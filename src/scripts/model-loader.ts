import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import type {Service} from '../data/services';
import {defaultModel,disposeModel,modelSpec,normalizeModel,proceduralModel} from './model-registry';

type RecordEntry={promise:Promise<THREE.Group>;root?:THREE.Group;refs:number;used:number;status:'loading'|'ready'|'fallback';controller:AbortController};
export type ModelLease={group:THREE.Group;status:string;release:()=>void};
/** Cache owns geometry/textures; leases own cloned materials. Release before pruning.
 * One pending promise per configuration; stale completions never attach to a scene. */
export class ModelCache {
 private records=new Map<string,RecordEntry>();
 private closed=false;
 constructor(private renderer:THREE.WebGLRenderer,private compact=false,private low=false){}
 private key(s:Service){return JSON.stringify(modelSpec(s,this.low));}
 private entry(service:Service){
  if(this.closed)throw new Error('Model cache disposed');
  const key=this.key(service),existing=this.records.get(key);if(existing){existing.used=performance.now();return existing;}
  const entry:RecordEntry={promise:Promise.resolve(new THREE.Group()),refs:0,used:performance.now(),status:'loading',controller:new AbortController()};this.records.set(key,entry);
  entry.promise=this.load(service,entry).then(root=>{if(this.closed||entry.controller.signal.aborted){disposeModel(root);throw new Error('Model load cancelled');}entry.root=root;return root;});
  return entry;
 }
 private async load(service:Service,entry:RecordEntry){
  const spec=modelSpec(service,this.low);let model:THREE.Group|undefined;
  try{
   if(spec.type==='glb'){
    if(!spec.source)throw new Error('Missing GLB source');
    // Abort transport on teardown; parsing completion is guarded by the cache token.
    const response=await fetch(spec.source,{signal:entry.controller.signal});if(!response.ok)throw new Error(`GLB ${response.status}`);
    const bytes=await response.arrayBuffer();const gltf=await new GLTFLoader().parseAsync(bytes,new URL('.',new URL(spec.source,location.href)).href);model=gltf.scene;
   }else if(spec.type==='procedural')model=proceduralModel(spec.source,this.renderer,this.compact);
   else model=defaultModel();
   if(spec.type==='poster'&&spec.poster){
    const response=await fetch(spec.poster,{signal:entry.controller.signal});if(!response.ok)throw new Error('Poster unavailable');
    const blob=await response.blob();const url=URL.createObjectURL(blob);
    try{const texture=await new THREE.TextureLoader().loadAsync(url);texture.colorSpace=THREE.SRGBColorSpace;const face=model.getObjectByName('poster-face') as THREE.Mesh<THREE.PlaneGeometry,THREE.MeshStandardMaterial>;face.material.map=texture;face.material.color.set('#ffffff');}finally{URL.revokeObjectURL(url);}
   }
   const root=normalizeModel(model,spec);entry.status='ready';return root;
  }catch(error){if(model)disposeModel(model);if(entry.controller.signal.aborted)throw error;entry.status='fallback';return normalizeModel(defaultModel(),spec);}
 }
 async acquire(service:Service,signal?:AbortSignal):Promise<ModelLease>{
  const entry=this.entry(service);entry.refs++;
  let abort:()=>void=()=>{};
  try{
   const cancelled=new Promise<never>((_,reject)=>{abort=()=>reject(new Error('Lease cancelled'));if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});});
   const root=await Promise.race([entry.promise,cancelled]);if(this.closed)throw new Error('Model cache disposed');
   const group=clone(root) as THREE.Group,owned=new Map<THREE.Material,THREE.Material>();
   group.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;const copy=(m:THREE.Material)=>{if(!owned.has(m))owned.set(m,m.clone());return owned.get(m)!;};mesh.material=Array.isArray(mesh.material)?mesh.material.map(copy):copy(mesh.material);});
   let released=false;return {group,status:entry.status,release:()=>{if(released)return;released=true;group.removeFromParent();group.traverse(o=>{if((o as THREE.SkinnedMesh).isSkinnedMesh)(o as THREE.SkinnedMesh).skeleton.dispose();});for(const m of owned.values())m.dispose();entry.refs--;if(this.closed&&entry.refs===0&&entry.root){disposeModel(entry.root);entry.root=undefined;}}};
  }catch(error){entry.refs--;if(this.closed&&entry.refs===0&&entry.root){disposeModel(entry.root);entry.root=undefined;}throw error;}finally{signal?.removeEventListener('abort',abort);}
 }
 preload(service:Service){if(!this.closed)void this.entry(service).promise.catch(()=>{});}
 prune(keep:Service[],limit=5){const keys=new Set(keep.map(s=>this.key(s)));const candidates=[...this.records].filter(([key,e])=>!keys.has(key)&&e.refs===0).sort((a,b)=>a[1].used-b[1].used);for(const [key,e] of candidates){if(this.records.size<=limit)break;e.controller.abort();if(e.root)disposeModel(e.root);this.records.delete(key);}}
 stats(){return {entries:this.records.size,leases:[...this.records.values()].reduce((n,e)=>n+e.refs,0),loading:[...this.records.values()].filter(e=>e.status==='loading').length};}
 dispose(){if(this.closed)return;this.closed=true;for(const e of this.records.values()){e.controller.abort();if(e.refs===0&&e.root){disposeModel(e.root);e.root=undefined;}}this.records.clear();}
}
