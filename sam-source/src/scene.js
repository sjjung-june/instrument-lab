import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {PARTS,representativeReflection} from './simulation.js';
import {applyHighlight} from '../../src/shared/highlight.js';

export function createScene(container,onSelect){
  const world=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xffffff,0);container.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=23;
  function home(){camera.position.set(8,6,9);controls.target.set(0,2,0);controls.update();}home();
  world.add(new THREE.HemisphereLight(0xffffff,0x809da4,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(5,10,6);world.add(light);
  const grid=new THREE.GridHelper(14,28,0xc9ddda,0xe1ebe9);grid.position.y=-.1;world.add(grid);
  const groups={},meshes=[],original=new Map(),outlines=new Map(),glass=new Set(),dies=[];
  const offsets={scanner:[0,.8,0],probe:[0,1.3,0],tank:[0,0,0],stack:[0,.5,0],bond:[1.5,.2,0],base:[-1,.1,0],interposer:[0,0,1],receiver:[0,-.15,0],pulser:[-1,0,0],control:[1,0,0]};
  for(const part of PARTS){groups[part.id]=new THREE.Group();world.add(groups[part.id]);}
  function mesh(id,geometry,color,position,isGlass=false){
    const object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,metalness:.3,roughness:.4}));object.position.set(...position);object.userData.part=id;groups[id].add(object);meshes.push(object);original.set(object,object.material.color.clone());if(isGlass)glass.add(object);
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial({color:0x087e72,depthTest:false}));outline.renderOrder=4;object.add(outline);outlines.set(object,outline);return object;
  }
  const box=(id,size,color,position,isGlass=false)=>mesh(id,new THREE.BoxGeometry(...size),color,position,isGlass);
  const cylinder=(id,top,bottom,height,color,position)=>mesh(id,new THREE.CylinderGeometry(top,bottom,height,24),color,position);
  box('tank',[5.4,.18,4.2],0xa6bac0,[0,.05,0]);
  box('tank',[5,.1,3.8],0x73c5d4,[0,2.95,0],true);
  for(const x of [-2.5,2.5])box('tank',[.07,2.8,3.8],0x99cfdb,[x,1.5,0],true);
  for(const z of [-1.9,1.9])box('tank',[5,2.8,.07],0x99cfdb,[0,1.5,z],true);
  for(const x of [-2.3,2.3])box('scanner',[.18,4.3,.2],0x91a9ad,[x,2.2,-1.35]);
  box('scanner',[4.8,.22,.3],0xb3c4c7,[0,4.35,-1.35]);box('scanner',[.2,.18,2.9],0x8fa9ab,[0,4.2,0]);
  const trolley=box('scanner',[.55,.3,.5],0x529d94,[0,4.13,0]);
  cylinder('probe',.28,.28,.72,0x446974,[0,3.6,0]);cylinder('probe',.31,.31,.12,0xc3d6d8,[0,3.94,0]);cylinder('probe',.24,.13,.32,0x67a9b3,[0,3.08,0]);
  box('interposer',[2.8,.2,2.8],0x9c8fbd,[0,.82,0]);box('base',[2.25,.14,2.25],0x507b8b,[0,.99,0]);
  for(let layer=0;layer<8;layer++){
    const die=box('stack',[2.2,.105,2.2],layer%2?0x739aa7:0x87aab5,[0,2.1-(layer+.5)*.13,0]);dies.push({object:die,y:die.position.y,layer});
    for(const x of [-.8,-.27,.27,.8])for(const z of [-.8,-.27,.27,.8])cylinder('bond',.055,.055,.025,0xd4ad64,[x,2.1-(layer+1)*.13+.012,z]);
  }
  for(const x of [-.62,0,.62])for(const z of [-.62,0,.62])cylinder('stack',.022,.022,1.02,0xe0ba76,[x,1.58,z]);
  for(const x of [-1.5,1.5])box('tank',[.18,.45,2.7],0x98aaac,[x,.4,0]);
  cylinder('receiver',.38,.38,.27,0x8c7cb1,[0,.35,0]);cylinder('receiver',.33,.33,.1,0xcac1e2,[0,.53,0]);
  box('pulser',[.95,1,1.3],0x4d6570,[-3.3,.6,-.5]);box('pulser',[.75,.65,.04],0xe0e8e8,[-3.3,.7,.17]);
  box('control',[1.1,1.25,1.4],0x4d6570,[3.3,.75,-.5]);box('control',[.9,.65,.04],0x8ec3b9,[3.3,.9,.22]);
  function beam(color,radius){const object=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,12),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.9}));object.renderOrder=6;world.add(object);return object;}
  function placeBeam(object,start,end){const direction=end.clone().sub(start);object.position.copy(start).add(end).multiplyScalar(.5);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());object.scale.y=direction.length();}
  const sent=beam(0x229dca,.027),returned=beam(0x9761ca,.027),wire=beam(0x9761ca,.021);
  const pulse=new THREE.Mesh(new THREE.SphereGeometry(.07,16,12),new THREE.MeshBasicMaterial({color:0x45d7f0,depthTest:false}));pulse.renderOrder=7;world.add(pulse);
  const gate= new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.3),new THREE.MeshBasicMaterial({color:0x22ad8e,transparent:true,opacity:.19,side:THREE.DoubleSide,depthTest:false}));gate.rotation.x=-Math.PI/2;gate.renderOrder=5;world.add(gate);
  const defects=[];
  for(const data of [{x:.36,y:.45,depth:260,sx:.17,sy:.13,type:'delamination'},{x:.69,y:.66,depth:590,sx:.12,sy:.10,type:'void'}]){
    const object=new THREE.Mesh(new THREE.CircleGeometry(1,48),new THREE.MeshBasicMaterial({color:0xf07c65,transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false}));object.rotation.x=-Math.PI/2;object.scale.set(data.sx*2.2,data.sy*2.2,1);object.position.set((data.x-.5)*2.2,2.1-data.depth*.002,(data.y-.5)*2.2);object.renderOrder=8;world.add(object);defects.push({object,...data});
  }
  let selected='stack',related=[],focused=true,exploded=false,truth=false,spread=0;
  function highlight(){for(const object of meshes)applyHighlight(object,original.get(object),outlines.get(object),{active:object.userData.part===selected,related:related.includes(object.userData.part),focused,baseOpacity:glass.has(object)?.12:1});}
  highlight();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',event=>{down=[event.clientX,event.clientY];});
  renderer.domElement.addEventListener('pointerup',event=>{if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(meshes,false);const hit=hits.find(item=>!glass.has(item.object))||hits[0];if(hit)onSelect(hit.object.userData.part);});
  new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(container);
  function render(engine,delta,time){
    spread=THREE.MathUtils.damp(spread,exploded?1:0,6,delta);
    for(const [id,group] of Object.entries(groups))group.position.set(...offsets[id]).multiplyScalar(spread);
    for(const die of dies)die.object.position.y=die.y+(7-die.layer)*.09*spread;
    const {x,y}=engine.coordinate,px=(x-.5)*2.2,pz=(y-.5)*2.2;
    groups.probe.position.x+=px;groups.probe.position.z+=pz;trolley.position.x=px;trolley.position.z=pz;
    gate.position.y=2.1-engine.center*.002;gate.visible=engine.mode!=='through'&&!exploded&&spread<.02;
    const visible=engine.status==='scanning'&&!exploded&&spread<.02,through=engine.mode==='through';
    groups.receiver.position.x+=px;groups.receiver.position.z+=pz;
    const start=new THREE.Vector3(px,2.9,pz),target=new THREE.Vector3(px,through?.55:2.1-representativeReflection(x,y,engine.sample)*.002,pz),end=through?target:start.clone();
    for(const object of [sent,wire,pulse])object.visible=visible;returned.visible=visible&&!through;
    placeBeam(sent,start,target);placeBeam(returned,target,end);placeBeam(wire,through?end:start,new THREE.Vector3(3.3,.9,.25));
    const phase=engine.elapsed%1;wire.visible=visible&&phase>=.9;pulse.visible=visible&&phase<.9;const travel=Math.min(1,phase/.9);pulse.position.lerpVectors(through||travel<.5?start:target,through?target:travel<.5?target:end,through?travel:travel<.5?travel*2:(travel-.5)*2);
    for(const defect of defects)defect.object.visible=truth&&!exploded&&(engine.sample==='both'||engine.sample===defect.type);
    controls.update();renderer.render(world,camera);
  }
  return {render,home,select(id){selected=id;highlight();},related(ids){related=ids;highlight();},focus(value){focused=value;highlight();},explode(value){exploded=value;},truth(value){truth=value;}};
}
