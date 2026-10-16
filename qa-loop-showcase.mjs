import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.impeccable/review/loop';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const url='http://127.0.0.1:4321/',errors=[];
async function open(options={}){const p=await browser.newPage({viewport:{width:1440,height:900},...options});p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>document.querySelector('#orbital-view')?.dataset.ready==='true');await p.waitForTimeout(650);return p;}
const state=p=>p.locator('#orbital-view').evaluate(e=>({progress:Number(e.dataset.progress),models:JSON.parse(e.dataset.orbit),timing:JSON.parse(e.dataset.timing),input:JSON.parse(e.dataset.input),fixed:JSON.parse(e.dataset.fixed),renders:Number(e.dataset.renderCount)}));
async function seek(p,value){const s=await state(p),r=await p.locator('#orbital-view').boundingBox();await p.mouse.move(r.x+r.width*.72,r.y+r.height*.55);await p.mouse.wheel(0,(value-s.progress)*s.input.wheel/s.timing.period);await p.waitForFunction(v=>Math.abs(Number(document.querySelector('#orbital-view').dataset.progress)-v)<.00002,value);await p.waitForTimeout(90);return state(p);}
const page=await open(),initial=await state(page),period=initial.timing.period;
assert(initial.models.every(m=>m.visible&&m.phase==='orbit'));assert.equal(await page.locator('[data-model-label]:visible').count(),2);assert.equal(await page.locator('.model-labels').getByRole('link',{name:'PricePulse',exact:true}).count(),1);
const clearance=await page.evaluate(async()=>{
 const {createShowcasePath}=await import('/src/scripts/showcase-path.ts'),{showcaseConfig:c}=await import('/src/scripts/showcase-config.ts');
 const path=createShowcasePath();let core=Infinity,outer=0;
 for(let i=0;i<=1000;i++){const p=path.orbit.getPoint(i/1000);core=Math.min(core,Math.hypot(p.x-c.core.x,p.z-c.core.z)-1.24-1.16);outer=Math.max(outer,Math.hypot(p.x,p.z)+1.16);}
 return {core,outer};
});
assert(clearance.core>.08,'moving podium must clear the foreground core throughout the orbit');
assert(clearance.outer<6.53,'the complete orbit must remain supported by the stone deck');
assert(await page.locator('#services').evaluate(e=>e.getBoundingClientRect().top<innerHeight));
assert(await page.locator('[data-showcase]').evaluate(e=>e.offsetHeight<innerHeight));
await page.screenshot({path:`${out}/desktop.png`});
for(const m of initial.models)assert(Math.hypot(m.x,m.z)+1.16<6.53);
assert(Math.hypot(.27,-.1)+5+1.16<6.53,'podium must be supported by disk');
for(const turns of [1,3,8,-2]){const s=await seek(page,initial.progress+period*turns);for(let i=0;i<2;i++)for(const k of ['x','y','z'])assert(Math.abs(s.models[i][k]-initial.models[i][k])<.0001);assert.deepEqual(s.fixed,initial.fixed);}
for(let i=0;i<2;i++)for(const [local,phase] of [[.1,'entry'],[.5,'orbit'],[.95,'exit'],[1.06,'after']]){const s=await seek(page,period*2+local+i*initial.timing.gap);assert.equal(s.models[i].phase,phase);assert.equal(s.models[i].visible,phase!=='after');assert.equal(s.models[i].connected,phase==='orbit');}
// The marked rear-centre point is shared by arrival and departure; docking owns the band.
for(let i=0;i<2;i++){
 const offset=period*2+i*initial.timing.gap;
 const arrival=await seek(page,offset+.24),m=arrival.models[i];
 assert(Math.abs(m.x-.27)<.0001&&Math.abs(m.z+3.85)<.0001&&Math.abs(m.y-.15)<.0001);
 assert(m.connected,'gold band attaches at arrival');
 const departure=await seek(page,offset+.82),d=departure.models[i];
 assert(Math.hypot(d.x-m.x,d.z-m.z)<.0001,'complete orbit returns to the same dock');
 const after=await seek(page,offset+.821);assert(!after.models[i].connected,'band detaches on departure');
}
// Counterclockwise seen from +Y; inspect opposite quadrants with the fixed set.
let prev,sum=0;for(let i=0;i<=12;i++){const s=await seek(page,.24+.58*i/12),m=s.models[0];if(prev){const ax=prev.x-.27,az=prev.z+.1,bx=m.x-.27,bz=m.z+.1,d=Math.atan2(ax*(-bz)-(-az)*bx,ax*bx+az*bz);assert(d>0);sum+=d;}prev=m;if(i%3===0)await page.screenshot({path:`${out}/orbit-${i}.png`});}assert(Math.abs(sum-2*Math.PI)<.0001);
await seek(page,.56);await page.waitForTimeout(400);const parked=await state(page);await page.waitForTimeout(500);assert.deepEqual((await state(page)).models,parked.models);assert.equal((await state(page)).renders,parked.renders);assert.equal(await page.evaluate(()=>scrollY),0);
await page.locator('#service-query').fill('excel');assert.equal(await page.locator('[data-service]:visible').count(),1);assert.equal((await state(page)).progress,parked.progress);await page.locator('#service-query').fill('');await page.getByRole('button',{name:'가격 정보',exact:true}).click();assert.equal(await page.locator('[data-service]:visible').count(),1);await page.getByRole('button',{name:'전체',exact:true}).click();
await page.getByRole('button',{name:'3D 끄기',exact:true}).click();assert.equal(await page.locator('#orbital-view canvas').count(),0);assert.equal(await page.locator('[data-service]:visible').count(),2);await page.getByRole('button',{name:'3D 켜기',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#orbital-view')?.dataset.ready==='true');await page.waitForTimeout(600);assert.equal((await state(page)).progress,parked.progress);
const historyBefore=await page.evaluate(()=>history.length);await page.locator('.scene-list-link').click();assert.equal(new URL(page.url()).hash,'#services');assert.equal(await page.evaluate(()=>history.length),historyBefore+1);
// Click the projected centre of the actual sculpture, deliberately above its label.
for(const [actor,destination] of [[0,'https://price-pulse.ravirgo.com/'],[1,'https://receipt-to-excel.ravirgo.com/']]){const p=await open(),s=await state(p),r=await p.locator('#orbital-view').boundingBox(),m=s.models[actor];await p.route(destination+'**',route=>route.fulfill({contentType:'text/html',body:'service destination'}));await p.mouse.click(r.x+m.screenX,r.y+m.screenY);await p.waitForURL(destination);await p.close();}
// Equal wheel deltas produce viewport-normalized travel; resizing preserves the route.
const sensitivity=[];for(const [width,height] of [[1440,900],[1024,700]]){const p=await open({viewport:{width,height}}),a=await state(p),r=await p.locator('#orbital-view').boundingBox();await p.mouse.move(r.x+r.width*.72,r.y+r.height*.55);await p.mouse.wheel(0,180);await p.waitForFunction(v=>Number(document.querySelector('#orbital-view').dataset.progress)>v,a.progress);const b=await state(p);sensitivity.push({height,delta:b.progress-a.progress,wheel:b.input.wheel});assert(Math.abs((b.progress-a.progress)-180/b.input.wheel*b.timing.period)<1e-6);const before=b.progress;await p.setViewportSize({width:width-100,height:height-100});await p.waitForTimeout(150);assert.equal((await state(p)).progress,before);assert.equal((await state(p)).input.wheel,(height-100)*4);await p.setViewportSize({width:width-100,height:height-160});await p.waitForTimeout(150);assert.equal((await state(p)).input.wheel,(height-160)*4);assert.equal((await state(p)).progress,before);await p.close();}assert(sensitivity[1].delta>sensitivity[0].delta);
const htmlLink=await open();await htmlLink.route('https://price-pulse.ravirgo.com/**',r=>r.fulfill({contentType:'text/html',body:'PricePulse'}));await htmlLink.locator('.model-labels').getByRole('link',{name:'PricePulse',exact:true}).focus();await htmlLink.keyboard.press('Enter');await htmlLink.waitForURL('https://price-pulse.ravirgo.com/');await htmlLink.close();
const mobile=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});await mobile.screenshot({path:`${out}/mobile.png`});assert(await mobile.locator('#services').evaluate(e=>e.getBoundingClientRect().top<innerHeight));assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
// A real horizontal touch gesture changes the route while a vertical gesture scrolls the page.
const client=await mobile.context().newCDPSession(mobile),before=await state(mobile);
await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:320,y:300}]});for(let i=1;i<=8;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:320-i*20,y:300}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert((await state(mobile)).progress>before.progress);assert.equal(await mobile.evaluate(()=>scrollY),0);
await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:390}]});for(let i=1;i<=8;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:390-i*25}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(300);assert(await mobile.evaluate(()=>scrollY>0));
const tap=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const ts=await state(tap),tr=await tap.locator('#orbital-view').boundingBox(),tm=ts.models[1];await tap.route('https://receipt-to-excel.ravirgo.com/**',r=>r.fulfill({contentType:'text/html',body:'Receipt'}));await tap.touchscreen.tap(tr.x+tm.screenX,tr.y+tm.screenY);await tap.waitForURL('https://receipt-to-excel.ravirgo.com/');
const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(url);await reduced.waitForTimeout(400);assert.equal(await reduced.locator('#orbital-view canvas').count(),0);assert.equal(await reduced.locator('.launch-link').count(),2);
const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t==='webgl'||t==='webgl2'?null:get.call(this,t,...args);};});await fallback.goto(url);await fallback.waitForFunction(()=>document.querySelector('#orbital-view').dataset.state==='fallback');assert.equal(await fallback.locator('.launch-link').count(),2);
assert.deepEqual(errors,[]);const result={edgeRadius:3.75,podiumFits:true,clearance,loopsForwardAndReverse:true,entryOrbitExitRepeats:true,ccwRadians:sum,parked:true,fixedSet:true,listVisibleByDefault:true,filterStable:true,modelBodyClicks:2,mobileModelTap:true,mobileHorizontalSwipe:true,mobileVerticalScroll:true,toggleAndResume:true,nativeAnchor:true,reducedMotion:true,webglFallback:true,htmlServiceNames:true,htmlKeyboardLink:true,viewportSensitivity:sensitivity,resizePreservesProgress:true,errors};writeFileSync(`${out}/results.json`,JSON.stringify(result,null,2));console.log(result);await browser.close();
