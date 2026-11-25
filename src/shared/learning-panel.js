import './learning-panel.css';
import {FAULTS,compatibleFault} from './fault-catalog.js';
import {PART_LESSONS,partLesson,REFERENCES} from './part-knowledge.js';
import {conditionKey,readLearningData,referenceLearningData} from './learning-data.js';
import {applyFault,comparisonMetrics,comparisonCSV} from './fault-models.js';

function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function bounds(values){let minimum=Infinity,maximum=-Infinity;for(const value of values)if(Number.isFinite(value)){minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);}return [minimum,maximum>minimum?maximum:minimum+1];}
const displayValue=(data,value)=>data.log?Math.log10(Math.max(1e-8,value)):value;
function drawComparison(canvas,data,reference,extent,axisExtent){
  const context=canvas.getContext('2d'),width=canvas.width,height=canvas.height;context.fillStyle='#101b28';context.fillRect(0,0,width,height);
  if(!data){context.fillStyle='#b6c8dc';context.font='15px sans-serif';context.fillText('취득 데이터 또는 고정 예시를 선택하세요',24,130);return;}
  if(data.shape==='grid'){
    const [low,high]=extent,cellWidth=(width-32)/data.width,cellHeight=(height-36)/data.height;
    for(let index=0;index<data.values.length;index++){const value=data.values[index];if(!Number.isFinite(value))continue;const ratio=Math.max(0,Math.min(1,(value-low)/(high-low)));context.fillStyle=`hsl(${235-235*ratio} 80% ${28+ratio*35}%)`;context.fillRect(16+index%data.width*cellWidth,10+Math.floor(index/data.width)*cellHeight,cellWidth+.3,cellHeight+.3);}
    context.fillStyle='#b6c8dc';context.font='12px sans-serif';context.fillText(`공통 색 범위 ${low.toPrecision(3)} ~ ${high.toPrecision(3)} · 미취득 공백`,16,height-8);return;
  }
  const all=[...data.points,...(reference?.points??[])],axis=axisExtent??bounds(all.map(point=>point.axis)),[low,high]=extent;
  context.strokeStyle='#5e748b';context.beginPath();context.moveTo(48,15);context.lineTo(48,height-38);context.lineTo(width-14,height-38);context.stroke();
  const plot=(points,color,dashed)=>{context.strokeStyle=color;context.lineWidth=2;context.setLineDash(dashed?[5,4]:[]);context.beginPath();let connected=false;for(const point of points){if(!Number.isFinite(point.value)){connected=false;continue;}const ratio=(point.axis-axis[0])/(axis[1]-axis[0]),coordinateX=48+(data.reverse?1-ratio:ratio)*(width-64),coordinateY=height-38-(displayValue(data,point.value)-low)/(high-low)*(height-56);if(connected)context.lineTo(coordinateX,coordinateY);else context.moveTo(coordinateX,coordinateY);connected=true;}context.stroke();context.setLineDash([]);};
  if(reference)plot(reference.points,'#72b9b4',true);plot(data.points,reference?'#ff8b83':'#7de2b6',false);
  context.fillStyle='#b6c8dc';context.font='11px sans-serif';context.fillText(high.toPrecision(3),2,17);context.fillText(low.toPrecision(3),2,height-38);context.fillText(data.axisLabel,50,height-9);context.fillText((data.reverse?axis[1]:axis[0]).toPrecision(3),48,height-24);context.fillText((data.reverse?axis[0]:axis[1]).toPrecision(3),width-60,height-24);
}
export function mountLearningLab({kind,engine,parts,selectPart,scene},strip){
  const getParts=typeof parts==='function'?parts:()=>parts,heading=document.getElementById('partName'),inspector=heading?.closest('.inspector')??heading?.closest('section');
  const detail=element('details',undefined,'part-lesson');detail.open=true;detail.append(element('summary','부품 상세 · 입력에서 데이터까지'));const lessonBody=element('div');detail.append(lessonBody);inspector?.append(detail);
  let lastLesson='';
  function refreshLesson(){
    const part=getParts().find(item=>item.name===heading?.textContent);if(!part)return;
    const key=part.id+conditionKey(kind,engine);if(key===lastLesson)return;lastLesson=key;
    const lesson=partLesson(kind,part,engine);lessonBody.replaceChildren();
    if(!PART_LESSONS[kind]?.[part.id])lessonBody.append(element('p','기본 역할과 점검 설명 · 일반화 모델','learning-muted'));
    for(const [key,title] of [['input','입력'],['output','출력'],['mechanism','작동 원리'],['normal','기준 확인'],['signature','이상 시 보이는 단서'],['checks','점검 순서'],['chain','장비의 신호 경로']]){lessonBody.append(element('h4',title),element('p',lesson[key]));}
    lessonBody.append(element('p',lesson.scope,'learning-muted'));
  }
  refreshLesson();const observer=new MutationObserver(refreshLesson);if(heading)observer.observe(heading,{childList:true,subtree:true,characterData:true});
  const panel=element('section',undefined,'learning-lab');panel.id='learningLab';panel.setAttribute('aria-label','학습용 이상 데이터 비교');
  panel.append(element('div','FAULT LEARNING · ORIGINAL DATA PRESERVED','learning-eyebrow'),element('h2','이상 데이터 실습'),element('p','원본 취득 기준 ↔ 학습용 왜곡을 비교합니다. 실제 고장 진단·정량 예측이 아니며 기존 그래프·원본 CSV·장비 상태는 바꾸지 않습니다. 원본 자체의 정상 여부도 보장하지 않습니다.','learning-warning'));
  const controls=element('div',undefined,'learning-controls'),live=element('button','현재 취득 데이터'),demo=element('button','고정 합성 예시'),scenarioLabel=element('label','문제 상황 '),scenario=element('select');scenario.id='faultScenario';scenarioLabel.htmlFor=scenario.id;
  const normalOption=element('option','추가 왜곡 없음');normalOption.value='';scenario.append(normalOption);
  for(const fault of FAULTS[kind]){const option=element('option',fault.name);option.value=fault.id;scenario.append(option);}scenarioLabel.append(scenario);
  const strengthLabel=element('label','예시 강도 '),strength=element('input'),strengthText=element('output','60%');strength.type='range';strength.id='faultSeverity';strength.min='0';strength.max='100';strength.value='60';strengthLabel.htmlFor=strength.id;strengthLabel.append(strength,strengthText);
  const reset=element('button','왜곡 해제'),download=element('button','비교 CSV · 학습용');controls.append(live,demo,scenarioLabel,strengthLabel,reset,download);panel.append(controls);
  const status=element('p',undefined,'learning-status');status.id='learningStatus';status.setAttribute('aria-live','polite');panel.append(status);
  const plots=element('div',undefined,'learning-plots'),normalCanvas=element('canvas'),faultCanvas=element('canvas');
  for(const [canvas,title] of [[normalCanvas,'원본 취득 기준'],[faultCanvas,'학습용 왜곡 · 점선은 원본']]){canvas.width=480;canvas.height=290;canvas.setAttribute('aria-label',title);const figure=element('figure');figure.append(element('figcaption',title),canvas);plots.append(figure);}panel.append(plots);
  const metrics=element('p',undefined,'learning-muted'),explanation=element('div',undefined,'learning-explanation'),related=element('div',undefined,'learning-related');panel.append(metrics,explanation,related);
  const refs=element('details');refs.append(element('summary','원리 참고 자료 · 제조사/연구 자료'));for(const [label,url] of REFERENCES[kind]??[]){const link=element('a',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';refs.append(link);}panel.append(refs);
  const main=document.querySelector('main')??document.body;main.append(panel);
  const jump=element('button','이상 데이터 실습');jump.type='button';jump.onclick=()=>panel.scrollIntoView({behavior:'smooth',block:'start'});strip.append(jump);
  let source='acquired',reference=null,referenceKey='',normal=null,affected=null,lastKey='',baseRelated=[],faultRelated=[];
  const originalRelated=scene?.related?.bind(scene);if(originalRelated)scene.related=ids=>{baseRelated=[...ids];originalRelated([...new Set([...baseRelated,...faultRelated])]);};
  function updateRelated(ids){faultRelated=ids;originalRelated?.([...new Set([...baseRelated,...faultRelated])]);}
  function render(){
    refreshLesson();const conditions=conditionKey(kind,engine);
    if(source==='reference_demo'&&referenceKey!==conditions){reference=referenceLearningData(kind,engine);referenceKey=conditions;}
    normal=source==='reference_demo'?reference:readLearningData(kind,engine);
    let incompatible=false;
    const channel=normal??{mode:engine.mode,shape:['map','image'].includes(engine.mode)?'grid':'curve'};
    for(const option of scenario.options){const fault=FAULTS[kind].find(item=>item.id===option.value);option.disabled=Boolean(fault&&!compatibleFault(fault,channel));option.title=option.disabled?'현재 데이터 채널/모드에는 적용할 수 없습니다.':'';if(option.selected&&option.disabled)incompatible=true;}
    if(incompatible)scenario.value='';
    const fault=FAULTS[kind].find(item=>item.id===scenario.value),severity=Number(strength.value)/100;
    affected=normal?applyFault(normal,fault,severity):null;strengthText.value=strength.value+'%';download.disabled=!normal;live.setAttribute('aria-pressed',String(source==='acquired'));demo.setAttribute('aria-pressed',String(source==='reference_demo'));
    status.textContent=(incompatible?'모드 변경: 호환되지 않는 왜곡을 해제했습니다. ':'')+(normal?`${source==='reference_demo'?'독립 고정 합성 예시 · 실제 취득 아님':'현재 취득 범위의 합성 데이터'} / ${normal.label} / ${normal.acquired} 취득 단위`:'아직 비교할 결과가 없습니다. 측정 시작 또는 고정 합성 예시를 선택하세요.'+(kind==='ftir'?' 같은 액세서리의 배경과 샘플 취득 완료 후 흡광도를 비교합니다.':''));
    const all=normal?[...(normal.shape==='grid'?normal.values:normal.points.map(point=>displayValue(normal,point.value))),...(affected.shape==='grid'?affected.values:affected.points.map(point=>displayValue(affected,point.value)))]:[],extent=bounds(all);
    plots.querySelector('figure+figure figcaption').textContent=normal?.shape==='grid'?'학습용 왜곡 · 동일 색 범위':'학습용 왜곡 · 점선은 원본';
    const axisExtent=normal?.shape==='curve'?bounds([...normal.points,...affected.points].map(point=>point.axis)):null;
    drawComparison(normalCanvas,normal,null,extent,axisExtent);drawComparison(faultCanvas,affected,normal,extent,axisExtent);
    metrics.textContent=normal?`공통 축/색 범위 · ${normal.valueLabel}${normal.log?' · 세로축 log₁₀ (표시 하한 10⁻⁸)':''} · 평균 |응답 차이| ${comparisonMetrics(normal,affected).meanAbsoluteDifference.toPrecision(3)} · 평균 |축 차이| ${comparisonMetrics(normal,affected).meanAxisDifference.toPrecision(3)}${affected.fault.retained!==undefined?` · 보존 이벤트 ${affected.fault.retained}/${normal.events.length}`:''} · 강도는 교육용 배율이며 고장 크기/확률이 아닙니다.`:'';
    explanation.replaceChildren();related.replaceChildren();
    if(fault){for(const [key,title] of [['appearance','화면에서 달라지는 점'],['cause','적용한 가정/변환'],['checks','확인 순서'],['confound','같이 고려할 다른 원인']])explanation.append(element('h3',title),element('p',fault[key]));for(const id of fault.parts){const part=getParts().find(item=>item.id===id);if(!part)continue;const button=element('button',part.ko??part.name);button.onclick=()=>{selectPart(id);inspector?.scrollIntoView({behavior:'smooth',block:'center'});};related.append(button);}updateRelated(fault.parts);}else{explanation.append(element('p','문제 상황을 선택하면 관련 부품과 오해하기 쉬운 원인, 점검 순서가 함께 표시됩니다. 미취득 영역은 생성하지 않습니다.'));updateRelated([]);}
  }
  function refresh(){lastKey='';render();}
  live.onclick=()=>{source='acquired';refresh();};demo.onclick=()=>{source='reference_demo';referenceKey='';refresh();};scenario.onchange=refresh;strength.oninput=refresh;reset.onclick=()=>{scenario.value='';refresh();};
  download.onclick=()=>{if(!normal)return;const blob=new Blob(['\uFEFF'+comparisonCSV(normal,affected)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=element('a');link.href=url;link.download=kind+'-training-comparison.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  render();const timer=setInterval(()=>{if(document.hidden)return;const key=JSON.stringify([conditionKey(kind,engine),engine.index,engine.progress,engine.scan,engine.rows?.length,engine.values?.length]);if(key!==lastKey){lastKey=key;render();}},350);
  window.addEventListener('pagehide',()=>{clearInterval(timer);observer.disconnect();},{once:true});
}
