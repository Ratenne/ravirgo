import {showcaseConfig} from './showcase-config';
export function setupScene(){
// Load the spatial enhancement independently of immediately usable HTML controls.
const host=document.querySelector<HTMLElement>('#orbital-view')!;
const section=host.closest<HTMLElement>('[data-showcase]')!;
const toggle=section.querySelector<HTMLButtonElement>('[data-scene=toggle]')!;
const controls=section.querySelector<HTMLElement>('[data-scene-controls]')!;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let sceneDispose:(()=>void)|undefined,revision=0,savedProgress:number=showcaseConfig.initialProgress;
let disabled=false;try{disabled=sessionStorage.getItem('ravirgo-3d-disabled')==='1';}catch{}
function staticMode(reason:string){section.classList.remove('is-active');section.classList.add('is-static');host.dataset.state=reason;controls.hidden=false;section.querySelector<HTMLElement>('.scene-hint')!.hidden=true;section.querySelector<HTMLElement>('.path-progress')!.hidden=true;toggle.setAttribute('aria-pressed','false');toggle.textContent=reason==='reduced-motion'?'모션 감소 설정':reason==='save-data'?'데이터 절약 모드':'3D 켜기';toggle.disabled=reason==='reduced-motion'||reason==='save-data';}
async function start(resume:number=showcaseConfig.initialProgress){const current=++revision;sceneDispose?.();sceneDispose=undefined;if(motion.matches){staticMode('reduced-motion');return;}const saveData=(navigator as Navigator&{connection?:{saveData:boolean}}).connection?.saveData;if(saveData){staticMode('save-data');return;}if(disabled){staticMode('disabled');return;}
 try{const m=await import('./orbital');if(current!==revision)return;const dispose=await m.mountOrbital(host,resume);if(current!==revision){dispose();return;}sceneDispose=dispose;if(host.dataset.state==='fallback'){staticMode('fallback');return;}toggle.disabled=false;toggle.textContent='3D 끄기';toggle.setAttribute('aria-pressed','true');}catch{sceneDispose?.();sceneDispose=undefined;staticMode('fallback');}}
toggle.addEventListener('click',()=>{if(toggle.disabled)return;if(toggle.getAttribute('aria-pressed')==='true'){savedProgress=Number(host.dataset.progress??0);disabled=true;try{sessionStorage.setItem('ravirgo-3d-disabled','1');}catch{}++revision;sceneDispose?.();sceneDispose=undefined;staticMode('disabled');}else{disabled=false;try{sessionStorage.removeItem('ravirgo-3d-disabled');}catch{}void start(savedProgress);}});
motion.addEventListener('change',()=>{savedProgress=Number(host.dataset.progress??0);void start(savedProgress);});
void start();

}
