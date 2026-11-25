import {CONFIG} from './config.js';
import {domainAt,heightAt,ramanSignal,afmirSignal,indentationAt,mechanicalResults,projectionAt,reconstruct,FT_SIZE,FT_RESOLUTION,irSingleBeam,interferogram,fourier,absorbance} from './physics.js';

export class InstrumentEngine{
  constructor(kind){
    if(!CONFIG[kind])throw new RangeError('Unknown instrument');
    this.kind=kind;this.config=CONFIG[kind];this.mode=this.config.defaultMode;this.parameter=this.config.parameter.value;this.sample=Object.keys(this.config.selector.values)[0];this.band=this.config.band?.value??0;this.accessory='transmission';this.backgrounds={};this.reset();
  }
  get total(){if(this.kind==='xrm')return this.mode==='ct'?48:1;if(this.kind==='nanoindenter')return 240;if(this.kind==='ftir')return FT_SIZE;if(this.mode==='map')return 1024;return this.kind==='raman'?8:64;}
  get duration(){return this.kind==='xrm'&&this.mode==='radiograph'?2:this.config.duration;}
  get progress(){return this.index/this.total;}
  get background(){return this.backgrounds[this.accessory];}
  reset(){this.index=0;this.elapsed=0;this.status='idle';this.rows=[];this.spectrum=[];this.integrationHistory=[];this.reconstruction=null;this.error='';this.ftSignal=null;}
  configure(changes){
    if('mode'in changes&&!Object.hasOwn(this.config.modes,changes.mode))throw new RangeError('Unknown mode');
    if('sample'in changes&&!Object.hasOwn(this.config.selector.values,changes.sample))throw new RangeError('Unknown sample');
    if('parameter'in changes&&(!Number.isFinite(changes.parameter)||changes.parameter<this.config.parameter.min||changes.parameter>this.config.parameter.max))throw new RangeError('Invalid parameter');
    if('band'in changes&&(!this.config.band||!Number.isFinite(changes.band)||changes.band<this.config.band.min||changes.band>this.config.band.max))throw new RangeError('Invalid band');
    for(const key of ['mode','sample','parameter','band'])if(key in changes)this[key]=changes[key];
    if(this.kind==='ftir'&&this.mode!=='background')this.accessory=this.mode;
    this.reset();
  }
  start(){
    if(this.kind==='ftir'&&this.mode!=='background'&&!this.background){this.error='현재 액세서리의 Background를 먼저 취득하세요.';return false;}
    if(this.status==='complete')this.reset();
    this.error='';this.status='scanning';
    if(this.kind==='ftir'&&!this.ftSignal)this.ftSignal=interferogram(irSingleBeam(this.sample,this.parameter,this.accessory,this.mode==='background'));
    return true;
  }
  pause(){if(this.status==='scanning')this.status='paused';}
  clearBackground(){this.backgrounds={};this.reset();}
  get cycleCount(){return this.kind==='afmir'&&this.mode==='map'?64:this.total;}
  get cycle(){return Math.min(this.cycleCount-1,Math.floor(this.elapsed/this.duration*this.cycleCount));}
  get cyclePhase(){const value=this.elapsed/this.duration*this.cycleCount;return value-Math.floor(value);}
  get coordinate(){
    const index=Math.min(this.total-1,this.status==='complete'?this.total-1:this.kind==='afmir'?this.cycle*(this.mode==='map'?16:1):Math.max(0,this.index-1));
    return this.mode==='map'?{x:index%32/31,y:Math.floor(index/32)/31}:{x:.35,y:.53};
  }
  get angle(){if(this.kind!=='xrm')return 0;if(this.mode==='radiograph')return Math.PI/6;if(this.status==='complete')return this.rows.at(-1).angle;return Math.max(0,this.cycle-1+Math.min(1,this.cyclePhase/.35))*Math.PI/48;}
  get phase(){
    if(this.status==='idle'||this.status==='complete')return this.status;
    if(this.kind==='nanoindenter')return indentationAt(this.elapsed/this.duration,this.parameter,this.sample).phase;
    if(this.kind==='xrm')return this.mode==='ct'&&this.cyclePhase<.35?'rotate':'expose';
    if(this.kind==='afmir')return this.cyclePhase<.12?'pulse':this.cyclePhase<.25?'expansion':this.cyclePhase<.85?'ringdown':'record';
    return this.kind==='ftir'?'interferogram':'integrate';
  }
  get signals(){
    const active=this.status==='scanning';
    if(this.kind==='afmir')return {input:active&&this.phase==='pulse',output:active&&['expansion','ringdown'].includes(this.phase)};
    return {input:active&&this.phase!=='rotate',output:active&&this.phase!=='rotate'};
  }
  get currentResponse(){const {x:coordinateX,y:coordinateY}=this.coordinate;return afmirSignal(this.mode==='map'?this.band:900+1000*this.cycle/63,coordinateX,coordinateY,this.sample,this.parameter);}
  tick(delta){
    if(this.status!=='scanning'||!Number.isFinite(delta)||delta<=0)return;
    this.elapsed=Math.min(this.duration,this.elapsed+delta);
    const cycles=this.elapsed/this.duration*this.cycleCount;
    const target=this.kind==='afmir'?Math.min(this.total,(Math.floor(cycles)+(cycles%1+1e-8>=.9?1:0))*(this.mode==='map'?16:1)):Math.min(this.total,Math.floor(this.elapsed/this.duration*this.total+1e-8));
    while(this.index<target){this.acquire(this.index);this.index++;}
    if(this.elapsed>=this.duration-1e-8){this.elapsed=this.duration;this.status='complete';this.finish();}
  }
  acquire(index){
    if(this.kind==='xrm'){
      const angle=this.mode==='ct'?index*Math.PI/48:Math.PI/6,projection=projectionAt(angle,this.sample,this.parameter);this.rows.push({axis:angle*180/Math.PI,angle,projection});
      if(this.mode==='ct')this.reconstruction=reconstruct(this.rows);return;
    }
    if(this.kind==='nanoindenter'){const fraction=index/(this.total-1),point=indentationAt(fraction,this.parameter,this.sample);this.rows.push({axis:fraction*this.duration,value:point.load,...point});return;}
    if(this.kind==='ftir'){this.rows.push({axis:index/(FT_SIZE*FT_RESOLUTION),value:this.ftSignal[index]});return;}
    if(this.kind==='raman'&&this.mode==='spectrum'){
      this.rows=Array.from({length:256},(_,bin)=>{const axis=100+3100*bin/255;return {axis,value:ramanSignal(axis,.35,.53,Number(this.sample),this.parameter)*(index+1)/8,frame:index+1};});this.integrationHistory.push({x:(index+1)*this.duration/8,y:this.rows.reduce((sum,row)=>sum+row.value,0)});return;
    }
    const coordinateX=index%32/31,coordinateY=Math.floor(index/32)/31;
    if(this.mode==='map'){const value=this.kind==='raman'?ramanSignal(this.band,coordinateX,coordinateY,Number(this.sample),this.parameter):afmirSignal(this.band,coordinateX,coordinateY,this.sample,this.parameter);this.rows.push({axis:index,x:coordinateX,y:coordinateY,value,height:heightAt(coordinateX,coordinateY),domain:domainAt(coordinateX,coordinateY)});}
    else {const axis=900+1000*index/63;this.rows.push({axis,value:afmirSignal(axis,.35,.53,this.sample,this.parameter)});}
  }
  finish(){
    if(this.kind==='ftir'){
      const transformed=fourier(this.rows.map(row=>row.value));
      if(this.mode==='background')this.backgrounds[this.accessory]=transformed;
      else this.spectrum=absorbance(transformed,this.background).filter(row=>row.axis>=600&&row.axis<=3600);
    }
  }
  get results(){return this.kind==='nanoindenter'&&this.elapsed/this.duration>=.95?mechanicalResults(this.parameter,this.sample):null;}
  metadata(){return {instrument:this.config.name,mode:this.mode,sample:this.sample,parameter:this.parameter,band_cm_1:this.config.band?this.band:null,accessory:this.kind==='ftir'?this.accessory:null,background_ready:!!this.background,accumulation_steps:this.kind==='raman'&&this.mode==='spectrum'?this.index:null,synthetic:true,units:this.kind==='nanoindenter'?'load_uN_depth_nm':this.kind==='xrm'?'angle_deg_detector_normalized_transmission_ratio':this.kind==='ftir'?'OPD_cm_absorbance_and_transmittance':'wavenumber_cm_1_response_au',timing:'expanded_representative_not_hardware_timing',limitations:this.config.limits};}
  csv(){
    const columns=['record','index','axis','axis_unit','x','y','value','transmission','load_uN','depth_nm','height_nm','phase','metadata'],metadata=JSON.stringify(this.metadata()),quote=value=>'"'+String(value??'').replaceAll('"','""')+'"',records=[];
    this.rows.forEach((row,index)=>{if(this.kind==='xrm'){for(const point of row.projection)records.push(['projection',index,row.axis,'angle_deg',point.offset,'',point.line,point.transmission,'','','','']);}else records.push(['measured',index,row.axis,this.kind==='ftir'?'OPD_cm':this.kind==='nanoindenter'?'time_s':this.mode==='map'?'pixel_index':'cm^-1',row.x,row.y,row.value,'',row.load,row.depth,row.height,row.phase]);});
    if(this.kind==='ftir')this.spectrum.forEach((row,index)=>records.push(['derived_absorbance',index,row.axis,'cm^-1','','',row.value,row.transmittance,'','','','']));
    return [columns.join(','),...records.map(row=>[...row,metadata].map(quote).join(','))].join('\n');
  }
}
