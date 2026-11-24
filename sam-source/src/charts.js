import {echoAt,timeAtDepth,MAX_DEPTH} from './simulation.js';

export function colorFor(value,magnitude=false){
  if(!Number.isFinite(value))return [24,36,43];
  const strength=Math.min(1,Math.abs(value)/.8);
  if(magnitude)return [Math.round(25+225*strength),Math.round(42+199*strength),Math.round(50+120*strength)];
  return value<0?[Math.round(227*strength+25*(1-strength)),Math.round(92*strength+42*(1-strength)),Math.round(85*strength+50*(1-strength))]:[Math.round(66*strength+25*(1-strength)),Math.round(195*strength+42*(1-strength)),Math.round(229*strength+50*(1-strength))];
}
function frame(context,width,height){context.fillStyle='#f8fbfb';context.fillRect(0,0,width,height);context.font='13px sans-serif';context.fillStyle='#46646e';}
export function drawWave(canvas,engine){
  const context=canvas.getContext('2d'),width=canvas.width,height=canvas.height,left=48,top=20,plotWidth=width-66,plotHeight=height-62;
  frame(context,width,height);const mapTime=time=>left+(time+20)/300*plotWidth,mapSignal=value=>top+plotHeight/2-value*plotHeight/1.7;
  const start=timeAtDepth(Math.max(0,engine.center-engine.width/2)),end=timeAtDepth(Math.min(MAX_DEPTH,engine.center+engine.width/2));
  context.fillStyle='#39b69a22';context.fillRect(mapTime(start),top,mapTime(end)-mapTime(start),plotHeight);
  context.strokeStyle='#d4e3e1';context.lineWidth=1;
  for(const time of [0,50,100,150,200,250]){const px=mapTime(time);context.beginPath();context.moveTo(px,top);context.lineTo(px,top+plotHeight);context.stroke();context.fillStyle='#46646e';context.fillText(String(time),px-7,height-22);}
  context.beginPath();context.moveTo(left,mapSignal(0));context.lineTo(width-18,mapSignal(0));context.stroke();
  context.fillStyle='#46646e';context.fillText('+0.7',4,mapSignal(.7));context.fillText('−0.7',4,mapSignal(-.7));context.fillText('RF (a.u.)',4,12);context.fillText('전면 반사 기준 시간 (ns)',width/2-70,height-3);
  const coordinate=engine.coordinate,total=512,acquired=engine.mode==='a'?engine.index:total;
  context.beginPath();context.strokeStyle='#227f83';context.lineWidth=1.7;
  for(let index=0;index<acquired;index++){const time=-20+300*index/(total-1),signal=engine.mode==='a'?engine.values[index]:echoAt(coordinate.x,coordinate.y,time,engine.sample);const px=mapTime(time),py=mapSignal(signal);if(index)context.lineTo(px,py);else context.moveTo(px,py);}context.stroke();
  context.fillStyle='#1d806d';context.fillText(engine.mode==='through'?'반사 참고 파형 · 투과 취득과 별개':'녹색 구간: 선택 깊이 게이트',Math.min(mapTime(start),width-220),top+12);
}
export function drawImage(canvas,engine,channel){
  const context=canvas.getContext('2d'),width=canvas.width,height=canvas.height,left=42,top=20,plotSize=width-62;
  frame(context,width,height);
  if(engine.mode==='a'){
    context.fillStyle='#edf5f3';context.fillRect(left,top,plotSize,plotSize);context.fillStyle='#346d68';context.font='18px sans-serif';context.fillText('A-Scan · 단일 위치 RF',left+18,80);context.font='14px sans-serif';context.fillText(`X ${engine.x.toFixed(2)} / Y ${engine.y.toFixed(2)}`,left+18,120);context.fillText('시간 파형을 아래에서 확인하세요.',left+18,160);context.fillText(`${engine.index} / 512 시간 샘플`,left+18,200);return;
  }
  const rows=engine.mode==='b'?engine.depthRows:engine.size,columns=engine.size;
  const raster=document.createElement('canvas');raster.width=columns;raster.height=rows;const rasterContext=raster.getContext('2d'),image=rasterContext.createImageData(columns,rows);
  for(let index=0;index<engine.values.length;index++){const color=colorFor(engine.values[index],engine.mode==='through'||channel==='magnitude');image.data.set([...color,255],index*4);}rasterContext.putImageData(image,0,0);context.imageSmoothingEnabled=false;context.drawImage(raster,left,top,plotSize,plotSize);
  context.fillStyle='#46646e';context.font='13px sans-serif';context.fillText('0',left,height-24);context.fillText('1',left+plotSize-6,height-24);context.fillText('X · 정규화 좌표',left+plotSize/2-50,height-5);
  if(engine.mode==='b'){
    for(const depth of [0,180,360,540,720])context.fillText(String(depth),4,top+depth/MAX_DEPTH*plotSize+5);
    context.save();context.translate(12,height/2+34);context.rotate(-Math.PI/2);context.fillText('깊이 (μm · 근사)',0,0);context.restore();
    context.strokeStyle='#70f0c7';context.setLineDash([4,3]);for(const depth of [engine.center-engine.width/2,engine.center+engine.width/2]){const py=top+depth/MAX_DEPTH*plotSize;context.beginPath();context.moveTo(left,py);context.lineTo(left+plotSize,py);context.stroke();}context.setLineDash([]);
  }else{
    context.fillText('0',20,top+6);context.fillText('1',20,top+plotSize);context.fillText('Y',7,top+plotSize/2);
    const coordinate=engine.coordinate;context.strokeStyle='#fff1a1';context.lineWidth=1.5;const px=left+coordinate.x*plotSize,py=top+coordinate.y*plotSize;context.beginPath();context.moveTo(px-5,py);context.lineTo(px+5,py);context.moveTo(px,py-5);context.lineTo(px,py+5);context.stroke();
  }
}
