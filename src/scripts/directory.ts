import {showcaseConfig} from './showcase-config';
const query=document.querySelector<HTMLInputElement>('#service-query')!;
const form=document.querySelector<HTMLFormElement>('[data-search]')!;
const filters=document.querySelector<HTMLElement>('[data-filters]')!;
const rows=[...document.querySelectorAll<HTMLElement>('[data-service]')];
const buttons=[...filters.querySelectorAll<HTMLButtonElement>('button')];
const count=document.querySelector<HTMLOutputElement>('#result-count')!;
const empty=document.querySelector<HTMLElement>('.empty-state')!;
const normalize=(s:string)=>s.normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g,' ').trim();
let category='all';
function apply(updateURL=true){const terms=normalize(query.value).split(' ').filter(Boolean);let n=0;for(const row of rows){const text=normalize(row.dataset.searchText??'');const matched=(category==='all'||row.dataset.category===category)&&terms.every(t=>text.includes(t));row.hidden=!matched;if(matched)n++;}for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.category===category));count.value=`서비스 ${n}개`;empty.hidden=n!==0;document.dispatchEvent(new CustomEvent('ravirgo:filter',{detail:{slugs:rows.filter(r=>!r.hidden).map(r=>r.dataset.service)}}));if(updateURL){const u=new URL(location.href);if(query.value.trim())u.searchParams.set('q',query.value.trim());else u.searchParams.delete('q');if(category!=='all')u.searchParams.set('category',category);else u.searchParams.delete('category');history.replaceState(null,'',u);}}
function restore(){const u=new URL(location.href);query.value=(u.searchParams.get('q')??'').slice(0,100);const c=u.searchParams.get('category');category=buttons.some(b=>b.dataset.category===c)?c!:'all';apply(false);}
form.hidden=false;filters.hidden=false;restore();query.addEventListener('input',()=>apply());form.addEventListener('submit',e=>{e.preventDefault();apply();document.querySelector('#services')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});});for(const b of buttons)b.addEventListener('click',()=>{category=b.dataset.category!;apply();});document.querySelector('[data-reset]')!.addEventListener('click',()=>{query.value='';category='all';apply();query.focus({preventScroll:true});});addEventListener('popstate',restore);
for(const row of rows){for(const event of ['pointerenter','focusin'])row.addEventListener(event,()=>document.dispatchEvent(new CustomEvent('ravirgo:select',{detail:{slug:row.dataset.service}})));for(const event of ['pointerleave','focusout'])row.addEventListener(event,()=>document.dispatchEvent(new CustomEvent('ravirgo:select',{detail:{slug:null}})));}
// Load the spatial enhancement independently of immediately usable HTML controls.
const host=document.querySelector<HTMLElement>('#orbital-view')!;
const section=host.closest<HTMLElement>('[data-showcase]')!;
const toggle=section.querySelector<HTMLButtonElement>('[data-scene=toggle]')!;
const controls=section.querySelector<HTMLElement>('[data-scene-controls]')!;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let sceneDispose:(()=>void)|undefined,revision=0,savedProgress=showcaseConfig.initialProgress;
let disabled=false;try{disabled=sessionStorage.getItem('ravirgo-3d-disabled')==='1';}catch{}
function staticMode(reason:string){section.classList.remove('is-active');section.classList.add('is-static');host.dataset.state=reason;controls.hidden=false;section.querySelector<HTMLElement>('.scene-hint')!.hidden=true;section.querySelector<HTMLElement>('.path-progress')!.hidden=true;toggle.setAttribute('aria-pressed','false');toggle.textContent=reason==='reduced-motion'?'모션 감소 설정':reason==='save-data'?'데이터 절약 모드':'3D 켜기';toggle.disabled=reason==='reduced-motion'||reason==='save-data';}
async function start(resume=showcaseConfig.initialProgress){const current=++revision;sceneDispose?.();sceneDispose=undefined;if(motion.matches){staticMode('reduced-motion');return;}const saveData=(navigator as Navigator&{connection?:{saveData:boolean}}).connection?.saveData;if(saveData){staticMode('save-data');return;}if(disabled){staticMode('disabled');return;}
 try{const m=await import('./orbital');if(current!==revision)return;sceneDispose=await m.mountOrbital(host,resume);if(host.dataset.state==='fallback'){staticMode('fallback');return;}toggle.disabled=false;toggle.textContent='3D 끄기';toggle.setAttribute('aria-pressed','true');}catch{sceneDispose?.();sceneDispose=undefined;staticMode('fallback');}}
toggle.addEventListener('click',()=>{if(toggle.disabled)return;if(toggle.getAttribute('aria-pressed')==='true'){savedProgress=Number(host.dataset.progress??0);disabled=true;try{sessionStorage.setItem('ravirgo-3d-disabled','1');}catch{}++revision;sceneDispose?.();sceneDispose=undefined;staticMode('disabled');}else{disabled=false;try{sessionStorage.removeItem('ravirgo-3d-disabled');}catch{}void start(savedProgress);}});
motion.addEventListener('change',()=>{savedProgress=Number(host.dataset.progress??0);void start(savedProgress);});
void start();
