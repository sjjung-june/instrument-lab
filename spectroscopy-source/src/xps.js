import {Acquisition,gaussian} from './acquisition.js';
export const PHOTON_ENERGY=1486.6;
export const WORK_FUNCTION=4.5;
export const NARROW_REGIONS={
  si2p:{name:'Si 2p',range:[110,94],peaks:[[99.4,'Si⁰'],[103.5,'Si⁴⁺']]},
  c1s:{name:'C 1s',range:[295,278],peaks:[[284.8,'C 1s']]},
  o1s:{name:'O 1s',range:[544,524],peaks:[[532.8,'O 1s']]}
};
export const kineticEnergy=binding=>PHOTON_ENERGY-binding-WORK_FUNCTION;
export const bindingEnergy=kinetic=>PHOTON_ENERGY-kinetic-WORK_FUNCTION;
export function xpsComponents(depth,thickness){const remaining=Math.max(0,thickness-depth);const si=Math.exp(-remaining/3);return {si,o:1-si,c:.22*Math.exp(-depth/1.5)};}
export function xpsSignal(energy,{thickness=6,charge=2,neutralizer=true,passEnergy=20,mode='survey'}={}){
  const shift=charge*(neutralizer?.1:1),components=xpsComponents(0,thickness),sigma=mode==='survey'?1.6:passEnergy===20?.35:.8;
  const doublet=center=>gaussian(energy,center+shift,sigma)+.5*gaussian(energy,center+.6+shift,sigma);
  return .012+components.si*doublet(99.4)+components.o*doublet(103.5)+components.o*.9*gaussian(energy,532.8+shift,mode==='survey'?2.2:sigma)+components.c*gaussian(energy,284.8+shift,mode==='survey'?1.2:Math.hypot(sigma,.35));
}
export class XpsEngine extends Acquisition{
  constructor(){super();this.kind='xps';this.mode='survey';this.region='si2p';this.thickness=6;this.charge=2;this.neutralizer=true;this.passEnergy=20;this.reset();}
  get energyRange(){return this.mode==='survey'?[600,0]:NARROW_REGIONS[this.region].range;}
  configure(changes){if(changes.mode&&!['survey','highres','depth'].includes(changes.mode))throw new RangeError('Unknown XPS mode');if('region'in changes&&!Object.hasOwn(NARROW_REGIONS,changes.region))throw new RangeError('Unknown Narrow region');for(const key of ['thickness','charge'])if(key in changes&&!Number.isFinite(changes[key]))throw new RangeError('Invalid '+key);if('passEnergy'in changes&&![20,80].includes(changes.passEnergy))throw new RangeError('Invalid pass energy');for(const key of ['mode','region','neutralizer','passEnergy'])if(key in changes)this[key]=changes[key];if('thickness'in changes)this.thickness=Math.max(2,Math.min(12,changes.thickness));if('charge'in changes)this.charge=Math.max(0,Math.min(4,changes.charge));this.reset();}
  point(index){if(this.mode==='depth'){const axis=index/(this.total-1)*30,components=xpsComponents(axis,this.thickness);return {axis,value:components.si,...components};}const [start,end]=this.energyRange,axis=start+(end-start)*index/(this.total-1);return {axis,value:xpsSignal(axis,this)};}
  metadata(){return {sample:'synthetic_SiO2_on_Si',mode_label:this.mode==='highres'?'Narrow':this.mode==='depth'?'Depth Profiling':'Survey',narrow_region:this.mode==='highres'?NARROW_REGIONS[this.region].name:null,energy_range_eV:this.mode==='depth'?null:this.energyRange,thickness_nm:this.thickness,charge_eV:this.charge,neutralizer:this.neutralizer,pass_energy_eV:this.passEnergy,photon_eV:PHOTON_ENERGY,work_function_eV_assumed:WORK_FUNCTION};}
}
