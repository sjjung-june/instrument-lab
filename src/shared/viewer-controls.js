import './viewer-controls.css';
import {PLAYBACK_RATES} from './playback.js';

export function mountViewerControls(scene,clock){
  const home=document.querySelector('#homeButton,#resetCamera,#resetView'),explode=document.querySelector('#explodeButton,#explode');
  if(!home||!explode)throw new Error('Viewer toolbar missing');
  home.textContent='시점 초기화';home.setAttribute('aria-label','시점 초기화');home.onclick=()=>scene?.home();
  let focus=document.getElementById('focusButton');
  if(!focus){focus=document.createElement('button');focus.id='focusButton';focus.type='button';focus.setAttribute('aria-pressed','true');explode.before(focus);}
  focus.textContent='선택 강조';focus.setAttribute('aria-label','선택 강조');focus.title='선택: 녹색 / 관련 부품: 황색 / 나머지: 반투명';
  focus.onclick=()=>{const enabled=focus.getAttribute('aria-pressed')!=='true';focus.setAttribute('aria-pressed',String(enabled));scene?.focus(enabled);};
  explode.textContent='분해 보기';explode.onclick=()=>{const enabled=explode.getAttribute('aria-pressed')!=='true';explode.setAttribute('aria-pressed',String(enabled));scene?.explode(enabled);};
  const strip=document.createElement('div');strip.className='playback-controls';
  const label=document.createElement('label');label.htmlFor='playbackRate';label.textContent='재생 속도';
  const select=document.createElement('select');select.id='playbackRate';select.title='이 장비의 애니메이션과 가상 취득 속도입니다. 실제 측정 조건은 바뀌지 않습니다.';
  for(const rate of PLAYBACK_RATES){const option=document.createElement('option');option.value=String(rate);option.textContent=rate+'×'+(rate===.25?' · 학습 기본':'');select.append(option);}select.value=String(clock.rate);select.onchange=()=>clock.setRate(Number(select.value));
  const note=document.createElement('span');note.textContent='선택 녹색 · 관련 황색 · 속도 변경 시 취득 데이터 유지';label.append(select);strip.append(label,note);
  document.getElementById('scene').before(strip);
  document.addEventListener('visibilitychange',()=>clock.resetTimestamp());
}
