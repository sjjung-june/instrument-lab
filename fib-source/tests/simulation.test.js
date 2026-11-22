import test from 'node:test';
import assert from 'node:assert/strict';
import {FibSimulation,PARTS,GUIDES,trenchMask,imageValue} from '../src/simulation.js';
test('milling progresses and pause preserves depth',()=>{const sim=new FibSimulation();sim.startMilling();sim.tick(3);const depth=sim.depth;assert.ok(depth>0);sim.pause();sim.tick(10);assert.equal(sim.depth,depth);});
test('imaging captures the current milled state progressively',()=>{const sim=new FibSimulation(8);sim.startMilling();sim.tick(9);sim.startImaging();sim.tick(3);assert.equal([...sim.image].filter(Number.isFinite).length,32);assert.equal(sim.imageDepth,.5);sim.tick(3);assert.equal(sim.mode,'imaged');assert.ok(sim.image.every(Number.isFinite));});
test('trench appears within the selected area and is distinct after milling',()=>{assert.equal(trenchMask(.5,.5),1);assert.equal(trenchMask(.05,.05),0);assert.ok(imageValue(.5,.5,1)<imageValue(.5,.5,0));});
test('guide references selectable components',()=>{const ids=PARTS.map(part=>part.id);for(const guide of GUIDES)assert.ok(guide.parts.every(id=>ids.includes(id)));});
test('reset clears acquired data and progress',()=>{const sim=new FibSimulation(8);sim.startMilling();sim.tick(5);sim.startImaging();sim.tick(2);sim.reset();assert.equal(sim.mode,'idle');assert.equal(sim.milling,0);assert.ok(sim.image.every(Number.isNaN));});
