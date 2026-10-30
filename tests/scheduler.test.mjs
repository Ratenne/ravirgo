import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSchedule} from '../src/scripts/showcase-schedule.ts';
for(const count of [1,2,3,5,10,12,30])for(const budget of [1,2,3,4,5])test(`${count} services / ${budget} concurrent: repeat, reverse, coverage and budget`,()=>{
 const schedule=createSchedule(count,budget,.29),seen=new Set();
 for(let step=0;step<1500;step++){
  const time=step/1500*schedule.period;
  const active=Array.from({length:count},(_,i)=>({i,t:schedule.local(time,i)})).filter(a=>a.t<1);
  assert(active.length<=budget);
  for(const {i,t} of active){seen.add(i);assert(Math.abs(schedule.local(time+schedule.period*4,i)-t)<1e-9);assert(Math.abs(schedule.local(time-schedule.period*3,i)-t)<1e-9);}
 }
 assert.equal(seen.size,count);
});
import {PerformanceMonitor,initialQuality} from '../src/scripts/quality.ts';
test('quality ignores warmup and spikes but degrades sustained slowness',()=>{const m=new PerformanceMonitor();for(let i=0;i<24;i++)assert(!m.observe(100));for(let i=0;i<90;i++)assert(!m.observe(i%30===0?200:16));let drops=0;for(let i=0;i<90;i++)if(m.observe(50))drops++;assert.equal(drops,1);assert.equal(initialQuality(2),'low');assert.equal(initialQuality(undefined,true),'balanced');assert.equal(initialQuality(8,false),'high');assert.equal(initialQuality(8,true),'balanced');});

test('five services can be on the orbit together',async()=>{const {createShowcasePath}=await import('../src/scripts/showcase-path.ts');const path=createShowcasePath({capacity:5}),schedule=createSchedule(5,5,path.gap);let maximum=0;for(let i=0;i<2000;i++){const count=Array.from({length:5},(_,j)=>path.sample(schedule.local(schedule.period*i/2000,j))).filter(s=>s.phase==='orbit').length;maximum=Math.max(maximum,count);}assert.equal(maximum,5);});
