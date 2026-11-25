import {ELEMENTS} from './engine.js';
export function draw(canvas,engine,view,filter){
  const context=canvas.getContext('2d'),width=canvas.width,height=canvas.height;context.clearRect(0,0,width,height);context.fillStyle='#f7fafb';context.fillRect(0,0,width,height);context.font='16px sans-serif';
  if(view==='detector'){
    context.fillStyle='#142630';context.fillRect(0,0,width,height);const radius=135,centerX=width/2,centerY=height/2;context.strokeStyle='#42616a';context.beginPath();context.arc(centerX,centerY,radius,0,Math.PI*2);context.stroke();
    for(const row of engine.rows){if(filter!=='all'&&row.element!==filter)continue;context.fillStyle=ELEMENTS[row.element].color;context.fillRect(centerX+row.hitX*radius,centerY-row.hitY*radius,2,2);}context.fillStyle='#d9e7e9';context.fillText('검출 XY · 정규화 −1…1',20,28);context.fillText('같은 이벤트의 도착 위치',20,height-16);return;
  }
  const bins=Array(280).fill(0);for(const row of engine.rows)if(filter==='all'||row.element===filter)bins[Math.min(279,Math.round(row.massToCharge*4))]++;
  const max=Math.max(1,...bins),left=55,top=35,plotWidth=width-75,plotHeight=height-90;context.strokeStyle='#dce6e8';context.fillStyle='#4c6975';
  for(let tick=0;tick<=4;tick++){const value=Math.round(max*tick/4),position=top+plotHeight*(1-tick/4);context.beginPath();context.moveTo(left,position);context.lineTo(left+plotWidth,position);context.stroke();context.fillText(String(value),5,position+5);}
  context.strokeStyle='#338d86';context.lineWidth=2;context.beginPath();bins.forEach((value,index)=>{const positionX=left+index/280*plotWidth,positionY=top+plotHeight*(1-value/max);if(index===0)context.moveTo(positionX,positionY);else context.lineTo(positionX,positionY);});context.stroke();
  context.fillStyle='#4c6975';for(const mass of [0,10,20,30,40,50,60,70])context.fillText(String(mass),left+mass/70*plotWidth-7,height-30);context.fillText('Counts · 취득 이벤트',left,22);context.fillText('m/z · Da/e',width/2-40,height-6);
  if(!engine.index){context.fillStyle='#789197';context.fillText('취득을 시작하면 이벤트가 누적됩니다.',75,height/2);}
}
