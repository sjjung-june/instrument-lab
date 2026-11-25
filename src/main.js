import './style.css';
import './equipment.css';
import {EQUIPMENT} from './equipment.js';
import { ScanEngine, PARTS, GUIDES } from './simulation.js';
import { createScene } from './scene.js';

const byId=id=>document.getElementById(id);
const engine=new ScanEngine();let selected='probe';let mapChannel='trace';let scene;let toastTimer;let activeGuide='noise';
function selectEquipment(equipment){for(const {id,button} of EQUIPMENT){const active=id===equipment;byId(id+'Workspace').hidden=!active;byId(button).setAttribute('aria-pressed',String(active));if(active&&id!=='afm'){const frame=byId(id+'Frame');if(!frame.getAttribute('src'))frame.src=frame.dataset.src;}}document.title=equipment.toUpperCase()+' Lab — Instrument Explorer';if(equipment!=='afm'){byId('aboutDialog').close();if(!byId('maintenanceDrawer').hidden)setDrawer(false);}window.scrollTo({top:0,behavior:'instant'});}
for(const {id,button} of EQUIPMENT)byId(button).onclick=()=>selectEquipment(id);
new ResizeObserver(entries=>{const height=entries[0].target.getBoundingClientRect().height;document.documentElement.style.setProperty('--equipment-nav-height',height+'px');}).observe(document.querySelector('.equipment-switch'));
const statuses={idle:'대기',approaching:'팁 접근 중',scanning:'스캔 중',paused:'일시정지',retracting:'후퇴 중',retracted:'후퇴 완료',complete:'스캔 완료'};
function toast(message){byId('toast').textContent=message;byId('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>byId('toast').hidden=true,3000);}
function selectPart(id){selected=id;const part=PARTS.find(item=>item.id===id);scene?.select(id);byId('sceneSelected').textContent=part.name;byId('partName').textContent=part.name;byId('partKo').textContent=part.ko;byId('partDescription').textContent=part.role;byId('partCheck').textContent='점검 포인트 · '+part.check;byId('partNumber').textContent=`${String(PARTS.indexOf(part)+1).padStart(2,'0')} / 09`;byId('hidePartButton').textContent=scene&&!scene.visible(id)?'선택 파트 표시하기':'선택 파트 숨기기';document.querySelectorAll('.part-button').forEach(button=>button.classList.toggle('active',button.dataset.id===id));}
for(const [index,part] of PARTS.entries()){const button=document.createElement('button');button.className='part-button';button.dataset.id=part.id;button.innerHTML=`<span class="part-index">${String(index+1).padStart(2,'0')}</span><span>${part.name}</span>`;button.onclick=()=>selectPart(part.id);byId('partsList').appendChild(button);}
try{scene=createScene(byId('scene'),selectPart);}catch(error){byId('webglError').hidden=false;console.error(error);}
selectPart('probe');
document.querySelectorAll('[data-part]').forEach(button=>button.onclick=()=>selectPart(button.dataset.part));
byId('resetView').onclick=()=>scene?.home();
byId('explodeButton').onclick=event=>{const enabled=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(enabled));scene?.explode(enabled);};
byId('xrayButton').onclick=event=>{const enabled=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(enabled));scene?.xray(enabled);};
byId('hidePartButton').onclick=()=>{scene?.hide(selected);selectPart(selected);};byId('showAllButton').onclick=()=>{scene?.showAll();selectPart(selected);};
byId('startButton').onclick=()=>{if(engine.status==='scanning')engine.pause();else engine.start();updateUI();};
byId('retractButton').onclick=()=>{engine.retract();updateUI();};
byId('resetScan').onclick=()=>{engine.reset();drawData();updateUI();};
byId('surfaceSelect').onchange=event=>{engine.surface=event.target.value;engine.reset();scene?.setSurface(engine.surface);drawData();updateUI();};
byId('rateInput').oninput=event=>{engine.rate=Number(event.target.value);byId('rateValue').textContent=engine.rate.toFixed(2).replace(/0$/,'')+' line/s';};
byId('gainInput').oninput=event=>{engine.gain=Number(event.target.value);byId('gainValue').textContent=engine.gain.toFixed(2);};
function setChannel(channel){mapChannel=channel;byId('traceButton').classList.toggle('selected',channel==='trace');byId('retraceMapButton').classList.toggle('selected',channel==='retrace');drawData();}
byId('traceButton').onclick=()=>setChannel('trace');byId('retraceMapButton').onclick=()=>setChannel('retrace');
byId('exportButton').onclick=()=>{if(!engine.index){toast('스캔을 시작하면 취득한 데이터를 CSV로 저장할 수 있습니다.');return;}const blob=new Blob(['\ufeff'+engine.csv()],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`afm-${engine.surface}-${engine.status}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Trace / Retrace 데이터를 CSV로 저장했습니다.');};
function showGuide(id){activeGuide=id;const guide=GUIDES.find(item=>item.id===id);scene?.setRelated(guide.parts);byId('guideContent').innerHTML=`<div class="micro">RELATED COMPONENTS</div><div class="guide-parts">${guide.parts.map(part=>`<button data-guide-part="${part}">${PARTS.find(item=>item.id===part).name}</button>`).join('')}</div><h3>${guide.name}</h3><p>${guide.cause}</p><div class="micro">RECOMMENDED CHECK ORDER</div><ol>${guide.steps.map(step=>`<li>${step}</li>`).join('')}</ol><p class="caution">주의 · ${guide.caution}</p><p>일반화된 점검 가이드입니다. 해당 장비의 제조사 매뉴얼을 우선하세요.</p>`;document.querySelectorAll('[data-guide-part]').forEach(button=>button.onclick=()=>{selectPart(button.dataset.guidePart);setDrawer(false,true);});document.querySelectorAll('[data-symptom]').forEach(button=>button.classList.toggle('selected',button.dataset.symptom===id));document.querySelectorAll('.part-button').forEach(button=>button.classList.toggle('related',guide.parts.includes(button.dataset.id)));}
for(const guide of GUIDES){const button=document.createElement('button');button.textContent=guide.name;button.dataset.symptom=guide.id;button.onclick=()=>showGuide(guide.id);byId('symptomList').appendChild(button);}
function setDrawer(open,keepHighlight=false){byId('maintenanceDrawer').hidden=!open;byId('drawerBackdrop').hidden=!open;byId('maintenanceTab').classList.toggle('active',open);byId('explorerTab').classList.toggle('active',!open);if(open){showGuide(activeGuide);byId('closeMaintenance').focus();}else{if(!keepHighlight){scene?.setRelated([]);document.querySelectorAll('.part-button').forEach(button=>button.classList.remove('related'));}byId('maintenanceTab').focus();}}
byId('maintenanceTab').onclick=()=>setDrawer(true);byId('explorerTab').onclick=()=>setDrawer(false);byId('closeMaintenance').onclick=()=>setDrawer(false);byId('drawerBackdrop').onclick=()=>setDrawer(false);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!byId('maintenanceDrawer').hidden)setDrawer(false);if(event.key==='Tab'&&!byId('maintenanceDrawer').hidden){const items=[...byId('maintenanceDrawer').querySelectorAll('button')];const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
byId('aboutButton').onclick=()=>byId('aboutDialog').showModal();byId('closeAbout').onclick=()=>byId('aboutDialog').close();
const mapContext=byId('heightMap').getContext('2d');const profileContext=byId('lineProfile').getContext('2d');
const stops=[[37,34,67],[96,80,128],[171,120,160],[230,180,164],[251,239,194]];
function colorFor(value){const fraction=Math.min(.9999,Math.max(0,value/100))*4;const index=Math.floor(fraction),mix=fraction-index;return stops[index].map((value,channel)=>Math.round(value+(stops[index+1][channel]-value)*mix));}
function drawData(){
  const size=engine.size;const canvas=byId('heightMap');const cell=canvas.width/size;mapContext.fillStyle='#252243';mapContext.fillRect(0,0,canvas.width,canvas.height);let available=0;
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){const value=engine[mapChannel][row*size+col];if(Number.isFinite(value)){available++;mapContext.fillStyle=`rgb(${colorFor(value).join(',')})`;mapContext.fillRect(col*cell,(size-1-row)*cell,cell,cell);}}
  if(engine.index>0){mapContext.strokeStyle='#eee6ff99';mapContext.lineWidth=1;mapContext.beginPath();mapContext.moveTo(0,(size-1-engine.line)*cell);mapContext.lineTo(canvas.width,(size-1-engine.line)*cell);mapContext.stroke();mapContext.fillStyle='#ffffff';mapContext.beginPath();mapContext.arc((engine.column+.5)*cell,(size-engine.line-.5)*cell,2,0,Math.PI*2);mapContext.fill();}
  byId('mapEmpty').hidden=available>0;
  const context=profileContext,width=560,height=250;context.clearRect(0,0,width,height);context.font='16px sans-serif';context.fillStyle='#b0a8bc';
  for(let level=0;level<=100;level+=25){const vertical=height-18-level/100*(height-35);context.strokeStyle='#efecf3';context.lineWidth=1;context.beginPath();context.moveTo(38,vertical);context.lineTo(width,vertical);context.stroke();context.fillText(String(level),0,vertical+5);}
  for(const [channel,color,dashes] of [['trace','#9671bc',[]],['retrace','#c2a18b',[7,5]]]){context.strokeStyle=color;context.lineWidth=2.5;context.setLineDash(dashes);context.beginPath();let started=false;for(let col=0;col<size;col++){const value=engine[channel][engine.line*size+col];if(!Number.isFinite(value)){started=false;continue;}const x=38+col/(size-1)*(width-42),y=height-18-value/100*(height-35);if(started)context.lineTo(x,y);else context.moveTo(x,y);started=true;}context.stroke();}context.setLineDash([]);
}
function updateUI(){
  byId('stateBadge').textContent=statuses[engine.status];byId('startButton').textContent=engine.status==='scanning'?'Ⅱ 일시정지':engine.status==='paused'?'▶ 이어서 스캔':engine.status==='complete'?'↺ 다시 스캔':'▶ 스캔 시작';
  byId('startButton').disabled=['approaching','retracting'].includes(engine.status);byId('retractButton').disabled=['idle','retracted','retracting'].includes(engine.status);
  byId('progressBar').style.width=engine.progress*100+'%';byId('progressText').textContent=`${Math.floor(engine.progress*100)}% · 5 × 5 μm`;byId('scanPosition').textContent=`Line ${String(engine.line+1).padStart(2,'0')} / ${engine.size} · ${engine.direction} ${engine.direction==='Trace'?'→':'←'}`;byId('profileLine').textContent='LINE '+String(engine.line+1).padStart(2,'0');
  byId('deflectionValue').textContent=engine.deflection.toFixed(3)+' a.u.';byId('detectorValue').textContent='Δ / SUM '+engine.deflection.toFixed(3);byId('errorValue').textContent=engine.error.toFixed(2)+' nm error';byId('zValue').textContent=engine.z.toFixed(2)+' nm';byId('detectorSpot').style.transform=`translateY(${Math.max(-10,Math.min(10,-engine.deflection*40))}px)`;document.body.classList.toggle('scanning',engine.status==='scanning');
}
let previous=null,lastDraw=0;
function animate(now){const delta=previous===null?0:Math.max(0,Math.min((now-previous)/1000,.1));previous=now;engine.tick(delta);scene?.render(engine,delta);if(now-lastDraw>65){drawData();updateUI();lastDraw=now;}requestAnimationFrame(animate);}
document.addEventListener('visibilitychange',()=>{previous=null;});
drawData();updateUI();requestAnimationFrame(animate);
