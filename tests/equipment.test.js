import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EQUIPMENT} from '../src/equipment.js';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('nine equipment buttons follow alphabetical order in both registry and HTML',()=>{const names=EQUIPMENT.map(item=>item.name);assert.deepEqual(names,names.toSorted());assert.equal(names.length,9);const buttons=[...html.matchAll(/<button id="(select\w+)" type="button" aria-pressed="(?:true|false)" aria-controls="(\w+)Workspace">(\w+) /g)];assert.deepEqual(buttons.map(match=>match[3]),names);assert.deepEqual(buttons.map(match=>match[1]),EQUIPMENT.map(item=>item.button));});
test('every registered instrument has a workspace and lazy frame except default AFM',()=>{for(const {id} of EQUIPMENT){assert.ok(html.includes(`id="${id}Workspace"`));if(id!=='afm'){assert.ok(html.includes(`id="${id}Frame"`));assert.ok(new RegExp(`id="${id}Frame"[^>]+data-src="[^"]+"`).test(html));}}assert.match(html,/id="aptFrame"[^>]+data-src="\.\/apt\/index.html"/);});
