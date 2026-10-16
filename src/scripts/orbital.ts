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

import type {Service as Featured} from '../data/services';
import {ModelCache,type ModelLease} from './model-loader';
import {MaterialFade} from './material-fade';
import {createSchedule} from './showcase-schedule';
import {profiles,initialQuality,PerformanceMonitor,type Quality} from './quality';
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
 const featured=(JSON.parse(host.dataset.featured??'[]') as Featured[]);
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:memory>4,alpha:false,powerPreference:'high-performance'});}catch{fallback('fallback');return ()=>{};}
 let disposed=false,lost=false,visible=true,raf=0,progress=0,renderCount=0,requestedAt=0;
 let manualQuality=false;let quality:Quality=initialQuality(memory,mobile(),saveData);let profile=profiles[quality];const monitor=new PerformanceMonitor();let lastFrame=0;const frameTimes:number[]=[];
 let composer:EffectComposer|undefined,bloomComposer:EffectComposer|undefined,bloom:UnrealBloomPass|undefined,fxaa:ShaderPass|undefined;
 const events=new AbortController(),signal=events.signal;
 section.hidden=false;section.classList.remove('is-static');section.classList.add('is-active');controls.hidden=false;hint.hidden=false;progressBar.hidden=false;
 const canvas=renderer.domElement;host.append(canvas);canvas.setAttribute('aria-hidden','true');
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.86;
 renderer.shadowMap.enabled=memory>4&&innerWidth>=600;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,120);
 const set=buildWorkbench(scene,renderer,Array.from({length:3},(_,i)=>({slug:`slot-${i}`})),invalidate,quality==='low');
 const {geometries,materials,textures,turntable:deck,stations}=set;
 let cache=new ModelCache(renderer,mobile()||memory<=4,quality==='low');
 const materialFade=new MaterialFade();
 const pool=[...stations.entries()].map(([id,station])=>({id,station,service:undefined as Featured|undefined,lease:undefined as ModelLease|undefined,version:0,controller:new AbortController(),placeholder:station.sculpture.children[0],fade:[] as THREE.Material[]}));
 let entries:{service:Featured;index:number;station:typeof pool[number]['station'];slot:typeof pool[number]}[]=[];
 function fading(slot:typeof pool[number]){const mats=new Set<THREE.Material>();slot.station.group.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh)for(const mat of Array.isArray(m.material)?m.material:[m.material])mats.add(mat);});slot.fade=[...mats];}
 // Each reusable station owns its materials. Cache instances own separate cloned materials.
 for(const slot of pool){const clones=new Map<THREE.Material,THREE.Material>();slot.station.group.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){const copy=(mat:THREE.Material)=>{if(!clones.has(mat)){const c=mat.clone();clones.set(mat,c);materials.add(c);}return clones.get(mat)!;};m.material=Array.isArray(m.material)?m.material.map(copy):copy(m.material);}});slot.station.group.visible=false;fading(slot);}
 function release(slot:typeof pool[number]){slot.version++;slot.controller.abort();slot.lease?.release();slot.lease=undefined;slot.service=undefined;slot.station.group.visible=false;slot.placeholder.visible=true;}
 function assign(slot:typeof pool[number],service:Featured){release(slot);slot.service=service;slot.station.light.intensity=4;slot.station.group.userData.modelState='loading';slot.controller=new AbortController();const version=slot.version;fading(slot);
  void cache.acquire(service,slot.controller.signal).then(lease=>{if(disposed||version!==slot.version){lease.release();return;}slot.lease=lease;slot.placeholder.visible=false;slot.station.sculpture.add(lease.group);slot.station.group.userData.modelState=lease.status;fading(slot);applyProgress(progress);}).catch(()=>{if(!disposed&&version===slot.version){slot.station.group.userData.modelState='fallback';invalidate();}});
 }
 const selectedSlugs=new Set(featured.map(s=>s.slug));let mobilePath=mobile(),path=createShowcasePath({mobile:mobilePath});
 let schedule=createSchedule(featured.length,profile.active,path.gap);
 const phases=new Map<string,ReturnType<typeof path.sample>&{local:number}>();
 if(config.debugPath||(import.meta.env.DEV&&new URL(location.href).searchParams.get('pathDebug')==='1')){const debug=new THREE.Group();debug.name='development-path';scene.add(debug);for(const [curve,color] of [[path.entry,'#65d5d0'],[path.orbit,'#dfbd80'],[path.exit,'#a5c9f7']] as const){const geometry=new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(300));geometries.add(geometry);const mat=new THREE.LineBasicMaterial({color,depthTest:false});materials.add(mat);debug.add(new THREE.Line(geometry,mat));}host.dataset.debugPath='true';}
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const labels=new Map([...host.querySelectorAll<HTMLAnchorElement>('[data-model-label]')].map(label=>[label.dataset.modelLabel!,label]));
 const labelPositions=new Map(featured.map(service=>[service.slug,new THREE.Vector3()]));
 const labelScreens=new Map<string,{x:number;y:number;visible:boolean}>();
 let hovered:string|null=null;
 // Sensitivity is recalculated from live layout; resizing never changes the route clock.
 const inputDistances=()=>({wheel:Math.max(1,document.documentElement.clientHeight)*config.wheelViewportHeightsPerCycle,drag:Math.max(1,host.clientWidth)*config.dragStageWidthsPerCycle});
 const bloomBlack=new THREE.MeshBasicMaterial({color:0x000000});materials.add(bloomBlack);
 const maskedMaterials=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>(),maskedSprites=new Map<THREE.Sprite,boolean>();
 function disposeComposer(){for(const chain of [composer,bloomComposer]){if(!chain)continue;for(const pass of chain.passes)pass.dispose();chain.dispose();}composer=undefined;bloomComposer=undefined;bloom=undefined;}
 function makeComposer(){disposeComposer();if(!profile.bloom){host.dataset.antialias='native';return;}
  bloomComposer=new EffectComposer(renderer);bloomComposer.renderToScreen=false;bloomComposer.addPass(new RenderPass(scene,camera));
  bloom=new UnrealBloomPass(new THREE.Vector2(1,1),profile.bloom,config.quality.bloomRadius,config.quality.bloomThreshold);bloomComposer.addPass(bloom);
  const gl=renderer.getContext() as WebGL2RenderingContext,samples=Math.min(gl.getParameter(gl.MAX_SAMPLES),profile.samples);
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples,depthBuffer:true});
  composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));host.dataset.antialias=`MSAA ${samples}x`;
  const blend=new ShaderPass({uniforms:{tDiffuse:{value:null},bloomTexture:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform sampler2D bloomTexture;varying vec2 vUv;void main(){gl_FragColor=texture2D(tDiffuse,vUv)+texture2D(bloomTexture,vUv);}'});
  // ShaderPass clones uniforms; render-target textures must be bound afterwards.
  blend.uniforms.bloomTexture.value=bloomComposer.renderTarget2.texture;
  composer.addPass(blend);composer.addPass(new OutputPass());fxaa=undefined;if(samples===0){fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);host.dataset.antialias='FXAA fallback';}
 }
 function renderScene(){
  if(!composer){renderer.render(scene,camera);return;}
  // Bloom authored light strips and the core; reflected metal and labels stay out of the mask.
  const background=scene.background;scene.background=new THREE.Color(0);
  scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.isMesh&&!mesh.userData.bloom){maskedMaterials.set(mesh,mesh.material);mesh.material=bloomBlack;}const sprite=object as THREE.Sprite;if(sprite.isSprite){maskedSprites.set(sprite,sprite.visible);sprite.visible=false;}});
  try{bloomComposer!.render();}finally{scene.background=background;for(const [mesh,material] of maskedMaterials)mesh.material=material;for(const [sprite,visible] of maskedSprites)sprite.visible=visible;maskedMaterials.clear();maskedSprites.clear();}
  composer!.render();
 }
 makeComposer();
 function positionCamera(){const view=mobile()?config.camera.mobile:config.camera.desktop;camera.fov=view.fov;
  const target=new THREE.Vector3(...view.target),position=new THREE.Vector3(Math.sin(view.azimuth)*view.distance,view.height,Math.cos(view.azimuth)*view.distance);
  // Fit the stage on portrait tablets too; wide desktop framing stays unchanged.
  const offset=position.clone().sub(target),halfH=Math.atan(Math.tan(THREE.MathUtils.degToRad(view.fov/2))*camera.aspect);offset.setLength(Math.max(offset.length(),config.camera.fitRadius/Math.sin(halfH)));position.copy(target).add(offset);
  camera.position.copy(position);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
 function resize(){if(disposed||lost)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;if(mobilePath!==mobile()){mobilePath=mobile();path=createShowcasePath({mobile:mobilePath});if(!manualQuality)setQuality(initialQuality(memory,mobile()));else{makeComposer();applyProgress(progress);}}
  renderer.shadowMap.enabled=profile.shadow>0;set.key.shadow.mapSize.set(profile.shadow||512,profile.shadow||512);renderer.setPixelRatio(Math.min(devicePixelRatio||1,profile.dpr));renderer.setSize(w,h,false);camera.aspect=w/h;positionCamera();
  composer?.setPixelRatio(renderer.getPixelRatio());composer?.setSize(w,h);bloomComposer?.setPixelRatio(1);bloomComposer?.setSize(w*profile.bloomScale,h*profile.bloomScale);bloom?.setSize(w*profile.bloomScale,h*profile.bloomScale);
  fxaa?.uniforms.resolution.value.set(1/(w*renderer.getPixelRatio()),1/(h*renderer.getPixelRatio()));
  if(bloom)bloom.strength=profile.bloom;
  renderer.shadowMap.needsUpdate=true;invalidate();
 }
 function applyProgress(value:number){progress=value;
  const filtered=featured.filter(service=>selectedSlugs.has(service.slug));
  schedule=createSchedule(filtered.length,profile.active,path.gap);
  const wanted=filtered.map((service,index)=>({service,index,local:schedule.local(progress,index)})).filter(e=>e.local<1);
  for(const slot of pool)if(slot.service&&!wanted.some(e=>e.service.slug===slot.service!.slug))release(slot);
  entries=wanted.map(({service,index})=>{let slot=pool.find(s=>s.service?.slug===service.slug);if(!slot){slot=pool.find(s=>!s.service)!;assign(slot,service);}return {service,index,station:slot.station,slot};});
  for(const label of labels.values())label.hidden=true;
  phases.clear();for(const service of featured){const index=filtered.indexOf(service),local=index<0?schedule.period:schedule.local(progress,index);phases.set(service.slug,{...path.sample(local),local});}
  for(const {service,station,slot} of entries){const sample=phases.get(service.slug)!;station.group.position.copy(sample.position);station.group.rotation.y=0;station.group.visible=true;
   const fade=THREE.MathUtils.smoothstep(sample.local,0,.035)*(1-THREE.MathUtils.smoothstep(sample.local,.965,1));for(const material of slot.fade)materialFade.apply(material,fade);
  }
  // Preload both directions; reversal does not wait on a different loading order.
  const parked=filtered.map((service,index)=>({service,local:schedule.local(progress,index)})).filter(e=>e.local>=1);
  const next=parked.toSorted((a,b)=>b.local-a.local)[0]?.service,previous=parked.toSorted((a,b)=>a.local-b.local)[0]?.service;
  const keep=[...entries.map(e=>e.service),...[next,previous].filter((s):s is Featured=>!!s)];for(const service of [next,previous])if(service)cache.preload(service);cache.prune(keep,profile.active+2);
  set.updateConnections(new Set(entries.filter(({service})=>phases.get(service.slug)?.phase==='orbit').map(({slot})=>slot.id)));
  const cycle=schedule.local(progress,0)/schedule.period;progressFill.style.transform=`scaleX(${cycle})`;progressBar.setAttribute('aria-valuenow',String(Math.round(cycle*100)));
  host.dataset.progress=String(progress);host.dataset.timing=JSON.stringify({entryEnd:path.entryEnd,orbitEnd:path.orbitEnd,gap:schedule.gap,period:schedule.period,inputPeriod:path.period});renderer.shadowMap.needsUpdate=true;invalidate();
 }
 function invalidate(){if(!raf&&!disposed&&!lost&&visible&&!document.hidden){requestedAt=performance.now();raf=requestAnimationFrame(frame);}}
 function frame(){const queueWait=performance.now()-requestedAt;raf=0;if(disposed||lost||!visible||document.hidden)return;scene.updateMatrixWorld();
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
  const elapsed=performance.now()-begin,interval=lastFrame?begin-lastFrame:0;lastFrame=begin;
  // A gap caused by an idle user is not a slow animation frame.
  if(interval>0&&interval<250){frameTimes.push(interval);if(frameTimes.length>180)frameTimes.shift();}
  if(monitor.observe(Math.max(elapsed,queueWait))&&quality!=='low')setQuality(quality==='high'?'balanced':'low');
  host.dataset.performance=JSON.stringify({frames:frameTimes.length,meanFrameMs:frameTimes.length?frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length:0,submitMs:elapsed,queueWaitMs:queueWait,memory:renderer.info.memory,cache:cache.stats(),active:entries.length});
  // Small declarative diagnostics make actual transforms, occlusion depth and parking testable.
  host.dataset.orbit=JSON.stringify(featured.map(service=>{const entry=entries.find(e=>e.service.slug===service.slug),phase=phases.get(service.slug)!,p=phase.position;
   const projected=entry?entry.station.sculpture.localToWorld(new THREE.Vector3(0,.9,0)).project(camera):p.clone().project(camera),label=labelScreens.get(service.slug);
   return {slug:service.slug,visible:!!entry,phase:phase.phase,segment:phase.segment,local:phase.local,connected:!!entry&&phase.phase==='orbit',x:p.x,y:p.y,z:p.z,yaw:0,distance:camera.position.distanceTo(p),screenX:(projected.x*.5+.5)*host.clientWidth,screenY:(-.5*projected.y+.5)*host.clientHeight,labelX:label?.x,labelY:label?.y,labelVisible:!!entry&&!!label?.visible,modelState:entry?.station.group.userData.modelState};}));
  host.dataset.fixed=JSON.stringify({deck:deck.rotation.toArray().slice(0,3),core:set.coreEmitter.getWorldPosition(new THREE.Vector3()).toArray(),camera:camera.position.toArray()});
  host.dataset.dpr=String(renderer.getPixelRatio());host.dataset.renderCount=String(renderCount);host.dataset.ready='true';host.dataset.state='webgl';host.dataset.bloom=profile.bloom?'selective':'off';host.dataset.quality=quality;
 }
 const hit=(clientX:number,clientY:number)=>{const rect=canvas.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
  const intersection=raycaster.intersectObjects(entries.filter(e=>e.station.group.visible).map(e=>e.station.group),true).find(hit=>{const object=hit.object as THREE.Mesh;const mats=Array.isArray(object.material)?object.material:[object.material];let parent:THREE.Object3D|null=object;while(parent){if(!parent.visible)return false;parent=parent.parent;}return mats.some(m=>m?.visible&&m.opacity>.05);});if(!intersection)return;
  // Station raycast alone could select a model behind the fixed stone/core. Respect foreground occluders.
  const occluder=raycaster.intersectObjects(set.world.children.filter(c=>c!==deck).concat(deck.children.filter(c=>!pool.some(s=>s.station.group===c))),true).find(hit=>{let o:THREE.Object3D|null=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});if(occluder&&occluder.distance<intersection.distance-.02)return;
  return entries.find(e=>{let node:THREE.Object3D|null=intersection.object;while(node){if(node===e.station.group)return true;node=node.parent;}return false;});};
 const highlight=(slug:string|null)=>{if(hovered===slug)return;hovered=slug;canvas.dataset.hover=String(!!slug);for(const label of labels.values())label.classList.toggle('is-selected',label.dataset.modelLabel===slug);for(const {service,station} of entries)station.light.intensity=service.slug===slug?12:4;invalidate();};
 let blockLabelClick=false;
 let gesture:{x:number;y:number;scroll:number;progress:number;time:number;moved:boolean;lastX:number;horizontal:boolean}|undefined;
 host.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;blockLabelClick=false;gesture={x:e.clientX,y:e.clientY,scroll:scrollY,progress,time:performance.now(),moved:false,lastX:e.clientX,horizontal:false};},{signal});
 host.addEventListener('pointermove',e=>{if(gesture){const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>6)gesture.moved=true;if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.3)gesture.horizontal=true;if(gesture.horizontal){applyProgress(progress+(gesture.lastX-e.clientX)/inputDistances().drag*path.period);host.setPointerCapture(e.pointerId);}gesture.lastX=e.clientX;}if(e.pointerType==='mouse')highlight(hit(e.clientX,e.clientY)?.service.slug??null);},{signal});
 host.addEventListener('pointerleave',()=>highlight(null),{signal});
 host.addEventListener('pointercancel',()=>{gesture=undefined;},{signal});
 host.addEventListener('pointerup',e=>{const g=gesture;gesture=undefined;blockLabelClick=!g||g.moved||Math.hypot(e.clientX-g.x,e.clientY-g.y)>6||Math.abs(scrollY-g.scroll)>3||Math.abs(progress-g.progress)>.002||performance.now()-g.time>600;if(blockLabelClick||(e.target as Element).closest('[data-model-label]'))return;const entry=hit(e.clientX,e.clientY);if(entry)location.assign(entry.service.url);},{signal});
 for(const label of labels.values()){label.addEventListener('focus',()=>highlight(label.dataset.modelLabel!),{signal});label.addEventListener('blur',()=>highlight(null),{signal});label.addEventListener('click',e=>{if(e.detail!==0&&blockLabelClick)e.preventDefault();},{signal});label.addEventListener('dragstart',e=>e.preventDefault(),{signal});}
 // Only the 3D stage owns wheel input. Controls and the catalogue keep normal page scrolling.
 host.addEventListener('wheel',e=>{if(e.ctrlKey||lost||disposed||e.altKey||e.clientY>host.getBoundingClientRect().bottom-90)return;e.preventDefault();if(gesture)gesture.moved=true;const unit=e.deltaMode===1?16:e.deltaMode===2?host.clientHeight:1;const delta=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;applyProgress(progress+delta*unit/inputDistances().wheel*path.period);},{passive:false,signal});
 function setQuality(value:Quality){quality=value;const select=section.querySelector<HTMLSelectElement>('select[data-quality]');if(select)select.value=quality;profile=profiles[quality];for(const slot of pool)release(slot);cache.dispose();cache=new ModelCache(renderer,quality!=='high',quality==='low');set.key.shadow.map?.dispose();set.key.shadow.map=null;makeComposer();applyProgress(progress);resize();}
 section.querySelector<HTMLSelectElement>('select[data-quality]')?.addEventListener('change',e=>{manualQuality=true;setQuality((e.target as HTMLSelectElement).value as Quality);},{signal});
 for(const button of section.querySelectorAll<HTMLButtonElement>('[data-step]'))button.addEventListener('click',()=>applyProgress(progress+Number(button.dataset.step)*schedule.gap),{signal});
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
 function dispose(){if(disposed)return;disposed=true;events.abort();for(const slot of pool)release(slot);cache.dispose();if(raf)cancelAnimationFrame(raf);resizeObserver.disconnect();intersection.disconnect();disposeComposer();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();set.disposeEnvironment();renderer.dispose();canvas.remove();for(const label of labels.values())label.hidden=true;host.dataset.ready='false';section.classList.remove('is-active');section.classList.add('is-static');hint.hidden=true;progressBar.hidden=true;host.dataset.state='disposed';}
 host.dataset.quality=quality;const qualitySelect=section.querySelector<HTMLSelectElement>('select[data-quality]');if(qualitySelect)qualitySelect.value=quality;host.dataset.ready='false';applyProgress(resumeProgress);resize();
 return dispose;
}
