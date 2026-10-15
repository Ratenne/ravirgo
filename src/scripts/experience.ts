import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { FrameSequence } from './frames';
import { stars, edges, starArrival } from './virgo';
const $ = <T extends Element = HTMLElement>(s:string) => document.querySelector<T>(s)!;
const stage=$('.stage'), section=$('.experience');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=matchMedia('(max-width: 760px)');
const svgNS='http://www.w3.org/2000/svg';
function el(tag:string, attrs:Record<string,string|number>, parent:Element){const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.append(e);return e;}
const constellation=$('.constellation');
const lines=edges.map(({from:a,to:b,start,end})=>{const p=el('path',{d:`M${stars[a].x} ${stars[a].y}L${stars[b].x} ${stars[b].y}`,class:'star-line','data-from':stars[a].name,'data-to':stars[b].name},constellation) as SVGPathElement;const n=p.getTotalLength();p.style.strokeDasharray=`${n}`;p.style.strokeDashoffset=`${n}`;return {p,n,start,end};});
const points=stars.map((s,i)=>{const g=el('g',{'data-star':s.name},constellation);el('circle',{cx:s.x,cy:s.y,r:i===0?33:16,fill:'url(#starlight)'},g);el('path',{d:`M${s.x-7} ${s.y}h14M${s.x} ${s.y-7}v14`,class:'star-flare'},g);el('circle',{cx:s.x,cy:s.y,r:i===0?2.8:1.7,class:'star-core'},g);g.setAttribute('opacity','0');return g;});
const spica=stars[0];
$('.ray-core').setAttribute('d',`M1146 622 L${spica.x} ${spica.y}`);$('.ray-halo').setAttribute('d',`M1146 622 L${spica.x} ${spica.y}`);
$('.spica-label').setAttribute('transform',`translate(${spica.x-1146} ${spica.y-366})`);
const rays=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return el('path',{d:`M${spica.x} ${spica.y}l${Math.cos(a)*600} ${Math.sin(a)*600}`,stroke:'#eec385','stroke-width':i%3===0?.6:.3,opacity:.14},$('.radiance'));});
const halo=el('circle',{cx:spica.x,cy:spica.y,r:250,fill:'url(#starlight)',opacity:.24},$('.radiance'));
const dust=Array.from({length:32},(_,i)=>el('circle',{cx:(i*137.51)%1600,cy:80+(i*71.23)%650,r:i%5===0?1.2:.6,fill:'#e9cc9b',opacity:0},$('.dust')));
let progress=0,dirty=true,raf=0,ready=false;
const back=$<HTMLCanvasElement>('.canvas-back'),front=$<HTMLCanvasElement>('.canvas-front');
const contexts=[back.getContext('2d'),front.getContext('2d')];
const image=new Image();image.decoding='async';image.src='/assets/sky.webp';image.onload=()=>{ready=true;resize();};
const lowMemory=(navigator as Navigator & {deviceMemory?:number}).deviceMemory;
const dpr=()=>Math.min(devicePixelRatio||1,lowMemory&&lowMemory<=4?1:2);
function resize(){if(reduced.matches)return;for(const c of [back,front]){c.width=Math.round(stage.clientWidth*dpr());c.height=Math.round(stage.clientHeight*dpr());}requestDraw();}
function requestDraw(){dirty=true;if(!raf)raf=requestAnimationFrame(draw);}
let currentImage:CanvasImageSource=image;
function draw(){raf=0;if(!dirty||!ready||reduced.matches)return;dirty=false;[back,front].forEach((c,i)=>{const ctx=contexts[i];if(!ctx)return;const source=currentImage as HTMLImageElement;const sw=source.width,sh=source.height;if(!sw||!sh)return;const scale=(i===0||mobile.matches?Math.max(c.width/sw,c.height/sh):Math.min(c.width/sw,c.height/sh))*(1+progress*.03);const w=sw*scale,h=sh*scale;const x=mobile.matches?(c.width-w)*.79:(c.width-w)/2;ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(source,x,(c.height-h)/2,w,h);c.style.opacity='1';});}
const clamp=(v:number)=>Math.max(0,Math.min(1,v));const phase=(p:number,a:number,b:number)=>{const v=clamp((p-a)/(b-a));return v*v*(3-2*v);};
const desktopScenes=[['THE SILENCE','빛이 태어나기 전'],['THE AWAKENING','첫 번째 광선'],['THE CONSTELLATION','빛이 별들을 연결합니다'],['THE RADIANCE','처녀자리에서 시작된 빛'],['THE REVELATION','일상을 밝히는 기술']];
const mobileScenes=[desktopScenes[0],desktopScenes[1],desktopScenes[2],desktopScenes[4]];
const journey=$<HTMLInputElement>('#journey');
let sequence:FrameSequence|undefined;
function render(p:number){progress=clamp(p);const beam=phase(p,.15,.35),formation=phase(p,.35,.6),radiance=phase(p,.6,.8),reveal=phase(p,.8,.95);gsap.set('.night-veil',{opacity:.72-.58*phase(p,.08,.8)});gsap.set('.horizon-bloom',{opacity:phase(p,.15,.7)});gsap.set('.intro-copy',{autoAlpha:1-phase(p,.18,.42),y:-18*phase(p,.18,.42)});gsap.set('.reveal-copy',{autoAlpha:reveal,y:18*(1-reveal)});gsap.set('.tagline',{opacity:phase(p,.86,.98)});gsap.set('.hero-copy>.eyebrow',{opacity:1-.4*reveal});const baseY=mobile.matches?1350:622;const length=Math.hypot(1146-spica.x,baseY-spica.y);for(const s of ['.ray-core','.ray-halo'])gsap.set(s,{strokeDasharray:length,strokeDashoffset:length*(1-beam),opacity:beam});const tip=$('.ray-tip');tip.setAttribute('cx',String(1146+(spica.x-1146)*beam));tip.setAttribute('cy',String(baseY+(spica.y-baseY)*beam));tip.setAttribute('opacity',String(beam));lines.forEach(({p:line,n,start,end})=>line.style.strokeDashoffset=String(n*(1-phase(formation,start,end))));points.forEach((g,i)=>g.setAttribute('opacity',String(phase(formation,Math.max(0,starArrival[i]-.025),starArrival[i]+.025))));gsap.set('.radiance',{opacity:radiance});gsap.set('.spica-label',{opacity:phase(p,.62,.76)});halo.setAttribute('r',String(60+210*radiance));dust.forEach((d,i)=>{d.setAttribute('opacity',String(radiance*(.15+(i%3)*.12)));d.setAttribute('transform',`translate(0 ${phase(p,.8,1)*(40+i%5*15)})`);});const steps=mobile.matches?[.15,.35,.72]:[.15,.35,.6,.8];const idx=steps.filter(t=>p>=t).length;const scenes=mobile.matches?mobileScenes:desktopScenes;$('.scene-number').innerHTML=`${String(idx+1).padStart(2,'0')} <i>/ ${String(scenes.length).padStart(2,'0')}</i>`;$('.scene-title').textContent=scenes[idx][0];$('.scene-description').textContent=scenes[idx][1];journey.value=String(Math.round(p*100));journey.style.setProperty('--progress',`${p*100}%`);$('#percent').textContent=`${Math.round(p*100)}%`;stage.setAttribute('data-progress',p.toFixed(4));if(sequence)sequence.seek(Math.round(p*(sequence.count-1)));requestDraw();}
let lenis:Lenis|undefined,trigger:ScrollTrigger|undefined;let setupRevision=0;
function setup(){const revision=++setupRevision;currentImage=image;for(const sel of ['.ray-core','.ray-halo'])$(sel).setAttribute('d',`M1146 ${mobile.matches?1350:622} L${spica.x} ${spica.y}`);$('.sky-art').setAttribute('viewBox',mobile.matches?'700 0 900 1900':'0 0 1600 900');trigger?.kill();lenis?.destroy();sequence?.destroy();sequence=undefined;if(reduced.matches){[back,front].forEach(c=>c.style.opacity='0');render(1);return;}gsap.registerPlugin(ScrollTrigger);if(!mobile.matches){lenis=new Lenis({autoRaf:true,duration:1.1,anchors:true});lenis.on('scroll',ScrollTrigger.update);}trigger=ScrollTrigger.create({trigger:section,start:'top top',end:'bottom bottom',onUpdate:self=>render(self.progress),invalidateOnRefresh:true});render(trigger.progress);resize();
// Optional real video export. No sequence requests are made without a manifest.
fetch('/assets/sequence.json').then(r=>r.ok?r.json():null).then(manifest=>{if(!manifest||reduced.matches||revision!==setupRevision)return;const config=mobile.matches?manifest.mobile:manifest.desktop;if(!config)return;sequence=new FrameSequence(config,frame=>{currentImage=frame;requestDraw();});sequence.seek(Math.round(progress*(sequence.count-1)));}).catch(()=>{});}
journey.addEventListener('input',()=>{if(reduced.matches)return;const y=section.offsetTop+(section.offsetHeight-stage.offsetHeight)*Number(journey.value)/100;if(lenis)lenis.scrollTo(y,{immediate:true});else window.scrollTo({top:y,behavior:'instant'});});
addEventListener('resize',resize);mobile.addEventListener('change',setup);reduced.addEventListener('change',setup);setup();
