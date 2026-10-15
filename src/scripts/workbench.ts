import * as THREE from 'three';
import {showcaseConfig} from './showcase-config';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type Featured={slug:string;exhibit:'price'|'receipt'};
/** Authored architectural set, derived from the approved orbital-v2 model silhouettes. */
export function buildWorkbench(scene:THREE.Scene,renderer:THREE.WebGLRenderer,featured:Featured[],invalidate:()=>void){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const own=<T extends THREE.BufferGeometry>(g:T)=>{geometries.add(g);return g;};
 const material=(color:string,roughness:number,metalness:number)=>{const m=new THREE.MeshPhysicalMaterial({color,roughness,metalness});materials.add(m);return m;};
 const stone=material('#233349',.52,.12),edgeStone=material('#1b293b',.5,.12),gold=material('#cba567',.4,.94),silver=material('#71808a',.34,.9),darkSilver=material('#3e4855',.38,.8),paper=material('#e4d7ba',.88,0);
 const lightMat=material('#ffcc76',.4,.1);lightMat.emissive.set('#ffb953');lightMat.emissiveIntensity=1.25;gold.anisotropy=.3;gold.anisotropyRotation=Math.PI/2;gold.clearcoat=.1;gold.clearcoatRoughness=.3;gold.envMapIntensity=.7;
 // Seeded multi-scale stone maps: broad mineral structure, etched veins and fine pores.
 const size=512;let seed=381;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const fields=[4,12,35,100].map(n=>({n,data:Float32Array.from({length:(n+1)*(n+1)},random)}));
 const noise=(x:number,y:number,f:typeof fields[number])=>{const px=x*f.n,py=y*f.n,ix=Math.floor(px),iy=Math.floor(py),a=px-ix,b=py-iy,u=a*a*(3-2*a),v=b*b*(3-2*b),at=(xx:number,yy:number)=>f.data[yy*(f.n+1)+xx];return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(ix,iy),at(ix+1,iy),u),THREE.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),u),v);};
 const albedo=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const a=noise(x/size,y/size,fields[0]),b=noise(x/size,y/size,fields[1]),c=noise(x/size,y/size,fields[2]),d=noise(x/size,y/size,fields[3]);const vein=Math.pow(Math.max(0,1-Math.abs(Math.sin(x*.023+y*.013+a*7+b*2))*16),2);const grain=random();const value=145+a*30+b*20+c*15+d*8+vein*18+grain*8;const i=(y*size+x)*4;albedo.set([value*.94,value*.98,value,255],i);const r=150+a*36+c*20-vein*12;rough.set([r,r,r,255],i);const h=120+b*30+c*22+d*12-vein*14+grain*6;height.set([h,h,h,255],i);}
 function dataMap(data:Uint8Array,color=false){const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.needsUpdate=true;textures.add(t);return t;}
 const stoneColor=dataMap(albedo,true),stoneRough=dataMap(rough),stoneHeight=dataMap(height);
 for(const m of [stone,edgeStone]){m.map=stoneColor;m.roughnessMap=stoneRough;m.bumpMap=stoneHeight;m.bumpScale=.055;m.envMapIntensity=.23;m.specularIntensity=.32;}
 const brushed=new Uint8Array(size*size*4);for(let y=0;y<size;y++){const stripe=195+random()*8;for(let x=0;x<size;x++){const i=(y*size+x)*4,v=stripe+random()*3;brushed.set([v,v,v,255],i);}}
 gold.roughnessMap=dataMap(brushed);gold.bumpMap=gold.roughnessMap;gold.bumpScale=.001;
 paper.bumpMap=stoneHeight;paper.bumpScale=.012;paper.specularIntensity=.15;
 function studio(){const r=new RoomEnvironment();const card=new THREE.Mesh(new THREE.PlaneGeometry(6,8),new THREE.MeshBasicMaterial({color:'#92734d'}));card.position.set(-3,2,2);card.lookAt(0,1,0);r.add(card);return r;}
 const pmrem=new THREE.PMREMGenerator(renderer),room=studio();let environment=pmrem.fromScene(room,.06);scene.environment=environment.texture;scene.environmentIntensity=.75;room.dispose();pmrem.dispose();
 function restoreEnvironment(){environment.dispose();const p=new THREE.PMREMGenerator(renderer),r=studio();environment=p.fromScene(r,.06);scene.environment=environment.texture;r.dispose();p.dispose();}
 const world=new THREE.Group(),turntable=new THREE.Group();scene.add(world);world.add(turntable);
 function mesh(geometry:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,shadows=true){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=shadows;m.receiveShadow=shadows;parent.add(m);return m;}
 function box(w:number,h:number,d:number,mat:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,bevel=.025){return mesh(own(new RoundedBoxGeometry(w,h,d,2,bevel)),mat,parent,x,y,z);}
 function cylinder(radius:number,h:number,mat:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0){const g=own(new THREE.LatheGeometry([new THREE.Vector2(0,-h/2),new THREE.Vector2(radius-.035,-h/2),new THREE.Vector2(radius,-h/2+.035),new THREE.Vector2(radius,h/2-.035),new THREE.Vector2(radius-.035,h/2),new THREE.Vector2(0,h/2)],128));const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){if(Math.abs(p.getY(i))>h/2-.04){uv.setXY(i,p.getX(i)*.18,p.getZ(i)*.18);}else uv.setXY(i,Math.atan2(p.getX(i),p.getZ(i))*radius*.18,p.getY(i)*.5);}return mesh(g,mat,parent,x,y,z);}
 function ring(r:number,y:number,mat:THREE.Material,parent:THREE.Object3D,x=0,z=0,tube=.015){const m=mesh(own(new THREE.TorusGeometry(r,tube,8,160)),mat,parent,x,y,z,false);m.rotation.x=-Math.PI/2;return m;}
 function arcSlab(outer:number,inner:number,h:number,y:number,mat:THREE.Material,parent:THREE.Object3D,start=0,end=Math.PI){const shape=new THREE.Shape();shape.absarc(0,0,outer,start,end,false);shape.lineTo(Math.cos(end)*inner,Math.sin(end)*inner);shape.absarc(0,0,inner,end,start,true);shape.closePath();const g=own(new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,curveSegments:96}));const m=mesh(g,mat,parent,0,y,0);m.rotation.x=-Math.PI/2;return m;}
 // A single substantial stone drum, inset upper surface, and broad inhabited perimeter walkway.
 cylinder(10.2,.38,edgeStone,world,0,-.66,0);
 cylinder(8.45,.32,stone,world,0,-.34,0);
 cylinder(6.6,.83,edgeStone,turntable,0,.145,0);
 cylinder(6.53,.09,stone,turntable,0,.585,0);
 ring(6.58,-.225,lightMat,turntable,0,0,.024);ring(6.5,.63,gold,turntable,0,0,.012);ring(5.3,.635,darkSilver,turntable,0,0,.012);
 // Stone panel joints are recessed dark radial cuts, with a restrained pair of metal inlays.
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const seam=box(1.17,.008,.018,edgeStone,turntable,Math.sin(a)*5.91,.633,Math.cos(a)*5.91,.001);seam.rotation.y=a+Math.PI/2;}
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const seam=box(1.7,.008,.018,edgeStone,world,Math.sin(a)*7.51,-.172,Math.cos(a)*7.51,.001);seam.rotation.y=a+Math.PI/2;}
 // Fixed front access stairs and thick cheeks join the stationary deck.
 const stairAngle=-.18;const stairs=new THREE.Group();stairs.rotation.y=stairAngle;world.add(stairs);
 for(let i=0;i<4;i++)box(1.7,.18,.43,stone,stairs,0,-.08+i*.2,7.65-i*.4,.018);
 for(const sign of [-1,1]){const cheek=box(.25,.3,1.88,edgeStone,stairs,sign*.98,.23,7.05);cheek.rotation.x=.45;}
 // Low segmented parapet, with a single monumental pier and partial overhead lintel.
 for(let i=0;i<14;i++){const start=.035+i*(Math.PI-.07)/14,end=start+(Math.PI-.07)/14-.006;arcSlab(9.15,8.55,1.7,-.5,edgeStone,world,start,end);}
 const stripCurve=new THREE.CatmullRomCurve3(Array.from({length:100},(_,i)=>{const a=.02+i/99*(Math.PI-.04);return new THREE.Vector3(Math.cos(a)*8.54,-.25,-Math.sin(a)*8.54);}));mesh(own(new THREE.TubeGeometry(stripCurve,120,.022,6,false)),lightMat,world,0,0,0,false);
 box(1.65,6.1,1.25,edgeStone,world,7.45,2.55,-5.9,.035);
 box(13,.55,2.05,edgeStone,world,1.85,5.83,-5.9,.035);
 box(.035,5.8,.025,gold,world,6.61,2.55,-5.25,.005);
 // Grazing light pools sit continuously along the concealed strip, not floating white spotlights.
 RectAreaLightUniformsLib.init();
 for(let i=0;i<5;i++){const a=.15+i/4*(Math.PI-.3);const light=new THREE.RectAreaLight('#ffb568',4,3.2,.2);light.position.set(Math.cos(a)*8.35,.05,-Math.sin(a)*8.35);light.lookAt(Math.cos(a)*6.8,-.2,-Math.sin(a)*6.8);world.add(light);}
 const coreX=showcaseConfig.core.x,coreZ=showcaseConfig.core.z;
 cylinder(1.02,.34,gold,turntable,coreX,.86,coreZ);cylinder(.82,.12,edgeStone,turntable,coreX,1.08,coreZ);cylinder(.64,.13,gold,turntable,coreX,1.17,coreZ);const coreMat=lightMat.clone();coreMat.emissiveIntensity=3.2;materials.add(coreMat);const coreEmitter=cylinder(.39,.025,coreMat,turntable,coreX,1.25,coreZ);ring(.91,1.04,gold,turntable,coreX,coreZ,.033);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const ctx=glowCanvas.getContext('2d')!;const grad=ctx.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,220,155,.7)');grad.addColorStop(.18,'rgba(255,180,76,.22)');grad.addColorStop(1,'rgba(255,156,49,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(glowCanvas);textures.add(glowTexture);
 function glow(x:number,y:number,z:number,scale:number){const m=new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.4});materials.add(m);const sprite=new THREE.Sprite(m);sprite.position.set(x,y,z);sprite.scale.set(scale,scale*.6,1);turntable.add(sprite);}
 glow(coreX,1.3,coreZ,2.6);const coreLight=new THREE.PointLight('#ffbc69',14,7,2);coreLight.position.set(coreX,1.55,coreZ);turntable.add(coreLight);
 const stations=new Map<string,{group:THREE.Group;highlight:THREE.Mesh;light:THREE.PointLight;type:string;sculpture:THREE.Group}>();
 for(let index=0;index<featured.length;index++){
  const entry=featured[index],group=new THREE.Group();const a=featured.length<=2?(index===0?-1.08:1.05):-1.3+index*.85;const x=Math.sin(a)*3.35,z=-Math.cos(a)*2.6;group.position.set(x,.1,z);group.scale.setScalar(1.18);world.updateMatrixWorld();turntable.add(group);
  cylinder(1.16,.36,edgeStone,group,0,.65,0);cylinder(1.12,.055,gold,group,0,.855,0);cylinder(1.03,.045,stone,group,0,.9,0);const highlight=ring(1.145,.49,lightMat,group,0,0,.021);
  const accent=new THREE.PointLight('#ffc477',4,4.5,2);accent.position.set(0,.58,0);group.add(accent);
  const sculpture=new THREE.Group();group.add(sculpture);
  if(entry.exhibit==='price'){
   const heights=[1.12,1.4,1.88,2.36,2.91],mats=[darkSilver,silver,gold,gold,gold];for(let i=0;i<5;i++){const h=heights[i];box(.37,h,.54,mats[i],sculpture,-.77+i*.37,.94+h/2,0,.012);}
  }else{
   for(let j=0;j<9;j++){const page=box(1.35,.018,1.07,paper,sculpture,(j%3-1)*.045,.94+j*.024,.12+(j%2)*.035,.005);page.rotation.y=(j%3-1)*.035;}
   const ink=material('#a89a82',.95,0);
   function sheet(points:THREE.Vector3[],width:number,offset:number){const path=new THREE.CatmullRomCurve3(points,false,'catmullrom',.35),positions:number[]=[],uvs:number[]=[],indices:number[]=[],n=96;for(let i=0;i<=n;i++){const t=i/n,p=path.getPoint(t);for(let side=0;side<=12;side++){const sx=(side/12-.5)*width;positions.push(sx,p.y+Math.sin(side/12*Math.PI)*.06,p.z+offset);uvs.push(side/12,t);}}for(let i=0;i<n;i++)for(let j=0;j<12;j++){const a=i*13+j;indices.push(a,a+13,a+1,a+1,a+13,a+14);}const g=own(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();const pm=paper.clone();pm.side=THREE.DoubleSide;materials.add(pm);mesh(g,pm,sculpture);
    for(const side of [-1,1]){const edge=new THREE.CatmullRomCurve3(Array.from({length:97},(_,i)=>{const p=path.getPoint(i/96);return new THREE.Vector3(side*width/2,p.y,p.z+offset);}));mesh(own(new THREE.TubeGeometry(edge,96,.008,4,false)),paper,sculpture);}
    for(let i=0;i<17;i++){const t=.08+i*.048,p=path.getPoint(t),v=path.getTangent(t);const line=box(i%4===0?width*.48:width*.72,.012,.004,ink,sculpture,i%4===0?-width*.1:0,p.y+.008,p.z+offset+.012,.001);line.rotation.x=Math.atan2(v.z,v.y);}
   }
   sheet([new THREE.Vector3(0,1.15,.65),new THREE.Vector3(0,1.25,.2),new THREE.Vector3(0,1.77,-.15),new THREE.Vector3(0,2.38,-.25),new THREE.Vector3(0,2.98,-.6),new THREE.Vector3(0,2.99,-.96)],1.15,-.13);
   sheet([new THREE.Vector3(0,1.15,.92),new THREE.Vector3(0,1.3,.65),new THREE.Vector3(0,1.8,.36),new THREE.Vector3(0,2.06,.18),new THREE.Vector3(0,2.0,.02),new THREE.Vector3(0,1.55,.02),new THREE.Vector3(0,1.25,.14)],1.17,0);
  }
  stations.set(entry.slug,{group,highlight,light:accent,type:entry.exhibit,sculpture});
 }
 const key=new THREE.DirectionalLight('#ffe4bd',2.5);key.position.set(-4,8,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:.5,far:35});key.shadow.bias=-.0002;key.shadow.normalBias=.025;key.shadow.radius=3;scene.add(key);
 const fill=new THREE.HemisphereLight('#b5c8e1','#10151d',.75);scene.add(fill);const sunset=new THREE.DirectionalLight('#ffbf78',1.7);sunset.position.set(9,3,-7);scene.add(sunset);
 const sky=new THREE.TextureLoader().load('/assets/orbital-dusk.webp',invalidate);sky.colorSpace=THREE.SRGBColorSpace;textures.add(sky);scene.background=sky;scene.backgroundIntensity=.8;scene.fog=null;
 return {geometries,materials,textures,turntable,stations,coreEmitter,restoreEnvironment,disposeEnvironment:()=>environment.dispose()};
}
