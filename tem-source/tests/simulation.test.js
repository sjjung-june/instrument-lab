import test from 'node:test';
import assert from 'node:assert/strict';
import {TemSimulation,transmission,imageIntensity,diffractionIntensity,PARTS,GUIDES} from '../src/simulation.js';
test('exposure completes and pause/resume retains progress',()=>{const sim=new TemSimulation();sim.start('image');sim.tick(1);sim.pause();const saved=sim.progress;sim.tick(3);assert.equal(sim.progress,saved);sim.start('image');sim.tick(3);assert.equal(sim.status,'complete');assert.equal(sim.progress,1);});
test('new mode captures current thickness and resets exposure',()=>{const sim=new TemSimulation();sim.start('image');sim.tick(2);sim.thickness=80;sim.start('diffraction');assert.equal(sim.mode,'diffraction');assert.equal(sim.progress,0);assert.equal(sim.exposureThickness,80);});
test('thicker specimen reduces conceptual transmitted intensity',()=>{assert.ok(transmission(100)<transmission(20));assert.ok(diffractionIntensity(.5,.5,100)<diffractionIntensity(.5,.5,20));});
test('images and diffraction remain bounded and distinct',()=>{assert.ok(diffractionIntensity(.5,.5,50)>diffractionIntensity(.55,.55,50));for(let row=0;row<20;row++)for(let col=0;col<20;col++)for(const fn of [imageIntensity,diffractionIntensity]){const value=fn(col/19,row/19,50);assert.ok(value>=0&&value<=1);}});
test('maintenance guides refer to existing parts',()=>{const ids=PARTS.map(part=>part.id);for(const guide of GUIDES)assert.ok(guide.parts.every(id=>ids.includes(id)));});
