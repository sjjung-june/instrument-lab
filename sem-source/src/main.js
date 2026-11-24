import './style.css';
import './extra.css';
import {PARTS,MODES,GUIDES,SemEngine} from './simulation.js';
import {createScene} from './scene.js';

const byId=id=>document.getElementById(id);
const engine=new SemEngine();let scene;
function selectPart(id){
  const part=PARTS.find(item=>item.id===id);if(!part)return;
  scene?.select(id);byId('selectedLabel').textContent=part.name;byId('partName').textContent=part.name;byId('partKo').textContent=part.ko;byId('partRole').textContent=part.role;byId('partCheck').textContent=part.check;
  document.querySelectorAll('[data-part]').forEach(button=>{button.classList.toggle('active',button.dataset.part===id);button.setAttribute('aria-pressed',String(button.dataset.part===id));});
}
for(const part of PARTS){const button=document.createElement('button');button.className='part';button.dataset.part=part.id;button.textContent=part.name;button.onclick=()=>selectPart(part.id);byId('parts').append(button);}
try{scene=createScene(byId('scene'),selectPart);}catch(error){byId('webglError').hidden=false;console.error(error);}
selectPart('gun');
const canvas=byId('imageCanvas'),context=canvas.getContext('2d');
const raster=document.createElement('canvas');raster.width=engine.size;raster.height=engine.size;const rasterContext=raster.getContext('2d');
function drawImage(){
  const image=rasterContext.createImageData(engine.size,engine.size);
  for(let index=0;index<engine.pixels.length;index++){const value=Number.isFinite(engine.pixels[index])?Math.round(engine.pixels[index]*255):24;image.data.set([value,value,value,255],index*4);}
  rasterContext.putImageData(image,0,0);context.imageSmoothingEnabled=false;context.drawImage(raster,0,0,256,256);
  if(engine.index&&engine.status!=='complete'){const {x,y}=engine.coordinate();context.strokeStyle='#79e5cc';context.lineWidth=1;context.strokeRect(x*252,y*252,4,4);}
}
const statuses={idle:'대기',scanning:'스캔 중',paused:'일시정지',complete:'취득 완료'};
function update(){
  byId('status').textContent=statuses[engine.status];byId('startButton').textContent=engine.status==='scanning'?'일시정지':engine.status==='paused'?'계속 취득':engine.status==='complete'?'다시 스캔':'스캔 시작';
  byId('pixelCount').textContent=`${engine.index} / ${engine.pixels.length}`;byId('percent').textContent=`${Math.round(engine.progress*100)}%`;byId('progress').style.width=`${engine.progress*100}%`;
  byId('lineLabel').textContent=`Line ${Math.ceil(engine.index/engine.size)} / ${engine.size}`;byId('emptyImage').hidden=engine.index>0;byId('exportButton').disabled=engine.index===0;
}
function setMode(mode){
  engine.configure(mode);const metadata=MODES[mode];
  for(const key of Object.keys(MODES))byId(key+'Button').setAttribute('aria-pressed',String(mode===key));
  byId('modeDescription').textContent=metadata.description;byId('imageTitle').textContent=metadata.short+(mode==='se'?' · 표면 형상':' · 상대 조성');byId('modeTag').textContent=metadata.short;
  byId('imageNote').textContent=mode==='se'?'기울기·모서리 대비. 밝기가 높이라고 직접 해석하지 마세요.':'밝은 원형 영역은 높은 상대 평균 원자번호, 어두운 원형 영역은 낮은 상대값으로 설정했습니다. 실제 원소 식별은 아닙니다.';
  byId('flow').replaceChildren();
  for(const [id,text] of [['gun','전자총'],['scan','주사 코일'],['sample','시료'],[mode,metadata.short+' 검출'],['control','픽셀 취득']]){const button=document.createElement('button');button.textContent=text;button.onclick=()=>selectPart(id);byId('flow').append(button);}
  selectPart(mode);drawImage();update();
}
byId('seButton').onclick=()=>setMode('se');byId('bseButton').onclick=()=>setMode('bse');
byId('startButton').onclick=()=>{if(engine.status==='scanning')engine.pause();else engine.start();update();};
byId('resetButton').onclick=()=>{engine.reset();drawImage();update();};
byId('defocusInput').oninput=event=>{engine.configure(engine.mode,Number(event.target.value));byId('defocusValue').textContent=engine.defocus+'%';drawImage();update();};
byId('homeButton').onclick=()=>scene?.home();
for(const [id,action] of [['focusButton','focus'],['explodeButton','explode']])byId(id).onclick=event=>{const enabled=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(enabled));scene?.[action](enabled);};
for(const guide of GUIDES){const option=document.createElement('option');option.value=guide.id;option.textContent=guide.name;byId('symptomSelect').append(option);}
byId('symptomSelect').onchange=event=>{
  const guide=GUIDES.find(item=>item.id===event.target.value);scene?.related(guide?.parts||[]);
  document.querySelectorAll('[data-part]').forEach(button=>button.classList.toggle('related',guide?.parts.includes(button.dataset.part)||false));
  byId('guide').innerHTML=guide?`<p>${guide.cause}</p><div class="guide-parts">${guide.parts.map(id=>`<button data-related="${id}">${PARTS.find(part=>part.id===id).ko}</button>`).join('')}</div><ol>${guide.steps.map(step=>`<li>${step}</li>`).join('')}</ol>`:'';
  document.querySelectorAll('[data-related]').forEach(button=>button.onclick=()=>selectPart(button.dataset.related));
};
byId('exportButton').onclick=()=>{if(!engine.index)return;const url=URL.createObjectURL(new Blob(['\ufeff'+engine.csv()],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`sem-${engine.mode}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
byId('aboutButton').onclick=()=>byId('aboutDialog').showModal();byId('closeAbout').onclick=()=>byId('aboutDialog').close();
setMode('se');let previous=performance.now(),lastIndex=-1;
function animate(time){const delta=Math.max(0,(time-previous)/1000);previous=time;engine.tick(delta);if(engine.index!==lastIndex){drawImage();update();lastIndex=engine.index;}scene?.render(engine,Math.min(delta,.1),time);requestAnimationFrame(animate);}
document.addEventListener('visibilitychange',()=>{if(document.hidden){engine.pause();update();}previous=performance.now();});
requestAnimationFrame(animate);
