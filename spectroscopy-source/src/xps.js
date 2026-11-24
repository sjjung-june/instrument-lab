import {Acquisition,gaussian} from './acquisition.js';
export const PHOTON_ENERGY=1486.6;
export const WORK_FUNCTION=4.5;
export const kineticEnergy=binding=>PHOTON_ENERGY-binding-WORK_FUNCTION;
export const bindingEnergy=kinetic=>PHOTON_ENERGY-kinetic-WORK_FUNCTION;
export function xpsComponents(depth,thickness){const remaining=Math.max(0,thickness-depth);const si=Math.exp(-remaining/3);return {si,o:1-si,c:.22*Math.exp(-depth/1.5)};}
export function xpsSignal(energy,{thickness=6,charge=2,neutralizer=true,passEnergy=20,mode='survey'}={}){
  const shift=charge*(neutralizer?.1:1),components=xpsComponents(0,thickness),sigma=mode==='survey'?1.6:passEnergy===20?.35:.8;
  const doublet=center=>gaussian(energy,center+shift,sigma)+.5*gaussian(energy,center+.6+shift,sigma);
  return .012+components.si*doublet(99.4)+components.o*doublet(103.5)+components.o*.9*gaussian(energy,532.8+shift,mode==='survey'?2.2:sigma)+components.c*gaussian(energy,284.8+shift,1.2);
}
export class XpsEngine extends Acquisition{
  constructor(){super();this.kind='xps';this.mode='survey';this.thickness=6;this.charge=2;this.neutralizer=true;this.passEnergy=20;this.reset();}
  configure(changes){if(changes.mode&&!['survey','highres','depth'].includes(changes.mode))throw new RangeError('Unknown XPS mode');for(const key of ['thickness','charge'])if(key in changes&&!Number.isFinite(changes[key]))throw new RangeError('Invalid '+key);if('passEnergy'in changes&&![20,80].includes(changes.passEnergy))throw new RangeError('Invalid pass energy');for(const key of ['mode','neutralizer','passEnergy'])if(key in changes)this[key]=changes[key];if('thickness'in changes)this.thickness=Math.max(2,Math.min(12,changes.thickness));if('charge'in changes)this.charge=Math.max(0,Math.min(4,changes.charge));this.reset();}
  point(index){if(this.mode==='depth'){const axis=index/(this.total-1)*30,components=xpsComponents(axis,this.thickness);return {axis,value:components.si,...components};}const axis=this.mode==='survey'?600-index/(this.total-1)*600:110-index/(this.total-1)*16;return {axis,value:xpsSignal(axis,this)};}
  metadata(){return {sample:'synthetic_SiO2_on_Si',thickness_nm:this.thickness,charge_eV:this.charge,neutralizer:this.neutralizer,pass_energy_eV:this.passEnergy,photon_eV:PHOTON_ENERGY,work_function_eV_assumed:WORK_FUNCTION};}
}
