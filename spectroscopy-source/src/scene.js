import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {copperPattern} from './sims.js';
import {signalState} from './signals.js';
import {applyHighlight} from '../../src/shared/highlight.js';

export function createScene(container,config,onSelect,kind){
  const world=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xffffff,0);container.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=22;
  function home(){camera.position.set(kind==='xps'?9:8,6,10);controls.target.set(0,kind==='xps'?2:2.5,0);controls.update();}home();
  world.add(new THREE.HemisphereLight(0xffffff,0x8aa2a8,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(4,9,7);world.add(light);const grid=new THREE.GridHelper(16,32,0xccdfdc,0xe3ecea);grid.position.y=-.1;world.add(grid);
  const groups={},meshes=[],original=new Map(),outlines=new Map(),glass=new Set(),patches=[];
  const offsets={source:[-1,1,0],sample:[0,-.2,1],lens:[.4,.5,0],analyzer:[1.1,.8,0],detector:[1.6,1,0],neutralizer:[1,0,1],sputter:[-1,0,1],vacuum:[0,0,-.4]};
  for(const part of config.parts){groups[part.id]=new THREE.Group();world.add(groups[part.id]);}
  function mesh(id,geometry,color,position,isGlass=false){const object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,metalness:.4,roughness:.4}));object.position.set(...position);object.userData.part=id;groups[id].add(object);meshes.push(object);original.set(object,object.material.color.clone());if(isGlass)glass.add(object);const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,35),new THREE.LineBasicMaterial({color:0x0a806f,depthTest:false}));outline.renderOrder=4;object.add(outline);outlines.set(object,outline);return object;}
  const box=(id,size,color,position,isGlass=false)=>mesh(id,new THREE.BoxGeometry(...size),color,position,isGlass);
  const cylinder=(id,top,bottom,height,color,position)=>mesh(id,new THREE.CylinderGeometry(top,bottom,height,32),color,position);
  function tube(id,start,end,radius,color){const midpoint=start.clone().add(end).multiplyScalar(.5),object=cylinder(id,radius,radius,start.distanceTo(end),color,[midpoint.x,midpoint.y,midpoint.z]);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize());return object;}
  const white=0xd8e5e7,metal=0x92aab2,dark=0x4b6470,teal=0x5d9e93;
  box('vacuum',[5.8,.25,4.4],white,[0,.1,0]);for(const x of [-2.65,2.65])for(const z of [-1.9,1.9])cylinder('vacuum',.07,.07,2.5,metal,[x,1.5,z]);box('vacuum',[1.1,.8,1.2],dark,[-3.3,.6,-1]);
  box('sample',[2.4,.28,2.2],0x5f7d91,[0,.65,0]);const oxide=box('sample',[2.4,1,2.2],0x86b5c0,[0,.9,0]);const surface=box('sample',[2.4,.016,2.2],0x96b5ae,[0,1,0]);
  if(kind==='sims')for(let row=0;row<20;row++)for(let col=0;col<20;col++)if(copperPattern(col/19,row/19))patches.push(box('sample',[.119,1,.109],0xc59462,[(col/19-.5)*2.28,1,(row/19-.5)*2.09]));
  const sourceStart=new THREE.Vector3(-2.5,3.8,-.3),sourceEnd=new THREE.Vector3(-.65,1.8,-.08);tube('source',sourceStart,sourceEnd,.35,dark);cylinder('source',.46,.46,.25,white,[-2.5,3.8,-.3]);
  const sputterStart=new THREE.Vector3(-2,2.5,1.4);tube('sputter',sputterStart,new THREE.Vector3(-.6,1.35,.5),.18,metal);tube('neutralizer',new THREE.Vector3(1.9,1.9,1.3),new THREE.Vector3(.8,1.1,.5),.14,teal);
  let path,magneticPath;const variants=[];
  if(kind==='xps'){
    tube('lens',new THREE.Vector3(.5,1.3,0),new THREE.Vector3(1.6,2.2,0),.23,metal);
    const hemisphere=mesh('analyzer',new THREE.SphereGeometry(.82,40,24,0,Math.PI*2,0,Math.PI/2),white,[2.3,2.4,0]);hemisphere.rotation.z=-Math.PI/2;
    const inner=mesh('analyzer',new THREE.TorusGeometry(.53,.1,12,48),teal,[2.3,2.4,0]);inner.rotation.y=Math.PI/2;
    tube('detector',new THREE.Vector3(2.9,2.4,0),new THREE.Vector3(3.4,2.4,0),.22,dark);
    path=[new THREE.Vector3(1.2,1.9,0),new THREE.Vector3(1.8,2.4,0),new THREE.Vector3(2.2,2.85,0),new THREE.Vector3(2.65,2.8,0),new THREE.Vector3(3.25,2.4,0)];
  }else{
    tube('lens',new THREE.Vector3(.4,1.3,0),new THREE.Vector3(1.3,2.25,0),.22,metal);
    const tofStart=meshes.length;cylinder('analyzer',.29,.29,2.8,white,[1.4,3.8,0]);for(const y of [2.5,3.1,3.8,4.5,5.1])cylinder('analyzer',.34,.34,.09,teal,[1.4,y,0]);cylinder('detector',.43,.43,.25,dark,[1.4,5.4,0]);for(const object of meshes.slice(tofStart))variants.push({object,technology:'tof'});
    path=[new THREE.Vector3(.8,1.8,0),new THREE.Vector3(1.4,2.4,0),new THREE.Vector3(1.4,3.8,0),new THREE.Vector3(1.4,5.25,0)];
    magneticPath=[new THREE.Vector3(.8,1.8,0),new THREE.Vector3(1.3,2.5,0),new THREE.Vector3(1.7,2.9,0),new THREE.Vector3(2.4,3.05,0),new THREE.Vector3(3,2.6,0),new THREE.Vector3(3.3,2,0),new THREE.Vector3(3.65,1.8,0)];
    const magneticStart=meshes.length;
    mesh('analyzer',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(magneticPath.slice(1,4)),32,.2,12,false),teal,[0,0,0]);
    for(const side of [-.38,.38])box('analyzer',[1.5,1.3,.22],0x9f7c9d,[2.65,2.55,side]);
    tube('analyzer',magneticPath[3],magneticPath[4],.19,white);tube('analyzer',magneticPath[4],magneticPath[5],.19,white);
    box('analyzer',[.12,.55,.65],dark,[1.1,2.25,0]);tube('detector',magneticPath[5],magneticPath[6],.25,dark);
    for(const object of meshes.slice(magneticStart))variants.push({object,technology:'magnetic'});
  }
  function beam(color,radius){const object=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,12),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.9}));object.renderOrder=6;world.add(object);return object;}
  function place(object,start,end){const direction=end.clone().sub(start);object.position.copy(start).add(end).multiplyScalar(.5);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());object.scale.y=direction.length();}
  const incident=beam(kind==='xps'?0xe9b238:0x45a6d4,.037),etch=beam(0xf38c4f,.035),compensator=beam(0x6dbf97,.022),collection=Array.from({length:Math.max(path.length,magneticPath?.length||0)},()=>beam(0xa36cce,.029));
  const pulse=new THREE.Mesh(new THREE.SphereGeometry(.07,16,12),new THREE.MeshBasicMaterial({color:0xf5dcff,depthTest:false}));pulse.renderOrder=8;world.add(pulse);
  let selected='sample',focused=true,related=[],exploded=false,spread=0;
  function highlight(){for(const object of meshes)applyHighlight(object,original.get(object),outlines.get(object),{active:object.userData.part===selected,related:related.includes(object.userData.part),focused,baseOpacity:glass.has(object)?.12:1});}highlight();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',event=>{down=[event.clientX,event.clientY];});renderer.domElement.addEventListener('pointerup',event=>{if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes.filter(object=>object.visible&&object.parent.visible),false)[0];if(hit)onSelect(hit.object.userData.part);});
  new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(container);
  function render(engine,delta,time){
    const magnetic=engine.technology==='magnetic',activePath=magnetic?magneticPath:path;for(const variant of variants)variant.object.visible=variant.technology===engine.technology;groups.sputter.visible=!magnetic;
    spread=THREE.MathUtils.damp(spread,exploded?1:0,6,delta);for(const [id,group] of Object.entries(groups))group.position.set(...offsets[id]).multiplyScalar(spread);
    const depth=engine.surfaceDepth??engine.depth;
    const oxideDepth=Math.max(0,depth-(kind==='sims'?8:0)),remaining=Math.max(0,engine.thickness-oxideDepth),oxideHeight=Math.max(.006,remaining*.025),substrateDrop=Math.max(0,oxideDepth-engine.thickness)*.003;
    oxide.scale.y=oxideHeight;oxide.position.y=.79+oxideHeight/2-substrateDrop;surface.position.y=.79+oxideHeight-substrateDrop;surface.visible=depth<2;
    for(const object of patches){object.scale.y=Math.max(.002,(8-depth)*.02);object.position.y=.79+oxideHeight+object.scale.y/2-substrateDrop;object.visible=depth<8;}
    const raster=engine.mode==='image',last=engine.rows.at(-1),coordinate=raster&&last?last:{x:kind==='sims'?.32:.5,y:.5},copperHeight=kind==='sims'&&copperPattern(coordinate.x,coordinate.y)?Math.max(0,8-depth)*.02:0;
    const point=new THREE.Vector3((coordinate.x-.5)*2.28,.81+oxideHeight-substrateDrop+copperHeight,(coordinate.y-.5)*2.09);
    const visible=!exploded&&spread<.02,signals=signalState(engine);incident.visible=visible&&signals.input;incident.material.opacity=.9;etch.visible=visible&&signals.etch;compensator.visible=visible&&(signals.input||signals.output)&&(kind==='sims'||engine.neutralizer);pulse.visible=visible&&signals.output;
    place(incident,sourceEnd,point);place(etch,sputterStart,point);place(compensator,new THREE.Vector3(.9,1.2,.55),point);
    let start=point;for(let index=0;index<collection.length;index++){collection[index].visible=visible&&signals.output&&index<activePath.length;if(index<activePath.length){place(collection[index],start,activePath[index]);start=activePath[index];}}
    const phase=signals.flightProgress,segment=Math.min(activePath.length-1,Math.floor(phase*activePath.length)),from=segment?activePath[segment-1]:point,to=activePath[segment];pulse.position.lerpVectors(from,to,(phase*activePath.length)%1);controls.update();renderer.render(world,camera);
  }
  return {render,home,select(id){selected=id;highlight();},related(ids){related=ids;highlight();},focus(value){focused=value;highlight();},explode(value){exploded=value;}};
}
