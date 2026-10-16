import * as THREE from 'three';
import {showcaseConfig} from './showcase-config';
import {buildServiceSculpture} from './service-models';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type Featured={slug:string;exhibit:'price'|'receipt'};
/** Authored architectural set, derived from the approved orbital-v2 model silhouettes. */
export function buildWorkbench(scene:THREE.Scene,renderer:THREE.WebGLRenderer,featured:Featured[],invalidate:()=>void){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const own=<T extends THREE.BufferGeometry>(g:T)=>{geometries.add(g);return g;};
 const material=(color:string,roughness:number,metalness:number)=>{const m=new THREE.MeshPhysicalMaterial({color,roughness,metalness});materials.add(m);return m;};
 const stone=material('#263244',.46,.12),edgeStone=material('#1b293b',.5,.12),gold=material('#c69750',.4,.92),silver=material('#87939d',.28,.92),darkSilver=material('#424f60',.32,.88),paper=material('#e4d7ba',.88,0),bronze=material('#8d795b',.38,.85);
 const lightMat=material('#ffcc76',.4,.1);lightMat.emissive.set('#ffb953');lightMat.emissiveIntensity=2.5;gold.anisotropy=.45;gold.anisotropyRotation=Math.PI/2;gold.clearcoat=.18;gold.clearcoatRoughness=.3;gold.envMapIntensity=.55;
 // Seeded multi-scale stone maps: broad mineral structure, etched veins and fine pores.
 const size=512;let seed=381;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const fields=[4,12,35,100].map(n=>({n,data:Float32Array.from({length:(n+1)*(n+1)},random)}));
 const noise=(x:number,y:number,f:typeof fields[number])=>{const px=x*f.n,py=y*f.n,ix=Math.floor(px),iy=Math.floor(py),a=px-ix,b=py-iy,u=a*a*(3-2*a),v=b*b*(3-2*b),at=(xx:number,yy:number)=>f.data[yy*(f.n+1)+xx];return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(ix,iy),at(ix+1,iy),u),THREE.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),u),v);};
 const albedo=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const a=noise(x/size,y/size,fields[0]),b=noise(x/size,y/size,fields[1]),c=noise(x/size,y/size,fields[2]),d=noise(x/size,y/size,fields[3]);const vein=Math.pow(Math.max(0,1-Math.abs(Math.sin(x*.023+y*.013+a*7+b*2))*16),2);const grain=random();const value=110+a*35+b*28+c*38+d*30-vein*55+grain*24;const i=(y*size+x)*4;albedo.set([value*.94,value*.98,value,255],i);const r=150+a*36+c*20-vein*12;rough.set([r,r,r,255],i);const h=120+b*30+c*25+d*25-vein*40+grain*15;height.set([h,h,h,255],i);}
 function dataMap(data:Uint8Array,color=false){const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.needsUpdate=true;textures.add(t);return t;}
 const stoneColor=dataMap(albedo,true),stoneRough=dataMap(rough),stoneHeight=dataMap(height);
 for(const m of [stone,edgeStone]){m.map=stoneColor;m.roughnessMap=stoneRough;m.bumpMap=stoneHeight;m.bumpScale=.055;m.envMapIntensity=.23;m.specularIntensity=.32;}
 const brushed=new Uint8Array(size*size*4);for(let y=0;y<size;y++){const stripe=195+random()*8;for(let x=0;x<size;x++){const i=(y*size+x)*4,v=stripe+random()*3;brushed.set([v,v,v,255],i);}}
 gold.roughnessMap=dataMap(brushed);gold.bumpMap=gold.roughnessMap;gold.bumpScale=.001;
 paper.bumpMap=stoneHeight;paper.bumpScale=.012;paper.specularIntensity=.15;
 function studio(){const r=new RoomEnvironment();const card=new THREE.Mesh(new THREE.PlaneGeometry(6,8),new THREE.MeshBasicMaterial({color:'#92734d'}));card.position.set(-3,2,2);card.lookAt(0,1,0);r.add(card);return r;}
 const pmrem=new THREE.PMREMGenerator(renderer),room=studio();let environment=pmrem.fromScene(room,.035);scene.environment=environment.texture;scene.environmentIntensity=.75;room.dispose();pmrem.dispose();
 function restoreEnvironment(){environment.dispose();const p=new THREE.PMREMGenerator(renderer),r=studio();environment=p.fromScene(r,.035);scene.environment=environment.texture;r.dispose();p.dispose();}
 const world=new THREE.Group(),turntable=new THREE.Group();scene.add(world);world.add(turntable);
 function mesh(geometry:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,shadows=true){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=shadows;m.receiveShadow=shadows;m.userData.bloom=mat===lightMat;parent.add(m);return m;}
 function box(w:number,h:number,d:number,mat:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,bevel=.025){return mesh(own(new RoundedBoxGeometry(w,h,d,2,bevel)),mat,parent,x,y,z);}
 function cylinder(radius:number,h:number,mat:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0){const bevel=Math.min(.04,h*.28),profile=[new THREE.Vector2(0,-h/2),new THREE.Vector2(radius-bevel,-h/2)];for(let i=1;i<=6;i++){const angle=i/6*Math.PI/2;profile.push(new THREE.Vector2(radius-bevel+Math.sin(angle)*bevel,-h/2+bevel-Math.cos(angle)*bevel));}profile.push(new THREE.Vector2(radius,h/2-bevel));for(let i=1;i<=6;i++){const angle=i/6*Math.PI/2;profile.push(new THREE.Vector2(radius-bevel+Math.cos(angle)*bevel,h/2-bevel+Math.sin(angle)*bevel));}profile.push(new THREE.Vector2(0,h/2));const g=own(new THREE.LatheGeometry(profile,innerWidth<600?128:192));const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){if(Math.abs(p.getY(i))>h/2-.04){uv.setXY(i,p.getX(i)*.18,p.getZ(i)*.18);}else uv.setXY(i,Math.atan2(p.getX(i),p.getZ(i))*radius*.18,p.getY(i)*.5);}return mesh(g,mat,parent,x,y,z);}
 function ring(r:number,y:number,mat:THREE.Material,parent:THREE.Object3D,x=0,z=0,tube=.015){const m=mesh(own(new THREE.TorusGeometry(r,tube,12,192)),mat,parent,x,y,z,false);m.rotation.x=-Math.PI/2;return m;}
 function arcSlab(outer:number,inner:number,h:number,y:number,mat:THREE.Material,parent:THREE.Object3D,start=0,end=Math.PI){const shape=new THREE.Shape();shape.absarc(0,0,outer,start,end,false);shape.lineTo(Math.cos(end)*inner,Math.sin(end)*inner);shape.absarc(0,0,inner,end,start,true);shape.closePath();const g=own(new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,curveSegments:96}));const m=mesh(g,mat,parent,0,y,0);m.rotation.x=-Math.PI/2;return m;}
 // The poster's terrace fills the foreground; the circular deck sits inside it.
 cylinder(13,.38,edgeStone,world,0,-.66,0);
 cylinder(10.8,.32,stone,world,0,-.34,0);
 cylinder(6.6,.72,edgeStone,turntable,0,.18,0);
 cylinder(6.53,.09,stone,turntable,0,.585,0);
 ring(6.58,-.155,lightMat,turntable,0,0,.028);
 const underglow=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{color:{value:new THREE.Color('#ffb04f')}},vertexShader:'varying vec2 local;void main(){local=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 local;uniform vec3 color;void main(){float d=(length(local)-6.62)/.23;float glow=exp(-d*d)*.6;gl_FragColor=vec4(color,glow);}'});
 materials.add(underglow);
 const wash=mesh(own(new THREE.RingGeometry(6.52,7.35,192)),underglow,world,0,-.148,0,false);wash.rotation.x=-Math.PI/2;
 ring(6.51,.635,gold,turntable,0,0,.014);
 ring(5.7,.638,darkSilver,turntable,0,0,.012);
 ring(7.7,-.172,darkSilver,world,0,0,.018);
 // A broad, flush bronze rim leaves a real opening at the front-left stairs.
 const stairAngle=-.48,opening=.14,front=-Math.PI/2+stairAngle;
 arcSlab(6.61,6.28,.025,.64,bronze,turntable,front+opening,front+Math.PI*2-opening);
 for(let i=0;i<16;i++){
  const a=i/16*Math.PI*2;
  const seam=box(.81,.008,.014,edgeStone,turntable,Math.sin(a)*6.09,.64,Math.cos(a)*6.09,.001);seam.rotation.y=a+Math.PI/2;
 }
 for(let i=0;i<20;i++){
  const a=i/20*Math.PI*2;
  const seam=box(3.3,.008,.016,edgeStone,world,Math.sin(a)*8.3,-.172,Math.cos(a)*8.3,.001);seam.rotation.y=a+Math.PI/2;
 }
 const stairs=new THREE.Group();stairs.rotation.y=stairAngle;world.add(stairs);
 for(let i=0;i<3;i++)box(1.65,.21,.46,stone,stairs,0,-.065+i*.24,7.42-i*.44,.018);
 for(const sign of [-1,1]){const cheek=box(.3,.27,1.62,edgeStone,stairs,sign*.98,.29,6.94);cheek.rotation.x=.46;}
 arcSlab(8.9,7.85,.32,-.15,edgeStone,world,.06,Math.PI-.06);
 arcSlab(8.93,7.82,.035,.19,stone,world,.06,Math.PI-.06);
 arcSlab(7.88,7.84,.018,.21,gold,world,1.1,1.8);
 // A continuous curved parapet and paired side piers frame the landscape.
 for(let i=0;i<18;i++){
  const start=-.18+i*(Math.PI+.36)/18,end=start+(Math.PI+.36)/18-.004;
  arcSlab(10.05,9.5,2.05,-.18,edgeStone,world,start,end);
  arcSlab(10.07,9.48,.045,1.88,stone,world,start,end);
 }
 for(const side of [-1,1]){
  for(let i=0;i<2;i++){
   const x=side*(8.55+i*.86);
   box(.53,7.4,.82,edgeStone,world,x,5.6,-5.45,.025);
   box(.68,.08,1.05,gold,world,x,1.93,-5.45,.015);
   box(.62,.018,.025,lightMat,world,x,1.985,-4.94,.004);
  }
 }
 const lintel=box(20.2,.5,1.25,edgeStone,world,0,6.4,-5.45,.025);lintel.rotation.z=-.025;
 RectAreaLightUniformsLib.init();
 for(let i=0;i<9;i++){
  const a=.08+i/8*(Math.PI-.16),x=Math.cos(a)*9.47,z=-Math.sin(a)*9.47;
  if(i%3!==1){
   arcSlab(9.49,9.46,.025,.26,lightMat,world,a-.075,a+.075);
   const light=new THREE.RectAreaLight('#ffb568',12,1.4,.18);
   light.position.set(x*.985,.34,z*.985);light.lookAt(x,1.1,z);world.add(light);
  }
 }
 for(const side of [-1,1]){
  const light=new THREE.RectAreaLight('#ffae58',18,.65,.16);
  light.position.set(side*8.55,2.04,-4.86);light.lookAt(side*8.55,3.2,-5.45);world.add(light);
 }
 // The core is a low luminous disk within a separate open bronze orbital ring.
 const coreX=showcaseConfig.core.x,coreZ=showcaseConfig.core.z;
 const coreRing=arcSlab(1.24,1.07,.27,.65,gold,turntable,0,Math.PI*2);coreRing.position.x=coreX;coreRing.position.z=coreZ;
 cylinder(.86,.08,edgeStone,turntable,coreX,.67,coreZ);
 cylinder(.86,.23,gold,turntable,coreX,.825,coreZ);
 const coreMat=lightMat.clone();coreMat.emissiveIntensity=3.2;materials.add(coreMat);
 const coreEmitter=cylinder(.38,.018,coreMat,turntable,coreX,.95,coreZ);coreEmitter.userData.bloom=true;
 ring(.85,.94,gold,turntable,coreX,coreZ,.014);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const ctx=glowCanvas.getContext('2d')!;const grad=ctx.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,220,155,.7)');grad.addColorStop(.18,'rgba(255,180,76,.22)');grad.addColorStop(1,'rgba(255,156,49,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(glowCanvas);textures.add(glowTexture);
 function glow(x:number,y:number,z:number,scale:number){const m=new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.4});materials.add(m);const sprite=new THREE.Sprite(m);sprite.position.set(x,y,z);sprite.scale.set(scale,scale*.6,1);turntable.add(sprite);}
 glow(coreX,1.02,coreZ,2.6);const coreLight=new THREE.PointLight('#ffbc69',14,7,2);coreLight.position.set(coreX,1.18,coreZ);turntable.add(coreLight);
 const stations=new Map<string,{group:THREE.Group;highlight:THREE.Mesh;light:THREE.PointLight;type:string;sculpture:THREE.Group}>();
 for(let index=0;index<featured.length;index++){
  const entry=featured[index],group=new THREE.Group();const a=featured.length<=2?(index===0?-1.08:1.05):-1.3+index*.85;const x=Math.sin(a)*3.35,z=-Math.cos(a)*2.6;group.position.set(x,.1,z);group.scale.setScalar(1);world.updateMatrixWorld();turntable.add(group);
  cylinder(1.16,.28,edgeStone,group,0,.62,0);cylinder(1.12,.025,gold,group,0,.775,0);cylinder(1.09,.035,stone,group,0,.805,0);const highlight=ring(1.145,.49,lightMat,group,0,0,.025);
  const accent=new THREE.PointLight('#ffc477',4,4.5,2);accent.position.set(0,.58,0);group.add(accent);
  const sculpture=new THREE.Group();const paperScale=entry.exhibit==='receipt'?.88:1,sculptureHeight=entry.exhibit==='receipt'?.58:.6;sculpture.position.y=.84-.94*sculptureHeight;sculpture.scale.set(paperScale,sculptureHeight,paperScale);sculpture.rotation.y=entry.exhibit==='receipt'?-.75:-.15;group.add(sculpture);
  buildServiceSculpture(entry.exhibit,sculpture,{geometries,materials,textures,gold,silver,darkSilver,paper,renderer,compact:innerWidth<600||(navigator as Navigator&{deviceMemory?:number}).deviceMemory!<=4});
  stations.set(entry.slug,{group,highlight,light:accent,type:entry.exhibit,sculpture});
 }
 // Swept rectangular bands join each moving podium to the fixed core.
 // Reuse buffers on input; there is no independent animation or detached connector.
 const ribbons=[...stations.entries()].map(([slug,station])=>{
  const segments=64,positions=new Float32Array((segments+1)*8*3),indices:number[]=[];
  for(let i=0;i<segments;i++)for(let face=0;face<4;face++){
   const a=i*8+face*2,b=a+1,c=a+8,d=b+8;indices.push(a,b,c,b,d,c);
  }
  indices.push(0,3,1,0,5,3);const end=segments*8;indices.push(end,end+1,end+3,end,end+3,end+5);
  const geometry=own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(indices);
  const uvs=new Float32Array((segments+1)*8*2);
  for(let i=0;i<=segments;i++)for(let vertex=0;vertex<8;vertex++){const offset=(i*8+vertex)*2;uvs[offset]=i/segments*3;uvs[offset+1]=vertex%2;}
  geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
  const band=mesh(geometry,gold,turntable);band.name='core-to-podium-band';band.userData.stationSlug=slug;
  return {slug,station,band,geometry,segments};
 });
 function updateConnections(connected:ReadonlySet<string>){
  for(const {slug,station,band,geometry,segments} of ribbons){
   const p=station.group.position;band.visible=station.group.visible&&connected.has(slug);
   if(!band.visible)continue;
   // Both anchors follow the same radial direction, so the band rotates continuously
   // through the rear-centre dock instead of snapping between left/right core sockets.
   const direction=new THREE.Vector3(p.x-coreX,0,p.z-coreZ),distance=direction.length();direction.normalize();
   const start=new THREE.Vector3(coreX,.77,coreZ).addScaledVector(direction,1.15);
   const end=new THREE.Vector3(p.x,.77,p.z).addScaledVector(direction,-1.04);
   const span=distance-2.19,sideways=new THREE.Vector3(-direction.z,0,direction.x),bow=Math.min(.55,span*.22);
   const curve=new THREE.CubicBezierCurve3(start,start.clone().addScaledVector(direction,span*.32).addScaledVector(sideways,bow),end.clone().addScaledVector(direction,-span*.32).addScaledVector(sideways,-bow),end);
   const position=geometry.attributes.position;
   for(let i=0;i<=segments;i++){
    const point=curve.getPoint(i/segments),tangent=curve.getTangent(i/segments),nx=-tangent.z*.18,nz=tangent.x*.18;
    for(let vertex=0;vertex<8;vertex++){
     const corner=(Math.floor(vertex/2)+vertex%2)%4;
     const sign=corner===0||corner===3?-1:1,y=corner<2?.14:-.14;
     position.setXYZ(i*8+vertex,point.x+nx*sign,point.y+y,point.z+nz*sign);
    }
   }
   position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  }
 }
 const key=new THREE.DirectionalLight('#ffe4bd',1.5);key.position.set(-4,8,2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:.5,far:35});key.shadow.bias=-.0002;key.shadow.normalBias=.025;key.shadow.radius=3;scene.add(key);
 const fill=new THREE.HemisphereLight('#b5c8e1','#10151d',.75);scene.add(fill);const sunset=new THREE.DirectionalLight('#ffbf78',1.25);sunset.position.set(9,3,-7);scene.add(sunset);
 const sky=new THREE.TextureLoader().load('/assets/orbital-dusk.webp',invalidate);sky.colorSpace=THREE.SRGBColorSpace;
 // Compress the panorama into the opening above the parapet, with the sunset on the right.
 // Full-canvas background stretching formerly put the horizon below the deck.
 sky.repeat.set(1,1.7);sky.offset.set(0,-1.01);sky.updateMatrix();
 textures.add(sky);scene.background=sky;scene.backgroundIntensity=1;scene.fog=null;
 return {geometries,materials,textures,turntable,stations,coreEmitter,updateConnections,restoreEnvironment,disposeEnvironment:()=>environment.dispose()};
}
