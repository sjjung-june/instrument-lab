export const SOUND_SPEED=5.5;
export const MAX_DEPTH=720;
export const DEPTHS=[65,130,195,260,325,390,455,520,590,690];
export const MODES={a:{name:'A-Scan',description:'한 XY 위치에서 반사 RF 진폭을 시간에 따라 취득합니다. 아래 파형의 색칠된 구간이 깊이 게이트입니다.',duration:2},b:{name:'B-Scan',description:'선택한 Y를 따라 X를 주사합니다. 가로는 X 위치, 세로는 표면 기준 추정 깊이인 단면 영상입니다.',duration:6},c:{name:'C-Scan',description:'XY 면을 주사하고 선택 게이트 안의 반사 피크를 픽셀로 만듭니다. 게이트 깊이를 바꾸어 다른 접합면을 비교하세요.',duration:8},through:{name:'Through-Scan',description:'시료 아래 별도 수신기로 투과 신호를 취득합니다. 반사 게이트와 무관한 두께 방향 투영 영상이며 깊이를 특정할 수 없습니다.',duration:8}};
export const PARTS=[
  {id:'scanner',name:'XY scanning bridge',ko:'XY 주사 브리지',role:'수침 탐촉자를 시료 위에서 XY로 이동시킵니다. 이 모델에서 HBM 샘플은 고정입니다.',check:'이동축 반복성·주사 왜곡·진동과 충돌 여유를 확인합니다.'},
  {id:'probe',name:'Acoustic transducer',ko:'초음파 탐촉자',role:'펄스를 송신하고 Pulse-echo 모드에서 반사 에코를 수신합니다. 가상 중심주파수는 100 MHz입니다.',check:'기준 시료의 전면 에코·초점·케이블 상태를 확인합니다.'},
  {id:'tank',name:'Water coupling tank',ko:'수침 탱크 · 결합수',role:'탐촉자와 시료 사이를 물로 음향 결합합니다. 수면과 벽은 내부 관찰용 반투명 메쉬입니다.',check:'수질·기포·온도·수위와 시료의 수침 적합성을 확인합니다.'},
  {id:'stack',name:'8-Hi DRAM stack / TSV',ko:'8단 DRAM 적층 · TSV',role:'DRAM 8장을 TSV로 연결하는 일반화 구조입니다. 표시된 TSV 수와 다이 크기·간격은 실제 배선도나 규격이 아닙니다.',check:'반사 게이트·기준 샘플·신호 감쇠를 먼저 확인합니다. 깊은 층의 신호 소실을 곧바로 결함으로 단정하지 않습니다.'},
  {id:'bond',name:'Bond / microbump layers',ko:'접합층 · 마이크로범프',role:'개념상 다이 간 접합면을 나타냅니다. 중간 접합면 260 μm에 가상 박리를 배치합니다. 개별 범프 검사 성능을 의미하지 않습니다.',check:'게이트 위치와 에코 극성을 비교합니다. 실제 공정에 따른 접합재와 구조를 확인합니다.'},
  {id:'base',name:'Base die',ko:'베이스 다이',role:'DRAM 아래의 베이스 다이입니다. 이 모델에서는 적층 하단 520 μm부터 590 μm까지로 가정합니다.',check:'상부 박리에 의한 음향 그림자와 하부 접합 결함을 구분합니다.'},
  {id:'interposer',name:'Interposer',ko:'인터포저',role:'HBM이 실장되는 인터포저를 개념적으로 표시합니다. 590 μm 접합면에 가상 보이드가 있으며 하단은 690 μm로 가정합니다.',check:'기준 영역과 투과 모드를 함께 비교하되 깊이 동정은 반사 에코로 확인합니다.'},
  {id:'receiver',name:'Through receiver',ko:'하부 투과 수신기',role:'Through-Scan에서만 활성화되는 별도 하부 수신기입니다. 실제 패키지 구조와 홀더에 따라 투과 접근이 불가능할 수도 있습니다.',check:'하부 접근·정렬·수침 결합과 수신 채널 선택을 확인합니다.'},
  {id:'pulser',name:'Pulser / receiver',ko:'펄서 · 수신 전자계',role:'전기 펄스와 수신 RF 신호를 처리합니다. 이 모델은 파형을 수학적으로 합성합니다.',check:'출력·케이블·게인·포화 여부를 제조사 절차로 확인합니다.'},
  {id:'control',name:'Gating / acquisition',ko:'게이트 · 영상 취득계',role:'RF 파형을 주사 좌표와 동기화하고 시간 게이트를 적용합니다. 깊이는 균일 유효 음속을 가정한 추정값입니다.',check:'전면 기준점·게이트 폭·음속·검출 채널과 저장 조건을 확인합니다.'}
];
export const GUIDES=[
  {id:'weak',name:'전면 에코가 약함',parts:['probe','tank','pulser'],steps:['기준 시료에서 신호를 비교합니다.','기포·수질·수위와 탐촉자 초점을 확인합니다.','케이블·채널·게인·포화 상태를 제조사 순서로 확인합니다.'],note:'수침 적합성이 확인되지 않은 HBM 패키지는 물에 넣지 마세요.'},
  {id:'missing',name:'하부 계면이 보이지 않음',parts:['stack','bond','control'],steps:['전면 기준과 게이트 위치·폭을 재확인합니다.','정상 위치와 의심 위치의 RF 파형을 비교합니다.','상부 반사·감쇠·다중반사·음향 그림자를 검토한 뒤 별도 분석으로 확인합니다.'],note:'신호 소실만으로 보이드나 박리를 확정할 수 없습니다.'},
  {id:'stripe',name:'영상 줄무늬 · 위치 왜곡',parts:['scanner','tank','control'],steps:['동일 영역 반복 스캔으로 위치 의존성을 확인합니다.','이동축·진동과 수중 기포 이동을 확인합니다.','주사 조건·취득 동기와 기준 샘플을 비교합니다.'],note:'이동 중인 브리지나 탐촉자를 손으로 건드리지 마세요.'},
  {id:'through',name:'투과 영상 전체가 어두움',parts:['receiver','interposer','tank'],steps:['투과 채널·하부 접근 가능성과 수신기 정렬을 확인합니다.','시료 없이 기준 결합 상태를 승인된 절차로 확인합니다.','패키지 구조에 따른 감쇠와 그림자 영향을 비교합니다.'],note:'투과 영상은 깊이 정보를 분리하지 않습니다. 깊이별 판정에는 추가 근거가 필요합니다.'}
];
const clamp=value=>Math.max(0,Math.min(1,value));
export const timeAtDepth=depth=>2*depth/SOUND_SPEED;
export const depthAtTime=time=>time*SOUND_SPEED/2;
export function defectAt(x,y,depth,sample='both'){
  if((sample==='both'||sample==='delamination')&&Math.abs(depth-260)<1&&((x-.36)/.17)**2+((y-.45)/.13)**2<1)return 'delamination';
  if((sample==='both'||sample==='void')&&Math.abs(depth-590)<1&&((x-.69)/.12)**2+((y-.66)/.10)**2<1)return 'void';
  return null;
}
function shadow(x,y,depth,sample){return (depth>260&&defectAt(x,y,260,sample) ? .18 : 1)*(depth>590&&defectAt(x,y,590,sample) ? .22 : 1);}
function wavelet(delta){return Math.cos(2*Math.PI*.1*delta)*Math.exp(-(delta**2)/32);}
export function echoAt(x,y,time,sample='both'){
  let signal=.55*wavelet(time);
  for(const depth of DEPTHS){const defect=defectAt(x,y,depth,sample);const coefficient=defect?-.92:depth===690?.32:.14+.02*Math.sin(x*18+y*15+depth);signal+=coefficient*Math.exp(-depth/1100)*shadow(x,y,depth,sample)*wavelet(time-timeAtDepth(depth));}
  return signal;
}
export function gatePeak(x,y,center=260,width=40,sample='both'){
  const start=timeAtDepth(Math.max(0,center-width/2)),end=timeAtDepth(Math.min(MAX_DEPTH,center+width/2));
  let peak=0;
  for(let index=0;index<=40;index++){const signal=echoAt(x,y,start+(end-start)*index/40,sample);if(Math.abs(signal)>Math.abs(peak))peak=signal;}
  return peak;
}
export function transmissionAt(x,y,sample='both'){let value=.66+.025*Math.sin(x*17)*Math.sin(y*19);if(defectAt(x,y,260,sample))value*=.14;if(defectAt(x,y,590,sample))value*=.19;return clamp(value);}
export class SamEngine{
  constructor(size=64){this.size=size;this.depthRows=128;this.mode='c';this.sample='both';this.center=260;this.width=40;this.x=.36;this.y=.45;this.reset();}
  get total(){return this.mode==='a'?512:this.mode==='b'?this.size:this.size**2;}
  get coordinate(){if(!['scanning','paused'].includes(this.status)||!this.index)return {x:this.x,y:this.y};const index=this.index-1;return this.mode==='a'?{x:this.x,y:this.y}:this.mode==='b'?{x:index/(this.size-1),y:this.y}:{x:(index%this.size)/(this.size-1),y:Math.floor(index/this.size)/(this.size-1)};}
  reset(){this.elapsed=0;this.index=0;this.status='idle';this.values=new Float32Array(this.mode==='b'?this.size*this.depthRows:this.total).fill(NaN);}
  configure(changes){
    if(changes.mode&&!MODES[changes.mode])throw new RangeError('Unknown SAM mode');
    if(changes.sample&&!['both','healthy','void','delamination'].includes(changes.sample))throw new RangeError('Unknown sample');
    for(const key of ['x','y','center','width'])if(key in changes&&!Number.isFinite(changes[key]))throw new RangeError('Invalid '+key);
    for(const key of ['mode','sample'])if(key in changes)this[key]=changes[key];
    for(const key of ['x','y'])if(key in changes)this[key]=clamp(changes[key]);
    if('center' in changes)this.center=Math.max(25,Math.min(690,changes.center));
    if('width' in changes)this.width=Math.max(10,Math.min(100,changes.width));
    this.reset();
  }
  start(){if(this.status==='complete')this.reset();this.status='scanning';}
  pause(){if(this.status==='scanning')this.status='paused';}
  tick(delta){
    if(this.status!=='scanning'||!Number.isFinite(delta)||delta<=0)return;
    const duration=MODES[this.mode].duration;this.elapsed=Math.min(duration,this.elapsed+delta);
    const target=Math.min(this.total,Math.floor(this.elapsed/duration*this.total+1e-8));
    while(this.index<target){
      const index=this.index;
      if(this.mode==='a')this.values[index]=echoAt(this.x,this.y,-20+300*index/(this.total-1),this.sample);
      else if(this.mode==='b'){const x=index/(this.size-1);for(let row=0;row<this.depthRows;row++)this.values[row*this.size+index]=echoAt(x,this.y,timeAtDepth(MAX_DEPTH*row/(this.depthRows-1)),this.sample);}
      else {const x=(index%this.size)/(this.size-1),y=Math.floor(index/this.size)/(this.size-1);this.values[index]=this.mode==='through'?transmissionAt(x,y,this.sample):gatePeak(x,y,this.center,this.width,this.sample);}
      this.index++;
    }
    if(this.index===this.total)this.status='complete';
  }
  get progress(){return this.index/this.total;}
  csv(){
    const rows=['mode,sample,x_normalized,y_normalized,depth_um_approx,time_ns_from_front,value_au,gate_center_um,gate_width_um'];
    const add=(x,y,depth,time,value)=>rows.push([this.mode,this.sample,x.toFixed(5),y.toFixed(5),depth,time,value.toFixed(6),this.center,this.width].join(','));
    for(let index=0;index<this.index;index++){
      if(this.mode==='a'){const time=-20+300*index/(this.total-1);add(this.x,this.y,'',time.toFixed(4),this.values[index]);}
      else if(this.mode==='b'){for(let row=0;row<this.depthRows;row++){const depth=MAX_DEPTH*row/(this.depthRows-1);add(index/(this.size-1),this.y,depth.toFixed(3),timeAtDepth(depth).toFixed(4),this.values[row*this.size+index]);}}
      else add((index%this.size)/(this.size-1),Math.floor(index/this.size)/(this.size-1),this.mode==='c'?this.center:'','',this.values[index]);
    }
    return rows.join('\n');
  }
}
