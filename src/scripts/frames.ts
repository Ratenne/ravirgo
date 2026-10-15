export interface SequenceConfig { count:number; pattern:string; cache?:number; }
/** Bounded async decoder. Only seek() may promote a decoded frame to the screen. */
export class FrameSequence {
 count:number;private cache=new Map<number,ImageBitmap>();private pending=new Set<number>();private target=0;private shown=-1;private disposed=false;private running=0;private failed=new Set<number>();private capacity:number;
 constructor(private config:SequenceConfig,private display:(image:ImageBitmap)=>void){this.count=config.count;this.capacity=Math.max(8,Math.min(config.cache??28,40));}
 seek(index:number){this.target=Math.max(0,Math.min(this.count-1,index));const frame=this.cache.get(this.target);if(frame){this.shown=this.target;this.display(frame);}this.trim();this.pump();}
 private trim(){const entries=[...this.cache.keys()].filter(n=>n!==this.shown).sort((a,b)=>Math.abs(b-this.target)-Math.abs(a-this.target));while(this.cache.size>this.capacity){const n=entries.shift()!;this.cache.get(n)?.close();this.cache.delete(n);}}
 private pump(){if(this.disposed)return;const radius=Math.floor(this.capacity/2);const wanted=[this.target];for(let d=1;d<=radius;d++)wanted.push(this.target+d,this.target-d);for(const n of wanted){if(this.running>=3)break;if(n<0||n>=this.count||this.cache.has(n)||this.pending.has(n)||this.failed.has(n))continue;this.pending.add(n);this.running++;const url=this.config.pattern.replace('{frame}',String(n).padStart(4,'0'));fetch(url).then(r=>{if(!r.ok)throw Error('frame unavailable');return r.blob();}).then(b=>createImageBitmap(b)).then(bitmap=>{if(this.disposed||Math.abs(n-this.target)>this.capacity){bitmap.close();return;}this.cache.set(n,bitmap);if(n===this.target){this.shown=n;this.display(bitmap);}this.trim();}).catch(()=>this.failed.add(n)).finally(()=>{this.pending.delete(n);this.running--;this.pump();});}}
 destroy(){this.disposed=true;for(const b of this.cache.values())b.close();this.cache.clear();}
}
