import {massHistogram,shiftedAptEvents} from './learning-data.js';
import {compatibleFault} from './fault-catalog.js';
import {reconstruct} from '../../multimodal-source/src/physics.js';

const noise=index=>Math.sin(index*12.9898+78.233)*Math.cos(index*4.1414);
const gaussian=(position,center,width)=>Math.exp(-.5*((position-center)/width)**2);
function range(values){let low=Infinity,high=-Infinity;for(const value of values)if(Number.isFinite(value)){low=Math.min(low,value);high=Math.max(high,value);}return {low,high,span:Math.max(high-low,Math.abs(high)*.05,1e-9)};}
function smooth(data,index){
  let sum=0,count=0;
  for(let vertical=data.shape==='grid'?-2:0;vertical<=(data.shape==='grid'?2:0);vertical++)for(let horizontal=-2;horizontal<=2;horizontal++){
    const column=data.shape==='grid'?index%data.width+horizontal:index+horizontal,row=data.shape==='grid'?Math.floor(index/data.width)+vertical:0;
    if(column<0||column>=(data.shape==='grid'?data.width:data.points.length)||row<0||row>=(data.shape==='grid'?data.height:1))continue;
    const value=data.shape==='grid'?data.values[row*data.width+column]:data.points[column].value;
    if(Number.isFinite(value)){sum+=value;count++;}
  }
  return count?sum/count:NaN;
}
export function applyFault(data,fault,severity=.6){
  if(!Number.isFinite(severity)||severity<0||severity>1)throw new RangeError('Severity must be between zero and one');
  if(!data)return null;
  if(fault&&!compatibleFault(fault,data))throw new RangeError('Fault is incompatible with this data channel');
  const output={...data,...(data.shape==='grid'?{values:Float64Array.from(data.values)}:{points:data.points.map(point=>({...point}))}),fault:{id:fault?.id??'none',severity,training:true}};
  if(!fault||severity===0)return output;
  const strength=severity,transform=fault.transform,values=data.shape==='grid'?Array.from(data.values):data.points.map(point=>point.value),scale=range(values),axis=data.shape==='curve'?range(data.points.map(point=>point.axis)):null;
  if(transform==='apt-time'||transform==='apt-loss'){
    const events=transform==='apt-time'?shiftedAptEvents(data.events,strength,data.voltage):data.events.filter((event,index)=>!(event.hitX>-.2&&((index*37)%101)/101<strength*.85));
    output.events=events;output.points=massHistogram(events);output.fault.retained=events.length;return output;
  }
  if(transform.startsWith('xrm-')){
    output.projections=data.projections.map(view=>({...view,projection:view.projection.map((point,index)=>{
      let line=point.line;
      if(transform==='xrm-column')line+=strength*.7*gaussian(index,31,.65);
      else {const shifted=index-strength*2,lower=Math.floor(shifted),weight=shifted-lower;line=(view.projection[lower]?.line??0)*(1-weight)+(view.projection[lower+1]?.line??0)*weight;}
      return {...point,line,transmission:Math.exp(-line)};
    })}));
    if(data.shape==='grid')output.values=reconstruct(output.projections,data.width);
    else output.points=output.projections.at(-1).projection.map(point=>({axis:point.offset,value:point.transmission}));
    return output;
  }
  const height=data.heights?range(data.heights):null,timeMaximum=data.points?.reduce((maximum,point)=>Math.max(maximum,point.time??0),0)??1;
  for(let index=0;index<values.length;index++){
    const original=values[index];if(!Number.isFinite(original))continue;
    const fraction=index/Math.max(1,values.length-1),column=data.shape==='grid'?index%data.width:0,row=data.shape==='grid'?Math.floor(index/data.width):0;
    let value=original;
    if(transform==='blur'||transform==='xps-charge')value=original*(1-strength)+smooth(data,index)*strength;
    else if(transform==='double'){const neighbor=column>=5?data.values[index-5]:NaN;if(Number.isFinite(neighbor))value=original+strength*(Math.max(original,neighbor)-original);}
    else if(transform==='stripes')value+=strength*scale.span*.25*Math.sin(row*1.7);
    else if(transform==='curtain')value+=strength*scale.span*.25*(Math.sin(column*1.3)+.35*Math.cos(column*2.7));
    else if(transform==='charging')value=Math.max(0,Math.min(1,original+strength*.4*(Math.sin(row*.7)+.7)));
    else if(transform==='attenuate')value*=1-strength*.8;
    else if(transform==='noise')value+=strength*scale.span*(.15+.3*noise(index));
    else if(transform==='background')value+=strength*scale.span*.18*(1+.1*Math.sin(index*.12));
    else if(transform==='low-snr')value=original*(1-.75*strength)+strength*scale.span*(.2+.12*noise(index));
    else if(transform==='fluorescence')value+=strength*scale.span*(.3+1.5*gaussian(fraction,.65,.3));
    else if(transform==='ftir-background')value+=strength*(.15*(fraction-.5)+.4*gaussian(data.points[index].axis,2350,70)-.5*gaussian(data.points[index].axis,1630,65));
    else if(transform==='force-offset')value+=strength*scale.high*.15;
    else if(transform==='height-cross'&&Number.isFinite(data.heights[index]))value+=strength*scale.span*.8*(data.heights[index]-height.low)/height.span;
    if(data.shape==='grid')output.values[index]=value;
    else {
      const point=output.points[index];point.value=value;
      if(transform==='axis-shift')point.axis+=strength*axis.span*.02;
      else if(transform==='xps-charge')point.axis+=strength*3;
      else if(transform==='mass-shift')point.axis=(Math.sqrt(Math.max(0,point.axis))+strength*.2)**2;
      else if(transform==='depth-drift')point.axis+=strength*axis.high*.25*(point.time??fraction)/Math.max(timeMaximum,1e-9);
    }
  }
  return output;
}
export function comparisonMetrics(normal,affected){
  const original=normal.shape==='grid'?normal.values:normal.points.map(point=>point.value),changed=affected.shape==='grid'?affected.values:affected.points.map(point=>point.value);
  let total=0,count=0,axisTotal=0;
  for(let index=0;index<original.length;index++)if(Number.isFinite(original[index])&&Number.isFinite(changed[index])){total+=Math.abs(original[index]-changed[index]);if(normal.shape==='curve')axisTotal+=Math.abs(normal.points[index].axis-affected.points[index].axis);count++;}
  return {count,meanAbsoluteDifference:count?total/count:0,meanAxisDifference:count?axisTotal/count:0};
}
const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
export function comparisonCSV(normal,affected){
  const metadata={training_only:true,source:normal.provenance,instrument:normal.kind,mode:normal.mode,axis:normal.axisLabel,value:normal.valueLabel,conditions:normal.conditions,fault:affected.fault,original_acquisition_unchanged:true};
  const rows=['# '+JSON.stringify(metadata),'index,axis_original,axis_training,value_original,value_training'];
  const length=normal.shape==='grid'?normal.values.length:normal.points.length;
  for(let index=0;index<length;index++){
    const original=normal.shape==='grid'?{axis:`${index%normal.width}:${Math.floor(index/normal.width)}`,value:normal.values[index]}:normal.points[index],changed=normal.shape==='grid'?{axis:original.axis,value:affected.values[index]}:affected.points[index];
    if(Number.isFinite(original.value))rows.push([index,quote(original.axis),quote(changed.axis),original.value,changed.value].join(','));
  }
  return rows.join('\n');
}
