export const ELEMENTS={Si:{color:'#5ca6d6'},Cu:{color:'#dc9961'},B:{color:'#b983db'}};
export const flightTime=(massToCharge,voltage=5000)=>1e9*.1*Math.sqrt(massToCharge*1.66053906660e-27/(2*1.602176634e-19*voltage));
export const massFromTime=(timeNs,voltage=5000)=>(timeNs*1e-9/.1)**2*2*1.602176634e-19*voltage/1.66053906660e-27;
const fraction=seed=>{const value=Math.sin(seed*127.1+311.7)*43758.5453;return value-Math.floor(value);};
export function eventAt(index,total,voltage,charge){
  const depth=index/(total-1)*30,radius=Math.sqrt(fraction(index*7+1)),angle=fraction(index*7+2)*Math.PI*2;
  const hitX=radius*Math.cos(angle),hitY=radius*Math.sin(angle),choice=fraction(index*7+3);
  const copper=depth<8?.72:.035,boron=.015+.28*Math.exp(-.5*((depth-19)/1.7)**2);
  const element=choice<copper?'Cu':choice<copper+boron?'B':'Si',isotope=fraction(index*7+4);
  const mass=element==='Cu'?(isotope<.69?63:65):element==='B'?(isotope<.8?11:10):isotope<.92?28:isotope<.97?29:30;
  const tof=flightTime(mass/charge,voltage),massToCharge=massFromTime(tof,voltage);
  return {event:index+1,element,charge,massToCharge,tof,hitX,hitY,x:hitX*8,y:hitY*8,z:depth};
}
export class AptEngine{
  constructor(){this.mode='laser';this.voltage=5000;this.charge=1;this.total=4096;this.duration=12;this.reset();}
  reset(){this.rows=[];this.index=0;this.elapsed=0;this.status='idle';}
  configure(changes){
    if('mode'in changes&&!['laser','voltage'].includes(changes.mode))throw new RangeError('Unknown pulse mode');
    if('voltage'in changes&&(!Number.isFinite(changes.voltage)||changes.voltage<2000||changes.voltage>8000))throw new RangeError('Voltage outside educational range');
    if('charge'in changes&&![1,2].includes(changes.charge))throw new RangeError('Unsupported charge state');
    for(const key of ['mode','voltage','charge'])if(key in changes)this[key]=changes[key];this.reset();
  }
  start(){if(this.status==='complete')this.reset();this.status='scanning';}
  pause(){if(this.status==='scanning')this.status='paused';}
  get progress(){return this.index/this.total;}
  get batchSize(){return 128;}
  get cycleCount(){return Math.ceil(this.total/this.batchSize);}
  get sequence(){
    const cycles=this.elapsed/this.duration*this.cycleCount,cycle=Math.min(this.cycleCount-1,Math.floor(cycles)),phase=cycles-Math.floor(cycles);
    const row=eventAt(cycle*this.batchSize,this.total,this.voltage,this.charge),arrival=.18+.64*row.tof/flightTime(65,this.voltage);
    const active=this.status==='scanning'||this.status==='paused';
    const stage=!active?this.status:phase<.12?'pulse':phase<.18?'evaporation':phase<arrival?'flight':phase<.86?'detection':'waiting';
    return {cycle,phase,row,stage,pulseOn:active&&phase<.12,ionVisible:active&&phase>=.18&&phase<arrival,flightProgress:Math.max(0,Math.min(1,(phase-.18)/(arrival-.18))),arrival};
  }
  get evaporated(){const cycles=this.elapsed/this.duration*this.cycleCount;return Math.min(this.total,(Math.floor(cycles)+(cycles%1>=.18?1:0))*this.batchSize);}
  tick(delta){
    if(this.status!=='scanning'||!Number.isFinite(delta)||delta<=0)return;
    this.elapsed=Math.min(this.duration,this.elapsed+delta);
    const cycles=this.elapsed/this.duration*this.cycleCount,completed=Math.floor(cycles)+(cycles%1+1e-8>=.86?1:0),target=Math.min(this.total,completed*this.batchSize);
    while(this.index<target){this.rows.push(eventAt(this.index,this.total,this.voltage,this.charge));this.index++;}
    if(this.elapsed>=this.duration-1e-8){this.elapsed=this.duration;this.status='complete';}
  }
  metadata(){return {instrument:'APT',pulse_mode:this.mode,effective_acceleration_V_assumed:this.voltage,flight_length_m_assumed:.1,charge_state_assumed:this.charge,sample:'synthetic_Cu_rich_cap_Si_with_B_enriched_layer',reconstruction:'fixed_linear_back_projection_and_event_order_not_physical_inversion',nominal_volume:'radius_8_nm_depth_30_nm',timing:'32_representative_cycles_in_12_simulation_seconds_each_groups_128_independent_synthetic_events_not_128_ions_per_real_pulse',recording:'batch_committed_after_representative_flight_and_detection_gate',displayed_particle:'one_representative_ion_per_cycle_time_expanded_not_real_pulse_rate',limitations:'no_calibration_mass_overlap_multi_hit_efficiency_or_quantification'};}
  csv(){const metadata='"'+JSON.stringify(this.metadata()).replaceAll('"','""')+'"';return ['event,synthetic_species,charge_assumed,mass_to_charge_Da_per_e,tof_ns,detector_x_normalized,detector_y_normalized,nominal_x_nm,nominal_y_nm,nominal_depth_nm,metadata',...this.rows.map(row=>[row.event,row.element,row.charge,row.massToCharge,row.tof,row.hitX,row.hitY,row.x,row.y,row.z,metadata].join(','))].join('\n');}
}
