export const gaussian=(value,center,width)=>Math.exp(-.5*((value-center)/width)**2);
export const domainAt=(coordinateX,coordinateY)=>Math.min(1,.08+.9*gaussian(coordinateX,.35,.16)*gaussian(coordinateY,.53,.23)+.6*gaussian(coordinateX,.76,.11)*gaussian(coordinateY,.3,.12));
export const heightAt=(coordinateX,coordinateY)=>12+35*gaussian(coordinateX,.57,.18)*gaussian(coordinateY,.46,.18)+8*Math.sin(coordinateX*12)*Math.sin(coordinateY*9);
export function irAbsorption(wavenumber,material='pmma'){
  const bands=material==='pmma'?[[1730,.85,32],[1140,.45,45],[1450,.18,40],[2950,.3,65]]:[[1600,.6,28],[1490,.4,28],[1025,.3,30],[3030,.5,45]];
  return .015+bands.reduce((sum,[center,amplitude,width])=>sum+amplitude*gaussian(wavenumber,center,width),0);
}
export function ramanSignal(shift,coordinateX=.35,coordinateY=.53,wavelength=532,weight=1){
  const polymer=domainAt(coordinateX,coordinateY),response=(1-polymer)*gaussian(shift,520,12)+polymer*weight*(.85*gaussian(shift,1000,18)+.55*gaussian(shift,1600,28)+.7*gaussian(shift,2900,60));
  return .008+response*(532/wavelength)**4;
}
export const scatteredWavelength=(laserNm,shift)=>1e7/(1e7/laserNm-shift);
export function afmirSignal(wavenumber,coordinateX,coordinateY,material,weight=1){const fraction=domainAt(coordinateX,coordinateY);return weight*(fraction*irAbsorption(wavenumber,material)+(1-fraction)*irAbsorption(wavenumber,material==='pmma'?'ps':'pmma'));}
export const ringdown=(time,amplitude)=>time<0?0:amplitude*Math.exp(-4*time)*Math.sin(2*Math.PI*6*time);
export function indentationAt(fraction,peak=1000,material='silicon'){
  const hardness={silicon:12,copper:3,polymer:.25}[material],contact=Math.sqrt(peak*1000/(hardness*24.5)),maximum=contact/.8,residual=.6*maximum;
  if(fraction<.08)return {load:0,depth:0,phase:'approach',maximum,residual};
  if(fraction<.55){const progress=(fraction-.08)/.47;return {load:peak*progress**2,depth:maximum*progress,phase:'loading',maximum,residual};}
  if(fraction<.7)return {load:peak,depth:maximum,phase:'hold',maximum,residual};
  if(fraction<.95){const progress=(fraction-.7)/.25;return {load:peak*(1-progress)**1.5,depth:residual+(maximum-residual)*(1-progress),phase:'unloading',maximum,residual};}
  return {load:0,depth:residual,phase:'retract',maximum,residual};
}
export function mechanicalResults(peak,material){
  const {maximum,residual}=indentationAt(.6,peak,material),stiffness=1.5*peak/(maximum-residual),contactDepth=maximum-.75*peak/stiffness,area=24.5*contactDepth**2;
  return {hardness:peak*1000/area,reducedModulus:1000*Math.sqrt(Math.PI)*stiffness/(2*1.034*Math.sqrt(area)),stiffness,contactDepth,area};
}
export function phantom(sample='void'){
  return [{x:0,y:0,radius:.8,mu:1},{x:.35,y:.13,radius:.16,mu:1.4},{x:-.3,y:-.24,radius:.2,mu:sample==='void'?-.95:0}];
}
export function projectionAt(angle,sample='void',scale=1,size=48){
  return Array.from({length:size},(_,channel)=>{const offset=-1+2*channel/(size-1);const line=phantom(sample).reduce((sum,item)=>{const distance=offset-item.x*Math.cos(angle)-item.y*Math.sin(angle);return sum+(Math.abs(distance)<item.radius?2*item.mu*Math.sqrt(item.radius**2-distance**2):0);},0)*scale;return {offset,line,transmission:Math.exp(-line)};});
}
export function reconstruct(projections,size=48){
  const image=new Float64Array(size*size);if(!projections.length)return image;
  const pitch=2/(size-1),filtered=projections.map(view=>view.projection.map((point,channel)=>view.projection.reduce((sum,neighbor,other)=>{const offset=channel-other;const kernel=offset===0?1/(4*pitch**2):Math.abs(offset)%2===1?-1/(Math.PI**2*offset**2*pitch**2):0;return sum+neighbor.line*kernel*pitch;},0)));
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){const coordinateX=-1+2*col/(size-1),coordinateY=-1+2*row/(size-1);if(coordinateX*coordinateX+coordinateY*coordinateY>1)continue;let sum=0;for(let view=0;view<projections.length;view++){const position=(coordinateX*Math.cos(projections[view].angle)+coordinateY*Math.sin(projections[view].angle)+1)/pitch,low=Math.floor(position),weight=position-low;if(low>=0&&low<size-1)sum+=filtered[view][low]*(1-weight)+filtered[view][low+1]*weight;}image[row*size+col]=sum*Math.PI/48;}
  return image;
}
export const FT_SIZE=256;
export const FT_RESOLUTION=32;
export function irSingleBeam(material,weight=1,accessory='transmission',background=false){
  return Array.from({length:FT_SIZE/2},(_,bin)=>{const wavenumber=bin*FT_RESOLUTION,reference=.4+.6*gaussian(wavenumber,1800,1600),response=irAbsorption(wavenumber,material)*weight*(accessory==='atr'?1200/Math.max(600,wavenumber):1);return background?reference:reference*10**(-response);});
}
export function interferogram(spectrum){return Array.from({length:FT_SIZE},(_,index)=>spectrum.reduce((sum,value,bin)=>sum+(bin===0?value:2*value*Math.cos(2*Math.PI*bin*index/FT_SIZE)),0)/FT_SIZE);}
export function fourier(signal){
  if(signal.length!==FT_SIZE)throw new RangeError('Complete interferogram required');
  return Array.from({length:FT_SIZE/2},(_,bin)=>{let real=0,imaginary=0;for(let index=0;index<FT_SIZE;index++){real+=signal[index]*Math.cos(2*Math.PI*bin*index/FT_SIZE);imaginary-=signal[index]*Math.sin(2*Math.PI*bin*index/FT_SIZE);}return Math.hypot(real,imaginary);});
}
export function absorbance(sample,reference){return sample.map((value,bin)=>{const transmittance=value/Math.max(1e-12,reference[bin]);return {axis:bin*FT_RESOLUTION,value:-Math.log10(Math.max(1e-12,transmittance)),transmittance};});}
