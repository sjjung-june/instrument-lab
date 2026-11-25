import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AptEngine} from '../apt-source/src/engine.js';
import {SamEngine,DEPTHS,representativeReflection,echoAt,gatePeak} from '../sam-source/src/simulation.js';
import {XpsEngine} from '../spectroscopy-source/src/xps.js';
import {SimsEngine} from '../spectroscopy-source/src/sims.js';
import {signalState} from '../spectroscopy-source/src/signals.js';
import {FibSimulation} from '../fib-source/src/simulation.js';

test('APT pulse, evaporation, flight, detection and recording are ordered',()=>{
  const engine=new AptEngine(),period=engine.duration/engine.cycleCount;
  engine.start();engine.tick(period*.05);assert.equal(engine.sequence.stage,'pulse');assert.equal(engine.sequence.ionVisible,false);assert.equal(engine.index,0);assert.equal(engine.evaporated,0);
  engine.tick(period*.09);assert.equal(engine.sequence.stage,'evaporation');assert.equal(engine.sequence.pulseOn,false);
  engine.tick(period*.16);assert.equal(engine.sequence.stage,'flight');assert.equal(engine.sequence.ionVisible,true);assert.equal(engine.sequence.pulseOn,false);assert.equal(engine.evaporated,128);assert.equal(engine.index,0);assert.equal(engine.csv().split('\n').length,1);
  engine.tick(period*.54);assert.equal(engine.sequence.stage,'detection');assert.equal(engine.sequence.ionVisible,false);assert.equal(engine.index,0);
  engine.tick(period*.04);assert.equal(engine.sequence.stage,'waiting');assert.equal(engine.index,128);
});
test('APT no recycled ion without a new trigger and pause freezes phase',()=>{
  const engine=new AptEngine();engine.start();engine.tick(.35);assert.equal(engine.sequence.ionVisible,false);assert.equal(engine.index,128);
  engine.pause();const before=engine.sequence;engine.tick(5);assert.deepEqual(engine.sequence,before);
  engine.start();engine.tick(.04);assert.equal(engine.sequence.stage,'pulse');assert.equal(engine.sequence.cycle,1);assert.equal(engine.index,128);
});
test('APT representative TOF scales with charge and signals stop at completion',()=>{
  const engine=new AptEngine();engine.start();engine.tick(.12);const single=engine.sequence.flightProgress;
  engine.configure({charge:2});engine.start();engine.tick(.12);assert.ok(engine.sequence.flightProgress>single);
  engine.tick(12);assert.equal(engine.index,4096);assert.equal(engine.sequence.pulseOn,false);assert.equal(engine.sequence.ionVisible,false);assert.equal(engine.evaporated,4096);
});
test('APT grouped records are independent of frame size in both modes',()=>{
  for(const mode of ['laser','voltage']){const small=new AptEngine(),large=new AptEngine();small.configure({mode});large.configure({mode});small.start();large.start();for(let frame=0;frame<1200;frame++)small.tick(.01);large.tick(12);assert.equal(small.status,'complete');assert.equal(small.csv(),large.csv());}
});
test('SAM physical reflection is independent of digital receive gate',()=>{
  const engine=new SamEngine(),depth=representativeReflection(engine.x,engine.y,engine.sample),wave=echoAt(engine.x,engine.y,100,engine.sample);assert.ok(DEPTHS.includes(depth));assert.equal(depth,260);
  const first=gatePeak(engine.x,engine.y,260,40,engine.sample);engine.configure({center:590});assert.equal(representativeReflection(engine.x,engine.y,engine.sample),depth);assert.equal(echoAt(engine.x,engine.y,100,engine.sample),wave);assert.notEqual(gatePeak(engine.x,engine.y,590,40,engine.sample),first);
});
test('SAM completion preserves last acquired position',()=>{
  for(const mode of ['b','c','through']){const engine=new SamEngine();engine.configure({mode});engine.start();engine.tick(20);assert.equal(engine.coordinate.x,1);assert.equal(engine.coordinate.y,mode==='b'?engine.y:1);}
});
test('XPS zero-depth analysis precedes removal and next depth record',()=>{
  const engine=new XpsEngine();engine.configure({mode:'depth'});engine.start();const period=engine.duration/engine.total;
  engine.tick(period*.5);assert.equal(engine.phase,'analyze');assert.equal(engine.surfaceDepth,0);assert.equal(signalState(engine).etch,false);
  engine.tick(period*.75);assert.equal(engine.index,1);assert.equal(engine.rows[0].axis,0);assert.equal(engine.phase,'sputter');assert.ok(engine.surfaceDepth>0);assert.equal(engine.depth,0);assert.equal(signalState(engine).input,false);
  engine.tick(period*.5);assert.equal(engine.phase,'analyze');assert.equal(engine.index,1);assert.equal(engine.surfaceDepth,.375);
  engine.tick(period*.3);assert.equal(engine.index,2);assert.equal(engine.rows[1].axis,.375);engine.tick(20);assert.equal(engine.surfaceDepth,30);
});
test('ToF input pulse switches off before secondary-ion flight',()=>{
  const engine=new SimsEngine();engine.start();engine.tick(.03);assert.equal(signalState(engine).input,true);assert.equal(signalState(engine).output,false);
  engine.tick(.15);assert.equal(signalState(engine).input,false);assert.equal(signalState(engine).output,true);const first=signalState(engine).flightProgress;
  engine.tick(.12);assert.ok(signalState(engine).flightProgress>first);engine.tick(.25);assert.equal(signalState(engine).output,false);
});
test('XPS and M-SIMS are continuous inputs, not ToF pulses',()=>{
  const magnetic=new SimsEngine(),xps=new XpsEngine();magnetic.setTechnology('magnetic');
  for(const engine of [magnetic,xps]){engine.start();for(const delta of [.03,.15,.12,.25]){engine.tick(delta);assert.equal(signalState(engine).input,true);assert.equal(signalState(engine).output,true);assert.equal(signalState(engine).etch,false);}}
});
test('spectroscopy has no active signals idle, paused or complete',()=>{
  for(const engine of [new SimsEngine(),new XpsEngine()])for(const status of ['idle','paused','complete']){engine.status=status;const state=signalState(engine);assert.equal(state.input,false);assert.equal(state.output,false);assert.equal(state.etch,false);}
});
test('ToF removal and analysis are mutually exclusive',()=>{
  const engine=new SimsEngine();engine.configure({mode:'depth'});engine.start();engine.tick(.16);assert.equal(signalState(engine).etch,true);assert.equal(signalState(engine).input,false);assert.equal(signalState(engine).output,false);engine.tick(.07);assert.equal(signalState(engine).etch,false);assert.equal(signalState(engine).input,true);
});
test('FIB image is an acquired snapshot, not live during later milling',()=>{
  const engine=new FibSimulation();engine.startMilling();engine.tick(3);engine.startImaging();engine.tick(6);const image=engine.image.slice(),depth=engine.imageDepth;engine.startMilling();engine.tick(3);assert.deepEqual(engine.image,image);assert.equal(engine.imageDepth,depth);assert.ok(engine.milling>depth);const before=engine.milling;for(const delta of [-1,NaN,Infinity])engine.tick(delta);assert.equal(engine.milling,before);
});
test('scene wiring gates live signals and SAM through path is one-way',()=>{
  const source=directory=>readFileSync(new URL('../'+directory+'-source/src/scene.js',import.meta.url),'utf8');
  assert.match(source('tem'),/rays.visible=sim.status==='exposing'/);assert.match(source('xrd'),/incoming.visible=outgoing.visible=sim.status==='scanning'/);assert.match(source('sem'),/visible=engine.status==='scanning'/);assert.match(source('sam'),/returned.visible=visible&&!through/);assert.match(source('sam'),/representativeReflection\(x,y,engine.sample\)/);assert.match(source('spectroscopy'),/signalState\(engine\)/);assert.match(source('apt'),/sequence.flightProgress/);
});
