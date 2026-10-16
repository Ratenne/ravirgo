import {test} from 'node:test';import assert from 'node:assert/strict';
import {createShowcasePath} from '../src/scripts/showcase-path.ts';
import {showcaseConfig as c} from '../src/scripts/showcase-config.ts';
import {createSchedule} from '../src/scripts/showcase-schedule.ts';
test('closed CCW orbit, aligned core, platform clearance and tangent continuity',()=>{
 assert.deepEqual(c.core,c.orbitCenter);const path=createShowcasePath();let prev,sum=0;
 for(let i=0;i<=720;i++){const p=path.orbit.getPoint(i/720);assert(Math.hypot(p.x,p.z)+1.16<6.28);assert(Math.hypot(p.x-c.core.x,p.z-c.core.z)>2.4);if(prev)sum+=Math.atan2(prev.x*(-p.z)-(-prev.z)*p.x,prev.x*p.x+prev.z*p.z);prev=p;}
 assert(Math.abs(sum-Math.PI*2)<1e-8);
 assert(path.entry.getPoint(1).distanceTo(path.orbit.getPoint(0))<1e-9);assert(path.exit.getPoint(0).distanceTo(path.orbit.getPoint(1))<1e-9);
 assert(path.entry.getTangent(1).dot(path.orbit.getTangent(0))>.999);assert(path.exit.getTangent(0).dot(path.orbit.getTangent(1))>.999);
 for(const count of [2,5,12,30])for(const budget of [1,2,3]){const schedule=createSchedule(count,budget,path.gap);for(let i=0;i<1000;i++){const actors=Array.from({length:count},(_,j)=>path.sample(schedule.local(schedule.period*i/1000,j))).filter(s=>['entry','orbit','exit'].includes(s.phase));for(let a=0;a<actors.length;a++)for(let b=a+1;b<actors.length;b++)assert(Math.hypot(actors[a].position.x-actors[b].position.x,actors[a].position.z-actors[b].position.z)>2.32);}}
});

test('entry and exit podiums clear the rear parapet in both viewport paths',()=>{
 for(const mobile of [false,true])for(const curve of ['entry','exit']){
  const path=createShowcasePath({mobile});
  for(let i=0;i<=3000;i++){
   const p=path[curve].getPointAt(i/3000),radius=Math.hypot(p.x,p.z);
   // Conservative cylindrical footprint: podium radius 1.16, base +.48.
   if(p.z<0&&radius+1.16>=9.48&&radius-1.16<=10.07)assert(p.y+.48>1.925+.1,`${mobile}/${curve}: podium clips parapet`);
  }
 }
});
