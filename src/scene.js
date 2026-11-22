import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PARTS, stageOffset, surfaceHeight } from './simulation.js';

const palette={metal:0xc7cbd7,dark:0x49475d,light:0xe2e4eb,purple:0xa995cd,gold:0xd6b77f,teal:0x86b6bb};
export function createScene(container,onSelect){
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,100);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0xf5f5fa,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;container.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=4;controls.maxDistance=23;controls.maxPolarAngle=Math.PI*.89;
  const home=()=>{camera.position.set(9,7.5,11);controls.target.set(0,2.1,0);controls.update();};home();
  scene.add(new THREE.HemisphereLight(0xffffff,0x9190ae,2.5));
  const key=new THREE.DirectionalLight(0xfff8ef,4);key.position.set(4,9,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});key.shadow.bias=-.0005;scene.add(key);
  const rim=new THREE.DirectionalLight(0xd0c8ff,2);rim.position.set(-6,4,-5);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-.3;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(18,36,0xdedce9,0xe4e3ed);grid.position.y=-.295;grid.material.transparent=true;grid.material.opacity=.6;scene.add(grid);
  const model=new THREE.Group();scene.add(model);
  const parts={};const selectable=[];const originalColors=new Map();const offsets={base:[0,-.5,0],sample:[0,.7,1.2],approach:[0,.3,-1.6],head:[0,2,0],piezo:[0,1,0],probe:[0,.3,1.8],laser:[-1.4,1.4,0],detector:[1.5,1.2,0],controller:[2,0,0]};
  for(const part of PARTS){const group=new THREE.Group();group.userData.id=part.id;model.add(group);parts[part.id]=group;}
  function material(color,metalness=.35){return new THREE.MeshStandardMaterial({color,roughness:.35,metalness});}
  function mesh(part,geometry,color,position,rotation){const item=new THREE.Mesh(geometry,material(color));item.position.set(...position);if(rotation)item.rotation.set(...rotation);item.castShadow=true;item.receiveShadow=true;item.userData.part=part;parts[part].add(item);selectable.push(item);originalColors.set(item,item.material.color.clone());return item;}
  const box=(part,size,color,position,rotation)=>mesh(part,new THREE.BoxGeometry(...size),color,position,rotation);
  const cyl=(part,radius,height,color,position,rotation)=>mesh(part,new THREE.CylinderGeometry(radius,radius,height,48),color,position,rotation);
  box('base',[5.4,.4,4.5],palette.light,[0,.08,0]);box('base',[4.95,.1,4.05],palette.metal,[0,.33,0]);
  for(const lateral of [-2.1,2.1])for(const depth of [-1.65,1.65]){cyl('base',.29,.3,palette.dark,[lateral,-.18,depth]);cyl('base',.16,.06,palette.dark,[lateral,.4,depth]);}
  cyl('sample',1.6,.22,palette.dark,[0,.55,.3]);cyl('sample',1.4,.1,palette.metal,[0,.72,.3]);box('sample',[2.75,.12,2.75],palette.teal,[0,.82,.3]);
  const surfaceGeometry=new THREE.PlaneGeometry(2.6,2.6,63,63);surfaceGeometry.rotateX(-Math.PI/2);
  const surface=mesh('sample',surfaceGeometry,0xa5c7c8,[0,.9,.3]);surface.material.roughness=.65;surface.material.metalness=.15;surface.material.vertexColors=true;
  const contourLines=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x326a70,transparent:true,opacity:.9,depthWrite:false}));parts.sample.add(contourLines);
  function setSurface(type){
    const position=surfaceGeometry.attributes.position;const colors=[];
    for(let index=0;index<position.count;index++){const x=(position.getX(index)+1.3)/2.6;const y=(position.getZ(index)+1.3)/2.6;const height=surfaceHeight(x,y,type);position.setY(index,height*.0045);const color=new THREE.Color().setHSL(.51-height*.0006,.38,.78-height*.0032);colors.push(color.r,color.g,color.b);}
    surfaceGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));position.needsUpdate=true;surfaceGeometry.computeVertexNormals();
    const points=[];const resolution=96;
    for(let level=10;level<=90;level+=10){for(let row=0;row<resolution;row++){for(let column=0;column<resolution;column++){
      const corners=[[column,row],[column+1,row],[column+1,row+1],[column,row+1]].map(([x,y])=>({x:x/resolution,y:y/resolution,h:surfaceHeight(x/resolution,y/resolution,type)}));
      const crossings=[];
      for(let edge=0;edge<4;edge++){const first=corners[edge],second=corners[(edge+1)%4];if((first.h<level)!==(second.h<level)){const ratio=(level-first.h)/(second.h-first.h);crossings.push(new THREE.Vector3((first.x+(second.x-first.x)*ratio-.5)*2.6,.9+level*.0045+.007,(first.y+(second.y-first.y)*ratio-.5)*2.6+.3));}}
      for(let index=0;index+1<crossings.length;index+=2)points.push(crossings[index],crossings[index+1]);
    }}}
    contourLines.geometry.dispose();contourLines.geometry=new THREE.BufferGeometry().setFromPoints(points);
  }
  setSurface('islands');
  for(const lateral of [-1.95,1.95]){box('approach',[.55,3.25,.65],palette.metal,[lateral,1.98,-1.35]);box('approach',[.66,.18,.76],palette.dark,[lateral,3.5,-1.35]);cyl('approach',.12,2.8,palette.dark,[lateral,2,-.97]);cyl('approach',.28,.16,palette.gold,[lateral,3.7,-1.35]);}
  box('approach',[4.6,.42,.75],palette.light,[0,3.4,-1.35]);
  box('piezo',[1.4,.35,1.1],palette.dark,[0,3.2,-.1]);
  for(let layer=0;layer<6;layer++)box('piezo',[.75,.09,.72],layer%2?palette.gold:palette.purple,[0,2.85+layer*.1,-.1]);
  box('head',[2.6,.28,1.15],palette.light,[0,2.65,.1]);box('head',[.48,.65,.7],palette.dark,[-.6,2.2,.1]);
  for(const lateral of [-1.08,1.08])for(const depth of [-.3,.48])cyl('head',.06,.07,palette.dark,[lateral,2.82,depth]);
  box('probe',[1,.055,.25],palette.gold,[-.13,1.83,.3]);
  const tip=mesh('probe',new THREE.ConeGeometry(.095,.32,4),0xa9a1b8,[.3,1.64,.3],[0,0,Math.PI]);
  const laser=cyl('laser',.2,.74,palette.dark,[-.95,2.4,.3],[0,0,-.65]);cyl('laser',.21,.13,palette.purple,[-1.17,2.7,.3],[0,0,-.65]);
  box('detector',[.65,.75,.18],palette.dark,[1,2.35,.3],[0,0,-.28]);
  for(const lateral of [-1,1])for(const vertical of [-1,1])box('detector',[.25,.26,.025],palette.purple,[1+lateral*.14,2.35+vertical*.15,.404]);
  box('controller',[1.2,.85,1.7],palette.dark,[2.95,.35,-.1]);box('controller',[1.03,.68,.04],palette.light,[2.95,.37,.77]);
  for(let indicator=0;indicator<3;indicator++)mesh('controller',new THREE.SphereGeometry(.04,12,8),indicator===0?0x76c9a9:palette.purple,[2.64+indicator*.17,.55,.8]);
  for(let vent=0;vent<5;vent++)box('controller',[.45,.025,.025],palette.dark,[3.09,.32-vent*.07,.8]);
  function tube(points,color,radius=.014){const curve=new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)));const path=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,6,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.6}));scene.add(path);return {path,curve};}
  const cable=tube([[3,.1,-.9],[3.3,.15,-1.8],[.8,.15,-2.3],[0,2.8,-1.4]],0x777188,.04);
  const laserLine=new THREE.Group();const beamMaterial=new THREE.MeshBasicMaterial({color:0xe12e64,depthTest:false});const beamGlowMaterial=new THREE.MeshBasicMaterial({color:0xf55b8a,transparent:true,opacity:.24,depthTest:false,depthWrite:false});
  const beamSegments=Array.from({length:2},()=>{const group=new THREE.Group();const geometry=new THREE.CylinderGeometry(1,1,1,12);const core=new THREE.Mesh(geometry,beamMaterial);const glow=new THREE.Mesh(geometry,beamGlowMaterial);core.scale.set(.018,1,.018);glow.scale.set(.047,1,.047);core.renderOrder=11;glow.renderOrder=10;group.add(glow,core);laserLine.add(group);return group;});scene.add(laserLine);
  const opticalDots=Array.from({length:4},()=>{const dot=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),new THREE.MeshBasicMaterial({color:0xffb1c3}));scene.add(dot);return dot;});
  const feedbackLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:4},()=>new THREE.Vector3())),new THREE.LineDashedMaterial({color:0x67aeb3,dashSize:.12,gapSize:.07,transparent:true,opacity:.65}));scene.add(feedbackLine);
  const feedbackDot=new THREE.Mesh(new THREE.SphereGeometry(.055,12,10),new THREE.MeshBasicMaterial({color:0x58b5b6}));scene.add(feedbackDot);
  const scanOutline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1.3,.93,-1],[1.3,.93,-1],[1.3,.93,1.6],[-1.3,.93,1.6]].map(point=>new THREE.Vector3(...point))),new THREE.LineDashedMaterial({color:0x457f80,dashSize:.1,gapSize:.07}));scanOutline.computeLineDistances();parts.sample.add(scanOutline);
  const scanLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xe45170,transparent:true,opacity:.95,depthWrite:false}));parts.sample.add(scanLine);
  const selectedState={id:'probe',related:[],exploded:false,xray:false};let explodeAmount=0;let time=0;let pointerDown=null;
  const outlines=new Map();
  for(const item of selectable){if(item===surface)continue;const outline=new THREE.LineSegments(new THREE.EdgesGeometry(item.geometry,30),new THREE.LineBasicMaterial({color:0x713aca,transparent:true,opacity:.95,depthTest:false}));outline.renderOrder=3;item.add(outline);outlines.set(item,outline);}
  function highlight(){for(const item of selectable){const selected=item.userData.part===selectedState.id;const related=selectedState.related.includes(item.userData.part);const emphasized=selected||related;item.material.color.copy(originalColors.get(item));if(!emphasized)item.material.color.lerp(new THREE.Color(0xaab0c1),.55);item.material.emissive.set(selected?0x713aca:related?0xc17c10:0x000000);item.material.emissiveIntensity=selected?.32:related?.24:0;item.material.opacity=emphasized?1:selectedState.xray?.12:.3;item.material.transparent=!emphasized;item.material.depthWrite=emphasized;const outline=outlines.get(item);if(outline){outline.visible=emphasized;outline.material.color.set(selected?0x713aca:0xc17c10);}}contourLines.material.opacity=selectedState.id==='sample'||selectedState.related.includes('sample')?.95:.55;}
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  function hit(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(selectable,false).find(result=>parts[result.object.userData.part].visible);}
  const tooltip=container.querySelector('#partTooltip');
  renderer.domElement.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};});
  renderer.domElement.addEventListener('pointerup',event=>{if(pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)<5){const result=hit(event);if(result)onSelect(result.object.userData.part);}pointerDown=null;});
  renderer.domElement.addEventListener('pointermove',event=>{const result=hit(event);renderer.domElement.style.cursor=result?'pointer':'grab';tooltip.hidden=!result;if(result){const rect=container.getBoundingClientRect();tooltip.textContent=PARTS.find(part=>part.id===result.object.userData.part).name;tooltip.style.left=`${Math.min(event.clientX-rect.left+13,rect.width-160)}px`;tooltip.style.top=`${event.clientY-rect.top-30}px`;}});
  renderer.domElement.addEventListener('pointerleave',()=>{tooltip.hidden=true;pointerDown=null;});
  const observer=new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();});observer.observe(container);
  function updateLine(line,points){line.geometry.setFromPoints(points);}
  function render(engine,delta){
    time+=delta;explodeAmount=THREE.MathUtils.damp(explodeAmount,selectedState.exploded?1:0,5,delta);
    const [scanX,scanY]=engine.xy;const stage=stageOffset(scanX,scanY);
    const zPosition=engine.z*.0045-.58+engine.clearance*.72;
    for(const [id,group] of Object.entries(parts)){group.position.set(...offsets[id]).multiplyScalar(explodeAmount);if(id==='sample'){group.position.x+=stage.x;group.position.z+=stage.z;}if(['head','probe','laser','detector','piezo'].includes(id))group.position.y+=zPosition;if(id==='probe')group.rotation.z=engine.deflection*.08;}
    const point=(id,position)=>parts[id].localToWorld(new THREE.Vector3(...position));
    scene.updateMatrixWorld(true);
    const source=point('laser',[-.72,2.1,.3]);const reflection=point('probe',[.3,1.86,.3]);const detector=point('detector',[1,2.35+engine.deflection*.7,.43]);
    [[source,reflection],[reflection,detector]].forEach(([start,end],index)=>{const segment=beamSegments[index];const direction=end.clone().sub(start);segment.position.copy(start).add(end).multiplyScalar(.5);segment.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());segment.scale.y=direction.length();});laserLine.visible=['laser','probe','detector'].every(id=>parts[id].visible);
    for(let index=0;index<opticalDots.length;index++){const phase=(time*.55+index/opticalDots.length)%1;opticalDots[index].position.copy(phase<.5?source.clone().lerp(reflection,phase*2):reflection.clone().lerp(detector,(phase-.5)*2));opticalDots[index].visible=laserLine.visible;}
    const controller=point('controller',[2.95,.65,.75]);const piezo=point('piezo',[.45,3.2,.2]);const route=[detector,new THREE.Vector3(controller.x,detector.y,controller.z),controller,piezo];updateLine(feedbackLine,route);feedbackLine.computeLineDistances();feedbackLine.visible=parts.controller.visible&&parts.detector.visible&&parts.piezo.visible;
    const phase=(time*.35)%1;const segment=Math.min(2,Math.floor(phase*3));feedbackDot.position.copy(route[segment]).lerp(route[segment+1],phase*3-segment);feedbackDot.visible=feedbackLine.visible&&engine.status==='scanning';
    const linePoints=Array.from({length:64},(_,index)=>{const x=index/63;return new THREE.Vector3((x-.5)*2.6,.91+surfaceHeight(x,scanY,engine.surface)*.0045,(scanY-.5)*2.6+.3);});updateLine(scanLine,linePoints);scanLine.visible=engine.index>0&&parts.sample.visible&&!selectedState.exploded;scanOutline.visible=parts.sample.visible&&!selectedState.exploded;
    cable.path.visible=!selectedState.exploded&&parts.controller.visible&&parts.approach.visible;
    controls.update();renderer.render(scene,camera);
  }
  highlight();
  return {render,home,setSurface,select(id){selectedState.id=id;highlight();},setRelated(ids){selectedState.related=ids;highlight();},explode(value){selectedState.exploded=value;},xray(value){selectedState.xray=value;highlight();},hide(id){parts[id].visible=!parts[id].visible;return !parts[id].visible;},visible(id){return parts[id].visible;},showAll(){Object.values(parts).forEach(part=>part.visible=true);},get meshCount(){return selectable.length;},dispose(){observer.disconnect();controls.dispose();renderer.dispose();}};
}
