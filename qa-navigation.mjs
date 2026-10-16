import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {browserOptions,baseURL} from './qa-browser.mjs';
const browser=await chromium.launch(browserOptions),page=await browser.newPage(),errors=[];
try{
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true}}));
 await page.goto(baseURL);
 for(let i=0;i<6;i++){
  await page.locator('.archive-shortcut').click();await page.waitForURL('**/archive/');
  assert.equal(await page.locator('canvas').count(),0);
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>/\/orbital\.[^/]+\.js/.test(r.name))),false);
  if(i%2)await page.goBack();else await page.locator('.site-header nav a[href="/"]').click();
  await page.waitForURL(baseURL);
 }
 for(let i=0;i<2;i++){
  const link=page.locator('.launch-link').nth(i),destination=new URL(await link.getAttribute('href')).href;
  await page.route(destination+'**',route=>route.fulfill({contentType:'text/html',body:'Service destination'}));
  await link.click();await page.waitForURL(destination);await page.goBack();await page.waitForURL(baseURL);
 }
 await page.waitForTimeout(500);assert.deepEqual(errors,[]);
 const result={nativeNavigationCycles:6,externalServiceLinks:2,archiveLoadsNoWebGLBundle:true,errors};
 writeFileSync('docs/qa/navigation.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}
