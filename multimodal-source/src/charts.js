import {ringdown,indentationAt} from './physics.js';

function start(canvas){const context=canvas.getContext('2d');context.fillStyle='#172b35';context.fillRect(0,0,canvas.width,canvas.height);context.font='18px sans-serif';return context;}
function empty(canvas,message){const context=start(canvas);context.fillStyle='#c1d6d9';context.textAlign='center';context.fillText(message,canvas.width/2,canvas.height/2);}
export function linePlot(canvas,series,{xLabel='',yLabel='',xRange,yRange}={}){
  const context=start(canvas),width=canvas.width,height=canvas.height,left=65,right=20,top=28,bottom=52,points=series.flatMap(item=>item.points).filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));
  if(!points.length){empty(canvas,'취득한 데이터가 없습니다.');return;}
  let [minimumX,maximumX]=xRange??[Math.min(...points.map(point=>point.x)),Math.max(...points.map(point=>point.x))];let [minimumY,maximumY]=yRange??[Math.min(0,...points.map(point=>point.y)),Math.max(...points.map(point=>point.y))*1.1];if(maximumX===minimumX)maximumX=minimumX+1;if(maximumY===minimumY)maximumY=minimumY+1;
  const px=value=>left+(value-minimumX)/(maximumX-minimumX)*(width-left-right),py=value=>height-bottom-(value-minimumY)/(maximumY-minimumY)*(height-top-bottom);
  context.strokeStyle='#36505b';context.lineWidth=1;context.fillStyle='#9ab9c1';context.textAlign='right';
  for(let tick=0;tick<=4;tick++){const value=minimumY+(maximumY-minimumY)*tick/4,y=py(value);context.beginPath();context.moveTo(left,y);context.lineTo(width-right,y);context.stroke();context.fillText(Math.abs(value)>=100?value.toFixed(0):value.toFixed(2),left-8,y+4);}
  for(let tick=0;tick<=4;tick++){context.textAlign=tick===4?'right':tick===0?'left':'center';const value=minimumX+(maximumX-minimumX)*tick/4;context.fillText(Math.abs(value)>=100?value.toFixed(0):value.toFixed(2),px(value),height-30);}context.textAlign='center';context.fillText(xLabel,(width+left)/2,height-8);context.textAlign='left';context.fillText(yLabel,left,17);
  context.save();context.beginPath();context.rect(left,top,width-left-right,height-top-bottom);context.clip();
  for(const item of series){context.strokeStyle=item.color??'#72d0bd';context.lineWidth=2.5;context.beginPath();item.points.forEach((point,index)=>{if(index===0)context.moveTo(px(point.x),py(point.y));else context.lineTo(px(point.x),py(point.y));});context.stroke();for(const point of item.points){context.fillStyle=item.color??'#72d0bd';context.fillRect(px(point.x)-1,py(point.y)-1,2,2);}}
  context.restore();
}
export function heatmap(canvas,values,size,max=1,label='',axes={xMin:0,xMax:1,yMin:0,yMax:1}){
  const context=start(canvas),top=30,span=Math.min(canvas.width-80,canvas.height-80),offset=(canvas.width-span)/2;
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){const value=values[row*size+col],normalized=Number.isFinite(value)?Math.max(0,Math.min(1,value/max)):NaN;context.fillStyle=Number.isFinite(normalized)?`rgb(${Math.round(30+210*normalized)},${Math.round(60+160*normalized)},${Math.round(78+55*normalized)})`:'#243b46';context.fillRect(offset+col*span/size,top+row*span/size,Math.ceil(span/size),Math.ceil(span/size));}
  context.fillStyle='#b9d0d4';context.textAlign='center';context.fillText(label,canvas.width/2,canvas.height-8);context.textAlign='right';context.fillText(String(axes.yMin),offset-8,top+10);context.fillText(String(axes.yMax),offset-8,top+span);context.textAlign='left';context.fillText(String(axes.xMin),offset,top+span+22);context.textAlign='right';context.fillText(String(axes.xMax),offset+span,top+span+22);
}
export function drawCharts(primary,secondary,engine,view){
  const {kind,mode,rows}=engine;
  if(kind==='xrm'){
    if(mode==='ct'&&view!=='projection'){if(engine.reconstruction)heatmap(primary,engine.reconstruction,48,2.5*engine.parameter,'FBP · 합성 흡수 계수',{xMin:-1,xMax:1,yMin:-1,yMax:1});else empty(primary,'투영 후 CT 단면이 누적됩니다.');}
    else linePlot(primary,[{points:(rows.at(-1)?.projection??[]).map(point=>({x:point.offset,y:point.transmission}))}],{xRange:[-1,1],yRange:[0,1.05],xLabel:'검출기 정규화 위치',yLabel:'I / I₀'});
    if(mode==='ct'){const values=new Float64Array(48*48).fill(NaN);rows.forEach((row,index)=>row.projection.forEach((point,channel)=>values[index*48+channel]=point.line));heatmap(secondary,values,48,3.5*engine.parameter,'위치 / 각도 (deg)',{xMin:-1,xMax:1,yMin:0,yMax:176.25});}
    else linePlot(secondary,[{points:(rows.at(-1)?.projection??[]).map(point=>({x:point.offset,y:point.line}))}],{xRange:[-1,1],xLabel:'검출기 위치',yLabel:'−ln(I/I₀)'});return;
  }
  if(kind==='nanoindenter'){
    const loading=rows.filter(row=>['loading','hold'].includes(row.phase)),unloading=rows.filter(row=>row.phase==='unloading'),maximum=indentationAt(.6,engine.parameter,engine.sample).maximum;
    linePlot(primary,[{points:loading.map(row=>({x:row.depth,y:row.load}))},{color:'#c6a0eb',points:unloading.map(row=>({x:row.depth,y:row.load}))}],{xRange:[0,maximum*1.1],yRange:[0,engine.parameter*1.1],xLabel:'압입 깊이 h (nm)',yLabel:'하중 P (μN)'});
    linePlot(secondary,[{points:rows.map(row=>({x:row.axis,y:row.load}))}],{xRange:[0,engine.duration],yRange:[0,engine.parameter*1.1],xLabel:'가상 시간 (s)',yLabel:'하중 (μN)'});return;
  }
  if(kind==='ftir'){
    if(view==='spectrum')linePlot(primary,[{points:engine.spectrum.map(row=>({x:row.axis,y:row.value}))}],{xRange:[3600,600],xLabel:'파수 (cm⁻¹)',yLabel:'흡광도 A'});
    else linePlot(primary,[{points:rows.map(row=>({x:row.axis*1e4,y:row.value}))}],{xRange:[0,312],xLabel:'광로차 OPD (μm)',yLabel:'간섭신호 (a.u.)'});
    if(engine.spectrum.length)linePlot(secondary,[{points:engine.spectrum.map(row=>({x:row.axis,y:row.transmittance}))}],{xRange:[3600,600],yRange:[0,1.05],xLabel:'파수 (cm⁻¹)',yLabel:'T = 샘플 / 배경'});
    else if(engine.background)linePlot(secondary,[{points:engine.background.map((value,index)=>({x:index*32,y:value})).filter(row=>row.x>=600&&row.x<=3600)}],{xRange:[3600,600],xLabel:'파수 (cm⁻¹)',yLabel:'배경 (a.u.)'});
    else empty(secondary,'Background를 먼저 취득하세요.');return;
  }
  if(mode==='map'){
    const values=new Float64Array(1024).fill(NaN);rows.forEach((row,index)=>values[index]=row.value);const maximum=kind==='raman'?1.2*engine.parameter:engine.parameter;heatmap(primary,values,32,maximum,'응답 (a.u.) · 정규화 XY');
  }else linePlot(primary,[{points:rows.map(row=>({x:row.axis,y:row.value}))}],{xRange:kind==='raman'?[100,3200]:[900,1900],xLabel:kind==='raman'?'Stokes Raman shift (cm⁻¹)':'IR 파수 (cm⁻¹)',yLabel:kind==='raman'?'누적 산란 응답 (a.u.)':'진동 응답 (a.u.)'});
  if(kind==='afmir'){
    const limit=engine.phase==='ringdown'?Math.min(1,(engine.cyclePhase-.25)/.6):engine.phase==='record'||engine.status==='complete'?1:0;
    const points=Array.from({length:Math.floor(limit*120)+1},(_,index)=>({x:index/120,y:ringdown(index/120,engine.currentResponse)}));linePlot(secondary,[{points}],{xRange:[0,1],yRange:[-engine.parameter,engine.parameter],xLabel:'정규화 대표 시간',yLabel:'진동 참고 (a.u.)'});
  }else if(mode==='map'){
    const lastRow=rows.at(-1)?.y;linePlot(secondary,[{points:rows.filter(row=>row.y===lastRow).map(row=>({x:row.x,y:row.value}))}],{xRange:[0,1],xLabel:'현재 취득 라인 X',yLabel:'Raman 응답 (a.u.)'});
  }else linePlot(secondary,[{points:engine.integrationHistory??[]}],{xRange:[0,engine.duration],xLabel:'가상 적분 시간 (s)',yLabel:'전 채널 합산 응답 (a.u.)'});
}
