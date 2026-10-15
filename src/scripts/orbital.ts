import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildWorkbench} from './workbench';
import {showcaseConfig as config} from './showcase-config';
import {createShowcasePath} from './showcase-path';

type Featured={slug:string;name:string;url:string;exhibit:'price'|'receipt'};
/** Unbounded wheel/swipe progress drives repeated paths; time never advances models. */
export async function mountOrbital(host:HTMLElement,resumeProgress:number=config.initialProgress):Promise<()=>void>{
 const section=host.closest<HTMLElement>('[data-showcase]')!,stage=section.querySelector<HTMLElement>('.workbench')!;
 const controls=section.querySelector<HTMLElement>('[data-scene-controls]')!,hint=section.querySelector<HTMLElement>('.scene-hint')!;
 const progressBar=section.querySelector<HTMLElement>('.path-progress')!,progressFill=progressBar.querySelector<HTMLElement>('span')!;
 const status=section.querySelector<HTMLElement>('.scene-state')!;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=()=>host.clientWidth<600;
 const memory=(navigator as Navigator&{deviceMemory?:number}).deviceMemory??8;
 const saveData=(navigator as Navigator&{connection?:{saveData:boolean}}).connection?.saveData;
 const fallback=(reason:string)=>{section.classList.add('is-static');section.classList.remove('is-active');host.dataset.state=reason;status.textContent='전체 서비스 목록을 표시합니다.';};
 if(reduced.matches||saveData){fallback(reduced.matches?'reduced-motion':'save-data');return ()=>{};}
 const featured=(JSON.parse(host.dataset.featured??'[]') as Featured[]).slice(0,config.maxFeatured);
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:memory>4,alpha:false,powerPreference:'low-power'});}catch{fallback('fallback');return ()=>{};}
 let disposed=false,lost=false,visible=true,raf=0,progress=0,renderCount=0;
 let cap=memory<=4||innerWidth<600?config.quality.mobileDpr:config.quality.desktopDpr;
 let samples=0,totalCost=0,composer:EffectComposer|undefined,bloomComposer:EffectComposer|undefined,bloom:UnrealBloomPass|undefined,fxaa:ShaderPass|undefined;
 const events=new AbortController(),signal=events.signal;
 section.hidden=false;section.classList.remove('is-static');section.classList.add('is-active');controls.hidden=false;hint.hidden=false;progressBar.hidden=false;
 const canvas=renderer.domElement;host.append(canvas);canvas.setAttribute('aria-hidden','true');
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 renderer.shadowMap.enabled=memory>4&&innerWidth>=600;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,120);
 const set=buildWorkbench(scene,renderer,featured,invalidate);
 const {geometries,materials,textures,turntable:deck,stations}=set;
 const entries=featured.map((service,index)=>({service,index,station:stations.get(service.slug)!}));
 // Per-station material ownership allows an offstage fade without dimming the fixed set.
 const fading=new Map<string,{material:THREE.Material;opacity:number}[]>();
 for(const {service,station} of entries){const owned=new Map<THREE.Material,THREE.Material>();station.group.traverse(object=>{const mesh=object as THREE.Mesh;if(!mesh.isMesh)return;const clone=(original:THREE.Material)=>{let copy=owned.get(original);if(!copy){copy=original.clone();owned.set(original,copy);materials.add(copy);}return copy;};mesh.material=Array.isArray(mesh.material)?mesh.material.map(clone):clone(mesh.material);});fading.set(service.slug,[...owned.values()].map(material=>({material,opacity:material.opacity})));}
 const selectedSlugs=new Set(featured.map(s=>s.slug));let mobilePath=mobile(),path=createShowcasePath({mobile:mobilePath});
 const phases=new Map<string,ReturnType<typeof path.sample>&{local:number}>();
 if(config.debugPath||(import.meta.env.DEV&&new URL(location.href).searchParams.get('pathDebug')==='1')){const debug=new THREE.Group();debug.name='development-path';scene.add(debug);for(const [curve,color] of [[path.entry,'#65d5d0'],[path.orbit,'#dfbd80'],[path.exit,'#a5c9f7']] as const){const geometry=new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(300));geometries.add(geometry);const mat=new THREE.LineBasicMaterial({color,depthTest:false});materials.add(mat);debug.add(new THREE.Line(geometry,mat));}host.dataset.debugPath='true';}
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const labelPositions=new Map<string,THREE.Vector3>();
 let hovered:string|null=null;

 for(const {service,station} of entries){
  // Native sprites billboard toward the camera and use the scene's depth buffer for occlusion.
  const art=document.createElement('canvas');art.width=512;art.height=112;const ctx=art.getContext('2d')!;
  ctx.fillStyle='#0b1825';ctx.beginPath();ctx.roundRect(8,8,496,96,24);ctx.fill();ctx.strokeStyle='#dfbd80';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#f0f2f3';ctx.font='500 40px "Noto Sans KR Variable",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(service.name,256,56,460);
  const map=new THREE.CanvasTexture(art);map.colorSpace=THREE.SRGBColorSpace;textures.add(map);
  const mat=new THREE.SpriteMaterial({map,depthTest:true,depthWrite:false,toneMapped:false});materials.add(mat);
  const label=new THREE.Sprite(mat);label.position.set(0,1.2,1.35);label.scale.set(1.6,.35,1);label.name='service-label';station.group.add(label);labelPositions.set(service.slug,new THREE.Vector3());

 }
 const bloomBlack=new THREE.MeshBasicMaterial({color:0x000000});materials.add(bloomBlack);
 const maskedMaterials=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>(),maskedSprites=new Map<THREE.Sprite,boolean>();
 function disposeComposer(){for(const chain of [composer,bloomComposer]){if(!chain)continue;for(const pass of chain.passes)pass.dispose();chain.dispose();}composer=undefined;bloomComposer=undefined;bloom=undefined;}
 function makeComposer(){disposeComposer();
  bloomComposer=new EffectComposer(renderer);bloomComposer.renderToScreen=false;bloomComposer.addPass(new RenderPass(scene,camera));
  bloom=new UnrealBloomPass(new THREE.Vector2(1,1),mobile()?config.quality.mobileBloomStrength:config.quality.bloomStrength,config.quality.bloomRadius,config.quality.bloomThreshold);bloomComposer.addPass(bloom);
  composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const blend=new ShaderPass({uniforms:{tDiffuse:{value:null},bloomTexture:{value:bloomComposer.renderTarget2.texture}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform sampler2D bloomTexture;varying vec2 vUv;void main(){gl_FragColor=texture2D(tDiffuse,vUv)+texture2D(bloomTexture,vUv);}'});
  composer.addPass(blend);composer.addPass(new OutputPass());fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);
 }
 function renderScene(){
  // Bloom only the fixed emitter. Metal highlights and service labels never enter its mask.
  const background=scene.background;scene.background=new THREE.Color(0);
  scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.isMesh&&mesh!==set.coreEmitter){maskedMaterials.set(mesh,mesh.material);mesh.material=bloomBlack;}const sprite=object as THREE.Sprite;if(sprite.isSprite){maskedSprites.set(sprite,sprite.visible);sprite.visible=false;}});
  try{bloomComposer!.render();}finally{scene.background=background;for(const [mesh,material] of maskedMaterials)mesh.material=material;for(const [sprite,visible] of maskedSprites)sprite.visible=visible;maskedMaterials.clear();maskedSprites.clear();}
  composer!.render();
 }
 makeComposer();
 function positionCamera(){const view=mobile()?config.camera.mobile:config.camera.desktop;camera.fov=view.fov;
  const target=new THREE.Vector3(...view.target),position=new THREE.Vector3(Math.sin(view.azimuth)*view.distance,view.height,Math.cos(view.azimuth)*view.distance);
  if(mobile()){const offset=position.clone().sub(target),halfH=Math.atan(Math.tan(THREE.MathUtils.degToRad(view.fov/2))*camera.aspect);offset.setLength(Math.max(offset.length(),config.camera.mobileFitRadius/Math.sin(halfH)));position.copy(target).add(offset);}
  camera.position.copy(position);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
 function resize(){if(disposed||lost)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;if(mobilePath!==mobile()){mobilePath=mobile();path=createShowcasePath({mobile:mobilePath});applyProgress(progress);}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,cap));renderer.setSize(w,h,false);camera.aspect=w/h;positionCamera();
  composer?.setPixelRatio(renderer.getPixelRatio());composer?.setSize(w,h);bloomComposer?.setPixelRatio(renderer.getPixelRatio());bloomComposer?.setSize(w,h);bloom?.setSize(w*(mobile()?.25:.5),h*(mobile()?.25:.5));
  fxaa?.uniforms.resolution.value.set(1/(w*renderer.getPixelRatio()),1/(h*renderer.getPixelRatio()));
  if(bloom)bloom.strength=mobile()?config.quality.mobileBloomStrength:config.quality.bloomStrength;
  renderer.shadowMap.needsUpdate=true;invalidate();
 }
 function applyProgress(value:number){progress=value;
  // Unbounded input preserves exact reversal; wrapping happens in the offstage gap.
  for(const {service,index,station} of entries){const local=path.modelProgress(progress,index),sample=path.sample(local);phases.set(service.slug,{...sample,local});station.group.position.copy(sample.position);station.group.rotation.y=0;station.group.visible=local>=0&&local<=1&&selectedSlugs.has(service.slug);const fade=THREE.MathUtils.smoothstep(local,0,.035)*(1-THREE.MathUtils.smoothstep(local,.965,1));for(const {material,opacity} of fading.get(service.slug)!){const transparent=fade<1||opacity<1;if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true;}material.opacity=opacity*fade;}}
  const cycle=path.modelProgress(progress,0)/path.period;progressFill.style.transform=`scaleX(${cycle})`;progressBar.setAttribute('aria-valuenow',String(Math.round(cycle*100)));
  host.dataset.progress=String(progress);host.dataset.timing=JSON.stringify({entryEnd:path.entryEnd,orbitEnd:path.orbitEnd,gap:path.gap,period:path.period});renderer.shadowMap.needsUpdate=true;invalidate();
 }
 function invalidate(){if(!raf&&!disposed&&!lost&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
 function frame(){raf=0;if(disposed||lost||!visible||document.hidden)return;scene.updateMatrixWorld();
  const cameraRight=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
  for(const {service,station} of entries){const label=station.group.getObjectByName('service-label') as THREE.Sprite;label.visible=phases.get(service.slug)?.phase==='orbit';label.position.set(0,1.2,1.35);station.group.updateMatrixWorld(true);const world=label.getWorldPosition(labelPositions.get(service.slug)!);const depth=-world.clone().applyMatrix4(camera.matrixWorldInverse).z;
   const unitPerPixel=2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/host.clientHeight,width=mobile()?120:166,height=width*36.3/166;
   label.scale.set(width*unitPerPixel/station.group.scale.x,height*unitPerPixel/station.group.scale.y,1);
   const projected=world.clone().project(camera),x=(projected.x*.5+.5)*host.clientWidth,clamped=THREE.MathUtils.clamp(x,width/2+12,host.clientWidth-width/2-12);
   world.addScaledVector(cameraRight,(clamped-x)*unitPerPixel);label.position.copy(station.group.worldToLocal(world.clone()));label.updateMatrixWorld();
  }

  const begin=performance.now();renderScene();totalCost+=performance.now()-begin;samples++;renderCount++;
  if(samples===16){if(totalCost/samples>24&&cap>1){cap=1;renderer.shadowMap.enabled=false;host.dataset.quality='economy';resize();}samples=0;totalCost=0;}
  // Small declarative diagnostics make actual transforms, occlusion depth and parking testable.
  host.dataset.orbit=JSON.stringify(entries.map(({service,station})=>{const p=station.group.position;const projected=new THREE.Vector3(p.x,p.y+2,p.z).project(camera);const distance=camera.position.distanceTo(p);const label=station.group.getObjectByName('service-label')!;label.getWorldPosition(labelPositions.get(service.slug)!);const lp=labelPositions.get(service.slug)!.clone().project(camera);const phase=phases.get(service.slug)!;return {slug:service.slug,visible:station.group.visible,phase:phase.phase,segment:phase.segment,local:phase.local,x:p.x,y:p.y,z:p.z,yaw:station.group.rotation.y,distance,screenX:(projected.x*.5+.5)*host.clientWidth,screenY:(-.5*projected.y+.5)*host.clientHeight,labelX:(lp.x*.5+.5)*host.clientWidth,labelY:(-.5*lp.y+.5)*host.clientHeight};}));
  host.dataset.fixed=JSON.stringify({deck:deck.rotation.toArray().slice(0,3),core:set.coreEmitter.getWorldPosition(new THREE.Vector3()).toArray(),camera:camera.position.toArray()});
  host.dataset.renderCount=String(renderCount);host.dataset.ready='true';host.dataset.state='webgl';host.dataset.bloom=mobile()?'quarter-resolution':'half-resolution';
 }
 const hit=(clientX:number,clientY:number)=>{const rect=canvas.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
  const intersection=raycaster.intersectObjects(entries.filter(e=>e.station.group.visible).map(e=>e.station.group),true).find(hit=>{const object=hit.object as THREE.Mesh;const mats=Array.isArray(object.material)?object.material:[object.material];return object.visible&&mats.some(m=>m?.visible&&m.opacity>.05);});if(!intersection)return;
  // Station raycast alone could select a model behind the fixed stone/core. Respect foreground occluders.
  const occluder=raycaster.intersectObjects(deck.children.filter(c=>c instanceof THREE.Mesh),true)[0];if(occluder&&occluder.distance<intersection.distance-.02)return;
  return entries.find(e=>{let node:THREE.Object3D|null=intersection.object;while(node){if(node===e.station.group)return true;node=node.parent;}return false;});};
 const highlight=(slug:string|null)=>{if(hovered===slug)return;hovered=slug;canvas.dataset.hover=String(!!slug);for(const {service,station} of entries)station.light.intensity=service.slug===slug?12:4;invalidate();};
 let gesture:{x:number;y:number;scroll:number;progress:number;time:number;moved:boolean;lastX:number;horizontal:boolean}|undefined;
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;gesture={x:e.clientX,y:e.clientY,scroll:scrollY,progress,time:performance.now(),moved:false,lastX:e.clientX,horizontal:false};},{signal});
 canvas.addEventListener('pointermove',e=>{if(gesture){const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>6)gesture.moved=true;if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.3)gesture.horizontal=true;if(gesture.horizontal){applyProgress(progress+(gesture.lastX-e.clientX)/config.dragPixelsPerCycle*path.period);canvas.setPointerCapture(e.pointerId);}gesture.lastX=e.clientX;}if(e.pointerType==='mouse')highlight(hit(e.clientX,e.clientY)?.service.slug??null);},{signal});
 canvas.addEventListener('pointerleave',()=>highlight(null),{signal});
 canvas.addEventListener('pointercancel',()=>{gesture=undefined;},{signal});
 canvas.addEventListener('pointerup',e=>{const g=gesture;gesture=undefined;if(!g||g.moved||Math.hypot(e.clientX-g.x,e.clientY-g.y)>6||Math.abs(scrollY-g.scroll)>3||Math.abs(progress-g.progress)>.002||performance.now()-g.time>600)return;const entry=hit(e.clientX,e.clientY);if(entry)location.assign(entry.service.url);},{signal});
 // Only the canvas owns wheel input. Controls and the catalogue keep normal page scrolling.
 canvas.addEventListener('wheel',e=>{if(e.ctrlKey||lost||disposed)return;e.preventDefault();if(gesture)gesture.moved=true;const unit=e.deltaMode===1?16:e.deltaMode===2?host.clientHeight:1;const delta=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;applyProgress(progress+delta*unit/config.wheelPixelsPerCycle*path.period);},{passive:false,signal});
 document.addEventListener('ravirgo:select',e=>highlight((e as CustomEvent).detail.slug),{signal});
 const filter=()=>{selectedSlugs.clear();for(const row of document.querySelectorAll<HTMLElement>('[data-service]'))if(!row.hidden)selectedSlugs.add(row.dataset.service!);applyProgress(progress);};
 document.addEventListener('ravirgo:filter',filter,{signal});filter();
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else invalidate();},{signal});
 const intersection=new IntersectionObserver(records=>{visible=records[0].isIntersecting;if(!visible&&raf){cancelAnimationFrame(raf);raf=0;}else invalidate();});intersection.observe(stage);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;host.dataset.ready='false';canvas.hidden=true;if(raf)cancelAnimationFrame(raf);raf=0;host.dataset.state='context-lost';status.textContent='3D를 복구하는 동안 서비스 목록을 이용할 수 있습니다.';},{signal});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;canvas.hidden=false;set.restoreEnvironment();makeComposer();resize();applyProgress(progress);status.textContent='3D 공간을 복구했습니다.';},{signal});
 addEventListener('pagehide',e=>{if(e.persisted){visible=false;if(raf)cancelAnimationFrame(raf);raf=0;}else dispose();},{signal});
 addEventListener('pageshow',e=>{if(e.persisted){visible=true;resize();}},{signal});
 function dispose(){if(disposed)return;disposed=true;events.abort();if(raf)cancelAnimationFrame(raf);resizeObserver.disconnect();intersection.disconnect();disposeComposer();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();set.disposeEnvironment();renderer.dispose();canvas.remove();section.classList.remove('is-active');section.classList.add('is-static');hint.hidden=true;progressBar.hidden=true;host.dataset.state='disposed';}
 host.dataset.quality=cap===1?'economy':'standard';applyProgress(resumeProgress);resize();
 return dispose;
}
