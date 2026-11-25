export const SIZE=64;
export class FibSimulation{
  constructor(size=SIZE){this.size=size;this.rate=1;this.reset();}
  reset(){this.mode='idle';this.milling=0;this.scan=0;this.image=new Float32Array(this.size*this.size).fill(NaN);this.imageDepth=0;}
  startMilling(){if(this.milling>=1)this.milling=0;this.mode='milling';}
  startImaging(){this.mode='imaging';this.scan=0;this.image.fill(NaN);this.imageDepth=this.milling;}
  pause(){this.mode='paused';}
  tick(seconds){if(!Number.isFinite(seconds)||seconds<=0)return;if(this.mode==='milling'){this.milling=Math.min(1,this.milling+seconds*this.rate/18);if(this.milling===1)this.mode='milled';}else if(this.mode==='imaging'){const before=Math.floor(this.scan*this.size*this.size);this.scan=Math.min(1,this.scan+seconds/6);const after=Math.floor(this.scan*this.size*this.size);for(let i=before;i<after;i++){const row=Math.floor(i/this.size),col=i%this.size;this.image[i]=imageValue(col/(this.size-1),row/(this.size-1),this.imageDepth);}if(this.scan===1)this.mode='imaged';}}
  get depth(){return this.milling*180;}
}
export function trenchMask(x,y){const edge=(value,min,max)=>Math.max(0,Math.min(1,(value-min)/.035,(max-value)/.035));return edge(x,.21,.79)*edge(y,.32,.68);}
export function imageValue(x,y,depth){const texture=.49+.08*Math.sin(37*x+4*Math.sin(y*11))+.06*Math.cos(54*y+5*x)+.025*Math.sin(93*x+87*y);const trench=trenchMask(x,y);return Math.max(0,Math.min(1,texture-depth*trench*.3+depth*(trench>0&&trench<1?.18:0)));}
export const PARTS=[
  {id:'ion',name:'Ion Column',ko:'이온 컬럼',role:'이온을 생성·가속하고 렌즈로 집속해 시료의 국소 영역에 조사합니다. 이 모델에서는 기울어진 컬럼으로 표시합니다.',check:'빔 상태, 정렬과 오염 여부를 제조사 진단 절차에 따라 확인합니다.'},
  {id:'electron',name:'Electron Column',ko:'전자 컬럼',role:'전자빔을 시료에 주사하고 방출 신호를 이용해 영상을 형성합니다.',check:'초점·비점·영상 품질과 컬럼 오염을 확인합니다.'},
  {id:'sample',name:'Sample & Stage',ko:'시료 · 스테이지',role:'시료를 고정하고 두 빔이 만나는 관찰·가공 위치로 이동시킵니다.',check:'시료 고정과 작업 거리, 이동 경로의 간섭 여부를 확인합니다.'},
  {id:'chamber',name:'Vacuum Chamber',ko:'진공 챔버',role:'컬럼과 시료가 적절한 진공 환경에서 작동할 수 있는 공간입니다.',check:'압력 추세와 챔버 오염을 확인합니다.'},
  {id:'detector',name:'SE Detector',ko:'2차 전자 검출기',role:'시료에서 방출되는 2차 전자 신호를 수집해 표면 영상을 만듭니다.',check:'검출기 선택, 신호 수준과 포화 여부를 확인합니다.'},
  {id:'gas',name:'Gas Injection',ko:'가스 주입계 · GIS',role:'일부 장비에서 전구체 가스를 공급해 빔 유도 증착이나 보조 식각을 지원합니다. 이 모델은 위치만 나타냅니다.',check:'가스 공급 상태와 노즐 위치를 장비 절차에 따라 확인합니다.'},
  {id:'vacuum',name:'Vacuum System',ko:'진공 펌프',role:'챔버의 압력을 낮추고 유지합니다. 실제 펌프 구성은 장비마다 다릅니다.',check:'펌프 상태와 압력 변화를 기록하고 관련 경보를 확인합니다.'},
  {id:'electronics',name:'Control Electronics',ko:'제어 · 전자부',role:'빔 편향, 검출 신호와 영상 표시 등 각 구성 요소를 제어합니다.',check:'경보 기록, 케이블 연결과 설정값을 확인합니다.'}
];
export const GUIDES=[
  {name:'영상이 흐림',parts:['electron','sample','detector'],cause:'초점·비점, 시료 충전 또는 오염 가능성',steps:['시료와 작업 거리가 안정적인지 확인합니다.','장비 절차에 따라 초점·비점 및 검출기를 확인합니다.','기준 시료와 비교해 오염이나 충전 여부를 점검합니다.'],warning:'원인을 확정하기 전 시료에 추가 빔을 조사하지 마세요.'},
  {name:'가공 속도 저하',parts:['ion','sample','vacuum'],cause:'빔 상태 변화, 시료 물성 차이 또는 오염 가능성',steps:['설정과 이전 가공 기록을 비교합니다.','기준 시료로 빔 상태와 정렬을 확인합니다.','진공과 오염 관련 경보를 확인합니다.'],warning:'고전압 컬럼의 내부 구성품은 임의로 열지 마세요.'},
  {name:'진공 압력 이상',parts:['chamber','vacuum'],cause:'시료 방출 가스, 누설 또는 펌프 상태 변화 가능성',steps:['작업을 중지하고 압력 추세와 경보를 기록합니다.','시료 적합성과 챔버 상태를 장비 절차에 따라 확인합니다.','회복되지 않으면 담당 서비스에 문의합니다.'],warning:'인터록을 우회하거나 임의로 챔버를 개방하지 마세요.'},
  {name:'신호가 약함',parts:['detector','electronics','electron'],cause:'검출기 선택, 신호 경로 또는 빔 상태 가능성',steps:['올바른 검출기와 표시 범위를 확인합니다.','기준 시료에서 신호를 비교합니다.','관련 경보와 연결 상태를 점검합니다.'],warning:'통전된 전자부를 열거나 케이블을 임의로 분리하지 마세요.'},
  {name:'가스 주입 이상',parts:['gas','chamber'],cause:'가스 공급, 노즐 위치 또는 전구체 상태 가능성',steps:['가공을 중지하고 관련 경보를 확인합니다.','장비 안내에 따라 노즐 위치와 공급 상태를 확인합니다.','회복되지 않으면 담당자에게 점검을 요청합니다.'],warning:'전구체와 가스 설비는 해당 장비의 안전 절차를 따르세요.'}
];
