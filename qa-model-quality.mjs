import {browserOptions,baseURL} from './qa-browser.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch(browserOptions);
try {
const page=await browser.newPage({viewport:{width:720,height:500},deviceScaleFactor:2});page.setDefaultTimeout(120000);const errors=[];page.on('console',message=>{if(message.text().includes('Textures of render targets cannot be cloned'))errors.push(message.text());});page.on('pageerror',e=>errors.push(e.message));await page.goto(baseURL);await page.waitForFunction(()=>document.querySelector('#orbital-view')?.dataset.ready==='true');await page.waitForTimeout(700);
const rendered=()=>page.locator('#orbital-view').evaluate(e=>({dpr:Number(e.dataset.dpr),antialias:e.dataset.antialias,progress:Number(e.dataset.progress),width:e.querySelector('canvas').width,cssWidth:e.clientWidth}));
const desktop=await rendered();assert.equal(desktop.dpr,2);assert.equal(desktop.width,desktop.cssWidth*2);assert.equal(desktop.antialias,'MSAA 4x');
await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('#orbital-view').dataset.dpr==='1.5');const mobile=await rendered();assert.equal(mobile.antialias,'MSAA 2x');assert.equal(mobile.progress,desktop.progress);
await page.setViewportSize({width:720,height:500});await page.waitForFunction(()=>document.querySelector('#orbital-view').dataset.dpr==='2');assert.equal((await rendered()).progress,desktop.progress);
const topology=await page.evaluate(async()=>{
 const THREE=await import('/node_modules/three/build/three.module.js'),{buildServiceSculpture}=await import('/src/scripts/service-models.ts'),result=[];
 for(const compact of [false,true]){const geometries=new Set(),materials=new Set(),textures=new Set(),gold=new THREE.MeshPhysicalMaterial(),silver=gold.clone(),darkSilver=gold.clone(),paper=gold.clone(),parent=new THREE.Group();for(const m of [gold,silver,darkSilver,paper])materials.add(m);const assets={geometries,materials,textures,gold,silver,darkSilver,paper,compact,renderer:{capabilities:{getMaxAnisotropy:()=>8}}};
  buildServiceSculpture('price',parent,assets);buildServiceSculpture('receipt',parent,assets);const bars=parent.children.filter(m=>m.name.startsWith('bevelled-price-bar')),sheets=parent.children.filter(m=>m.name==='solid-printed-receipt');const data={compact,bars:bars.length,bevelSegments:bars[0].geometry.parameters.segments,paperTextureWidth:sheets[0].material[0].map.image.width,sheets:[]};
  for(const sheet of sheets){const g=sheet.geometry,p=g.attributes.position,n=g.attributes.normal,ix=g.index.array,edges=new Map();let degenerate=0;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();for(let i=0;i<ix.length;i+=3){const v=ix.slice(i,i+3);a.fromBufferAttribute(p,v[0]);b.fromBufferAttribute(p,v[1]).sub(a);c.fromBufferAttribute(p,v[2]).sub(a);if(b.cross(c).lengthSq()<1e-16)degenerate++;for(let e=0;e<3;e++){const x=v[e],y=v[(e+1)%3],key=x<y?`${x}:${y}`:`${y}:${x}`;edges.set(key,(edges.get(key)||0)+1);}}data.sheets.push({vertices:p.count,triangles:ix.length/3,degenerate,nonManifoldEdges:[...edges.values()].filter(v=>v!==2).length,finiteNormals:[...n.array].every(Number.isFinite)});}
  result.push(data);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();
 }return result;
});
for(const profile of topology){assert.equal(profile.bars,4);assert.equal(profile.sheets.length,2);assert.equal(profile.paperTextureWidth,profile.compact?512:1024);assert.equal(profile.bevelSegments,profile.compact?3:5);for(const sheet of profile.sheets){assert.equal(sheet.nonManifoldEdges,0);assert.equal(sheet.degenerate,0);assert(sheet.finiteNormals);}}
// Cache ownership, shared pending loads, default models, GLB errors and cancellation.
let requests=0;await page.route('**/qa-missing.glb',route=>{requests++;return route.fulfill({status:404,body:'missing'});});
const json=Buffer.from(JSON.stringify({asset:{version:'2.0'},buffers:[{byteLength:36}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,0,0],max:[1,2,0]}],materials:[{alphaMode:'BLEND',pbrMetallicRoughness:{baseColorFactor:[1,1,1,.4]}}],meshes:[{primitives:[{attributes:{POSITION:0},material:0}]}],nodes:[{mesh:0}],scenes:[{nodes:[0]}],scene:0}));
const jsonSize=Math.ceil(json.length/4)*4,glb=Buffer.alloc(12+8+jsonSize+8+36,32);glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(jsonSize,12);glb.writeUInt32LE(0x4e4f534a,16);json.copy(glb,20);const offset=20+jsonSize;glb.writeUInt32LE(36,offset);glb.writeUInt32LE(0x004e4942,offset+4);[-1,0,0,1,0,0,0,2,0].forEach((v,i)=>glb.writeFloatLE(v,offset+8+i*4));
await page.route('**/qa-valid.glb',route=>route.fulfill({contentType:'model/gltf-binary',body:glb}));
const registry=await page.evaluate(async()=>{
 const {ModelCache}=await import('/src/scripts/model-loader.ts'),{modelSpec,normalizeModel,defaultModel}=await import('/src/scripts/model-registry.ts'),THREE=await import('/node_modules/three/build/three.module.js');
 const renderer={capabilities:{getMaxAnisotropy:()=>8}},cache=new ModelCache(renderer,true),missing={slug:'missing',modelType:'glb',modelSource:'/qa-missing.glb'};
 const valid=await cache.acquire({slug:'valid',modelType:'glb',modelSource:'/qa-valid.glb'});const glbLoaded=valid.status==='ready';let glbAlpha=false;valid.group.traverse(o=>{if(o.isMesh)glbAlpha=o.material.transparent&&Math.abs(o.material.opacity-.4)<1e-6;});valid.release();cache.prune([],0);
 const [a,b]=await Promise.all([cache.acquire(missing),cache.acquire({...missing,slug:'same-source'})]);
 let disposed=0;a.group.traverse(m=>{if(m.isMesh)m.geometry.addEventListener('dispose',()=>disposed++);});
 const fallback=a.status==='fallback'&&b.status==='fallback',shared=cache.stats();a.release();const afterFirst=disposed;b.release();cache.dispose();const afterDispose=disposed;
 const common=new ModelCache(renderer,true);const generic=await common.acquire({slug:'unregistered'});const bounds=new THREE.Box3().setFromObject(generic.group),size=bounds.getSize(new THREE.Vector3());generic.release();common.dispose();
 const abortCache=new ModelCache(renderer,true),controller=new AbortController(),pending=abortCache.acquire(missing,controller.signal);controller.abort();let aborted=false;try{await pending;}catch{aborted=true;}abortCache.dispose();
 return {glbLoaded,glbAlpha,fallback,shared,afterFirst,afterDispose,defaultSize:size.toArray(),base:bounds.min.y,aborted};
});
assert(registry.glbLoaded);assert(registry.glbAlpha);assert(registry.fallback);assert.equal(registry.shared.entries,1);assert.equal(registry.shared.leases,2);assert.equal(registry.afterFirst,0);assert(registry.afterDispose>0);assert(registry.defaultSize[0]<=1.75001&&registry.defaultSize[1]<=1.80001&&registry.defaultSize[2]<=1.75001);assert(Math.abs(registry.base)<1e-6);assert(registry.aborted);assert(requests<=2);
assert.deepEqual(errors,[]);const result={desktop,mobile,resizeKeepsProgress:true,topology,registry,errors};mkdirSync('docs/qa',{recursive:true});writeFileSync('docs/qa/model-quality.json',JSON.stringify(result,null,2));console.log(result);
} finally {await browser.close();}
