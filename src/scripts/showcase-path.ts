import * as THREE from 'three';
import {showcaseConfig as c} from './showcase-config';
export type PathPhase='before'|'entry'|'orbit'|'exit'|'after';
/** Horizontal closed orbit with a wider foreground arc around the offset core. */
class ShowcaseOrbit extends THREE.Curve<THREE.Vector3>{
 getPoint(t:number,target=new THREE.Vector3()){
  const a=c.orbitStartAngle+t*Math.PI*2,front=THREE.MathUtils.clamp(-Math.sin(a)/.6,0,1);
  const r=THREE.MathUtils.lerp(c.orbitRadius,c.orbitFrontRadius,front*front*(3-2*front));
  return target.set(c.orbitCenter.x+r*Math.cos(a),c.modelHeight,c.orbitCenter.z-r*Math.sin(a));
 }
 getPointAt(t:number,target=new THREE.Vector3()){return this.getPoint(t,target);}
 getTangent(t:number,target=new THREE.Vector3()){
  // Wrapped central difference keeps tangents continuous at the closed seam.
  return target.copy(this.getPoint(t+.00001)).sub(this.getPoint(t-.00001)).normalize();
 }
 getTangentAt(t:number,target=new THREE.Vector3()){return this.getTangent(t,target);}
}
export function createShowcasePath({mobile=false}={}){
 const orbit=new ShowcaseOrbit(),join=orbit.getPoint(0),tangent=orbit.getTangent(0);
 // Exact shared endpoints and parallel tangent directions at entry→orbit→exit.
 const entry=new THREE.CubicBezierCurve3(new THREE.Vector3(...(mobile?c.entry.mobileStart:c.entry.start)),new THREE.Vector3(...c.entry.control),join.clone().addScaledVector(tangent,-c.entry.tangentLength),join.clone());
 const bendControl=new THREE.Vector3(...c.exit.bendControl),bendEnd=new THREE.Vector3(...c.exit.bendEnd);
 const exitA=new THREE.CubicBezierCurve3(join.clone(),join.clone().addScaledVector(tangent,c.exit.tangentLength),bendControl,bendEnd);
 const exitB=new THREE.CubicBezierCurve3(bendEnd.clone(),bendEnd.clone().add(bendEnd.clone().sub(bendControl)),new THREE.Vector3(...c.exit.control),new THREE.Vector3(...c.exit.end));
 const exit=new THREE.CurvePath<THREE.Vector3>();exit.add(exitA);exit.add(exitB);
 for(const curve of [entry,exitA,exitB,exit]){curve.arcLengthDivisions=1600;curve.updateArcLengths();}
 const sum=c.phaseRatios.entry+c.phaseRatios.orbit+c.phaseRatios.exit;
 const entryEnd=c.phaseRatios.entry/sum,orbitEnd=entryEnd+c.phaseRatios.orbit/sum;
 // Keep the two rest positions opposite while the foreground arc bends around the core.
 const gap=c.modelPhaseGap*(orbitEnd-entryEnd);
 function sample(local:number){
  // Wheel accumulation and cycle wrapping can differ by a sub-pixel input rounding at the dock.
  if(Math.abs(local-entryEnd)<1e-7)local=entryEnd;
  if(Math.abs(local-orbitEnd)<1e-7)local=orbitEnd;
  if(local<0)return {position:entry.getPoint(0),phase:'before' as PathPhase,segment:0};
  if(local>1)return {position:exit.getPoint(1),phase:'after' as PathPhase,segment:1};
  if(local<entryEnd){const u=local/entryEnd;return {position:entry.getPointAt(u),phase:'entry' as PathPhase,segment:u};}
  if(local<=orbitEnd){const u=(local-entryEnd)/(orbitEnd-entryEnd);return {position:orbit.getPointAt(u),phase:'orbit' as PathPhase,segment:u};}
  const u=(local-orbitEnd)/(1-orbitEnd);return {position:exit.getPointAt(u),phase:'exit' as PathPhase,segment:u};
 }
 const period=1+c.cyclePause;
 // Wrap only while offstage: each visible traversal still contains one whole circle.
 function modelProgress(global:number,index:number){const raw=global-index*gap;return ((raw%period)+period)%period;}
 return {entry,orbit,exit,entryEnd,orbitEnd,gap,period,sample,modelProgress};
}
