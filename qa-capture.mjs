import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {browserOptions,baseURL} from './qa-browser.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT||'docs/qa';mkdirSync(out,{recursive:true});
const browser=await chromium.launch(browserOptions);const errors=[];
try{for(const [name,width,height] of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:width===390,hasTouch:width===390});page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseURL,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#orbital-view')?.dataset.orbit);await page.waitForTimeout(1200);assert.equal(await page.locator('[data-model-label]:visible').count(),2,`${name}: both service labels must fit`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/${name}.png`});
 console.log(name,await page.locator('#orbital-view').evaluate(e=>({quality:e.dataset.quality,performance:e.dataset.performance,overflow:document.documentElement.scrollWidth>innerWidth})));
 await page.goto(baseURL+'archive/');await page.waitForTimeout(1200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/archive-${name}.png`,fullPage:true});await page.close();
}writeFileSync(`${out}/capture-errors.json`,JSON.stringify(errors));assert.deepEqual(errors,[]);console.log({errors});}finally{await browser.close();}
