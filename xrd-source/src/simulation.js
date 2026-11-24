export const WAVELENGTH=.15406;
export const MODES={out:{name:'Out-of-plane',ko:'면외 회절',min:10,max:90,axis:'2θ (°)',description:'대칭 θ–2θ 기하로 시료 표면의 법선 방향 격자 간격을 살펴봅니다. 산란벡터 q는 표면에 수직입니다.'},in:{name:'In-plane',ko:'면내 회절',min:10,max:90,axis:'2θχ (°)',description:'입사·출사각을 작은 값으로 유지하고 검출기를 면내 방향으로 회전합니다. 산란벡터 q는 주로 표면에 평행합니다.'},xrr:{name:'XRR',ko:'X선 반사율',min:.05,max:4,axis:'θ (°)',description:'낮은 입사각의 정반사 기하입니다. 박막 두께는 간섭무늬의 간격, 거칠기는 고각 반사율 감쇠에 영향을 줍니다.'}};
export const PARTS=[
{id:'source',name:'X-ray Source',ko:'X선 광원',role:'X선을 발생시킵니다. 이 모델은 λ = 0.15406 nm의 단색 X선을 가정합니다.',check:'광원 상태와 장비 경보를 확인합니다.'},
{id:'optics',name:'Incident Optics',ko:'입사 광학계',role:'슬릿과 광학 소자가 빔의 폭·발산과 파장 조건을 조절합니다.',check:'슬릿 선택과 정렬 상태를 확인합니다.'},
{id:'sample',name:'Film & Stage',ko:'박막 · 스테이지',role:'시료 높이·방향을 설정합니다. 면내·면외 격자 또는 반사율을 관찰합니다.',check:'시료 높이, 평탄도와 고정 상태를 확인합니다.'},
{id:'goniometer',name:'Goniometer',ko:'고니오미터',role:'광원·시료·검출기의 상대 각도를 조절합니다. 기종에 따라 실제 구동 축은 다릅니다.',check:'각도 기준점과 재현성을 확인합니다.'},
{id:'detector',name:'Detector',ko:'X선 검출기',role:'각도에 따른 회절 또는 반사 강도를 측정합니다.',check:'검출기 선택, 포화와 배경 신호를 확인합니다.'},
{id:'enclosure',name:'Shielded Enclosure',ko:'차폐 하우징',role:'X선 장비의 차폐 구조를 일반화해 표현합니다.',check:'장비의 차폐·인터록 경보를 확인합니다.'}
];
export const GUIDES=[
{name:'회절 피크 위치가 다름',parts:['sample','goniometer'],cause:'시료 높이·각도 기준 또는 시료 자체 차이 가능성',steps:['기준 시료의 피크 위치와 비교합니다.','시료 높이와 정렬 조건을 확인합니다.','이전 설정과 각도 기준을 기록해 담당자와 검토합니다.'],warning:'피크 이동만으로 시료 원인을 확정하지 마세요.'},
{name:'강도가 낮거나 배경이 큼',parts:['source','optics','detector'],cause:'광학계 선택, 정렬 또는 배경 산란 가능성',steps:['모드에 맞는 광학계와 검출기를 확인합니다.','기준 시료에서 강도·배경을 비교합니다.','슬릿과 시료 위치를 제조사 절차로 점검합니다.'],warning:'조사 중 차폐 구조를 열거나 인터록을 우회하지 마세요.'},
{name:'XRR 간섭무늬가 약함',parts:['sample','optics','detector'],cause:'거칠기, 불균일 두께 또는 정렬·측정 조건 가능성',steps:['시료 평탄도와 측정 위치를 확인합니다.','정반사 정렬과 낮은 각도의 광학 조건을 확인합니다.','표면·두께 불균일과 장비 상태를 구분해 검토합니다.'],warning:'이 교육 모델의 곡선으로 실제 박막 두께를 판정하지 마세요.'}
];
export function braggAngle(spacing,order=1){const sine=order*WAVELENGTH/(2*spacing);return sine>0&&sine<=1?2*Math.asin(sine)*180/Math.PI:null;}
export function reflectivity(theta,thickness,roughness){const radians=theta*Math.PI/180,critical=.22*Math.PI/180;const fresnel=radians<=critical?1:(critical/radians)**4;const qz=4*Math.PI*Math.sin(radians)/WAVELENGTH;const fringes=.58+.42*Math.cos(qz*thickness);return Math.max(1e-9,Math.min(1,fresnel*(radians<=critical?1:fringes)*Math.exp(-((qz*roughness)**2))));}
export function diffraction(angle,spacing,mode){let value=20+30*Math.exp(-angle/35);for(let order=1;order<=3;order++){const peak=braggAngle(spacing,order);if(peak!==null)value+=(mode==='in'?850:1100)/order**2*Math.exp(-.5*((angle-peak)/.42)**2);}return value;}
export function geometry(mode,angle){if(mode==='in'){const alpha=.6*Math.PI/180,azimuth=angle*Math.PI/180;return {incident:[Math.cos(alpha),-Math.sin(alpha),0],outgoing:[Math.cos(alpha)*Math.cos(azimuth),Math.sin(alpha),Math.cos(alpha)*Math.sin(azimuth)],incidence:.6};}const theta=(mode==='xrr'?angle:angle/2)*Math.PI/180;return {incident:[Math.cos(theta),-Math.sin(theta),0],outgoing:[Math.cos(theta),Math.sin(theta),0],incidence:theta*180/Math.PI};}
export class XrdSimulation{
constructor(){this.mode='out';this.spacingOut=.25;this.spacingIn=.28;this.thickness=30;this.roughness=.3;this.reset();}
reset(){this.status='idle';this.progress=0;this.values=[];this.angle=MODES[this.mode].min;this.settings=null;}
setMode(mode){if(!MODES[mode])throw Error('Unknown XRD mode');this.mode=mode;this.reset();}
start(){if(this.status==='paused'){this.status='scanning';return;}this.reset();this.settings={spacing:this.mode==='in'?this.spacingIn:this.spacingOut,thickness:this.thickness,roughness:this.roughness};this.status='scanning';}
pause(){if(this.status==='scanning')this.status='paused';}
tick(seconds){if(this.status!=='scanning')return;this.progress=Math.min(1,this.progress+seconds/8);const count=Math.floor(this.progress*400),mode=MODES[this.mode];while(this.values.length<count){const x=mode.min+(mode.max-mode.min)*this.values.length/399;const y=this.mode==='xrr'?reflectivity(x,this.settings.thickness,this.settings.roughness):diffraction(x,this.settings.spacing,this.mode);this.values.push({x,y});}this.angle=this.values.at(-1)?.x??mode.min;if(this.progress===1)this.status='complete';}
csv(){const label=this.mode==='xrr'?'theta_deg,reflectivity':'two_theta_deg,intensity_au';return '# synthetic educational data; mode='+this.mode+'\n'+label+'\n'+this.values.map(({x,y})=>x.toFixed(5)+','+y.toPrecision(7)).join('\n');}
}
