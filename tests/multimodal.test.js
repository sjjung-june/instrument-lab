import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONFIG} from '../multimodal-source/src/config.js';
import {InstrumentEngine} from '../multimodal-source/src/engine.js';
import {PlaybackClock} from '../src/shared/playback.js';
import {domainAt,heightAt,irAbsorption,ramanSignal,scatteredWavelength,afmirSignal,ringdown,indentationAt,mechanicalResults,projectionAt,reconstruct,interferogram,fourier,absorbance,irSingleBeam,FT_SIZE} from '../multimodal-source/src/physics.js';

const near=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} versus ${expected}`);
function background(engine,accessory='transmission'){engine.configure({mode:accessory});engine.configure({mode:'background'});engine.start();engine.tick(100);}
test('five new instruments have valid unique selectable parts and maintenance guides',()=>{
  assert.equal(Object.keys(CONFIG).length,5);for(const [kind,config] of Object.entries(CONFIG)){const ids=config.parts.map(part=>part.id);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.includes('sample'));assert.ok(config.sources.length);for(const guide of config.guides){assert.equal(guide.steps.length,3);for(const id of guide.parts)assert.ok(ids.includes(id));}assert.equal(new InstrumentEngine(kind).status,'idle');}
});
test('every new mode completes and restart loads a fresh virtual acquisition',()=>{
  for(const [kind,config] of Object.entries(CONFIG))for(const mode of Object.keys(config.modes)){const engine=new InstrumentEngine(kind);if(kind==='ftir')background(engine,mode==='atr'?'atr':'transmission');engine.configure({mode});assert.equal(engine.start(),true);engine.tick(100);assert.equal(engine.status,'complete');assert.equal(engine.progress,1);assert.ok(engine.rows.length);engine.start();assert.equal(engine.index,0);assert.equal(engine.status,'scanning');}
});
test('pause, invalid deltas and resume preserve new acquisition data',()=>{
  for(const kind of Object.keys(CONFIG)){const engine=new InstrumentEngine(kind);engine.start();engine.tick(1);engine.pause();const snapshot=engine.csv(),elapsed=engine.elapsed;for(const delta of [10,-1,NaN,Infinity])engine.tick(delta);assert.equal(engine.elapsed,elapsed);assert.equal(engine.csv(),snapshot);engine.start();for(const delta of [-1,NaN,Infinity])engine.tick(delta);assert.equal(engine.elapsed,elapsed);engine.tick(100);assert.equal(engine.status,'complete');}
});
test('configuration validation is transactional and changes wait for explicit start',()=>{
  for(const kind of Object.keys(CONFIG)){const engine=new InstrumentEngine(kind),sample=engine.sample;assert.throws(()=>engine.configure({sample:'invalid'}),RangeError);assert.throws(()=>engine.configure({parameter:NaN}),RangeError);assert.throws(()=>engine.configure({sample:Object.keys(CONFIG[kind].selector.values).at(-1),parameter:-100}),RangeError);assert.equal(engine.sample,sample);engine.start();engine.tick(1);engine.configure({parameter:CONFIG[kind].parameter.min});assert.equal(engine.index,0);assert.equal(engine.status,'idle');}
});
test('playback rate changes duration, not final new-instrument data',()=>{
  for(const kind of Object.keys(CONFIG)){const snapshots=[];for(const rate of [.1,2]){const engine=new InstrumentEngine(kind),clock=new PlaybackClock(rate);engine.start();clock.step(0);for(let frame=1;frame<5000&&engine.status!=='complete';frame++)engine.tick(clock.step(frame*50));assert.equal(engine.status,'complete');snapshots.push(engine.csv());}assert.equal(snapshots[0],snapshots[1]);}
});
test('XRM attenuation is nonnegative and obeys the exponential transmission law',()=>{
  for(const angle of [0,.5,Math.PI/2])for(const point of projectionAt(angle)){assert.ok(point.line>=0);assert.ok(point.transmission>0&&point.transmission<=1);near(-Math.log(point.transmission),point.line);}
  const low=projectionAt(.4,'void',.5),high=projectionAt(.4,'void',2);low.forEach((point,index)=>near(high[index].transmission,point.transmission**4));
});
test('XRM rotation precedes exposure, and projections are recorded after exposure',()=>{
  const engine=new InstrumentEngine('xrm'),period=engine.duration/48;engine.start();engine.tick(period*.2);assert.equal(engine.phase,'rotate');assert.equal(engine.signals.input,false);assert.equal(engine.rows.length,0);engine.tick(period*.3);assert.equal(engine.phase,'expose');assert.equal(engine.signals.output,true);assert.equal(engine.rows.length,0);engine.tick(period*.6);assert.equal(engine.rows.length,1);assert.equal(engine.rows[0].angle,0);engine.tick(100);near(engine.angle,47*Math.PI/48);
});
test('XRM reconstruction is computed from projections and separates void and dense inclusion',()=>{
  const views=Array.from({length:48},(_,index)=>({angle:index*Math.PI/48,projection:projectionAt(index*Math.PI/48)})),image=reconstruct(views),at=(coordinateX,coordinateY)=>image[Math.round((coordinateY+1)*47/2)*48+Math.round((coordinateX+1)*47/2)];near(at(0,0),1,.1);assert.ok(at(-.3,-.24)<.2);assert.ok(at(.35,.13)>2);assert.ok(image.every(Number.isFinite));assert.ok(reconstruct([]).every(value=>value===0));
});
test('XRM reference sample removes void contrast without changing detector dimensions',()=>{
  const defect=projectionAt(0,'void'),healthy=projectionAt(0,'healthy');assert.equal(defect.length,48);assert.equal(healthy.length,48);assert.ok(defect.some((point,index)=>point.transmission>healthy[index].transmission));
});
test('Nanoindenter loading, hold and unloading are continuous and leave residual depth',()=>{
  const before=indentationAt(.55-1e-10),hold=indentationAt(.55),unload=indentationAt(.7),end=indentationAt(1);near(before.depth,hold.depth,1e-6);near(hold.load,unload.load);near(hold.depth,unload.depth);assert.equal(end.load,0);assert.ok(end.depth>0&&end.depth<hold.depth);assert.equal(indentationAt(.01).load,0);
});
test('Nanoindenter synthetic hardness, units and ideal reduced modulus are consistent',()=>{
  for(const [material,hardness] of Object.entries({silicon:12,copper:3,polymer:.25})){const result=mechanicalResults(1000,material);near(result.hardness,hardness);near(result.area,24.5*result.contactDepth**2);assert.ok(result.reducedModulus>0);near(mechanicalResults(2000,material).hardness,result.hardness);}
  assert.ok(indentationAt(.6,1000,'polymer').depth>indentationAt(.6,1000,'silicon').depth);
});
test('Nanoindenter results are not reported before unloading finishes',()=>{
  const engine=new InstrumentEngine('nanoindenter');engine.start();engine.tick(engine.duration*.8);assert.equal(engine.results,null);engine.tick(engine.duration*.16);assert.ok(engine.results.hardness>0);
});
test('Raman shift remains fixed while Stokes wavelength changes with excitation',()=>{
  assert.ok(scatteredWavelength(532,1000)>532);assert.ok(scatteredWavelength(785,1000)>785);near(1e7/532-1e7/scatteredWavelength(532,1000),1000);near((ramanSignal(1000,.35,.53,532)-.008)/(ramanSignal(1000,.35,.53,785)-.008),(785/532)**4);
});
test('Raman CCD accumulates all channels together rather than sweeping shift',()=>{
  const engine=new InstrumentEngine('raman');engine.start();engine.tick(engine.duration/8);assert.equal(engine.index,1);assert.equal(engine.rows.length,256);const first=engine.rows[74].value;engine.tick(engine.duration/8);near(engine.rows[74].value,2*first);assert.equal(engine.rows.length,256);assert.equal(engine.integrationHistory.length,2);near(engine.rows[0].axis,100);near(engine.rows.at(-1).axis,3200);
});
test('Raman chemical maps use the selected shift and spatial material response',()=>{
  const engine=new InstrumentEngine('raman');engine.configure({mode:'map',band:1000});engine.start();engine.tick(100);const first=engine.rows.map(row=>row.value);engine.configure({band:520});engine.start();engine.tick(100);assert.ok(first.some((value,index)=>Math.abs(value-engine.rows[index].value)>.1));assert.equal(engine.rows.at(-1).x,1);assert.equal(engine.rows.at(-1).y,1);
});
test('FTIR inverse transform and DFT recover the same single-beam spectrum',()=>{
  const spectrum=irSingleBeam('pmma'),signal=interferogram(spectrum),restored=fourier(signal);assert.equal(signal.length,FT_SIZE);restored.forEach((value,index)=>near(value,spectrum[index],1e-10));assert.throws(()=>fourier(signal.slice(1)),RangeError);
});
test('FTIR absorbance follows the sample/background ratio, not subtraction',()=>{
  const reference=irSingleBeam('pmma',1,'transmission',true),sample=irSingleBeam('pmma',1,'transmission',false),result=absorbance(fourier(interferogram(sample)),fourier(interferogram(reference)));for(const row of result){near(row.value,irAbsorption(row.axis),1e-10);near(row.transmittance,10**(-row.value));}
});
test('FTIR cannot report sample spectra without its accessory-specific background',()=>{
  const engine=new InstrumentEngine('ftir');engine.configure({mode:'transmission'});assert.equal(engine.start(),false);assert.equal(engine.status,'idle');assert.ok(engine.error);background(engine);engine.configure({mode:'transmission'});assert.equal(engine.start(),true);engine.tick(3);assert.equal(engine.spectrum.length,0);engine.tick(100);assert.equal(engine.spectrum.length,94);engine.configure({mode:'atr'});assert.equal(engine.background,undefined);assert.equal(engine.start(),false);background(engine,'atr');engine.configure({mode:'atr'});assert.equal(engine.start(),true);engine.tick(100);assert.ok(engine.spectrum.length);engine.clearBackground();assert.equal(engine.background,undefined);assert.equal(engine.rows.length,0);
});
test('FTIR material and optical weight change absorptions but not empty background',()=>{
  const engine=new InstrumentEngine('ftir');background(engine);const reference=engine.background.slice();engine.configure({mode:'transmission',parameter:2,sample:'ps'});assert.deepEqual(engine.background,reference);engine.start();engine.tick(100);assert.ok(engine.spectrum.some(row=>row.value>.5));
});
test('AFM-IR pulse precedes expansion, ringdown and data recording',()=>{
  const engine=new InstrumentEngine('afmir'),period=engine.duration/64;engine.start();engine.tick(period*.05);assert.equal(engine.phase,'pulse');assert.equal(engine.signals.input,true);assert.equal(engine.signals.output,false);assert.equal(engine.index,0);engine.tick(period*.15);assert.equal(engine.phase,'expansion');assert.equal(engine.signals.input,false);engine.tick(period*.2);assert.equal(engine.phase,'ringdown');assert.equal(engine.signals.output,true);assert.equal(engine.index,0);engine.tick(period*.51);assert.equal(engine.phase,'record');assert.equal(engine.rows.length,1);
});
test('AFM-IR maps use independent 16-location batches after representative ringdown',()=>{
  const engine=new InstrumentEngine('afmir');engine.configure({mode:'map'});engine.start();engine.tick(engine.duration/64*.85);assert.equal(engine.index,0);engine.tick(engine.duration/64*.1);assert.equal(engine.index,16);engine.tick(100);assert.equal(engine.rows.length,1024);assert.equal(engine.coordinate.x,1);assert.equal(engine.coordinate.y,1);
});
test('AFM-IR chemical response and topography are independent quantities',()=>{
  const coordinateX=.35,coordinateY=.53,height=heightAt(coordinateX,coordinateY);assert.ok(domainAt(coordinateX,coordinateY)>.8);assert.ok(afmirSignal(1730,coordinateX,coordinateY,'pmma')>afmirSignal(1600,coordinateX,coordinateY,'pmma'));near(heightAt(coordinateX,coordinateY),height);near(afmirSignal(1730,coordinateX,coordinateY,'pmma',2),2*afmirSignal(1730,coordinateX,coordinateY,'pmma',1));assert.equal(ringdown(-1,1),0);assert.ok(Math.abs(ringdown(.8,1))<Math.abs(ringdown(.05,1)));
});
test('new active input/output stops idle, paused, and completed',()=>{
  for(const kind of Object.keys(CONFIG)){const engine=new InstrumentEngine(kind);for(const status of ['idle','paused','complete']){engine.status=status;assert.equal(engine.signals.input,false);assert.equal(engine.signals.output,false);}}
});
test('CSV exports acquired values and quoted metadata; CT exports detector projections',()=>{
  for(const kind of Object.keys(CONFIG)){const engine=new InstrumentEngine(kind);assert.equal(engine.csv().split('\n').length,1);engine.start();engine.tick(100);const csv=engine.csv();assert.match(csv,/metadata/);assert.match(csv,/""synthetic"":true/);assert.ok(csv.split('\n').length>1);if(kind==='xrm')assert.equal(csv.split('\n').length,1+48*48);}
});
test('new views reuse common selection and playback modules with separate entry points',()=>{
  const scene=readFileSync(new URL('../multimodal-source/src/scene.js',import.meta.url),'utf8'),main=readFileSync(new URL('../multimodal-source/src/main.js',import.meta.url),'utf8');assert.match(scene,/applyHighlight\(/);assert.match(main,/mountViewerControls\(scene,playbackClock,/);assert.match(main,/playbackClock.step\(time\)/);for(const kind of Object.keys(CONFIG)){const html=readFileSync(new URL('../multimodal-source/'+kind+'.html',import.meta.url),'utf8');assert.ok(html.includes('data-instrument="'+kind+'"'));}
});
