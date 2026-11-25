import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {applyHighlight} from '../../src/shared/highlight.js';
import {phantom,projectionAt,domainAt,heightAt,indentationAt,ringdown} from './physics.js';

export function createScene(container,config,onSelect,kind){
  const world=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.05,100),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xf1f7f7,1);container.append(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=24;
  function home(){camera.position.set(kind==='ftir'?7:8,6,9);controls.target.set(0,1.5,0);controls.update();}home();
  world.add(new THREE.HemisphereLight(0xffffff,0x829aa3,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,8,5);world.add(light);world.add(new THREE.GridHelper(14,28,0xc3d7d5,0xe2eceb));
  const groups={},objects=[],signals=[];for(const part of config.parts){groups[part.id]=new THREE.Group();world.add(groups[part.id]);}
  function mesh(id,geometry,color,position){
    const object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,metalness:.3,roughness:.4}));object.position.set(...position);object.userData={part:id,base:object.material.color.clone()};groups[id].add(object);objects.push(object);
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,32),new THREE.LineBasicMaterial({color:0x138b78,depthTest:false}));outline.renderOrder=5;object.add(outline);object.userData.outline=outline;return object;
  }
  const box=(id,size,color,position)=>mesh(id,new THREE.BoxGeometry(...size),color,position);
  const cylinder=(id,radius,height,color,position)=>mesh(id,new THREE.CylinderGeometry(radius,radius,height,32),color,position);
  const vector=position=>new THREE.Vector3(...position);
  function link(color,radius=.035){const object=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,12),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95,depthTest:false}));object.renderOrder=7;world.add(object);signals.push(object);return object;}
  function connect(object,start,end,visible=true){const from=vector(start),to=vector(end),direction=to.clone().sub(from);object.visible=visible;object.position.copy(from).add(to).multiplyScalar(.5);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());object.scale.y=direction.length();}
  const incoming=link(0xe0aa37),outgoing=link(0x946acb),readIn=link(0xeb5e68,.024),readOut=link(0xeb5e68,.024),flow=link(0x946acb,.023);
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),new THREE.MeshBasicMaterial({color:0xc49bea,depthTest:false}));marker.renderOrder=8;world.add(marker);
  box('base',[7,.24,5],0xccdce0,[0,.12,0]);box('control',[.9,.8,.8],0x597786,[2.8,.65,-1.8]);
  let mirror,atrCrystal,atrContact,transmissionSample,tip,indent,voidObject;
  const strips=[],arms=[];
  function surface(){
    const geometry=new THREE.PlaneGeometry(2.4,2.4,32,32),positions=geometry.attributes.position,colors=[];
    for(let row=0;row<=32;row++)for(let col=0;col<=32;col++){const coordinateX=col/32,coordinateY=row/32,index=row*33+col;positions.setXYZ(index,(coordinateX-.5)*2.4,.93+(kind==='afmir'?heightAt(coordinateX,coordinateY)/100:0),(coordinateY-.5)*2.4);const color=new THREE.Color(0x739eae).lerp(new THREE.Color(0xc6a26f),domainAt(coordinateX,coordinateY));colors.push(color.r,color.g,color.b);}
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();const object=mesh('sample',geometry,0xffffff,[0,0,0]);object.material.vertexColors=true;object.material.side=THREE.DoubleSide;object.userData.outline.visible=false;
  }
  if(kind==='xrm'){
    const source=cylinder('source',.4,1.2,0x557c8c,[-3,1.5,0]);source.rotation.z=Math.PI/2;const optics=cylinder('optics',.24,.5,0x91b6bc,[-2,1.5,0]);optics.rotation.z=Math.PI/2;
    cylinder('stage',.65,.35,0x658e9d,[0,.55,0]);cylinder('stage',.25,.5,0xa3bbc2,[0,.95,0]);
    for(const item of phantom()){const object=cylinder('sample',item.radius*1.1,.8,item.mu<0?0x283b48:item.mu>1?0xd1a866:0x7a9daa,[item.y*1.1,1.5,item.x*1.1]);if(item.mu<0)voidObject=object;}
    box('detector',[.18,2.5,2.5],0x7383a6,[3,1.5,0]);box('detector',[.1,2.3,2.3],0x9cc3c7,[2.88,1.5,0]);
    for(let channel=0;channel<5;channel++)strips.push({beam:link(0x67b8dc,.018),z:-.85+channel*.425});
  }else if(kind==='nanoindenter'){
    for(const coordinateX of [-1.7,1.7])box('base',[.25,4,.3],0x8ca8b2,[coordinateX,2.3,-.7]);box('base',[3.8,.25,.6],0xa6bfc5,[0,4.3,-.7]);
    cylinder('source',.48,1.2,0x638e9c,[0,3.2,0]);box('optics',[.6,.55,.8],0x9d8ab1,[.65,2.25,0]);
    cylinder('probe',.1,.8,0xc5d6da,[0,1.9,0]);tip=mesh('probe',new THREE.ConeGeometry(.28,.5,3),0xd5c8af,[0,1.18,0]);tip.rotation.z=Math.PI;
    box('sample',[2.4,.3,2.4],0xb2c3c7,[0,.78,0]);box('stage',[2.8,.24,2.8],0x6b8e9c,[0,.5,0]);
    indent=mesh('sample',new THREE.CircleGeometry(.24,3),0x5a6c79,[0,.935,0]);indent.rotation.x=-Math.PI/2;
  }else if(kind==='ftir'){
    box('source',[.8,.75,.8],0x627d8d,[-3,1.8,0]);const splitter=box('splitter',[.08,.8,.9],0x8fc1c3,[-1,1.8,0]);splitter.rotation.y=Math.PI/4;
    box('fixed',[1,.9,.12],0xa8b9ce,[-1,1.8,-2]);mirror=box('moving',[.12,.9,1],0x91a8c4,[1.3,1.8,0]);box('moving',[1.5,.12,.5],0x8ba5ae,[1.3,1.2,0]);
    box('sample',[1.2,.2,1.1],0x617e91,[-1,1.4,2]);transmissionSample=box('sample',[.8,.8,.08],0xc7aa7a,[-1,1.8,2]);atrCrystal=box('sample',[.85,.25,.75],0x84c2c4,[-1,1.7,2]);atrContact=box('sample',[.7,.1,.5],0xc7aa7a,[-1,1.9,2]);
    box('detector',[.9,.8,.5],0x8c7ba8,[-1,1.8,3.3]);for(let arm=0;arm<4;arm++)arms.push(link(0xe0aa37,.025));
  }else{
    surface();box('stage',[2.7,.35,2.7],0x72939e,[0,.6,0]);
    if(kind==='raman'){
      const source=cylinder('source',.24,1.2,0x667f91,[-2,3.5,0]);source.rotation.z=Math.PI/2;
      cylinder('optics',.32,.75,0x7fa5ae,[0,2.5,0]);cylinder('optics',.22,.35,0xa9c8cc,[0,1.95,0]);box('filter',[.28,.6,.65],0x83bba5,[0,3.5,0]);
      box('detector',[1.5,.8,1.1],0x8c96b2,[2.2,3.5,0]);for(let grating=0;grating<8;grating++)box('detector',[.025,.5,.55],0xd1c9df,[1.65+grating*.07,3.5,0]);box('detector',[.12,.6,.7],0xb7cfdd,[2.85,3.5,0]);
    }else{
      box('piezo',[.55,.75,.6],0x6c9daf,[-1.2,1.8,0]);box('probe',[1.25,.055,.25],0xc6a66d,[-.6,1.3,0]);tip=mesh('probe',new THREE.ConeGeometry(.07,.3,12),0xd4b37c,[0,1.13,0]);tip.rotation.z=Math.PI;
      const source=cylinder('source',.22,1,0x738ca0,[-2,2.6,1]);source.rotation.z=-Math.PI/4;
      cylinder('reader',.19,.65,0x8b7a9e,[-2.2,3,-.6]);box('detector',[.5,.6,.5],0x7999ad,[1.8,3,0]);
    }
  }
  let selected='sample',focused=true,related=[],exploded=false,spread=0;
  const offsets=Object.fromEntries(config.parts.map((part,index)=>[part.id,[(index%3-1)*1.1,part.id==='base'?-.1:.4+Math.floor(index/3)*.3,(Math.floor(index/3)-1)*.8]]));
  function highlight(){for(const object of objects)applyHighlight(object,object.userData.base,object.userData.outline,{active:object.userData.part===selected,related:related.includes(object.userData.part),focused});}highlight();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',event=>{down=[event.clientX,event.clientY];});
  renderer.domElement.addEventListener('pointerup',event=>{if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(objects.filter(object=>object.visible),false)[0];if(hit)onSelect(hit.object.userData.part);});
  new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(container);
  function render(engine,delta){
    spread=THREE.MathUtils.damp(spread,exploded?1:0,6,delta);for(const [id,group] of Object.entries(groups)){group.position.set(...offsets[id]).multiplyScalar(spread);group.rotation.set(0,0,0);}
    const assembled=!exploded&&spread<.02,input=assembled&&engine.signals.input,output=assembled&&engine.signals.output;
    for(const object of signals)object.visible=false;marker.visible=false;
    if(kind==='xrm'){
      groups.sample.rotation.y=-engine.angle;groups.stage.rotation.y=-engine.angle;voidObject.visible=engine.sample==='void';
      connect(incoming,[-2.3,1.5,0],[-.9,1.5,0],input);connect(outgoing,[.9,1.5,0],[2.8,1.5,0],output);
      const projection=projectionAt(engine.angle,engine.sample,engine.parameter);for(const {beam,z} of strips){const channel=Math.round((z/1.1+1)*47/2);beam.material.opacity=.15+.8*projection[channel].transmission;connect(beam,[.9,1.5,z],[2.8,1.5,z],output);}
    }else if(kind==='nanoindenter'){
      const point=indentationAt(engine.elapsed/engine.duration,engine.parameter,engine.sample),approach=engine.elapsed/engine.duration<.08?.6*(1-engine.elapsed/engine.duration/.08):0,retract=engine.elapsed/engine.duration>.95?.6*(engine.elapsed/engine.duration-.95)/.05:0;
      groups.probe.position.y+=approach+retract-point.depth/point.maximum*.35;indent.visible=engine.elapsed/engine.duration>=.08;indent.scale.setScalar(Math.max(.02,Math.min(1,point.depth/point.maximum)));
      connect(incoming,[0,2.6,0],[0,1.7,0],input&&point.phase!=='approach'&&point.phase!=='retract');connect(outgoing,[.9,2.2,0],[2.8,.8,-1.8],output);
    }else if(kind==='ftir'){
      const displacement=engine.elapsed/engine.duration*.8;mirror.position.x=1.3+displacement;const split=[-1,1.8,0],moving=[mirror.position.x,1.8,0],fixed=[-1,1.8,-1.9];
      connect(incoming,[-2.6,1.8,0],split,input);connect(arms[0],split,moving,input);connect(arms[1],[moving[0],1.8,.04],[-1,1.8,.04],input);connect(arms[2],split,fixed,input);connect(arms[3],[-.96,1.8,-1.9],[-.96,1.8,0],input);
      const atr=engine.accessory==='atr';atrCrystal.visible=atr;atrContact.visible=atr&&engine.mode!=='background';transmissionSample.visible=!atr&&engine.mode!=='background';
      if(atr){connect(outgoing,split,[-1.35,1.65,1.75],output);connect(readIn,[-1.35,1.65,1.75],[-1,1.82,2],output);connect(readOut,[-1,1.82,2],[-.65,1.65,2.25],output);readIn.material.color.set(0xe0aa37);readOut.material.color.set(0xe0aa37);connect(flow,[-.65,1.65,2.25],[-1,1.8,3],output);}
      else{connect(outgoing,split,[-1,1.8,2],output);connect(flow,[-1,1.8,2],[-1,1.8,3],output);}
    }else{
      const {x:coordinateX,y:coordinateY}=engine.coordinate,shiftX=-(coordinateX-.5)*2.4,shiftZ=-(coordinateY-.5)*2.4;groups.sample.position.x+=shiftX;groups.sample.position.z+=shiftZ;groups.stage.position.x+=shiftX;groups.stage.position.z+=shiftZ;
      if(kind==='raman'){
        incoming.material.color.set(engine.sample==='532'?0x51bd83:0xca6575);connect(incoming,[-1.4,3.5,0],[0,3.5,0],input);connect(readIn,[0,3.5,0],[0,.96,0],input);readIn.material.color.copy(incoming.material.color);
        connect(outgoing,[.07,.96,0],[.07,3.5,0],output);connect(readOut,[0,3.5,0],[1.6,3.5,0],output);readOut.material.color.set(0x946acb);connect(flow,[2.85,3.5,0],[2.8,.8,-1.8],output);
      }else{
        const surface=.93+heightAt(coordinateX,coordinateY)/100,amplitude=engine.currentResponse,vibration=engine.phase==='ringdown'?ringdown((engine.cyclePhase-.25)/.6,amplitude)*.09:0,expansion=engine.phase==='expansion'?amplitude*.06:0;
        groups.probe.position.y+=surface-.98+vibration+expansion;groups.piezo.position.y+=surface-.98;
        const leverPoint=[0,1.3+groups.probe.position.y,0];connect(incoming,[-1.7,2.2,1],[0,surface,0],input);connect(readIn,[-2.2,2.7,-.6],leverPoint,assembled);connect(readOut,leverPoint,[1.8,3,0],assembled);connect(flow,[1.8,3,0],[2.8,.8,-1.8],output);
        marker.visible=assembled&&engine.phase==='expansion'&&engine.status==='scanning';marker.position.set(0,surface+.05,0);marker.scale.setScalar(.5+amplitude);
      }
    }
    controls.update();renderer.render(world,camera);
  }
  return {render,home,select(id){selected=id;highlight();},related(ids){related=ids;highlight();},focus(value){focused=value;highlight();},explode(value){exploded=value;}};
}
