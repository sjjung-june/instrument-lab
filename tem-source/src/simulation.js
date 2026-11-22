export const PARTS=[
{id:'gun',name:'Electron Gun',ko:'전자총',role:'전자를 발생시켜 컬럼의 전자광학계로 공급합니다.',check:'방출 상태와 관련 경보를 장비 진단 절차에 따라 확인합니다.'},
{id:'condenser',name:'Condenser Lenses',ko:'집속렌즈',role:'전자빔을 조절해 얇은 시료를 조명합니다.',check:'조명 정렬과 빔 상태를 제조사 절차에 따라 확인합니다.'},
{id:'aperture',name:'Apertures',ko:'조리개',role:'전자빔의 일부를 선택해 조명 또는 영상 대비에 영향을 줍니다.',check:'조리개의 위치와 오염 여부를 확인합니다.'},
{id:'sample',name:'Specimen & Holder',ko:'시료 · 홀더',role:'투과 가능한 얇은 시료를 전자빔 경로에 위치시킵니다.',check:'홀더 삽입 상태, 시료 고정과 오염 여부를 확인합니다.'},
{id:'objective',name:'Objective Lens',ko:'대물렌즈',role:'시료를 통과한 전자를 이용해 초기 영상과 회절 정보를 형성합니다.',check:'초점, 비점과 관련 경보를 장비 절차에 따라 확인합니다.'},
{id:'projector',name:'Projection Lenses',ko:'중간 · 투사 렌즈',role:'설정에 따라 영상 또는 회절 패턴을 검출기 쪽으로 투사합니다.',check:'영상 모드, 렌즈 상태와 관련 설정을 확인합니다.'},
{id:'detector',name:'Camera / Screen',ko:'카메라 · 관찰 스크린',role:'투사된 전자 정보를 관찰하거나 디지털 영상으로 취득합니다.',check:'검출기 선택, 노출과 포화 여부를 확인합니다.'},
{id:'vacuum',name:'Vacuum System',ko:'진공 시스템',role:'전자광학계와 시료가 적절한 진공 환경에서 동작하도록 돕습니다.',check:'압력 추세와 진공 경보를 확인합니다.'}
];
export const GUIDES=[
{name:'영상이 흐림',parts:['objective','sample','detector'],cause:'초점·비점, 시료 이동 또는 오염 가능성',steps:['시료 고정과 홀더 상태를 확인합니다.','장비 절차에 따라 초점과 비점을 확인합니다.','기준 시료와 검출기 설정을 비교합니다.'],warning:'불필요한 추가 노출은 시료에 영향을 줄 수 있습니다.'},
{name:'전자빔이 약함',parts:['gun','condenser','aperture'],cause:'조명 설정, 조리개 위치 또는 전자총 상태 가능성',steps:['조명 설정과 조리개 위치를 확인합니다.','전자총과 진공 경보를 기록합니다.','기준 조건에서 재현 여부를 확인합니다.'],warning:'고전압 구성품을 임의로 열거나 인터록을 우회하지 마세요.'},
{name:'영상에 얼룩이 생김',parts:['sample','aperture','detector'],cause:'시료·조리개 오염 또는 검출기 상태 가능성',steps:['얼룩이 시료 이동에 따라 변하는지 확인합니다.','기준 시료와 검출기 설정을 비교합니다.','제조사 절차에 따라 오염을 점검합니다.'],warning:'홀더와 시료의 취급 절차를 따르세요.'},
{name:'진공 압력 이상',parts:['vacuum','sample'],cause:'시료 가스 방출, 누설 또는 펌프 상태 변화 가능성',steps:['작업을 멈추고 압력 변화와 경보를 기록합니다.','시료 적합성과 홀더 상태를 확인합니다.','회복되지 않으면 장비 담당자에게 문의합니다.'],warning:'진공 인터록을 우회하거나 컬럼을 임의로 개방하지 마세요.'},
{name:'회절 패턴 이상',parts:['objective','aperture','sample'],cause:'모드·조리개 설정, 시료 영역 또는 정렬 변화 가능성',steps:['관찰 모드와 시료 영역을 확인합니다.','조리개 선택과 위치를 확인합니다.','기준 시료 및 장비 매뉴얼과 비교합니다.'],warning:'정렬 조작은 장비별 교육 절차에 따라 진행하세요.'}
];
export function transmission(thickness){return Math.exp(-thickness/100);}
export function imageIntensity(x,y,thickness){const phase=Math.sin(15*x+4*Math.sin(8*y))+Math.cos(21*y-5*x)+.7*Math.sin(26*(x+y));const grain=.1*Math.sin(91*x+79*y)*Math.cos(67*x-83*y);return Math.max(0,Math.min(1,.28+.46*transmission(thickness)+.1*phase+grain));}
export function diffractionIntensity(x,y,thickness){let value=.025;for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){const dx=x-.5-col*.115,dy=y-.5-row*.115;const strength=col===0&&row===0?.8:.5*Math.exp(-.08*(col*col+row*row));value+=strength*transmission(thickness)*Math.exp(-(dx*dx+dy*dy)/.00011);}return Math.min(1,value);}
export class TemSimulation{
constructor(){this.thickness=50;this.reset();}
reset(){this.status='idle';this.mode='image';this.progress=0;this.exposureThickness=this.thickness;}
start(mode){if(this.status==='paused'&&this.mode===mode){this.status='exposing';return;}this.mode=mode;this.progress=0;this.exposureThickness=this.thickness;this.status='exposing';}
pause(){if(this.status==='exposing')this.status='paused';}
tick(seconds){if(this.status!=='exposing')return;this.progress=Math.min(1,this.progress+seconds/4);if(this.progress===1)this.status='complete';}
get brightness(){return transmission(this.exposureThickness)*this.progress;}
}
