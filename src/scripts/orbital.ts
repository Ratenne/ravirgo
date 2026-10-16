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
 try{renderer=new THREE.WebGLRenderer({antialias:memory>4,alpha:false,powerPreference:'high-performance'});}catch{fallback('fallback');return ()=>{};}
 let disposed=false,lost=false,visible=true,raf=0,progress=0,renderCount=0;
 let cap=memory<=4?1.25:config.quality.desktopDpr;
 let samples=0,totalCost=0,warmupFrames=24,slowWindows=0,composer:EffectComposer|undefined,bloomComposer:EffectComposer|undefined,bloom:UnrealBloomPass|undefined,fxaa:ShaderPass|undefined;
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
 const labels=new Map(entries.map(({service})=>[service.slug,host.querySelector<HTMLAnchorElement>(`[data-model-label="${service.slug}"]`)!]));
 const labelPositions=new Map(entries.map(({service})=>[service.slug,new THREE.Vector3()]));
 const labelScreens=new Map<string,{x:number;y:number;visible:boolean}>();
 let hovered:string|null=null;
 // Sensitivity is recalculated from live layout; resizing never changes the route clock.
 const inputDistances=()=>({wheel:Math.max(1,document.documentElement.clientHeight)*config.wheelViewportHeightsPerCycle,drag:Math.max(1,host.clientWidth)*config.dragStageWidthsPerCycle});
 const bloomBlack=new THREE.MeshBasicMaterial({color:0x000000});materials.add(bloomBlack);
 const maskedMaterials=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>(),maskedSprites=new Map<THREE.Sprite,boolean>();
 function disposeComposer(){for(const chain of [composer,bloomComposer]){if(!chain)continue;for(const pass of chain.passes)pass.dispose();chain.dispose();}composer=undefined;bloomComposer=undefined;bloom=undefined;}
 function makeComposer(){disposeComposer();
  bloomComposer=new EffectComposer(renderer);bloomComposer.renderToScreen=false;bloomComposer.addPass(new RenderPass(scene,camera));
  bloom=new UnrealBloomPass(new THREE.Vector2(1,1),mobile()?config.quality.mobileBloomStrength:config.quality.bloomStrength,config.quality.bloomRadius,config.quality.bloomThreshold);bloomComposer.addPass(bloom);
  const gl=renderer.getContext(),samples=Math.min(gl.getParameter(gl.MAX_SAMPLES),mobile()?config.quality.mobileSamples:config.quality.desktopSamples);
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples,depthBuffer:true});
  composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));host.dataset.antialias=`MSAA ${samples}x`;
  const blend=new ShaderPass({uniforms:{tDiffuse:{value:null},bloomTexture:{value:bloomComposer.renderTarget2.texture}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform sampler2D bloomTexture;varying vec2 vUv;void main(){gl_FragColor=texture2D(tDiffuse,vUv)+texture2D(bloomTexture,vUv);}'});
  composer.addPass(blend);composer.addPass(new OutputPass());fxaa=undefined;if(samples===0){fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);host.dataset.antialias='FXAA fallback';}
 }
 function renderScene(){
  // Bloom authored light strips and the core; reflected metal and labels stay out of the mask.
  const background=scene.background;scene.background=new THREE.Color(0);
  scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.isMesh&&!mesh.userData.bloom){maskedMaterials.set(mesh,mesh.material);mesh.material=bloomBlack;}const sprite=object as THREE.Sprite;if(sprite.isSprite){maskedSprites.set(sprite,sprite.visible);sprite.visible=false;}});
  try{bloomComposer!.render();}finally{scene.background=background;for(const [mesh,material] of maskedMaterials)mesh.material=material;for(const [sprite,visible] of maskedSprites)sprite.visible=visible;maskedMaterials.clear();maskedSprites.clear();}
  composer!.render();
 }
 makeComposer();
 function positionCamera(){const view=mobile()?config.camera.mobile:config.camera.desktop;camera.fov=view.fov;
  const target=new THREE.Vector3(...view.target),position=new THREE.Vector3(Math.sin(view.azimuth)*view.distance,view.height,Math.cos(view.azimuth)*view.distance);
  if(mobile()){const offset=position.clone().sub(target),halfH=Math.atan(Math.tan(THREE.MathUtils.degToRad(view.fov/2))*camera.aspect);offset.setLength(Math.max(offset.length(),config.camera.mobileFitRadius/Math.sin(halfH)));position.copy(target).add(offset);}
  camera.position.copy(position);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
 function resize(){if(disposed||lost)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;if(mobilePath!==mobile()){mobilePath=mobile();path=createShowcasePath({mobile:mobilePath});makeComposer();applyProgress(progress);}
  renderer.shadowMap.enabled=memory>4&&!mobile();renderer.setPixelRatio(Math.min(devicePixelRatio||1,cap,mobile()?config.quality.mobileDpr:config.quality.desktopDpr));renderer.setSize(w,h,false);camera.aspect=w/h;positionCamera();
  composer?.setPixelRatio(renderer.getPixelRatio());composer?.setSize(w,h);bloomComposer?.setPixelRatio(renderer.getPixelRatio());bloomComposer?.setSize(w,h);bloom?.setSize(w*(mobile()?.25:.5),h*(mobile()?.25:.5));
  fxaa?.uniforms.resolution.value.set(1/(w*renderer.getPixelRatio()),1/(h*renderer.getPixelRatio()));
  if(bloom)bloom.strength=mobile()?config.quality.mobileBloomStrength:config.quality.bloomStrength;
  renderer.shadowMap.needsUpdate=true;invalidate();
 }
 function applyProgress(value:number){progress=value;
  // Unbounded input preserves exact reversal; wrapping happens in the offstage gap.
  for(const {service,index,station} of entries){const local=path.modelProgress(progress,index),sample=path.sample(local);phases.set(service.slug,{...sample,local});station.group.position.copy(sample.position);station.group.rotation.y=0;station.group.visible=local>=0&&local<=1&&selectedSlugs.has(service.slug);const fade=THREE.MathUtils.smoothstep(local,0,.035)*(1-THREE.MathUtils.smoothstep(local,.965,1));for(const {material,opacity} of fading.get(service.slug)!){const transparent=fade<1||opacity<1;if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true;}material.opacity=opacity*fade;}}
  set.updateConnections(new Set(entries.filter(({service})=>phases.get(service.slug)?.phase==='orbit').map(({service})=>service.slug)));
  const cycle=path.modelProgress(progress,0)/path.period;progressFill.style.transform=`scaleX(${cycle})`;progressBar.setAttribute('aria-valuenow',String(Math.round(cycle*100)));
  host.dataset.progress=String(progress);host.dataset.timing=JSON.stringify({entryEnd:path.entryEnd,orbitEnd:path.orbitEnd,gap:path.gap,period:path.period});renderer.shadowMap.needsUpdate=true;invalidate();
 }
 function invalidate(){if(!raf&&!disposed&&!lost&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
 function frame(){raf=0;if(disposed||lost||!visible||document.hidden)return;scene.updateMatrixWorld();
  // DOM names stay crisp and accessible; project their anchors through the same camera.
  for(const {service,station} of entries){const label=labels.get(service.slug)!,world=station.group.localToWorld(labelPositions.get(service.slug)!.set(0,.7,1.35)),projected=world.clone().project(camera);
   const x=(projected.x*.5+.5)*host.clientWidth,y=(-projected.y*.5+.5)*host.clientHeight;
   let show=station.group.visible&&phases.get(service.slug)?.phase==='orbit'&&projected.z>=-1&&projected.z<=1&&x>=0&&x<=host.clientWidth&&y>=0&&y<=host.clientHeight;
   if(show){pointer.set(projected.x,projected.y);raycaster.setFromCamera(pointer,camera);raycaster.far=camera.position.distanceTo(world)-.08;
    const obstruction=raycaster.intersectObjects(deck.children.filter(object=>object!==station.group&&object.userData.stationSlug!==service.slug),true).some(hit=>{let object:THREE.Object3D|null=hit.object;while(object){if(!object.visible)return false;object=object.parent;}const mesh=hit.object as THREE.Mesh;const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];return mats.some(m=>m?.visible&&m.opacity>.7);});show=!obstruction;raycaster.far=Infinity;
   }
   const half=(mobile()?120:166)/2,clamped=THREE.MathUtils.clamp(x,half+12,host.clientWidth-half-12);
   label.hidden=!show;label.style.transform=`translate3d(${clamped}px,${y}px,0) translate(-50%,-50%)`;label.style.zIndex=String(Math.max(1,Math.round(100-camera.position.distanceTo(world))));
   labelScreens.set(service.slug,{x:clamped,y,visible:show});
  }
  const input=inputDistances();host.dataset.input=JSON.stringify(input);

  const begin=performance.now();renderScene();renderCount++;
  // Ignore shader warmup. Reduce resolution only after three sustained slow windows.
  if(warmupFrames>0){warmupFrames--;}else{totalCost+=performance.now()-begin;samples++;if(samples===30){slowWindows=totalCost/samples>config.quality.slowFrameMs?slowWindows+1:0;const floor=mobile()?1.25:1.5;if(slowWindows>=3&&cap>floor){cap=floor;host.dataset.quality='balanced';resize();slowWindows=0;}samples=0;totalCost=0;}}
  // Small declarative diagnostics make actual transforms, occlusion depth and parking testable.
  host.dataset.orbit=JSON.stringify(entries.map(({service,station})=>{const p=station.group.position;const projected=station.sculpture.localToWorld(new THREE.Vector3(service.exhibit==='receipt'?-.2:.2,1.8,service.exhibit==='receipt'?.36:0)).project(camera);const distance=camera.position.distanceTo(p);const label=labelScreens.get(service.slug)!;const phase=phases.get(service.slug)!;return {slug:service.slug,visible:station.group.visible,phase:phase.phase,segment:phase.segment,local:phase.local,connected:station.group.visible&&phase.phase==='orbit',x:p.x,y:p.y,z:p.z,yaw:station.group.rotation.y,distance,screenX:(projected.x*.5+.5)*host.clientWidth,screenY:(-.5*projected.y+.5)*host.clientHeight,labelX:label.x,labelY:label.y,labelVisible:label.visible};}));
  host.dataset.fixed=JSON.stringify({deck:deck.rotation.toArray().slice(0,3),core:set.coreEmitter.getWorldPosition(new THREE.Vector3()).toArray(),camera:camera.position.toArray()});
  host.dataset.dpr=String(renderer.getPixelRatio());host.dataset.renderCount=String(renderCount);host.dataset.ready='true';host.dataset.state='webgl';host.dataset.bloom=mobile()?'quarter-resolution':'half-resolution';
 }
 const hit=(clientX:number,clientY:number)=>{const rect=canvas.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
  const intersection=raycaster.intersectObjects(entries.filter(e=>e.station.group.visible).map(e=>e.station.group),true).find(hit=>{const object=hit.object as THREE.Mesh;const mats=Array.isArray(object.material)?object.material:[object.material];return object.visible&&mats.some(m=>m?.visible&&m.opacity>.05);});if(!intersection)return;
  // Station raycast alone could select a model behind the fixed stone/core. Respect foreground occluders.
  const occluder=raycaster.intersectObjects(deck.children.filter(c=>c instanceof THREE.Mesh),true)[0];if(occluder&&occluder.distance<intersection.distance-.02)return;
  return entries.find(e=>{let node:THREE.Object3D|null=intersection.object;while(node){if(node===e.station.group)return true;node=node.parent;}return false;});};
 const highlight=(slug:string|null)=>{if(hovered===slug)return;hovered=slug;canvas.dataset.hover=String(!!slug);for(const {service,station} of entries)station.light.intensity=service.slug===slug?12:4;invalidate();};
 let blockLabelClick=false;
 let gesture:{x:number;y:number;scroll:number;progress:number;time:number;moved:boolean;lastX:number;horizontal:boolean}|undefined;
 host.addEventListener('pointerdown',e=>{if(e.button!==0)return;blockLabelClick=false;gesture={x:e.clientX,y:e.clientY,scroll:scrollY,progress,time:performance.now(),moved:false,lastX:e.clientX,horizontal:false};},{signal});
 host.addEventListener('pointermove',e=>{if(gesture){const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>6)gesture.moved=true;if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.3)gesture.horizontal=true;if(gesture.horizontal){applyProgress(progress+(gesture.lastX-e.clientX)/inputDistances().drag*path.period);host.setPointerCapture(e.pointerId);}gesture.lastX=e.clientX;}if(e.pointerType==='mouse')highlight(hit(e.clientX,e.clientY)?.service.slug??null);},{signal});
 host.addEventListener('pointerleave',()=>highlight(null),{signal});
 host.addEventListener('pointercancel',()=>{gesture=undefined;},{signal});
 host.addEventListener('pointerup',e=>{const g=gesture;gesture=undefined;blockLabelClick=!g||g.moved||Math.hypot(e.clientX-g.x,e.clientY-g.y)>6||Math.abs(scrollY-g.scroll)>3||Math.abs(progress-g.progress)>.002||performance.now()-g.time>600;if(blockLabelClick||(e.target as Element).closest('[data-model-label]'))return;const entry=hit(e.clientX,e.clientY);if(entry)location.assign(entry.service.url);},{signal});
 for(const label of labels.values()){label.addEventListener('click',e=>{if(e.detail!==0&&blockLabelClick)e.preventDefault();},{signal});label.addEventListener('dragstart',e=>e.preventDefault(),{signal});}
 // Only the 3D stage owns wheel input. Controls and the catalogue keep normal page scrolling.
 host.addEventListener('wheel',e=>{if(e.ctrlKey||lost||disposed)return;e.preventDefault();if(gesture)gesture.moved=true;const unit=e.deltaMode===1?16:e.deltaMode===2?host.clientHeight:1;const delta=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;applyProgress(progress+delta*unit/inputDistances().wheel*path.period);},{passive:false,signal});
 document.addEventListener('ravirgo:select',e=>highlight((e as CustomEvent).detail.slug),{signal});
 const filter=()=>{selectedSlugs.clear();for(const row of document.querySelectorAll<HTMLElement>('[data-service]'))if(!row.hidden)selectedSlugs.add(row.dataset.service!);applyProgress(progress);};
 document.addEventListener('ravirgo:filter',filter,{signal});filter();
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else invalidate();},{signal});
 const intersection=new IntersectionObserver(records=>{visible=records[0].isIntersecting;if(!visible&&raf){cancelAnimationFrame(raf);raf=0;}else invalidate();});intersection.observe(stage);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
 addEventListener('resize',invalidate,{signal});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;host.dataset.ready='false';canvas.hidden=true;for(const label of labels.values())label.hidden=true;if(raf)cancelAnimationFrame(raf);raf=0;host.dataset.state='context-lost';status.textContent='3D를 복구하는 동안 서비스 목록을 이용할 수 있습니다.';},{signal});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;canvas.hidden=false;set.restoreEnvironment();makeComposer();resize();applyProgress(progress);status.textContent='3D 공간을 복구했습니다.';},{signal});
 addEventListener('pagehide',e=>{if(e.persisted){visible=false;if(raf)cancelAnimationFrame(raf);raf=0;}else dispose();},{signal});
 addEventListener('pageshow',e=>{if(e.persisted){visible=true;resize();}},{signal});
 function dispose(){if(disposed)return;disposed=true;events.abort();if(raf)cancelAnimationFrame(raf);resizeObserver.disconnect();intersection.disconnect();disposeComposer();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();set.disposeEnvironment();renderer.dispose();canvas.remove();for(const label of labels.values())label.hidden=true;section.classList.remove('is-active');section.classList.add('is-static');hint.hidden=true;progressBar.hidden=true;host.dataset.state='disposed';}
 host.dataset.quality=memory<=4?'balanced':'high';applyProgress(resumeProgress);resize();
 return dispose;
}
