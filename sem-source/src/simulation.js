export const MODES={
  se:{name:'SE · 이차전자',short:'SE',detector:'se',description:'표면의 기울기와 모서리가 강조됩니다. 낮은 에너지의 이차전자를 측면 검출기로 수집하는 개념 모델입니다.'},
  bse:{name:'BSE · 후방산란전자',short:'BSE',detector:'bse',description:'상대적으로 높은 평균 원자번호 영역이 밝아지는 조성 대비입니다. 실제 BSE에는 형상·결정방향 대비도 포함될 수 있습니다.'}
};
export const PARTS=[
  {id:'gun',name:'Electron gun',ko:'전자총',role:'전자빔을 발생시킵니다. 실제 방출원 종류와 가속전압은 장비마다 다릅니다.',check:'방출전류·안정화 시간·진공 상태를 제조사 절차로 확인합니다.'},
  {id:'condenser',name:'Condenser / aperture',ko:'집속렌즈 · 조리개',role:'빔 전류와 프로브 형성에 관여합니다.',check:'조리개 정렬·오염 및 빔 전류의 반복성을 확인합니다.'},
  {id:'scan',name:'Scan coils',ko:'주사 코일',role:'시료는 고정하고 전자 프로브를 X 방향으로 주사한 뒤 Y 방향으로 이동시킵니다.',check:'프레임 왜곡·주사 방향별 줄무늬와 전자적 간섭을 확인합니다.'},
  {id:'objective',name:'Objective lens',ko:'대물렌즈',role:'작은 프로브를 시료 위에 형성합니다. 초점 조절은 아래 합성 영상의 선명도에 반영됩니다.',check:'작업거리·초점·비점수차를 제조사 순서에 따라 점검합니다.'},
  {id:'sample',name:'Sample / stage',ko:'복합 시료 · 스테이지',role:'범프·단차와 상대 조성 영역이 함께 있는 가상 시료입니다. 주사 중 스테이지는 움직이지 않습니다.',check:'시료 고정·전도성 접촉·높이 및 검출기 간섭 여부를 확인합니다.'},
  {id:'se',name:'SE detector',ko:'측면 이차전자 검출기',role:'주사 위치에서 발생한 이차전자를 수집해 표면 형상 영상을 만듭니다. 검출 경로는 설명용 직선입니다.',check:'검출기 선택·이득·배경값과 기준 시료의 신호를 확인합니다.'},
  {id:'bse',name:'Annular BSE detector',ko:'환형 후방산란전자 검출기',role:'대물렌즈 아래 환형 검출기로 후방산란전자를 수집하는 일반화 모델입니다.',check:'검출기 삽입 위치·작업거리·세그먼트 신호 균형을 확인합니다.'},
  {id:'vacuum',name:'Chamber / vacuum',ko:'챔버 · 진공계',role:'전자 이동 경로와 시료 주변의 진공을 유지합니다. 챔버는 내부 관찰을 위한 개방 프레임입니다.',check:'진공 표시·펌프 상태·시료의 방출가스를 확인합니다.'},
  {id:'control',name:'Acquisition electronics',ko:'영상 취득 전자계',role:'검출 신호를 주사 좌표와 동기화해 픽셀 밝기로 저장합니다.',check:'연결·주사 동기·설정값을 확인합니다. 전원부는 열지 않습니다.'}
];
export const GUIDES=[
  {id:'blur',name:'영상이 흐림',parts:['objective','condenser','sample'],cause:'초점·작업거리·시료 진동·비점수차 등이 원인일 수 있습니다.',steps:['기준 시료로 재현 여부를 비교합니다.','작업거리와 초점을 확인한 뒤 제조사 절차로 비점수차를 조정합니다.','시료 고정과 주변 진동·열적 안정화를 확인합니다.']},
  {id:'signal',name:'신호가 약하거나 없음',parts:['gun','se','bse','control'],cause:'선택된 검출기·빔 상태·검출기 위치·이득 설정을 먼저 구분합니다.',steps:['빔 블랭킹과 선택된 SE/BSE 검출기를 확인합니다.','기준 시료에서 이득·오프셋과 작업거리를 확인합니다.','문제가 지속되면 로그와 설정을 기록해 담당자에게 전달합니다.']},
  {id:'charge',name:'밝은 번짐 · 대전',parts:['sample','gun','vacuum'],cause:'비전도성 시료나 접지 불량은 대전과 불안정한 밝기를 유발할 수 있습니다.',steps:['시료 고정 및 홀더까지의 전기적 접촉을 확인합니다.','승인된 절차 안에서 빔 전류·가속전압·주사 조건을 비교합니다.','시료에 적합한 코팅 또는 저진공 조건은 담당자와 결정합니다.']},
  {id:'drift',name:'드리프트 · 줄무늬',parts:['scan','sample','control'],cause:'시료 안정화·스캔 동기·전자기 간섭을 구분해야 합니다.',steps:['같은 영역을 반복 취득해 이동과 주기성 노이즈를 구분합니다.','스테이지와 온도 안정화 시간을 확보합니다.','프레임 속도와 주사 방향을 비교하고 주변 간섭을 확인합니다.']}
];
const clamp=value=>Math.max(0,Math.min(1,value));
export function heightAt(x,y){
  const bump=.36*Math.exp(-((x-.32)**2+(y-.35)**2)/.012);
  const ridge=.18*Math.exp(-((x-.72)**2/.006+(y-.65)**2/.08));
  const terrace=.09/(1+Math.exp(-(x+y-1)*45));
  return bump+ridge+terrace;
}
export function compositionAt(x,y){return Math.hypot(x-.67,y-.3)<.125?.88:Math.hypot(x-.3,y-.73)<.105?.22:.48;}
function rawSignal(x,y,mode){
  const step=.006;
  const slopeX=(heightAt(x+step,y)-heightAt(x-step,y))/(2*step);
  const slopeY=(heightAt(x,y+step)-heightAt(x,y-step))/(2*step);
  const topology=.10*heightAt(x,y)+.09*slopeX+.055*slopeY;
  const texture=.015*Math.sin(x*190)*Math.sin(y*170);
  return clamp(mode==='se'?.43+topology+texture:compositionAt(x,y)+.22*topology+texture);
}
export function signalAt(x,y,mode='se',defocus=0){
  if(!MODES[mode])throw new RangeError('Unknown SEM mode');
  const radius=Math.max(0,Math.min(100,defocus))*.0007;
  let total=0;
  for(const offsetX of [-1,0,1])for(const offsetY of [-1,0,1])total+=rawSignal(clamp(x+offsetX*radius),clamp(y+offsetY*radius),mode);
  return total/9;
}
export class SemEngine{
  constructor(size=64){if(!Number.isInteger(size)||size<2)throw new RangeError('Invalid raster size');this.size=size;this.mode='se';this.defocus=0;this.duration=8;this.reset();}
  reset(){this.status='idle';this.elapsed=0;this.index=0;this.pixels=new Float32Array(this.size**2).fill(NaN);}
  configure(mode,defocus=this.defocus){if(!MODES[mode])throw new RangeError('Unknown SEM mode');this.mode=mode;this.defocus=Math.max(0,Math.min(100,defocus));this.reset();}
  start(){if(this.status==='complete')this.reset();this.status='scanning';}
  pause(){if(this.status==='scanning')this.status='paused';}
  tick(delta){
    if(this.status!=='scanning'||!Number.isFinite(delta)||delta<=0)return;
    this.elapsed=Math.min(this.duration,this.elapsed+delta);
    const target=Math.min(this.pixels.length,Math.floor(this.elapsed/this.duration*this.pixels.length+1e-8));
    while(this.index<target){const {x,y}=this.coordinate(this.index);this.pixels[this.index]=signalAt(x,y,this.mode,this.defocus);this.index++;}
    if(this.index===this.pixels.length)this.status='complete';
  }
  coordinate(index=Math.max(0,this.index-1)){const bounded=Math.max(0,Math.min(this.pixels.length-1,index));return {x:(bounded%this.size)/(this.size-1),y:Math.floor(bounded/this.size)/(this.size-1)};}
  get progress(){return this.index/this.pixels.length;}
  csv(){const rows=['mode,x_pixel,y_pixel,intensity_au,defocus_percent'];for(let index=0;index<this.index;index++)rows.push(`${this.mode},${index%this.size},${Math.floor(index/this.size)},${this.pixels[index].toFixed(6)},${this.defocus}`);return rows.join('\n');}
}
