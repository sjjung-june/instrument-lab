import test from 'node:test';
import assert from 'node:assert/strict';
import {ScanEngine} from '../src/simulation.js';
import {AptEngine} from '../apt-source/src/engine.js';
import {FibSimulation} from '../fib-source/src/simulation.js';
import {TemSimulation} from '../tem-source/src/simulation.js';
import {XrdSimulation} from '../xrd-source/src/simulation.js';
import {SemEngine} from '../sem-source/src/simulation.js';
import {SamEngine} from '../sam-source/src/simulation.js';
import {XpsEngine} from '../spectroscopy-source/src/xps.js';
import {SimsEngine} from '../spectroscopy-source/src/sims.js';
import {InstrumentEngine} from '../multimodal-source/src/engine.js';
import {FAULTS,compatibleFault} from '../src/shared/fault-catalog.js';
import {PART_LESSONS,SIGNAL_CHAINS,partLesson} from '../src/shared/part-knowledge.js';
import {referenceLearningData,readLearningData} from '../src/shared/learning-data.js';
import {applyFault,comparisonCSV,comparisonMetrics} from '../src/shared/fault-models.js';
import {reconstruct} from '../multimodal-source/src/physics.js';
import {CONFIG} from '../multimodal-source/src/config.js';

const factories={afm:()=>new ScanEngine(),apt:()=>new AptEngine(),fib:()=>new FibSimulation(),tem:()=>new TemSimulation(),xrd:()=>new XrdSimulation(),sem:()=>new SemEngine(),sam:()=>new SamEngine(),xps:()=>new XpsEngine(),sims:()=>new SimsEngine(),...Object.fromEntries(['xrm','nanoindenter','raman','ftir','afmir'].map(kind=>[kind,()=>new InstrumentEngine(kind)]))};
for(const [kind,factory] of Object.entries(factories)){
  test(kind+' has detached reference data, detailed lessons and two reversible faults',()=>{
    const engine=factory(),before=structuredClone(engine),data=referenceLearningData(kind,engine);assert.ok(data,kind);assert.deepEqual(structuredClone(engine),before);
    assert.ok(SIGNAL_CHAINS[kind]);assert.equal(FAULTS[kind].length,2);assert.ok(Object.keys(PART_LESSONS[kind]).length>=3);
    for(const [id,lesson] of Object.entries(PART_LESSONS[kind])){for(const field of ['input','output','mechanism','signature','checks'])assert.ok(lesson[field].length>5,id+field);}
    for(const fault of FAULTS[kind]){
      if(!compatibleFault(fault,data))continue;
      const original=structuredClone(data),zero=applyFault(data,fault,0);assert.deepEqual(zero.shape==='grid'?zero.values:zero.points,data.shape==='grid'?data.values:data.points);
      const changed=applyFault(data,fault,1);assert.deepEqual(data,original);assert.ok(comparisonMetrics(data,changed).meanAbsoluteDifference>0||comparisonMetrics(data,changed).meanAxisDifference>0,fault.id);
      assert.equal(comparisonMetrics(data,applyFault(data,null)).meanAbsoluteDifference,0);
      const csv=comparisonCSV(data,changed);assert.ok(csv.includes('"training_only":true'));assert.ok(csv.includes('"original_acquisition_unchanged":true'));assert.ok(csv.includes('reference_demo'));
      assert.deepEqual(applyFault(data,fault,1),changed);
    }
  });
  test(kind+' idle engine never fabricates acquired data',()=>assert.equal(readLearningData(kind,factory()),null));
}
test('partial maps preserve unacquired pixels for every grid transformation',()=>{
  const data={kind:'afm',mode:'scan',shape:'grid',width:8,height:4,values:Float64Array.from({length:32},(_,index)=>index<13?index:NaN)};
  for(const kind of ['afm','fib','sem','sam','tem'])for(const fault of FAULTS[kind]){const changed=applyFault(data,fault,1);assert.equal(changed.values.length,32);for(let index=13;index<32;index++)assert.ok(Number.isNaN(changed.values[index]),fault.id);}
});
test('axis faults are rejected for incompatible modes, not applied to depth',()=>{
  const xps=new XpsEngine();xps.configure({mode:'depth'});const data=referenceLearningData('xps',xps);assert.equal(compatibleFault(FAULTS.xps[0],data),false);assert.throws(()=>applyFault(data,FAULTS.xps[0]),RangeError);
  const sims=new SimsEngine();sims.setTechnology('magnetic');const magnetic=referenceLearningData('sims',sims);assert.equal(magnetic.mode,'depth');assert.equal(compatibleFault(FAULTS.sims[0],magnetic),false);
  assert.match(partLesson('sims',{id:'analyzer'},sims).input,/M-SIMS/);
});
test('AFM-IR crosstalk uses acquired height channel in map mode',()=>{
  const engine=new InstrumentEngine('afmir');engine.configure({mode:'map'});const data=referenceLearningData('afmir',engine),changed=applyFault(data,FAULTS.afmir[1],1);assert.ok(comparisonMetrics(data,changed).meanAbsoluteDifference>0);assert.deepEqual(data.heights,changed.heights);
});
test('XRM faults rebuild from changed projections rather than painting rings',()=>{
  const data=referenceLearningData('xrm',new InstrumentEngine('xrm'));
  for(const fault of FAULTS.xrm){const changed=applyFault(data,fault,1);assert.deepEqual(changed.values,reconstruct(changed.projections));assert.notDeepEqual(changed.projections,data.projections);}
});
test('APT dropout conserves histogram counts of remaining events',()=>{
  const data=referenceLearningData('apt',new AptEngine()),changed=applyFault(data,FAULTS.apt[1],1);
  assert.ok(changed.events.length<data.events.length);assert.equal(changed.points.reduce((total,point)=>total+point.value,0),changed.events.length);
});
test('Nanoindenter drift changes depth with time, force-zero changes load only',()=>{
  const data=referenceLearningData('nanoindenter',new InstrumentEngine('nanoindenter')),drift=applyFault(data,FAULTS.nanoindenter[0],1),force=applyFault(data,FAULTS.nanoindenter[1],1);
  assert.deepEqual(drift.points.map(point=>point.value),data.points.map(point=>point.value));assert.deepEqual(force.points.map(point=>point.axis),data.points.map(point=>point.axis));assert.ok(force.points[0].value>0);
});
test('FTIR incomplete sample has no absorbance comparison and background faults are signed',()=>{
  const engine=new InstrumentEngine('ftir');engine.start();engine.tick(.1);assert.equal(readLearningData('ftir',engine),null);
  const data=referenceLearningData('ftir',engine),changed=applyFault(data,FAULTS.ftir[0],1),differences=changed.points.map((point,index)=>point.value-data.points[index].value);assert.ok(Math.min(...differences)<0);assert.ok(Math.max(...differences)>0);
});
test('severity validation rejects NaN, infinity and out-of-range values',()=>{const data=referenceLearningData('afm',new ScanEngine());for(const severity of [NaN,Infinity,-1,1.1])assert.throws(()=>applyFault(data,FAULTS.afm[0],severity),RangeError);});
test('all multimodal modes create correctly shaped, independent reference examples',()=>{
  for(const [kind,config] of Object.entries(CONFIG))for(const mode of Object.keys(config.modes)){const engine=new InstrumentEngine(kind);engine.configure({mode});const before=structuredClone(engine),data=referenceLearningData(kind,engine);assert.ok(data,kind+mode);assert.deepEqual(structuredClone(engine),before);for(const fault of FAULTS[kind])if(compatibleFault(fault,data))assert.ok(applyFault(data,fault,.6));}
});
test('TEM modes including STEM and EELS preserve acquisition ranges',()=>{
  for(const mode of ['image','df','diffraction','stem','eels']){const engine=new TemSimulation();engine.configure({mode});engine.start();engine.tick(.4);const data=readLearningData('tem',engine);assert.ok(data,mode);for(const fault of FAULTS.tem){const changed=applyFault(data,fault,.5);if(data.shape==='grid')for(let index=0;index<data.values.length;index++)if(!Number.isFinite(data.values[index]))assert.ok(Number.isNaN(changed.values[index]));}}
});
test('XPS and both SIMS technologies retain channels and forbid invalid fault modes',()=>{
  for(const kind of ['xps','sims'])for(const technology of kind==='sims'?['tof','magnetic']:['xps'])for(const mode of kind==='xps'?['survey','highres','depth']:['spectrum','image','depth']){
    const engine=factories[kind]();if(kind==='sims')engine.setTechnology(technology);engine.configure({mode});const data=referenceLearningData(kind,engine);assert.ok(data,kind+mode);for(const fault of FAULTS[kind])if(compatibleFault(fault,data))assert.ok(applyFault(data,fault,1));
  }
});
test('SAM A/B/C/Through adapters preserve RF or acquired map dimensions',()=>{
  for(const mode of ['a','b','c','through']){const engine=new SamEngine();engine.configure({mode});const data=referenceLearningData('sam',engine);assert.ok(data);if(mode==='a')assert.equal(data.shape,'curve');else assert.equal(data.values.length,data.width*data.height);for(const fault of FAULTS.sam)assert.ok(applyFault(data,fault,.5));}
});
test('every detailed lesson and fault refers to a selectable component',async()=>{
  const modulePaths={afm:'../src/simulation.js',apt:'../apt-source/src/config.js',fib:'../fib-source/src/simulation.js',tem:'../tem-source/src/simulation.js',xrd:'../xrd-source/src/simulation.js',sem:'../sem-source/src/simulation.js',sam:'../sam-source/src/simulation.js'};
  const spectroscopy=await import('../spectroscopy-source/src/config.js');
  for(const kind of Object.keys(factories)){
    const parts=CONFIG[kind]?.parts??(spectroscopy.CONFIG[kind]?.parts)??(await import(modulePaths[kind])).PARTS,ids=new Set(parts.map(part=>part.id));
    for(const id of Object.keys(PART_LESSONS[kind]))assert.ok(ids.has(id),kind+' lesson '+id);
    for(const fault of FAULTS[kind])for(const id of fault.parts)assert.ok(ids.has(id),kind+' fault '+id);
  }
});
