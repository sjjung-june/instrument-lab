export const PARTS=[
{id:'gun',name:'Electron Gun',ko:'전자총',role:'전자를 발생시켜 컬럼의 전자광학계로 공급합니다.',check:'방출 상태와 관련 경보를 장비 진단 절차에 따라 확인합니다.'},
{id:'condenser',name:'Condenser Lenses',ko:'집속렌즈',role:'전자빔을 조절해 얇은 시료를 조명합니다.',check:'조명 정렬과 빔 상태를 제조사 절차에 따라 확인합니다.'},
{id:'aperture',name:'Apertures',ko:'조리개',role:'전자빔의 일부를 선택해 조명 또는 영상 대비에 영향을 줍니다.',check:'조리개의 위치와 오염 여부를 확인합니다.'},
{id:'sample',name:'Specimen & Holder',ko:'시료 · 홀더',role:'투과 가능한 얇은 시료를 전자빔 경로에 위치시킵니다.',check:'홀더 삽입 상태, 시료 고정과 오염 여부를 확인합니다.'},
{id:'objective',name:'Objective Lens',ko:'대물렌즈',role:'시료를 통과한 전자를 이용해 초기 영상과 회절 정보를 형성합니다.',check:'초점, 비점과 관련 경보를 장비 절차에 따라 확인합니다.'},
{id:'projector',name:'Projection Lenses',ko:'중간 · 투사 렌즈',role:'설정에 따라 영상 또는 회절 패턴을 검출기 쪽으로 투사합니다.',check:'영상 모드, 렌즈 상태와 관련 설정을 확인합니다.'},
{id:'detector',name:'Camera / Screen',ko:'카메라 · 관찰 스크린',role:'투사된 전자 정보를 관찰하거나 디지털 영상으로 취득합니다.',check:'검출기 선택, 노출과 포화 여부를 확인합니다.'},
{id:'stem',name:'STEM ADF Detector',ko:'STEM 환형 검출기',role:'집속 프로브를 주사하며 특정 각도 범위로 산란된 전자를 모아 픽셀 강도를 구성합니다. ADF 개념을 표현합니다.',check:'검출기 선택과 주사·프로브 정렬을 확인합니다.'},
{id:'eels',name:'EELS Spectrometer',ko:'EELS 분광기',role:'투과 전자를 에너지 손실에 따라 분산해 스펙트럼을 취득합니다.',check:'에너지 기준점, 수집 조건과 검출기 포화를 확인합니다.'},
{id:'vacuum',name:'Vacuum System',ko:'진공 시스템',role:'전자광학계와 시료가 적절한 진공 환경에서 동작하도록 돕습니다.',check:'압력 추세와 진공 경보를 확인합니다.'}
];
export const GUIDES=[
{name:'영상이 흐림',parts:['objective','sample','detector'],cause:'초점·비점, 시료 이동 또는 오염 가능성',steps:['시료 고정과 홀더 상태를 확인합니다.','장비 절차에 따라 초점과 비점을 확인합니다.','기준 시료와 검출기 설정을 비교합니다.'],warning:'불필요한 추가 노출은 시료에 영향을 줄 수 있습니다.'},
{name:'전자빔이 약함',parts:['gun','condenser','aperture'],cause:'조명 설정, 조리개 위치 또는 전자총 상태 가능성',steps:['조명 설정과 조리개 위치를 확인합니다.','전자총과 진공 경보를 기록합니다.','기준 조건에서 재현 여부를 확인합니다.'],warning:'고전압 구성품을 임의로 열거나 인터록을 우회하지 마세요.'},
{name:'영상에 얼룩이 생김',parts:['sample','aperture','detector'],cause:'시료·조리개 오염 또는 검출기 상태 가능성',steps:['얼룩이 시료 이동에 따라 변하는지 확인합니다.','기준 시료와 검출기 설정을 비교합니다.','제조사 절차에 따라 오염을 점검합니다.'],warning:'홀더와 시료의 취급 절차를 따르세요.'},
{name:'진공 압력 이상',parts:['vacuum','sample'],cause:'시료 가스 방출, 누설 또는 펌프 상태 변화 가능성',steps:['작업을 멈추고 압력 변화와 경보를 기록합니다.','시료 적합성과 홀더 상태를 확인합니다.','회복되지 않으면 장비 담당자에게 문의합니다.'],warning:'진공 인터록을 우회하거나 컬럼을 임의로 개방하지 마세요.'},
{name:'회절 패턴 이상',parts:['objective','aperture','sample'],cause:'모드·조리개 설정, 시료 영역 또는 정렬 변화 가능성',steps:['관찰 모드와 시료 영역을 확인합니다.','조리개 선택과 위치를 확인합니다.','기준 시료 및 장비 매뉴얼과 비교합니다.'],warning:'정렬 조작은 장비별 교육 절차에 따라 진행하세요.'}
,{name:'DF 대비가 약함',parts:['aperture','objective','sample'],cause:'선택한 회절파, 시료 방위 또는 조리개 정렬 가능성',steps:['선택된 회절파와 관찰 영역을 확인합니다.','대물 조리개와 정렬 상태를 확인합니다.','BF·회절 패턴과 시료 조건을 비교합니다.'],warning:'DF 밝기는 조성이나 두께만으로 결정되지 않습니다.'}
,{name:'STEM 주사 줄무늬',parts:['stem','condenser','sample'],cause:'드리프트, 외란 또는 주사 조건 가능성',steps:['주사 방향·시간에 따른 변화를 확인합니다.','시료와 환경 안정화를 확인합니다.','기준 시료에서 프로브·주사 상태를 비교합니다.'],warning:'추가 노출과 시료 손상 가능성을 고려하세요.'}
,{name:'EELS 피크가 이동함',parts:['eels','detector','sample'],cause:'에너지 기준, 드리프트 또는 수집 조건 가능성',steps:['제로로스 기준점과 에너지 교정을 확인합니다.','노출·포화와 수집 조건을 점검합니다.','기준 스펙트럼 및 장비 절차와 비교합니다.'],warning:'합성 피크를 실제 원소·결합 상태로 해석하지 마세요.'}
];
export const MODES={image:{name:'BF',title:'BF TEM 이미지',description:'투과파를 이용한 밝은 바탕의 개념 영상입니다.',duration:4},diffraction:{name:'Diffraction',title:'회절 패턴',description:'결정구조를 계산하지 않는 합성 회절 점 배열입니다.',duration:4},df:{name:'DF',title:'DF TEM 이미지',description:'대물 조리개로 선택한 회절파가 발생한 영역이 밝아지는 개념 영상입니다. g₁/g₂를 바꿔 비교하세요.',duration:4},stem:{name:'STEM · ADF',title:'STEM ADF 주사 영상',description:'집속 프로브를 한 점씩 주사하며 환형 검출 신호로 픽셀을 채웁니다. 조성·원자번호 정량 모델은 아닙니다.',duration:8},eels:{name:'EELS',title:'EELS 스펙트럼',description:'에너지 손실에 따른 합성 강도입니다. 0 eV 부근 제로로스, 저손실 피크와 임의의 코어 에지 A/B를 표시합니다.',duration:5}};
export function darkFieldIntensity(x,y,thickness,reflection=1){const center=reflection===1?[.32,.4]:[.7,.6];const domain=Math.exp(-((x-center[0])**2/.025+(y-center[1])**2/.045));const stripes=.65+.35*Math.cos(60*x+27*y);return Math.min(1,.025+domain*stripes*(.5+.3*transmission(thickness)));}
export function stemIntensity(x,y,thickness){let value=.04;for(let row=0;row<7;row++)for(let col=0;col<7;col++){const dx=x-(.12+col*.125+(row%2)*.025),dy=y-(.12+row*.125);value+=(.45+.25*((row+col)%3)/2)*Math.exp(-(dx*dx+dy*dy)/.00032);}return Math.min(1,value*(.5+thickness/150));}
export function eelsIntensity(energy,thickness){const zero=48000*transmission(thickness)*Math.exp(-.5*(energy/2.2)**2);const loss=1800*(1-transmission(thickness))*Math.exp(-.5*((energy-22)/7)**2);const background=180*(thickness/50)/(1+Math.max(0,energy)/45)**1.5;const edge=(onset,height)=>energy<onset?0:height*(thickness/50)*Math.exp(-(energy-onset)/110);return Math.max(1,zero+loss+background+edge(200,90)+edge(520,65));}
export function transmission(thickness){return Math.exp(-thickness/100);}
export function imageIntensity(x,y,thickness){const phase=Math.sin(15*x+4*Math.sin(8*y))+Math.cos(21*y-5*x)+.7*Math.sin(26*(x+y));const grain=.1*Math.sin(91*x+79*y)*Math.cos(67*x-83*y);return Math.max(0,Math.min(1,.28+.46*transmission(thickness)+.1*phase+grain));}
export function diffractionIntensity(x,y,thickness){let value=.025;for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){const dx=x-.5-col*.115,dy=y-.5-row*.115;const strength=col===0&&row===0?.8:.5*Math.exp(-.08*(col*col+row*row));value+=strength*transmission(thickness)*Math.exp(-(dx*dx+dy*dy)/.00011);}return Math.min(1,value);}
export class TemSimulation{
constructor(){this.thickness=50;this.reflection=1;this.reset();}
reset(){this.status='idle';this.mode=this.mode||'image';this.progress=0;this.exposureThickness=this.thickness;this.exposureReflection=this.reflection;}
configure(changes){if('mode'in changes&&!MODES[changes.mode])throw new RangeError('Unknown TEM mode');if('thickness'in changes&&(!Number.isFinite(changes.thickness)||changes.thickness<10||changes.thickness>100))throw new RangeError('Invalid thickness');if('reflection'in changes&&![1,2].includes(changes.reflection))throw new RangeError('Invalid reflection');for(const key of ['mode','thickness','reflection'])if(key in changes)this[key]=changes[key];this.reset();}
start(mode=this.mode,restart=false){if(!MODES[mode])throw Error('Unknown TEM mode');if(!restart&&this.status==='paused'&&this.mode===mode){this.status='exposing';return;}this.mode=mode;this.progress=0;this.exposureThickness=this.thickness;this.exposureReflection=this.reflection;this.status='exposing';}
pause(){if(this.status==='exposing')this.status='paused';}
tick(seconds){if(this.status!=='exposing'||!Number.isFinite(seconds)||seconds<=0)return;this.progress=Math.min(1,this.progress+seconds/MODES[this.mode].duration);if(this.progress>=1-1e-10){this.progress=1;this.status='complete';}}
get scanXY(){const index=Math.min(4095,Math.floor(this.progress*4096));return [index%64/63,Math.floor(index/64)/63];}
eelsCsv(){return '# synthetic EELS; no element identification\nenergy_loss_eV,intensity_au\n'+Array.from({length:401},(_,index)=>{const energy=index*2;return energy+','+(eelsIntensity(energy,this.exposureThickness)*this.progress).toFixed(5);}).join('\n');}
get brightness(){return transmission(this.exposureThickness)*this.progress;}
}
