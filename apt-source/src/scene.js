import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ELEMENTS} from './engine.js';

function viewport(container,background){
  const world=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.05,100),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(background,1);container.append(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=22;
  new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(container);
  return {world,camera,renderer,controls};
}
export function createInstrument(container,parts,onSelect){
  const {world,camera,renderer,controls}=viewport(container,0xf1f7f7),groups={},meshes=[];
  for(const part of parts){groups[part.id]=new THREE.Group();world.add(groups[part.id]);}
  function home(){camera.position.set(8,5.5,10);controls.target.set(.3,1.3,0);controls.update();}home();
  world.add(new THREE.HemisphereLight(0xffffff,0x80999b,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,8,5);world.add(light);world.add(new THREE.GridHelper(12,24,0xc7dbd8,0xe1eae8));
  function mesh(id,geometry,color,position,glass=false){
    const object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,metalness:.35,roughness:.35}));object.position.set(...position);object.userData={part:id,color:new THREE.Color(color),glass};groups[id].add(object);meshes.push(object);
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,35),new THREE.LineBasicMaterial({color:0x0c8a78,depthTest:false}));outline.renderOrder=5;object.add(outline);object.userData.outline=outline;return object;
  }
  const box=(id,size,color,position)=>mesh(id,new THREE.BoxGeometry(...size),color,position);
  function cylinder(id,radius,length,color,position){const object=mesh(id,new THREE.CylinderGeometry(radius,radius,length,40),color,position);object.rotation.z=-Math.PI/2;return object;}
  box('vacuum',[8,.2,3.8],0xd5e3e5,[.3,-.05,0]);box('vacuum',[1,.7,.9],0x6c8691,[-3,.4,-1]);
  box('cryostat',[1.2,.4,1.2],0x7099ab,[-2,.4,0]);cylinder('cryostat',.35,1,0x96bcc9,[-2,1,0]);
  const needle=mesh('tip',new THREE.CylinderGeometry(.025,.24,1.4,40),0xc89c6c,[-2,1.5,0]);needle.rotation.z=-Math.PI/2;
  const apex=mesh('tip',new THREE.SphereGeometry(.08,20,12),0xf4bd78,[-1.3,1.5,0]);
  const electrode=mesh('electrode',new THREE.TorusGeometry(.47,.14,16,48),0x71a79c,[-.5,1.5,0]);electrode.rotation.y=Math.PI/2;
  const flight=cylinder('flight',.85,3.7,0xb3ced3,[1.5,1.5,0]);flight.userData.glass=true;
  cylinder('detector',1.05,.2,0x9278b5,[3.5,1.5,0]);cylinder('detector',1.16,.08,0x5b7280,[3.67,1.5,0]);
  const laser=cylinder('laser',.22,1,0x667f8e,[-2.7,3,-.8]);laser.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(1,-1.5,.8).normalize());
  box('pulser',[1,.6,.7],0x7e8da7,[-2.5,.65,1.1]);box('pulser',[.3,.3,.3],0x5e7a93,[-2.2,1.2,.7]);
  function beam(color,radius){const object=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,12),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthTest:false}));object.renderOrder=7;world.add(object);return object;}
  function place(object,start,end){const direction=end.clone().sub(start);object.position.copy(start).add(end).multiplyScalar(.5);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());object.scale.y=direction.length();}
  const laserBeam=beam(0xe3ac39,.035),voltageBeam=beam(0xef8251,.027),ionBeams=Array.from({length:6},()=>beam(0x9a73c6,.014));
  const ions=Array.from({length:6},()=>{const object=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshBasicMaterial({color:0xb17ddd,depthTest:false}));object.renderOrder=8;world.add(object);return object;});
  let selected='tip',focused=true,related=[],exploded=false,spread=0;
  const offsets={tip:[-1,0,0],electrode:[0,1,0],laser:[-1,1,-.5],pulser:[-1,0,1],flight:[0,1,0],detector:[1,0,0],cryostat:[0,-.1,1],vacuum:[0,-.2,-.4]};
  function highlight(){for(const object of meshes){const active=object.userData.part===selected,near=related.includes(object.userData.part),dim=focused&&!active&&!near;object.material.color.copy(object.userData.color);object.material.transparent=dim||object.userData.glass;object.material.opacity=dim?.15:object.userData.glass?.18:1;object.material.depthWrite=!object.material.transparent;object.material.emissive.set(active&&focused?0x127d6b:near?0xa67122:0);object.material.emissiveIntensity=.25;const outline=object.userData.outline;outline.visible=(active&&focused)||near;outline.material.color.set(active?0x0c8a78:0xc88b2e);}}highlight();
  const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();let down;
  renderer.domElement.addEventListener('pointerdown',event=>{down=[event.clientX,event.clientY];});
  renderer.domElement.addEventListener('pointerup',event=>{if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes,false)[0];if(hit)onSelect(hit.object.userData.part);});
  function render(engine,delta,time){
    spread=THREE.MathUtils.damp(spread,exploded?1:0,6,delta);for(const [id,group] of Object.entries(groups))group.position.set(...offsets[id]).multiplyScalar(spread);
    needle.scale.y=1-engine.progress*.2;needle.position.x=-2-engine.progress*.14;apex.position.x=-1.3-engine.progress*.28;
    const origin=apex.position.clone(),visible=engine.index>0&&!exploded&&spread<.02;
    laserBeam.visible=visible&&engine.mode==='laser';voltageBeam.visible=visible&&engine.mode==='voltage';place(laserBeam,new THREE.Vector3(-2.5,2.7,-.65),origin);place(voltageBeam,new THREE.Vector3(-2.2,1.2,.7),origin);
    const running=engine.status==='scanning';laserBeam.material.opacity=running?(Math.sin(time*.012)>0?.95:.2):.65;
    for(let index=0;index<ions.length;index++){const row=engine.rows[Math.max(0,engine.index-1-index*7)],destination=new THREE.Vector3(3.38,1.5+(row?.hitX||0)*.85,(row?.hitY||0)*.85);ionBeams[index].visible=visible;ions[index].visible=visible;place(ionBeams[index],origin,destination);ions[index].position.lerpVectors(origin,destination,running?((time*.0005+index/ions.length)%1):.3+index*.1);ions[index].material.color.set(ELEMENTS[row?.element||'Si'].color);}
    controls.update();renderer.render(world,camera);
  }
  return {render,home,select(id){selected=id;highlight();},related(ids){related=ids;highlight();},focus(value){focused=value;highlight();},explode(value){exploded=value;}};
}
export function createReconstruction(container){
  const {world,camera,renderer,controls}=viewport(container,0x142630);camera.position.set(4,2,5);controls.target.set(0,0,0);controls.update();
  const positions=new Float32Array(4096*3),colors=new Float32Array(4096*3),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setDrawRange(0,0);
  const cloud=new THREE.Points(geometry,new THREE.PointsMaterial({size:.045,vertexColors:true}));cloud.frustumCulled=false;world.add(cloud);
  const boundary=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.8,.8,3,32)),new THREE.LineBasicMaterial({color:0x3c5965,transparent:true,opacity:.5}));world.add(boundary);
  let previousRows,previousIndex=-1,previousFilter;
  function render(engine,filter){if(engine.rows!==previousRows||engine.index!==previousIndex||filter!==previousFilter){let count=0;for(const row of engine.rows){if(filter!=='all'&&row.element!==filter)continue;positions.set([row.x*.1,1.5-row.z*.1,row.y*.1],count*3);const color=new THREE.Color(ELEMENTS[row.element].color);colors.set([color.r,color.g,color.b],count*3);count++;}geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;geometry.setDrawRange(0,count);previousRows=engine.rows;previousIndex=engine.index;previousFilter=filter;}controls.update();renderer.render(world,camera);}
  return {render,home(){camera.position.set(4,2,5);controls.target.set(0,0,0);controls.update();}};
}
