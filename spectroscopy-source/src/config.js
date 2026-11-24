const part=(id,name,ko,role,check)=>({id,name,ko,role,check});
export const CONFIG={
  xps:{title:'XPS',subtitle:'X-ray Photoelectron Spectroscopy',heading:'표면의 전자에서, 화학 상태까지.',intro:'Survey · Narrow · Depth Profiling으로 SiO₂/Si 표면의 합성 신호를 비교하세요.',modes:{survey:'Survey',highres:'Narrow',depth:'Depth Profiling'},parts:[
    part('source','X-ray source','X선원 · 단색화기','Al Kα 1486.6 eV X선으로 광전자를 발생시키는 일반화 소스입니다.','출력 안정화·셔터·인터록 상태를 제조사 절차로 확인합니다.'),
    part('sample','SiO₂ / Si sample','산화막/실리콘 표면 쿠폰','가상 2–12 nm 산화막과 표면 탄소를 가진 시료입니다. SAM의 HBM 적층 내부가 아니라 표면 소재 예시입니다.','접지·시료 고정·오염·측정 위치를 확인합니다.'),
    part('lens','Electron lens','전자 수집 렌즈','광전자를 수집하고 분석기 입사 조건을 형성합니다.','렌즈 모드·시료 높이와 기준 시료의 신호를 비교합니다.'),
    part('analyzer','Hemispherical analyzer','반구형 에너지 분석기','전자 운동에너지를 분리해 결합에너지 스펙트럼으로 변환합니다.','패스 에너지·에너지 눈금과 기준 피크를 확인합니다.'),
    part('detector','Electron detector','전자 검출기','에너지별 합성 강도를 픽셀·스펙트럼으로 취득합니다.','포화·검출 신호·배경·장비 로그를 확인합니다.'),
    part('neutralizer','Charge neutralizer','전하 중화기','대전으로 인한 균일 에너지 이동을 줄이는 개념 모델입니다.','중화 조건과 기준 위치를 비교합니다. 자동으로 정확한 에너지 기준을 보장하지 않습니다.'),
    part('sputter','Sputter ion gun','스퍼터 이온총','깊이 모드에서 제거와 XPS 분석을 교대로 수행합니다. 파괴 분석입니다.','스퍼터 조건·제거율 교정·크레이터·선택적 스퍼터 영향을 확인합니다.'),
    part('vacuum','Vacuum / chamber','초고진공 · 챔버','광전자 경로와 시료 주변 진공을 유지합니다.','진공 경보·로드록 이력과 탈가스·오염을 확인합니다.')],
    guides:[{id:'charge',name:'피크 위치가 함께 이동함',parts:['sample','neutralizer','analyzer'],steps:['시료 접지와 중화 상태를 확인합니다.','기준 시료·에너지 눈금과 반복성을 비교합니다.','균일·차등 대전과 실제 화학 이동을 구분해 담당자와 검토합니다.']},{id:'weak',name:'강도가 낮거나 피크가 넓음',parts:['source','lens','detector'],steps:['측정 위치·시료 높이·렌즈 모드를 확인합니다.','패스 에너지와 기준 시료의 신호를 비교합니다.','소스·검출기·진공 로그를 기록해 담당자에게 전달합니다.']},{id:'depth',name:'깊이별 변화가 비정상적임',parts:['sputter','sample','vacuum'],steps:['스퍼터 제거율과 크레이터 교정을 확인합니다.','혼합·거칠기·선택적 스퍼터와 화학적 환원을 검토합니다.','프로파일을 원래 구조와 동일하다고 단정하지 말고 교차 분석합니다.']}]},
  sims:{title:'SIMS',subtitle:'Time-of-Flight Secondary Ion Mass Spectrometry',heading:'이차이온에서, 분포와 깊이까지.',intro:'Cu 패턴/SiO₂/Si 표면과 가상 B 분포를 질량·XY·깊이 신호로 탐색하세요.',modes:{spectrum:'Static 질량 스펙트럼',image:'이온 이미지',depth:'깊이 프로파일'},parts:[
    part('source','Pulsed primary ion gun','펄스 1차 이온총','펄스형 분석 빔이 표면에서 이차이온을 방출시킵니다. 저선량 분석의 개념이며 무손상을 의미하지 않습니다.','빔 안정성·펄스·선량·주사 조건을 확인합니다.'),
    part('sample','Cu / SiO₂ / Si sample','Cu 패턴 · 산화막 · Si','가상 Cu 표면 패턴, 산화막, Si와 35 nm 부근의 B 분포를 가진 쿠폰입니다. 실제 HBM 배선도·농도 분포가 아닙니다.','분석 영역·고정·접지·교차 오염을 확인합니다.'),
    part('lens','Secondary ion extraction','이차이온 추출 렌즈','선택된 극성의 이온을 TOF 경로로 추출합니다.','극성·추출 조건·정렬과 기준 신호를 확인합니다.'),
    part('analyzer','TOF analyzer','비행시간 질량 분석기','비행시간에 따라 m/z를 구분하는 개념적 직선 경로입니다.','질량 교정·시작 시간·피크 분리와 간섭을 확인합니다.'),
    part('detector','Ion detector','이온 검출기','비행시간별 이차이온을 취득합니다. 모든 강도는 임의 단위입니다.','포화·데드타임·검출기 응답과 기준 시료를 확인합니다.'),
    part('neutralizer','Charge compensation','전하 보상계','비전도성 표면의 대전 완화를 돕는 개념 부품입니다. 이 버전에서는 보상 동역학을 계산하지 않습니다.','대전·질량 이동·영상 왜곡을 기준 시료와 비교합니다.'),
    part('sputter','Sputter ion gun','깊이 제거용 이온총','이중 빔 깊이 모드에서 분석 펄스와 제거 단계를 교대합니다. 음이온 예시는 Cs⁺, 양이온 예시는 O₂⁺ 제거 빔으로 표시합니다.','크레이터·분석 영역·제거율·혼합·매트릭스 효과를 확인합니다.'),
    part('vacuum','Vacuum / chamber','진공 · 시료 챔버','이온 비행과 시료 환경을 유지합니다.','진공 상태·잔류가스·탈가스와 로드록 이력을 확인합니다.')],
    guides:[{id:'mass',name:'질량 피크가 이동하거나 겹침',parts:['analyzer','lens','neutralizer'],steps:['극성과 질량 교정·기준 피크를 확인합니다.','대전·시간 기준·분해능과 동중질량 간섭을 검토합니다.','단일 명목 m/z만으로 원소·분자를 확정하지 않습니다.']},{id:'matrix',name:'신호가 농도와 비례하지 않음',parts:['sample','source','sputter'],steps:['매트릭스·1차 이온·극성에 따른 이온화 수율 차이를 고려합니다.','적절한 기준 시료와 RSF·검출기 응답을 확인합니다.','임의 강도를 농도로 바로 환산하지 않습니다.']},{id:'depth',name:'계면이 넓거나 깊이가 다름',parts:['sputter','sample','lens'],steps:['크레이터 깊이와 제거율 교정을 확인합니다.','혼합·거칠기·크레이터 가장자리 영향을 비교합니다.','명목 깊이와 측정 깊이를 구분하고 별도 표면 측정으로 확인합니다.']}]}
};
export function simsConfig(technology){
  const base=CONFIG.sims;if(technology==='tof')return {...base,heading:'ToF-SIMS · 펄스에서 비행시간까지.'};
  const replacements={
    source:part('source','Continuous primary ion gun','연속 1차 이온총','연속 1차 이온빔으로 표면을 스퍼터하며 이차이온을 생성합니다. 깊이 모드에서 제거와 분석이 동시에 진행됩니다.','빔 전류 안정성·선량·주사 면적·기준 시료를 확인합니다.'),
    lens:part('lens','Secondary ion extraction','이차이온 추출 렌즈','선택 극성의 이온을 에너지 필터와 자기 섹터로 수집합니다.','추출 전압·극성·입사 슬릿·정렬과 기준 신호를 확인합니다.'),
    analyzer:part('analyzer','ESA + magnetic sector','정전 에너지 필터 · 자기 섹터','정전 섹터로 에너지 범위를 선택한 뒤 자기 섹터로 m/z를 분리하는 이중 집속 개념입니다. 단일 수집기 예시이며 다중 수집기 장비도 있습니다.','기준 질량·자장 안정성·에너지 창·슬릿·질량 간섭을 확인합니다.'),
    detector:part('detector','Selected-mass collector','선택 질량 수집기','스펙트럼은 자장 스윕, 이미지는 선택 질량, 깊이는 세 질량을 순차 전환한 한 사이클의 합성값을 표시합니다.','검출기 범위·포화·데드타임·질량 전환 후 안정화를 확인합니다.'),
    sputter:part('sputter','Auxiliary gun (inactive)','보조 이온총 · 이 예시 비활성','이 모델의 M-SIMS 제거는 연속 1차 이온총이 담당합니다. 별도 제거/분석 교대는 사용하지 않습니다.','제거율·크레이터는 1차 빔 조건과 함께 확인합니다. 보조 총 사용은 장비별로 다릅니다.')};
  return {...base,subtitle:'Magnetic-sector Secondary Ion Mass Spectrometry',heading:'M-SIMS · 연속 빔에서 질량 선택까지.',intro:'자기 섹터형 SIMS: 같은 가상 쿠폰을 연속 스퍼터·질량 선택·깊이 프로파일로 비교하세요.',modes:{spectrum:'자장 스윕 스펙트럼',image:'선택 질량 이미지',depth:'연속 깊이 프로파일'},parts:base.parts.map(item=>replacements[item.id]||item),guides:base.guides.map(guide=>guide.id==='mass'?{...guide,steps:['에너지 창·입출사 슬릿·기준 질량을 확인합니다.','자장·가속 전압 안정성과 대전·동중질량 간섭을 검토합니다.','단일 명목 m/z만으로 원소·분자를 확정하지 않습니다.']}:guide.id==='depth'?{...guide,parts:['source','sample','lens']}:guide.id==='matrix'?{...guide,parts:['sample','source','detector']}:guide)};
}
