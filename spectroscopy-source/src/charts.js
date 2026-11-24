const COLORS={si:'#3988c4',o:'#c077cd',c:'#ba8e46',cu:'#d07c4b',b:'#249987'};
export function plot(canvas,engine){
  const context=canvas.getContext('2d'),width=canvas.width,height=canvas.height,left=62,top=35,plotWidth=width-85,plotHeight=height-95;
  context.fillStyle='#f7fbfa';context.fillRect(0,0,width,height);context.font='18px sans-serif';context.fillStyle='#476770';
  if(engine.mode==='image'){
    const raster=document.createElement('canvas');raster.width=64;raster.height=64;const rasterContext=raster.getContext('2d'),image=rasterContext.createImageData(64,64);
    for(let index=0;index<4096;index++){const value=engine.rows[index]?.value,strength=Number.isFinite(value)?Math.max(0,Math.min(1,value/.85)):0;image.data.set([20+strength*116,36+strength*205,44+strength*160,255],index*4);}rasterContext.putImageData(image,0,0);context.imageSmoothingEnabled=false;context.drawImage(raster,left,top,plotWidth,plotHeight);context.fillText('0',left,height-34);context.fillText('1',left+plotWidth-9,height-34);context.fillText('Y',12,top+plotHeight/2);context.fillText('0',34,top+12);context.fillText('1',34,top+plotHeight);context.fillText('X · 정규화 좌표',width/2-60,height-8);return;
  }
  const depth=engine.mode==='depth',xps=engine.kind==='xps',range=depth?[0,xps?30:80]:xps?(engine.mode==='survey'?[600,0]:[110,94]):[1,70];
  const xPixel=value=>left+(value-range[0])/(range[1]-range[0])*plotWidth,maximum=depth?1.1:xps?1.7:1, yPixel=value=>top+plotHeight-value/maximum*plotHeight;
  context.strokeStyle='#d5e3e1';context.lineWidth=1;
  for(let index=0;index<=4;index++){const y=top+plotHeight*index/4;context.beginPath();context.moveTo(left,y);context.lineTo(left+plotWidth,y);context.stroke();context.fillStyle='#476770';context.fillText((maximum*(1-index/4)).toFixed(1),8,y+6);const axis=range[0]+(range[1]-range[0])*index/4;context.fillText(axis.toFixed(xps&&!depth&&engine.mode==='highres'?1:0),xPixel(axis)-12,height-32);}
  context.fillText('Intensity (a.u.)',left,20);context.fillText(depth?'명목 제거 깊이 (nm)':xps?'Binding energy (eV) · 감소 방향':'m/z · 명목 질량/전하',left+15,height-7);
  const keys=depth?(xps?['si','o','c']:engine.polarity==='positive'?['si','cu','b']:['si','o','c']):['value'];
  for(const key of keys){context.strokeStyle=COLORS[key]||'#228c80';context.lineWidth=depth&&!xps&&key===engine.species?4:2.5;context.beginPath();engine.rows.forEach((row,index)=>{const x=xPixel(row.axis),y=yPixel(row[key]);if(index)context.lineTo(x,y);else context.moveTo(x,y);});context.stroke();}
  if(!depth){const shift=xps?engine.charge*(engine.neutralizer?.1:1):0;const peaks=xps?(engine.mode==='survey'?[[103.5,'Si 2p'],[284.8,'C 1s'],[532.8,'O 1s']]:[[99.4,'Si⁰'],[103.5,'Si⁴⁺']]):engine.polarity==='positive'?[[11,'B⁺'],[28,'Si⁺'],[63,'Cu⁺'],[65,'⁶⁵Cu⁺']]:[[12,'C⁻'],[16,'O⁻'],[28,'Si⁻'],[44,'SiO⁻']];context.font='16px sans-serif';context.fillStyle='#657f82';for(const [value,label] of peaks){const x=xPixel(value+shift);context.fillText(label,Math.min(width-64,Math.max(left,x-17)),top+16+(label.includes('⁶⁵')?22:0));}}
}
export {COLORS};
