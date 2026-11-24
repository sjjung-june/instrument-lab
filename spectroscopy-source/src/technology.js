import {simsConfig} from './config.js';
import {SPECIES,flightTime,magneticField} from './sims.js';

const byId=id=>document.getElementById(id);
export function mountTechnology(engine,config,refresh,selectPart){
  const label=document.createElement('label');label.htmlFor='technologySelect';label.textContent='SIMS 분석기 방식';
  const select=document.createElement('select');select.id='technologySelect';
  for(const [value,text] of [['tof','ToF-SIMS · 비행시간형'],['magnetic','M-SIMS · 자기 섹터형']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}label.append(select);byId('thicknessInput').closest('label').before(label);
  select.onchange=()=>{engine.setTechnology(select.value);Object.assign(config,simsConfig(engine.technology));refresh({});
    document.querySelector('.workspace header b').textContent=`Workspace / ${config.subtitle}`;document.querySelector('.heading h1').textContent=config.heading;document.querySelector('.heading p').textContent=config.intro;
    document.querySelectorAll('[data-part]').forEach(button=>button.textContent=config.parts.find(part=>part.id===button.dataset.part).name);
    document.querySelectorAll('[data-mode]').forEach(button=>{button.textContent=config.modes[button.dataset.mode];button.setAttribute('aria-pressed',String(button.dataset.mode===engine.mode));});
    [...byId('flow').children].forEach((button,index)=>button.textContent=config.parts.find(part=>part.id===['source','sample','lens','analyzer','detector'][index]).ko);
    byId('symptomSelect').value='';byId('symptomSelect').dispatchEvent(new Event('change'));selectPart('analyzer');
  };
  const paragraphs=byId('aboutDialog').querySelectorAll('p');
  paragraphs[0].textContent='M-SIMS는 자기 섹터형으로 해석했습니다. 연속 1차 빔, 정전 에너지 필터와 자기 섹터, 단일 수집기 예시입니다. ToF-SIMS는 펄스 1차 빔과 이상적 직선 비행시간 경로입니다. 동일 Cu/SiO₂/Si·B 합성 쿠폰을 사용하며 장비 간 감도·분해능 우열을 재현하지 않습니다.';
  paragraphs[1].textContent='M-SIMS 깊이 모드는 연속 제거와 분석을 동시에 표시하고, 극성별 세 질량을 순차 전환한 한 사이클로 단순화합니다. 다중 수집기형도 있습니다. ToF-SIMS 깊이는 별도 제거 빔과 펄스 분석을 교대합니다. ToF 스펙트럼은 펄스마다 넓은 질량 범위를 얻는 개념이며 화면의 순차 그리기는 질량 스캔이 아닙니다. M-SIMS 스펙트럼·이미지도 파괴적이지만 누적 제거 깊이 계산은 깊이 모드에만 적용합니다. 실제 선량·분자 간섭·제거율·혼합·농도·HBM 내부 구조를 재현하지 않습니다. 초기화는 새 가상 시료입니다.';
  const reference=document.createElement('a');reference.href='https://www.nist.gov/programs-projects/magnetic-sector-secondary-ion-mass-spectrometry';reference.target='_blank';reference.rel='noreferrer';reference.textContent='M-SIMS 원리 참고 · NIST';byId('aboutDialog').append(reference);
}
export function updateTechnology(engine){
  const magnetic=engine.technology==='magnetic',depth=engine.mode==='depth',image=engine.mode==='image',name=magnetic?'M-SIMS':'ToF-SIMS',species=SPECIES[engine.polarity].find(item=>item.id===engine.species);
  byId('plotTitle').textContent=`${name} · ${depth?'명목 깊이별 응답':image?species.name+' 이미지':magnetic?'자장 스윕 스펙트럼':'비행시간 질량 스펙트럼'}`;
  byId('modeDescription').textContent=magnetic?(depth?'연속 1차 빔이 제거와 분석을 함께 수행합니다. 세 질량을 순차 전환한 한 사이클의 응답을 깊이별로 표시합니다.':image?'선택 m/z만 수집하며 XY 래스터를 취득합니다. 연속 스퍼터로 시료가 손상되는 분석입니다.':'고정 가속전압·반경에서 자장을 스윕하며 m/z 1–70을 순차 선택하는 단일 수집기 예시입니다.'):(depth?'이중 빔: 별도 제거 이온빔과 펄스 분석을 교대해 명목 0–80 nm를 탐색합니다.':'펄스당 넓은 질량 범위를 비행시간으로 분리합니다. 순차 화면 표시는 실제 질량 스캔이 아닙니다. 저선량도 비파괴를 뜻하지 않습니다.');
  byId('phaseLabel').textContent=magnetic?(depth?'연속 스퍼터 + 질량 순차 수집':image?'연속 빔 · 선택 질량 수집':'연속 빔 · 자장 스윕'):(depth?(engine.status==='scanning'?(engine.phase==='sputter'?'제거 단계':'펄스 분석 단계'):byId('status').textContent):'펄스 이차이온 분석');
  byId('destructive').hidden=!magnetic&&!depth;byId('destructive').textContent=magnetic?'파괴 분석 · 연속 1차 빔으로 제거합니다. 누적 제거 깊이는 깊이 모드에서만 모사하며, 실제 시료는 초기화로 복원되지 않습니다.':'파괴 분석 · 제거와 펄스 분석을 교대합니다. 깊이는 교정하지 않은 명목값이며 실제 시료는 초기화로 복원되지 않습니다.';
  document.querySelector('.observation .check b').textContent=magnetic?'이상적 자기 섹터 관계':'이상적 비행시간 관계';
  byId('equation').textContent=magnetic?`m/z ∝ B² · |V|=5 kV, r=0.35 m, 단일 전하 가정. ${depth?'선택 채널 기준':image?'선택':'현재'} m/z ${engine.selectedMass.toFixed(1)} → |B| ${magneticField(engine.selectedMass).toFixed(3)} T (실측·장비 설정 아님).`:`t ∝ √(m/z) · L=1 m, |V|=2 kV, 단일 전하 가정. ${species.name}의 이상적 비행시간 ${flightTime(species.mass).toFixed(2)} μs (실측 아님).`;
  byId('physicsNote').textContent=magnetic?'연속 1차 이온 → 스퍼터·이차이온 추출 → 정전 에너지 필터 → 자기 섹터의 m/z 선택 → 수집기. 별도 제거 빔은 이 예시에서 비활성입니다.':'펄스 1차 이온 → 이차이온 추출 → 비행시간에 따른 m/z 분리 → 시간 분해 검출. 깊이 모드는 제거 빔과 분석 펄스를 교대합니다.';
}
