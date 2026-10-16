/** Input-driven conveyor. Each actor traverses [0,1] once, then waits offstage.
 * The finite GPU budget changes spacing, never catalogue membership or order. */
export function createSchedule(count:number,budget:number,restGap:number){
 const gap=count<=2&&count<=budget?restGap:budget>=3?.4:budget===2?.72:1.12;
 const period=Math.max(1.12,count*gap);
 const local=(time:number,index:number)=>{const t=((time-index*gap)%period+period)%period;return t<1e-10||period-t<1e-10?0:t;};
 return {gap,period,local};
}
