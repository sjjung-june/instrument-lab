export const RESOLUTION = 64;
export function stageOffset(x,y){return {x:.3-(x-.5)*2.6,z:-(y-.5)*2.6};}
export const PARTS = [
  {id:'head', name:'Probe Head', ko:'프로브 헤드', role:'광학계와 프로브를 지지합니다. XY 위치는 고정되고 Z 스캐너에 따라 위아래로 움직입니다.', check:'고정 상태와 장착부 오염을 확인합니다.'},
  {id:'probe', name:'Cantilever / Tip', ko:'캔틸레버 · 팁', role:'표면과 상호작용하며 휘어지는 미세 레버입니다. 접촉 모드에서 휨은 힘에 비례합니다.', check:'반복 형상·해상도 저하가 있으면 팁 오염이나 마모를 의심합니다.'},
  {id:'laser', name:'Laser', ko:'레이저 광원', role:'캔틸레버 뒷면에 입사한 빛이 검출기로 반사됩니다.', check:'제조사 절차에 따라 SUM 신호와 광점 위치를 확인합니다.'},
  {id:'detector', name:'Photodiode', ko:'4분할 광검출기', role:'반사광의 위치 변화로 휨 신호를 읽습니다. 정규화된 상·하 차동 신호를 사용합니다.', check:'충분한 SUM 신호를 확보한 뒤 기준 위치를 확인합니다.'},
  {id:'piezo', name:'Z Piezo Scanner', ko:'Z 압전 스캐너', role:'검출 오차에 따라 프로브의 Z 위치를 보정합니다. Z 보정량으로 높이를 구성합니다.', check:'Z 포화·이동 범위·드리프트를 점검합니다.'},
  {id:'sample', name:'XY Sample Stage', ko:'XY 시료 스테이지', role:'시료를 고정하고 X/Y로 이동해 고정된 프로브 아래에서 래스터 스캔합니다. 등고선과 높이맵은 같은 합성 표면을 사용합니다.', check:'시료 고정, 기울기, 오염을 확인합니다.'},
  {id:'approach', name:'Coarse Approach', ko:'조동 접근부', role:'프로브를 시료 근처까지 이동시킵니다. 미세 피드백과 구분되는 접근 기구입니다.', check:'접근 전 시료 높이와 여유 공간을 확인합니다.'},
  {id:'base', name:'Isolation Base', ko:'진동 차단 베이스', role:'외부 진동이 팁과 시료의 상대 운동으로 전달되는 것을 줄입니다.', check:'주변 진동·공기 흐름·케이블 접촉을 확인합니다.'},
  {id:'controller', name:'Controller', ko:'제어기 · 전자부', role:'검출 신호와 설정값의 오차를 계산하고 Z 보정을 명령합니다.', check:'설정값·피드백 이득·스캔 속도를 함께 점검합니다.'}
];
export const GUIDES = [
  {id:'noise',name:'노이즈 증가',parts:['base','sample','controller'],cause:'환경 진동, 불안정한 시료 고정, 전기적 간섭 가능성',steps:['스캔을 중지하고 원본 이미지와 설정을 기록합니다.','주변 진동·기류, 베이스에 닿는 케이블과 시료 고정을 확인합니다.','동일 조건의 기준 시료로 재현성을 비교합니다.'], caution:'통전된 전자부를 열거나 접지 배선을 임의로 바꾸지 마세요.'},
  {id:'stripes',name:'이미지 줄무늬',parts:['probe','sample','base'],cause:'팁 오염, 시료 이동, 반복 외란 가능성',steps:['Trace/Retrace와 줄무늬 방향을 비교합니다.','스캔 방향·속도를 변경해 현상이 함께 변하는지 확인합니다.','프로브를 후퇴시킨 뒤 제조사 절차에 따라 팁과 시료를 점검합니다.'],caution:'접촉 상태에서 시료나 프로브를 만지지 마세요.'},
  {id:'feedback',name:'피드백 불안정',parts:['controller','piezo','probe'],cause:'과도한 이득, 높은 스캔 속도, 부적합한 설정값 가능성',steps:['스캔 속도를 낮추고 왕복 프로파일의 일치 여부를 확인합니다.','제조사 권장 범위 안에서 이득을 조금씩 조정합니다.','오차 신호와 Z 포화를 함께 관찰하고 기준 시료로 확인합니다.'],caution:'진동이 지속되면 스캔을 중지하고 프로브를 후퇴시키세요.'},
  {id:'approach',name:'팁 접근 실패',parts:['approach','probe','sample'],cause:'잘못된 시료 높이, 프로브 장착, 검출 신호 부족 가능성',steps:['접근을 중지하고 안전하게 후퇴합니다.','시료 높이, 프로브 장착, 장애물과 이동 여유를 확인합니다.','SUM과 휨 기준 신호를 확인한 후 제조사 접근 절차를 따릅니다.'],caution:'강제 접근이나 인터록 해제는 하지 마세요.'},
  {id:'alignment',name:'레이저 정렬 불량',parts:['laser','detector','probe'],cause:'광점 이탈, 검출기 중심 불일치, 레버 장착 불량 가능성',steps:['프로브를 후퇴시키고 장착 상태를 확인합니다.','제조사 관찰 장치로 레버 위 광점과 SUM을 확인합니다.','반사광의 검출기 기준 위치를 조정하고 신호를 재확인합니다.'],caution:'광로를 직접 보거나 레이저 안전 커버를 우회하지 마세요.'},
  {id:'ztravel',name:'Z 이동 범위 이상',parts:['piezo','approach','controller'],cause:'Z 범위 포화, 시료 기울기, 중심 위치 이탈 가능성',steps:['스캔을 멈추고 Z 출력의 범위와 포화 여부를 기록합니다.','후퇴 후 시료 기울기와 조동 위치를 확인합니다.','범위가 회복되지 않으면 제조사 점검을 요청합니다.'],caution:'압전 스캐너의 고전압 연결부를 임의로 분리하지 마세요.'}
];
export function surfaceHeight(x,y,type='islands') {
  if(type==='steps') return 12+Math.floor(x*5)*13+5*Math.sin(y*8);
  if(type==='waves') return 38+22*Math.sin(x*14)*Math.cos(y*10)+8*Math.sin(y*28);
  const peaks=[[.27,.3,.12,65],[.65,.35,.16,83],[.45,.72,.13,54],[.82,.8,.08,42]];
  return 5+peaks.reduce((sum,[px,py,width,amp])=>sum+amp*Math.exp(-((x-px)**2+(y-py)**2)/(2*width**2)),0)+3*Math.sin(x*25)*Math.sin(y*19);
}
export class ScanEngine {
  constructor(size=RESOLUTION) {this.size=size;this.rate=1;this.gain=0.45;this.surface='islands';this.reset();}
  reset() {this.trace=new Float32Array(this.size**2).fill(NaN);this.retrace=new Float32Array(this.size**2).fill(NaN);this.index=0;this.elapsed=0;this.accumulator=0;this.z=0;this.error=0;this.deflection=0;this.sum=1;this.line=0;this.column=0;this.direction='Trace';this.status='idle';this.transition=0;this.last=null;}
  start() {if(this.status==='paused'){this.status='scanning';return;}if(['idle','complete','retracted'].includes(this.status)){this.reset();this.status='approaching';}}
  pause() {if(this.status==='scanning')this.status='paused';}
  retract() {this.status='retracting';this.transition=0;}
  tick(seconds) {
    if(['approaching','retracting'].includes(this.status)){this.transition+=seconds;if(this.transition>=1.2){this.status=this.status==='approaching'?'scanning':'retracted';this.transition=0;}return;}
    if(this.status!=='scanning')return;
    this.elapsed+=seconds;this.accumulator+=seconds*this.rate*this.size*2;
    while(this.accumulator>=1&&this.status==='scanning'){this.accumulator-=1;this.sample();}
  }
  sample() {
    if(this.index>=this.size*this.size*2){this.status='complete';return;}
    const row=Math.floor(this.index/(2*this.size));
    const offset=this.index%(2*this.size);
    const forward=offset<this.size;
    const column=forward?offset:2*this.size-1-offset;
    const target=surfaceHeight(column/(this.size-1),row/(this.size-1),this.surface);
    const response=1-Math.exp(-this.gain*8/this.rate);
    this.z+=response*(target-this.z);
    this.error=target-this.z;
    this.deflection=this.error/100;
    (forward?this.trace:this.retrace)[row*this.size+column]=this.z;
    this.line=row;this.column=column;this.direction=forward?'Trace':'Retrace';
    this.last={row,column,direction:this.direction,height:this.z,error:this.error};
    this.index+=1;
    if(this.index===this.size*this.size*2)this.status='complete';
  }
  get progress(){return this.index/(this.size*this.size*2);}
  get xy(){return [this.column/(this.size-1),this.line/(this.size-1)];}
  get clearance(){if(this.status==='approaching')return 1-this.transition/1.2;if(this.status==='retracting')return this.transition/1.2;return ['idle','retracted'].includes(this.status)?1:0;}
  csv(){const rows=['x_um,y_um,trace_nm,retrace_nm'];for(let row=0;row<this.size;row++)for(let col=0;col<this.size;col++){const index=row*this.size+col;rows.push([col/(this.size-1)*5,row/(this.size-1)*5,Number.isFinite(this.trace[index])?this.trace[index].toFixed(4):'',Number.isFinite(this.retrace[index])?this.retrace[index].toFixed(4):''].join(','));}return rows.join('\n');}
}
