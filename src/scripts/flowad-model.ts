import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/** A compact sculpture built entirely from real meshes for the orbital podium. */
export function buildFlowad(parent:THREE.Group, geometries:Set<THREE.BufferGeometry>, materials:Set<THREE.Material>, compact:boolean){
 const geometry=<T extends THREE.BufferGeometry>(g:T)=>{geometries.add(g);return g;};
 const material=(color:number,metalness:number,roughness:number,emissive=0)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:.35});materials.add(m);return m;};
 const road=material(0x242f32,.35,.6),side=material(0x323a3c,.7,.38),gold=material(0xd9aa5d,.65,.3,0x684117),white=material(0xe5dfc8,.25,.55),mountain=material(0x17363d,.45,.55),silver=material(0xc5c9c8,.72,.3),glass=material(0x172c35,.45,.18),tire=material(0x121719,.1,.8);
 const add=(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 // A sampled ribbon makes a solid, raised road with realistic edge and lane lines.
 const path=new THREE.CatmullRomCurve3([new THREE.Vector3(.55,.18,.78),new THREE.Vector3(-.58,.28,.45),new THREE.Vector3(-.37,.50,.05),new THREE.Vector3(.52,.76,-.33),new THREE.Vector3(.08,1.02,-.82)],false,'catmullrom',.25);
 const n=compact?48:96,w=.31,verts:number[]=[],idx:number[]=[];
 for(let i=0;i<=n;i++){const t=i/n,p=path.getPoint(t),d=path.getTangent(t),l=Math.hypot(d.x,d.z),nx=-d.z/l,nz=d.x/l;for(const y of [0,-.10])for(const s of [-1,1])verts.push(p.x+nx*w*s,p.y+y,p.z+nz*w*s);}
 for(let i=0;i<n;i++){const a=i*4,b=a+4;idx.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);}idx.push(0,1,2,1,3,2,n*4,n*4+2,n*4+1,n*4+1,n*4+2,n*4+3);
 const ribbon=geometry(new THREE.BufferGeometry());ribbon.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));ribbon.setIndex(idx);ribbon.computeVertexNormals();add(ribbon,road).name='flowad-road';
 for(const s of [-1,1]){const points:THREE.Vector3[]=[];for(let i=0;i<=n;i++){const t=i/n,p=path.getPoint(t),d=path.getTangent(t),l=Math.hypot(d.x,d.z);points.push(new THREE.Vector3(p.x-d.z/l*w*.89*s,p.y+.012,p.z+d.x/l*w*.89*s));}add(geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),n,.011,6,false)),gold);}
 for(let i=0;i<9;i++){const t=.06+i*.105,p=path.getPoint(t),d=path.getTangent(t);const line=add(geometry(new THREE.BoxGeometry(.025,.009,.075)),white,p.x,p.y+.014,p.z);line.rotation.y=Math.atan2(d.x,d.z);}
 // Two low-poly silhouettes stand behind the road, keeping the scene legible at thumbnail size.
 function peak(x:number,y:number,z:number,r:number,h:number){const g=geometry(new THREE.ConeGeometry(r,h,3));const o=add(g,mountain,x,y+h/2,z);o.rotation.y=Math.PI/6;}
 peak(-.55,0,-.48,.45,1.05);peak(-.12,0,-.80,.37,1.33);
 const t=.31,p=path.getPoint(t),d=path.getTangent(t);const car=new THREE.Group();car.position.copy(p);car.position.y+=.095;car.rotation.y=Math.atan2(d.x,d.z);parent.add(car);
 const part=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number)=>{const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;car.add(mesh);};
 part(geometry(new RoundedBoxGeometry(.20,.085,.38,3,.025)),silver,0,0,0);part(geometry(new RoundedBoxGeometry(.16,.065,.19,3,.025)),glass,0,.064,-.01);
 const wheel=geometry(new THREE.CylinderGeometry(.04,.04,.025,12));for(const x of [-.105,.105])for(const z of [-.115,.115]){const m=new THREE.Mesh(wheel,tire);m.rotation.z=Math.PI/2;m.position.set(x,-.025,z);car.add(m);}
}
