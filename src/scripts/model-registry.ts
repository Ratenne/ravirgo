import * as THREE from 'three';
import type {Service} from '../data/services';
import {buildServiceSculpture} from './service-models';

export type ModelSpec=ReturnType<typeof modelSpec>;
export function modelSpec(service:Service,low=false){
 return {type:low?'poster':service.modelType??(service.exhibit?'procedural':'poster'),
  source:service.modelSource??service.exhibit??'',poster:service.poster,
  scale:Math.max(.25,Math.min(1,service.scale??1)),rotation:service.rotation??[0,0,0]} as const;
}
export function defaultModel(){
 const group=new THREE.Group();
 const frame=new THREE.Mesh(new THREE.BoxGeometry(1.55,1.2,.15),new THREE.MeshStandardMaterial({color:'#bc965e',metalness:.8,roughness:.45}));
 frame.position.y=.6;group.add(frame);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.05),new THREE.MeshStandardMaterial({color:'#152b43',roughness:.8}));
 face.position.set(0,.6,.081);face.name='poster-face';group.add(face);
 const mark=new THREE.Mesh(new THREE.TorusGeometry(.29,.025,8,32),new THREE.MeshStandardMaterial({color:'#dfbd80',metalness:.6,roughness:.4}));mark.position.set(0,.6,.1);group.add(mark);
 return group;
}
export function proceduralModel(source:string,renderer:THREE.WebGLRenderer,compact:boolean){
 if(source!=='price'&&source!=='receipt')return defaultModel();
 const group=new THREE.Group(),geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const gold=new THREE.MeshPhysicalMaterial({color:'#c69750',roughness:.42,metalness:.88}),silver=gold.clone(),darkSilver=gold.clone(),paper=new THREE.MeshPhysicalMaterial({color:'#e4d7ba',roughness:.88});
 silver.color.set('#87939d');darkSilver.color.set('#424f60');
 buildServiceSculpture(source,group,{geometries,materials,textures,gold,silver,darkSilver,paper,renderer,compact});
 // Dispose unused palette members too; the cache owns every factory allocation.
 group.userData.extraMaterials=[gold,silver,darkSilver,paper,...materials];
 return group;
}
/** Apply rotation before measuring; preserve aspect ratio and anchor the base at y=0.
 * A bounded scale cannot break the common 2.32-unit podium footprint. */
export function normalizeModel(model:THREE.Group,spec:ModelSpec){
 const anchor=new THREE.Group(),pivot=new THREE.Group();anchor.name='model-anchor';pivot.add(model);anchor.add(pivot);
 model.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
 model.rotation.set(...spec.rotation as [number,number,number]);model.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const factor=Math.min(1.75/Math.max(size.x,1e-6),1.75/Math.max(size.z,1e-6),1.8/Math.max(size.y,1e-6))*spec.scale;
 if(box.isEmpty()||!Number.isFinite(factor))throw new Error('Empty or invalid model bounds');
 model.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));pivot.scale.setScalar(factor);
 return anchor;
}
export function disposeModel(root:THREE.Object3D){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 root.traverse(o=>{const m=o as THREE.Mesh;if((o as THREE.SkinnedMesh).isSkinnedMesh)(o as THREE.SkinnedMesh).skeleton.dispose();if(m.isMesh){geometries.add(m.geometry);for(const mat of Array.isArray(m.material)?m.material:[m.material])materials.add(mat);}for(const mat of o.userData.extraMaterials??[])materials.add(mat);});
 for(const mat of materials)for(const value of Object.values(mat))if(value instanceof THREE.Texture)textures.add(value);
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures){t.dispose();const image=t.source.data;if(typeof ImageBitmap!=='undefined'&&image instanceof ImageBitmap)image.close();}
}
