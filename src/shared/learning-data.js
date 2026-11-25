import {ScanEngine} from '../simulation.js';
import {AptEngine,massFromTime} from '../../apt-source/src/engine.js';
import {FibSimulation} from '../../fib-source/src/simulation.js';
import {TemSimulation,imageIntensity,diffractionIntensity,darkFieldIntensity,stemIntensity,eelsIntensity} from '../../tem-source/src/simulation.js';
import {XrdSimulation} from '../../xrd-source/src/simulation.js';
import {SemEngine} from '../../sem-source/src/simulation.js';
import {SamEngine} from '../../sam-source/src/simulation.js';
import {XpsEngine} from '../../spectroscopy-source/src/xps.js';
import {SimsEngine} from '../../spectroscopy-source/src/sims.js';
import {InstrumentEngine} from '../../multimodal-source/src/engine.js';

export function conditionKey(kind,engine){
  const keys=kind==='fib'?['rate','imageDepth']:['mode','surface','gain','rate','defocus','sample','center','width','x','y','thickness','exposureThickness','reflection','exposureReflection','spacingIn','spacingOut','roughness','technology','polarity','species','region','passEnergy','neutralizer','matrix','parameter','band','accessory','voltage','charge'];
  return JSON.stringify([kind,...keys.map(key=>[key,engine[key]])]);
}
export function massHistogram(events){const values=new Float64Array(700);for(const event of events){const bin=Math.floor(event.massToCharge*10);if(bin>=0&&bin<values.length)values[bin]++;}return Array.from(values,(value,index)=>({axis:(index+.5)/10,value}));}
export const shiftedAptEvents=(events,severity,voltage)=>events.map(event=>({...event,massToCharge:massFromTime(event.tof+severity*45,voltage)}));
function grid(width,height,values,label,extra={}){return {shape:'grid',width,height,values:Float64Array.from(values),label,axisLabel:'정규화 XY / 취득 순서',valueLabel:'응답 (a.u.)',...extra};}
function curve(points,label,axisLabel,valueLabel,extra={}){return {shape:'curve',points:points.map(point=>({...point})),label,axisLabel,valueLabel,...extra};}
export function readLearningData(kind,engine){
  let result;
  if(kind==='afm')result=grid(engine.size,engine.size,engine.trace,'Trace 높이맵 · Z 추종 결과',{valueLabel:'높이 (nm)',channel:'Trace'});
  else if(kind==='sem')result=grid(engine.size,engine.size,engine.pixels,`${engine.mode.toUpperCase()} 영상`);
  else if(kind==='fib')result=grid(engine.size,engine.size,engine.image,'취득된 SEM 영상 · 가공 스냅샷',{mode:'imaging',capturedDepth:engine.imageDepth*180});
  else if(kind==='sam'){
    if(engine.mode==='a')result=curve(Array.from(engine.values).slice(0,engine.index).map((value,index)=>({axis:-20+300*index/(engine.total-1),value})),'A-Scan RF','전면 기준 시간 (ns)','RF 응답 (a.u.)');
    else result=grid(engine.size,engine.mode==='b'?engine.depthRows:engine.size,engine.values,engine.mode==='b'?'B-Scan · RF 단면':engine.mode==='through'?'Through · 투과 응답':'C-Scan · 수신 게이트 응답');
  }else if(kind==='apt')result=curve(massHistogram(engine.rows),'APT · 동일 취득 이온의 질량 히스토그램','m/z (Da/e)','이벤트 수',{events:engine.rows.map(row=>({...row})),voltage:engine.voltage});
  else if(kind==='xrd')result=curve(engine.values.map(row=>({axis:row.x,value:row.y})),`${engine.mode.toUpperCase()} 곡선`,engine.mode==='xrr'?'θ (deg)':'2θ (deg)','강도 (a.u.)',{log:engine.mode==='xrr'});
  else if(kind==='tem'){
    if(engine.progress<=0)return null;
    if(engine.mode==='eels')result=curve(Array.from({length:401},(_,index)=>({axis:index*2,value:eelsIntensity(index*2,engine.exposureThickness)*engine.progress})),'EELS · 현재 누적 신호','에너지 손실 (eV)','강도 (a.u.)',{log:true});
    else {const size=128,values=new Float64Array(size**2).fill(NaN);for(let row=0;row<size;row++)for(let col=0;col<size;col++){if(engine.mode==='stem'&&Math.floor(row/2)*64+Math.floor(col/2)>=Math.floor(engine.progress*4096))continue;const coordinateX=col/(size-1),coordinateY=row/(size-1);values[row*size+col]=(engine.mode==='image'?imageIntensity(coordinateX,coordinateY,engine.exposureThickness):engine.mode==='df'?darkFieldIntensity(coordinateX,coordinateY,engine.exposureThickness,engine.exposureReflection):engine.mode==='diffraction'?diffractionIntensity(coordinateX,coordinateY,engine.exposureThickness):stemIntensity(coordinateX,coordinateY,engine.exposureThickness))*(engine.mode==='stem'?1:engine.progress);}result=grid(size,size,values,`${engine.mode.toUpperCase()} · 현재 누적 영상`);}
  }else if(kind==='xps'||kind==='sims'){
    if(engine.mode==='image'){const values=new Float64Array(4096).fill(NaN);engine.rows.forEach((row,index)=>values[index]=row.value);result=grid(64,64,values,'선택 이온 XY 맵');}
    else result=curve(engine.rows.map(row=>({axis:row.axis,value:row.value})),engine.mode==='depth'?'명목 깊이 응답':kind==='xps'?'XPS 에너지 스펙트럼':'SIMS 질량 스펙트럼',engine.mode==='depth'?'명목 깊이 (nm)':kind==='xps'?'결합 에너지 (eV)':'m/z (Da/e)','응답 (a.u.)',{reverse:kind==='xps'&&engine.mode!=='depth'});
  }else if(kind==='xrm'){
    const projections=engine.rows.map(row=>({...row,projection:row.projection.map(point=>({...point}))}));
    if(engine.mode==='ct'&&engine.reconstruction)result=grid(48,48,engine.reconstruction,'CT · 취득 투영의 FBP 단면',{projections});
    else if(projections.length)result=curve(projections.at(-1).projection.map(point=>({axis:point.offset,value:point.transmission})),'Radiography · 최근 한 행 투과율','검출기 정규화 위치','I / I₀',{projections});
  }else if(kind==='ftir'){
    if(!engine.spectrum.length)return null;
    result=curve(engine.spectrum.map(row=>({axis:row.axis,value:row.value})),`${engine.accessory.toUpperCase()} · 변환된 흡광도`,'파수 (cm⁻¹)','흡광도 A',{reverse:true});
  }else if(kind==='nanoindenter')result=curve(engine.rows.map(row=>({axis:row.depth,value:row.load,time:row.axis,phase:row.phase})),'P–h · 취득 순서 보존','압입 깊이 (nm)','하중 (μN)');
  else if(kind==='raman'||kind==='afmir'){
    if(engine.mode==='map'){const values=new Float64Array(1024).fill(NaN),heights=new Float64Array(1024).fill(NaN);engine.rows.forEach((row,index)=>{values[index]=row.value;heights[index]=row.height;});result=grid(32,32,values,`${engine.band} cm⁻¹ 응답 맵`,{heights});}
    else result=curve(engine.rows.map(row=>({axis:row.axis,value:row.value})),kind==='raman'?'동시 채널 누적 Raman':'국소 AFM-IR 스펙트럼',kind==='raman'?'Raman shift (cm⁻¹)':'IR 파수 (cm⁻¹)','응답 (a.u.)');
  }
  if(!result)return null;
  const finite=result.shape==='grid'?Array.from(result.values).filter(Number.isFinite).length:result.points.filter(point=>Number.isFinite(point.value)).length;
  const acquired=kind==='fib'?Math.floor(engine.scan*engine.size**2):kind==='tem'?Math.floor(engine.progress*4096):engine.index??engine.values?.length??0;
  if(!finite||!acquired)return null;
  return {...result,kind,mode:result.mode??engine.mode??'scan',technology:engine.technology,acquired,provenance:'acquired',conditions:conditionKey(kind,engine)};
}
export function referenceLearningData(kind,current){
  const factories={afm:()=>new ScanEngine(),apt:()=>new AptEngine(),fib:()=>new FibSimulation(),tem:()=>new TemSimulation(),xrd:()=>new XrdSimulation(),sem:()=>new SemEngine(),sam:()=>new SamEngine(),xps:()=>new XpsEngine(),sims:()=>new SimsEngine()};
  const engine=factories[kind]?.()??new InstrumentEngine(kind);
  if(kind==='afm'){for(const key of ['surface','gain','rate'])engine[key]=current[key];engine.start();engine.tick(2);engine.tick(2000);}
  else if(kind==='fib'){engine.startMilling();engine.tick(5);engine.startImaging();engine.tick(10);}
  else if(kind==='tem'){engine.configure({mode:current.mode,thickness:current.thickness,reflection:current.reflection});engine.start();engine.tick(100);}
  else if(kind==='xrd'){for(const key of ['mode','spacingIn','spacingOut','thickness','roughness'])engine[key]=current[key];engine.start();engine.tick(100);}
  else if(kind==='sem'){engine.configure(current.mode,current.defocus);engine.start();engine.tick(100);}
  else {
    const keys={apt:['mode','voltage','charge'],sam:['mode','sample','center','width','x','y'],xps:['mode','region','thickness','charge','neutralizer','passEnergy'],sims:['mode','polarity','species','thickness','matrix']}[kind]??['mode','sample','parameter','band'];
    if(kind==='sims')engine.setTechnology(current.technology);
    const settings=Object.fromEntries(keys.filter(key=>current[key]!==undefined&&(key!=='band'||current.config?.band)).map(key=>[key,current[key]]));
    if(kind==='ftir'){
      engine.configure({...settings,mode:current.accessory});engine.configure({mode:'background'});engine.start();engine.tick(100);engine.configure({mode:current.accessory});
    }else engine.configure(settings);
    engine.start();engine.tick(100);
  }
  const result=readLearningData(kind,engine);
  return result?{...result,provenance:'reference_demo',label:'고정 합성 예시 · '+result.label}:null;
}
