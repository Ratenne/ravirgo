import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4321');await page.waitForTimeout(800);await page.screenshot({path:'qa-desktop.png'});
async function seek(p){await page.evaluate(p=>{const e=document.querySelector('.experience');window.scrollTo({top:(e.offsetHeight-innerHeight)*p,behavior:"instant"})},p);await page.waitForTimeout(250);return page.evaluate(()=>({progress:document.querySelector('.stage').dataset.progress,stars:[...document.querySelectorAll('[data-star]')].map(e=>e.getAttribute('opacity')),logo:getComputedStyle(document.querySelector('.reveal-copy')).opacity}));}
async function checkConstellation(){
const result=await page.evaluate(()=>{
 const vertices=[...document.querySelectorAll('[data-star]')];
 const spica=document.querySelector('[data-star="Spica"] .star-core');
 const x=Number(spica.getAttribute('cx')),y=Number(spica.getAttribute('cy'));
 const beam=document.querySelector('.ray-core').getAttribute('d');
 const halo=document.querySelector('.radiance circle');
 const lines=[...document.querySelectorAll('.star-line')];
 // Reference's five-vertex body and three branches, with Spica at (587,658).
 const required=[['Spica','Virgo 02'],['Spica','Virgo 12'],['Spica','Virgo 13'],['Virgo 02','Virgo 05'],['Virgo 05','Virgo 07'],['Virgo 12','Virgo 07']];
 const linked=required.every(([a,b])=>lines.some(l=>[l.dataset.from,l.dataset.to].includes(a)&&[l.dataset.from,l.dataset.to].includes(b)));
 const bounds=vertices.every(g=>{const r=g.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});
 return {count:vertices.length,lines:lines.length,linked,bounds,anchor:beam.endsWith(`L${x} ${y}`)&&Number(halo.getAttribute('cx'))===x&&Number(halo.getAttribute('cy'))===y,reference:x===1193.5&&y===379};
});
if(result.count!==15||result.lines!==15||!result.linked||!result.anchor||!result.reference||!result.bounds)throw Error('Constellation mismatch: '+JSON.stringify(result));
}
const mid=await seek(.55);await seek(.96);await checkConstellation();await page.screenshot({path:'qa-revelation.png'});const back=await seek(.55);if(JSON.stringify(mid)!==JSON.stringify(back))throw Error('Reverse scroll mismatch');
await page.locator('.scroll-cue').click();await page.waitForTimeout(1600);await page.screenshot({path:'qa-services.png'});
await page.locator('.service-card').first().click();await page.waitForTimeout(500);if(!await page.locator('#pricepulse').isVisible())throw Error('Service link failed');
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4321');await page.waitForTimeout(400);await page.screenshot({path:'qa-mobile.png'});await seek(.96);await checkConstellation();await page.screenshot({path:'qa-mobile-reveal.png'});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const requests=[];reduced.on('request',r=>requests.push(r.url()));await reduced.goto('http://127.0.0.1:4321');await reduced.waitForTimeout(500);if(requests.some(r=>r.includes('sequence.json')))throw Error('Reduced motion requested sequence');if(await reduced.locator('.reveal-copy').evaluate(e=>getComputedStyle(e).opacity)!=='1')throw Error('Reduced motion logo missing');if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({constellationReference:'pass',spicaAnchor:'pass',desktop:'pass',reverseScroll:'pass',serviceLinks:'pass',mobile:'pass',reducedMotion:'pass',errors}));await browser.close();
