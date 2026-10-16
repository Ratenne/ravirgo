export const profiles={
 high:{dpr:2,bloom:.3,bloomScale:.5,samples:4,shadow:2048,active:3},
 balanced:{dpr:1.5,bloom:.14,bloomScale:.25,samples:2,shadow:1024,active:2},
 low:{dpr:1,bloom:0,bloomScale:0,samples:0,shadow:0,active:1},
} as const;
export type Quality=keyof typeof profiles;
export function initialQuality(memory=8,mobile=false,saveData=false):Quality{return saveData||memory<=2?'low':memory<=4||mobile?'balanced':'high';}
/** Ignore warmup and isolated spikes; degrade only after three 30-frame slow windows. */
export class PerformanceMonitor {
 private warmup=24;private costs:number[]=[];private slow=0;
 observe(frameMs:number){if(this.warmup>0){this.warmup--;return false;}this.costs.push(frameMs);if(this.costs.length<30)return false;
  const ordered=this.costs.sort((a,b)=>a-b);const mean=ordered.slice(0,27).reduce((a,b)=>a+b,0)/27;
  this.slow=mean>38?this.slow+1:0;this.costs=[];if(this.slow<3)return false;this.slow=0;this.warmup=24;return true;
 }
}
