import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG} from '../src/config.js';
import {XpsEngine} from '../src/xps.js';
test('both instruments have selectable parts for every maintenance guide',()=>{for(const config of Object.values(CONFIG)){const ids=config.parts.map(part=>part.id);assert.equal(new Set(ids).size,8);for(const guide of config.guides){assert.equal(guide.steps.length,3);for(const id of guide.parts)assert.ok(ids.includes(id));}}});
test('CSV metadata uses escaped quoted JSON and rejects invalid elapsed time',()=>{const engine=new XpsEngine();engine.start();engine.tick(-1);engine.tick(NaN);assert.equal(engine.index,0);engine.tick(.1);const line=engine.csv().split('\n')[1],encoded=line.slice(line.indexOf(',"{')+1);assert.ok(encoded.startsWith('"{')&&encoded.endsWith('}"'));const parsed=JSON.parse(encoded.slice(1,-1).replaceAll('""','"'));assert.equal(parsed.photon_eV,1486.6);});
