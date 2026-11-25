import './style.css';
import './extra.css';
import './sam.css';
import {SamEngine,MODES,PARTS,GUIDES,SOUND_SPEED,MAX_DEPTH,timeAtDepth,gatePeak} from './simulation.js';
import {createScene} from './scene.js';
import {drawImage,drawWave} from './charts.js';
import {PlaybackClock} from '../../src/shared/playback.js';
import {mountViewerControls} from '../../src/shared/viewer-controls.js';
const playbackClock=new PlaybackClock();

const byId=id=>document.getElementById(id),engine=new SamEngine();let scene;
function selectPart(id){const part=PARTS.find(item=>item.id===id);if(!part)return;scene?.select(id);byId('selectedLabel').textContent=part.name;byId('partName').textContent=part.name;byId('partKo').textContent=part.ko;byId('partRole').textContent=part.role;byId('partCheck').textContent=part.check;document.querySelectorAll('[data-part]').forEach(button=>{button.classList.toggle('active',button.dataset.part===id);button.setAttribute('aria-pressed',String(button.dataset.part===id));});}
for(const part of PARTS){const button=document.createElement('button');button.className='part';button.dataset.part=part.id;button.textContent=part.name;button.onclick=()=>selectPart(part.id);byId('parts').append(button);}
try{scene=createScene(byId('scene'),selectPart);}catch(error){console.error(error);byId('webglError').hidden=false;}
selectPart('stack');
const statuses={idle:'대기',scanning:'취득 중',paused:'일시정지',complete:'취득 완료'};
function draw(){drawImage(byId('imageCanvas'),engine,byId('channelSelect').value);drawWave(byId('waveCanvas'),engine);}
function update(){
  const coordinate=engine.coordinate,through=engine.mode==='through',single=engine.mode==='a',magnitude=byId('channelSelect').value==='magnitude'||through;
  byId('status').textContent=statuses[engine.status];byId('startButton').textContent=engine.status==='scanning'?'일시정지':engine.status==='paused'?'계속 취득':engine.status==='complete'?'다시 취득':'취득 시작';byId('progress').style.width=engine.progress*100+'%';byId('percent').textContent=Math.round(engine.progress*100)+'%';
  byId('count').textContent=`${engine.index} / ${engine.total} ${single?'시간 샘플':engine.mode==='b'?'X 열':'XY 위치'}`;byId('exportButton').disabled=!engine.index;
  byId('positionLabel').textContent=`X ${coordinate.x.toFixed(2)} / Y ${coordinate.y.toFixed(2)}`;byId('xValue').textContent=engine.x.toFixed(2);byId('yValue').textContent=engine.y.toFixed(2);
  byId('modeDescription').textContent=MODES[engine.mode].description;byId('gateSelect').disabled=through;byId('widthInput').disabled=through;byId('channelSelect').disabled=through||single;
  byId('gateReadout').textContent=through?'투과 취득에는 시간 게이트를 적용하지 않습니다. 반사 파형은 참고용으로만 표시합니다. 3D 펄스는 아래 수신기로 편도 이동합니다.':`수신 시간창 (반사면 아님) · 전면 이후 게이트 ${timeAtDepth(Math.max(0,engine.center-engine.width/2)).toFixed(1)}–${timeAtDepth(Math.min(MAX_DEPTH,engine.center+engine.width/2)).toFixed(1)} ns / 깊이 약 ${Math.max(0,engine.center-engine.width/2)}–${Math.min(MAX_DEPTH,engine.center+engine.width/2)} μm / 가정 음속 ${SOUND_SPEED} μm/ns`;
  byId('imageTitle').textContent={a:'A-Scan · 단일 위치',b:'B-Scan · X–깊이 단면',c:`C-Scan · 약 ${engine.center} μm`,through:'Through-Scan · 두께 투영'}[engine.mode];
  byId('imageDescription').textContent={a:'시간 파형을 순차 취득합니다. 아래 RF 그래프에서 반사 부호와 게이트를 비교하세요.',b:`Y = ${engine.y.toFixed(2)} 고정. 녹색 점선은 선택 게이트, 세로축은 균일 음속으로 환산한 추정 깊이입니다.`,c:'가로 X · 세로 Y. 게이트 내 최대 절대 진폭을 가진 RF 샘플을 부호와 함께 저장합니다.',through:'하부 수신기의 합성 투과 진폭입니다. 어두운 영역은 투과 감소이며 결함 깊이를 구분하지 못합니다.'}[engine.mode];
  byId('interpretation').textContent=through?'상부 박리와 하부 보이드가 한 영상에 중첩되어 보입니다. 투과 신호 감소만으로 원인·위치를 확정할 수 없습니다.':single?'기준 위치와 가상 결함 위치를 바꿔 다시 취득해 보세요. 음의 반사·하부 감쇠는 교육용으로 설정한 특성입니다.':magnitude?'밝을수록 반사 진폭 절댓값이 큽니다. 부호 정보는 이 표시에서 숨겨집니다.':'붉은색은 음의 RF, 청색은 양의 RF, 암색은 약한 신호 또는 미취득입니다. 반사 부호만으로 결함을 확정할 수 없습니다.';
  byId('colorbar').hidden=single;byId('colorbar').classList.toggle('magnitude',magnitude);byId('rangeLabel').textContent=single?'파형 참조':magnitude?'0 a.u.':'−0.8 a.u.';byId('rangeEnd').textContent=single?'전면 기준':'+0.8 a.u.';
  const peak=gatePeak(coordinate.x,coordinate.y,engine.center,engine.width,engine.sample);
  byId('waveNote').textContent=single?`A-Scan 실제 취득 버퍼 표시 · 전면 반사 0 ns · 게이트 내 합성 참고 피크 ${peak.toFixed(3)} a.u.`:`현재 좌표의 합성 RF 참고 파형 (별도 A-Scan 취득 버퍼 아님) · 게이트 피크 ${peak.toFixed(3)} a.u. · 물 경로 시간은 전면 기준으로 제거한 가정`;
}
function configure(changes){engine.configure(changes);byId('gateSelect').value=String(engine.center);byId('xInput').value=String(engine.x);byId('yInput').value=String(engine.y);byId('widthValue').textContent=engine.width+' μm';update();draw();}
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{configure({mode:button.dataset.mode});document.querySelectorAll('[data-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));selectPart(engine.mode==='through'?'receiver':engine.mode==='a'?'probe':'stack');});
byId('sampleSelect').onchange=event=>configure({sample:event.target.value});byId('gateSelect').onchange=event=>configure({center:Number(event.target.value)});byId('widthInput').oninput=event=>configure({width:Number(event.target.value)});byId('xInput').oninput=event=>configure({x:Number(event.target.value)});byId('yInput').oninput=event=>configure({y:Number(event.target.value)});byId('channelSelect').onchange=()=>{update();draw();};
const positions={healthy:{x:.85,y:.2},delamination:{x:.36,y:.45,center:260},void:{x:.69,y:.66,center:590}};
document.querySelectorAll('[data-position]').forEach(button=>button.onclick=()=>configure(positions[button.dataset.position]));
byId('startButton').onclick=()=>{if(engine.status==='scanning')engine.pause();else engine.start();update();draw();};byId('resetButton').onclick=()=>{engine.reset();update();draw();};byId('homeButton').onclick=()=>scene?.home();
for(const [id,action] of [['focusButton','focus'],['explodeButton','explode'],['truthButton','truth']])byId(id).onclick=event=>{const enabled=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(enabled));scene?.[action](enabled);if(action==='truth')byId('truthNote').hidden=!enabled;};
for(const guide of GUIDES){const option=document.createElement('option');option.value=guide.id;option.textContent=guide.name;byId('symptomSelect').append(option);}
byId('symptomSelect').onchange=event=>{const guide=GUIDES.find(item=>item.id===event.target.value);scene?.related(guide?.parts||[]);document.querySelectorAll('[data-part]').forEach(button=>button.classList.toggle('related',guide?.parts.includes(button.dataset.part)||false));byId('guide').innerHTML=guide?`<div class="guide-parts">${guide.parts.map(id=>`<button data-related="${id}">${PARTS.find(part=>part.id===id).ko}</button>`).join('')}</div><ol>${guide.steps.map(step=>`<li>${step}</li>`).join('')}</ol><p>${guide.note}</p>`:'';document.querySelectorAll('[data-related]').forEach(button=>button.onclick=()=>selectPart(button.dataset.related));};
byId('aboutButton').onclick=()=>byId('aboutDialog').showModal();byId('closeAbout').onclick=()=>byId('aboutDialog').close();
byId('exportButton').onclick=()=>{if(!engine.index)return;const url=URL.createObjectURL(new Blob(['\ufeff'+engine.csv()],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`sam-hbm-${engine.mode}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
update();draw();let lastDraw=0,lastIndex=-1;
function animate(time){const delta=playbackClock.step(time);engine.tick(delta);if(engine.index!==lastIndex&&time-lastDraw>60){draw();update();lastDraw=time;lastIndex=engine.index;}scene?.render(engine,playbackClock.realDelta,playbackClock.elapsed);requestAnimationFrame(animate);}
document.addEventListener('visibilitychange',()=>{if(document.hidden){engine.pause();update();}playbackClock.resetTimestamp();});requestAnimationFrame(animate);

mountViewerControls(scene,playbackClock);
