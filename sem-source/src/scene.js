import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {PARTS,heightAt,compositionAt} from './simulation.js';
import {applyHighlight} from '../../src/shared/highlight.js';

export function createScene(container,onSelect){
  const world=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0xffffff,0);
  container.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=23;
  function home(){camera.position.set(9,7,11);controls.target.set(0,3,0);controls.update();}
  home();
  world.add(new THREE.HemisphereLight(0xffffff,0x7c9299,3));
  const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(5,10,6);world.add(light);
  const grid=new THREE.GridHelper(14,28,0xc8dcda,0xe2ebea);grid.position.y=-.1;world.add(grid);
  const groups={},meshes=[],original=new Map(),outlines=new Map();
  const offsets={gun:[0,2,0],condenser:[-1.5,1.3,0],scan:[1.6,1,0],objective:[0,.8,0],sample:[0,-.3,1],se:[1.5,0,1],bse:[-1.3,.2,0],vacuum:[-.8,0,-1],control:[1.2,0,0]};
  for(const part of PARTS){groups[part.id]=new THREE.Group();world.add(groups[part.id]);}
  function mesh(id,geometry,color,position){
    const object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,metalness:.35,roughness:.4}));
    object.position.set(...position);object.userData.part=id;groups[id].add(object);meshes.push(object);original.set(object,object.material.color.clone());
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial({color:0x087a70,depthTest:false}));
    outline.renderOrder=4;outline.visible=false;object.add(outline);outlines.set(object,outline);return object;
  }
  const cylinder=(id,top,bottom,height,color,position)=>mesh(id,new THREE.CylinderGeometry(top,bottom,height,40),color,position);
  const box=(id,size,color,position)=>mesh(id,new THREE.BoxGeometry(...size),color,position);
  const white=0xd9e4e5,metal=0x91a9ae,dark=0x415c68,teal=0x67a69e;
  cylinder('gun',.5,.42,.95,dark,[0,6.2,0]);cylinder('gun',.56,.56,.18,white,[0,6.75,0]);
  cylinder('condenser',.46,.46,1.15,white,[0,5.1,0]);cylinder('condenser',.53,.53,.12,teal,[0,5.2,0]);
  cylinder('scan',.43,.43,.6,dark,[0,4.15,0]);
  for(const side of [-1,1])box('scan',[.15,.35,.5],teal,[side*.47,4.15,0]);
  cylinder('objective',.6,.55,.65,white,[0,3.46,0]);cylinder('objective',.5,.16,.62,metal,[0,2.88,0]);
  const ring=mesh('bse',new THREE.TorusGeometry(.49,.12,12,48),0xb2a0d1,[0,2.23,0]);ring.rotation.x=Math.PI/2;
  const detector=cylinder('se',.26,.26,.65,metal,[1.7,1.9,.2]);detector.rotation.z=-Math.PI/3;
  const face=cylinder('se',.29,.29,.12,0x9b80bd,[1.4,1.73,.2]);face.rotation.z=-Math.PI/3;
  cylinder('sample',1.25,1.4,.25,dark,[0,.65,0]);box('sample',[1.9,.2,1.9],teal,[0,.9,0]);
  const surfaceGeometry=new THREE.PlaneGeometry(1.8,1.8,64,64);surfaceGeometry.rotateX(-Math.PI/2);
  const positions=surfaceGeometry.attributes.position;
  const vertexColors=[];
  for(let index=0;index<positions.count;index++){
    const x=positions.getX(index)/1.8+.5,y=positions.getZ(index)/1.8+.5;
    positions.setY(index,heightAt(x,y));
    const value=compositionAt(x,y);vertexColors.push(value,value,value);
  }
  surfaceGeometry.setAttribute('color',new THREE.Float32BufferAttribute(vertexColors,3));surfaceGeometry.computeVertexNormals();
  const surface=mesh('sample',surfaceGeometry,0xffffff,[0,1.02,0]);surface.material.vertexColors=true;surface.material.metalness=.05;surface.material.roughness=.8;outlines.get(surface).visible=false;
  box('vacuum',[4.5,.25,3.7],white,[0,.2,0]);
  for(const x of [-2,2])for(const z of [-1.6,1.6])cylinder('vacuum',.08,.08,2.3,metal,[x,1.45,z]);
  box('vacuum',[1,.8,1.2],dark,[-2.7,.55,-.7]);
  const pipe=cylinder('vacuum',.15,.15,.8,metal,[-2.1,.7,-.7]);pipe.rotation.z=Math.PI/2;
  box('control',[1.1,1.4,1.4],dark,[2.9,.85,-.6]);box('control',[.87,.75,.04],0x8dbdb8,[2.9,1.05,.12]);
  function beam(color,radius){const object=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,12),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.9}));object.renderOrder=6;world.add(object);return object;}
  function placeBeam(object,start,end){const direction=end.clone().sub(start);object.position.copy(start).add(end).multiplyScalar(.5);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());object.scale.y=direction.length();}
  const incident=beam(0x239ed1,.035),probe=beam(0x239ed1,.028),emitted=beam(0x9b60ce,.036),signal=beam(0x9b60ce,.026);
  const spot=new THREE.Mesh(new THREE.SphereGeometry(.065,16,12),new THREE.MeshBasicMaterial({color:0xffb34e,depthTest:false}));spot.renderOrder=7;world.add(spot);
  const pulse=new THREE.Mesh(new THREE.SphereGeometry(.06,12,8),new THREE.MeshBasicMaterial({color:0xe9d0ff,depthTest:false}));pulse.renderOrder=8;world.add(pulse);
  let selected='gun',related=[],focused=true,exploded=false,spread=0;
  function highlight(){for(const object of meshes)applyHighlight(object,original.get(object),object===surface?null:outlines.get(object),{active:object.userData.part===selected,related:related.includes(object.userData.part),focused});}
  highlight();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',event=>{down=[event.clientX,event.clientY];});
  renderer.domElement.addEventListener('pointerup',event=>{
    if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5)return;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(meshes,false)[0];if(hit)onSelect(hit.object.userData.part);
  });
  const observer=new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();});observer.observe(container);
  function render(engine,delta,time){
    spread=THREE.MathUtils.damp(spread,exploded?1:0,6,delta);
    for(const [id,group] of Object.entries(groups))group.position.set(...offsets[id]).multiplyScalar(spread);
    const coordinate=engine.coordinate(),point=new THREE.Vector3((coordinate.x-.5)*1.8,1.04+heightAt(coordinate.x,coordinate.y),(coordinate.y-.5)*1.8);
    const destination=engine.mode==='se'?new THREE.Vector3(1.4,1.73,.2):new THREE.Vector3(.49,2.23,0);
    const visible=engine.index>0&&!exploded&&spread<.02;
    for(const object of [incident,probe,emitted,signal,spot,pulse])object.visible=visible;
    placeBeam(incident,new THREE.Vector3(0,6,0),new THREE.Vector3(0,3.95,0));placeBeam(probe,new THREE.Vector3(0,3.95,0),point);
    placeBeam(emitted,point,destination);placeBeam(signal,destination,new THREE.Vector3(2.9,1.05,.2));
    spot.position.copy(point);pulse.position.lerpVectors(point,destination,engine.status==='scanning'?(time*.0015)%1:.5);
    controls.update();renderer.render(world,camera);
  }
  return {render,home,select(id){selected=id;highlight();},related(ids){related=ids;highlight();},focus(value){focused=value;highlight();},explode(value){exploded=value;}};
}
