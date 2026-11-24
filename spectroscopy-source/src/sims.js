import {Acquisition,gaussian} from './acquisition.js';
export const SPECIES={positive:[{id:'si',name:'²⁸Si⁺',mass:28},{id:'cu',name:'⁶³Cu⁺',mass:63},{id:'b',name:'¹¹B⁺',mass:11}],negative:[{id:'o',name:'¹⁶O⁻',mass:16},{id:'c',name:'¹²C⁻',mass:12},{id:'si',name:'²⁸Si⁻',mass:28}]};
export const flightTime=mass=>1e6*Math.sqrt(mass*1.66053906660e-27/(2*1.602176634e-19*2000));
export function copperPattern(x,y){return (Math.abs(x-.32)<.12&&y>.2&&y<.8)||(Math.abs(y-.32)<.1&&x>.32&&x<.8)?1:0;}
export function simsComponents(depth=0,x=.32,y=.5,thickness=10,matrix=true){
  const patterned=copperPattern(x,y),oxideDepth=Math.max(0,depth-(patterned?8:0));
  const oxide=1/(1+Math.exp((oxideDepth-thickness)/1.8)),copper=patterned/(1+Math.exp((depth-8)/1.3));
  return {cu:.85*copper*(matrix?.65:1),o:.65*oxide*(1-.85*copper)*(matrix?1.3:1),si:(.15+.7*(1-oxide))*(1-.8*copper),c:.32*Math.exp(-depth/2)*(1-.6*copper),b:.38*gaussian(depth,35,7)*(1-.5*copper)+.012};
}
export function massSignal(mass,polarity='positive',thickness=10,matrix=true){
  const components=simsComponents(0,.32,.5,thickness,matrix),background=.002;
  if(polarity==='positive')return background+components.b*gaussian(mass,11,.15)+components.si*gaussian(mass,28,.15)+components.si*.05*gaussian(mass,29,.15)+components.si*.033*gaussian(mass,30,.15)+components.cu*gaussian(mass,63,.15)+components.cu*.45*gaussian(mass,65,.15);
  return background+components.c*2*gaussian(mass,12,.15)+components.o*3*gaussian(mass,16,.15)+components.si*gaussian(mass,28,.15)+components.o*.4*gaussian(mass,44,.15);
}
export class SimsEngine extends Acquisition{
  constructor(){super();this.kind='sims';this.mode='spectrum';this.polarity='positive';this.species='cu';this.thickness=10;this.matrix=true;this.reset();}
  configure(changes){if(changes.mode&&!['spectrum','image','depth'].includes(changes.mode))throw new RangeError('Unknown SIMS mode');if(changes.polarity&&!SPECIES[changes.polarity])throw new RangeError('Unknown polarity');const polarity=changes.polarity||this.polarity;if(changes.species&&!SPECIES[polarity].some(item=>item.id===changes.species))throw new RangeError('Species not available in selected polarity');if('thickness'in changes&&!Number.isFinite(changes.thickness))throw new RangeError('Invalid thickness');for(const key of ['mode','polarity','species','matrix'])if(key in changes)this[key]=changes[key];if(!SPECIES[this.polarity].some(item=>item.id===this.species))this.species=SPECIES[this.polarity][0].id;if('thickness'in changes)this.thickness=Math.max(2,Math.min(20,changes.thickness));this.reset();}
  point(index){if(this.mode==='depth'){const axis=index/(this.total-1)*80,components=simsComponents(axis,.32,.5,this.thickness,this.matrix),channels=Object.fromEntries(SPECIES[this.polarity].map(item=>[item.id,components[item.id]]));return {axis,value:components[this.species],...channels};}if(this.mode==='image'){const x=(index%64)/63,y=Math.floor(index/64)/63;return {axis:index,x,y,value:simsComponents(0,x,y,this.thickness,this.matrix)[this.species]};}const axis=1+index/(this.total-1)*69;return {axis,value:massSignal(axis,this.polarity,this.thickness,this.matrix)};}
  metadata(){return {sample:'synthetic_Cu_pattern_SiO2_Si_with_B_layer',polarity:this.polarity,species:this.species,oxide_nm:this.thickness,matrix_effect:this.matrix,flight_length_m_assumed:1,acceleration_V_assumed:2000,depth_calibration:'nominal_not_measured',image_x_y:'index%64/63;floor(index/64)/63'};}
}
