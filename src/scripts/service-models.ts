import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

type Assets={geometries:Set<THREE.BufferGeometry>;materials:Set<THREE.Material>;textures:Set<THREE.Texture>;gold:THREE.MeshPhysicalMaterial;silver:THREE.MeshPhysicalMaterial;darkSilver:THREE.MeshPhysicalMaterial;paper:THREE.MeshPhysicalMaterial;renderer:THREE.WebGLRenderer;compact:boolean};
/** Native mesh construction: bevelled metal and solid, UV-mapped thermal paper. */
export function buildServiceSculpture(type:'price'|'receipt',parent:THREE.Group,a:Assets){
 const own=<T extends THREE.BufferGeometry>(g:T)=>{a.geometries.add(g);return g;};
 const add=(g:THREE.BufferGeometry,m:THREE.Material|THREE.Material[],x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 if(type==='price'){
  const heights=[1.12,1.4,1.88,2.36,2.91],metals=[a.darkSilver,a.silver,a.gold,a.gold,a.gold];
  add(own(new RoundedBoxGeometry(1.9,.055,.7,4,.022)),a.darkSilver,0,.958,0);
  for(let i=0;i<5;i++){const h=heights[i];const bar=add(own(new RoundedBoxGeometry(.34,h,.59,a.compact?3:5,.035)),metals[i],-.78+i*.39,.985+h/2,0);bar.name=`bevelled-price-bar-${i}`;}
  return;
 }
 const paper=a.paper.clone();paper.color.set('#f2eee5');paper.bumpMap=null;paper.roughness=.83;paper.specularIntensity=.22;a.materials.add(paper);
 const edge=paper.clone();edge.color.set('#d5cbbb');edge.side=THREE.DoubleSide;a.materials.add(edge);
 const stackGeometry=own(new RoundedBoxGeometry(1.35,.016,1.07,3,.005));
 for(let j=0;j<9;j++){const page=add(stackGeometry,j%3===0?edge:paper,(j%3-1)*.035,.94+j*.024,.12+(j%2)*.027);page.rotation.y=(j%3-1)*.026;}
 // Printed markings follow the paper UVs instead of floating as separate raised boxes.
 const art=document.createElement('canvas'),width=a.compact?512:1024;art.width=width;art.height=width*2;
 const ctx=art.getContext('2d')!,scale=width/1024;ctx.scale(scale,scale);ctx.fillStyle='#f4f0e7';ctx.fillRect(0,0,1024,2048);
 let seed=891;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<22000;i++){const value=random()>.5?'#877c6a':'#ffffff';ctx.globalAlpha=.035+random()*.035;ctx.fillStyle=value;ctx.fillRect(random()*1024,random()*2048,.7+random()*1.5,.7+random()*1.5);}ctx.globalAlpha=1;
 ctx.fillStyle='#45413a';ctx.textAlign='center';ctx.font='600 72px sans-serif';ctx.fillText('RECEIPT',512,220);ctx.font='26px monospace';ctx.fillText('TRANSACTION RECORD',512,275);
 const rule=(y:number,dashed=false)=>{ctx.strokeStyle='#81786b';ctx.lineWidth=2;ctx.setLineDash(dashed?[12,10]:[]);ctx.beginPath();ctx.moveTo(115,y);ctx.lineTo(909,y);ctx.stroke();ctx.setLineDash([]);};rule(340,true);
 ctx.textAlign='left';ctx.font='28px monospace';ctx.fillText('ITEM',122,410);ctx.textAlign='right';ctx.fillText('AMOUNT',902,410);rule(448);
 for(let i=0;i<8;i++){const y=525+i*104;ctx.textAlign='left';ctx.font='30px monospace';ctx.fillText(`ITEM ${String(i+1).padStart(2,'0')}`,122,y);ctx.textAlign='right';ctx.fillText(`${[12,24,8,16,32,6,18,10][i]}.00`,902,y);ctx.fillStyle='#8e8578';ctx.fillRect(122,y+22,210+(i%3)*65,5);ctx.fillStyle='#45413a';}
 rule(1390,true);ctx.textAlign='left';ctx.font='600 43px monospace';ctx.fillText('TOTAL',122,1470);ctx.textAlign='right';ctx.fillText('126.00',902,1470);
 let bx=230;while(bx<794){const w=2+Math.floor(random()*5);ctx.fillRect(bx,1610,w,130);bx+=w+2+Math.floor(random()*4);}ctx.textAlign='center';ctx.font='25px monospace';ctx.fillText('0001  0246  0812',512,1790);ctx.fillText('THANK YOU',512,1890);
 const print=new THREE.CanvasTexture(art);print.colorSpace=THREE.SRGBColorSpace;print.anisotropy=Math.min(8,a.renderer.capabilities.getMaxAnisotropy());a.textures.add(print);
 const face=paper.clone();face.map=print;face.color.set('#ffffff');a.materials.add(face);
 function sheet(points:THREE.Vector3[],sheetWidth:number,offset:number){
  const path=new THREE.CatmullRomCurve3(points,false,'catmullrom',.35);path.arcLengthDivisions=1200;path.updateArcLengths();
  const n=a.compact?112:192,m=a.compact?16:24,stride=m+1,count=(n+1)*stride,positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  // Two offset surfaces and a closed perimeter give the curls real paper thickness.
  for(const sign of [1,-1])for(let i=0;i<=n;i++){const t=i/n,p=path.getPointAt(t),tangent=path.getTangentAt(t);
   for(let j=0;j<=m;j++){const u=j/m,camber=.035*Math.sin(Math.PI*u)*Math.sin(Math.PI*t),slope=.035*Math.PI*Math.cos(Math.PI*u)*Math.sin(Math.PI*t);
    const normal=new THREE.Vector3(slope*tangent.z,-sheetWidth*tangent.z,sheetWidth*tangent.y).normalize(),thickness=.0045;
    positions.push((u-.5)*sheetWidth+normal.x*thickness*sign,p.y+camber+normal.y*thickness*sign,p.z+offset+normal.z*thickness*sign);uvs.push(u,t);
   }
  }
  for(let i=0;i<n;i++)for(let j=0;j<m;j++){const v=i*stride+j;indices.push(v,v+1,v+stride,v+1,v+stride+1,v+stride);}const frontCount=indices.length;
  for(let i=0;i<n;i++)for(let j=0;j<m;j++){const v=count+i*stride+j;indices.push(v,v+stride,v+1,v+1,v+stride,v+stride+1);}const backCount=indices.length-frontCount;
  const close=(v:number,w:number)=>indices.push(v,v+count,w,w,v+count,w+count);
  for(let i=0;i<n;i++){close(i*stride,(i+1)*stride);close((i+1)*stride+m,i*stride+m);}for(let j=0;j<m;j++){close(j+1,j);close(n*stride+j,n*stride+j+1);}
  const g=own(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.addGroup(0,frontCount,0);g.addGroup(frontCount,backCount,1);g.addGroup(frontCount+backCount,indices.length-frontCount-backCount,2);g.computeVertexNormals();g.computeBoundingSphere();const mesh=add(g,[face,paper,edge]);mesh.name='solid-printed-receipt';
 }
 sheet([new THREE.Vector3(0,1.15,.65),new THREE.Vector3(0,1.25,.2),new THREE.Vector3(0,1.77,-.15),new THREE.Vector3(0,2.38,-.25),new THREE.Vector3(0,2.98,-.6),new THREE.Vector3(0,2.99,-.96)],1.15,-.13);
 sheet([new THREE.Vector3(0,1.15,.92),new THREE.Vector3(0,1.3,.65),new THREE.Vector3(0,1.8,.36),new THREE.Vector3(0,2.06,.18),new THREE.Vector3(0,2.0,.02),new THREE.Vector3(0,1.55,.02),new THREE.Vector3(0,1.25,.14)],1.17,0);
}
