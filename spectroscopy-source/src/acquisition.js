export class Acquisition{
  reset(){this.status='idle';this.elapsed=0;this.index=0;this.rows=[];}
  start(){if(this.status==='complete')this.reset();this.status='scanning';}
  pause(){if(this.status==='scanning')this.status='paused';}
  get total(){return this.mode==='depth'?81:this.mode==='image'?4096:801;}
  get duration(){return this.mode==='depth'?12:this.mode==='image'?8:6;}
  get progress(){return this.index/this.total;}
  get depth(){return this.mode==='depth'?(this.index?this.rows.at(-1).axis:0):0;}
  get phase(){return this.mode==='depth'&&this.status==='scanning'?(this.elapsed/(this.duration/this.total)%1<.5?'sputter':'analyze'):'analyze';}
  tick(delta){if(this.status!=='scanning'||!Number.isFinite(delta)||delta<=0)return;this.elapsed=Math.min(this.duration,this.elapsed+delta);const target=Math.min(this.total,Math.floor(this.progressAtTime()*this.total+1e-8));while(this.index<target){this.rows.push(this.point(this.index));this.index++;}if(this.index===this.total)this.status='complete';}
  progressAtTime(){return this.elapsed/this.duration;}
  csv(){const metadata='"'+JSON.stringify(this.metadata()).replaceAll('"','""')+'"';return ['instrument,mode,axis,signal_au,si_au,oxide_or_oxygen_au,carbon_au,copper_au,boron_au,nominal_depth_nm,metadata',...this.rows.map(row=>[this.kind,this.mode,row.axis,row.value,row.si??'',row.o??'',row.c??'',row.cu??'',row.b??'',this.mode==='depth'?row.axis:'',metadata].join(','))].join('\n');}
}
export const gaussian=(value,center,sigma)=>Math.exp(-.5*((value-center)/sigma)**2);
