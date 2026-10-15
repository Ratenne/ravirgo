import * as THREE from 'three';
import {showcaseConfig as c} from './showcase-config';
export type PathPhase='before'|'entry'|'orbit'|'exit'|'after';
/** A real horizontal circle, viewed from +Y: increasing angle is counterclockwise. */
class OrbitCircle extends THREE.Curve<THREE.Vector3>{
 getPoint(t:number,target=new THREE.Vector3()){const a=c.orbitStartAngle+t*Math.PI*2;return target.set(c.core.x+c.orbitRadius*Math.cos(a),c.modelHeight,c.core.z-c.orbitRadius*Math.sin(a));}
 getPointAt(t:number,target=new THREE.Vector3()){return this.getPoint(t,target);}
 getTangent(t:number,target=new THREE.Vector3()){const a=c.orbitStartAngle+t*Math.PI*2;return target.set(-Math.sin(a),0,-Math.cos(a));}
 getTangentAt(t:number,target=new THREE.Vector3()){return this.getTangent(t,target);}
 getLength(){return Math.PI*2*c.orbitRadius;}
}
export function createShowcasePath({mobile=false}={}){
 const orbit=new OrbitCircle(),join=orbit.getPoint(0),tangent=orbit.getTangent(0);
 // Exact shared endpoints and parallel tangent directions at entry→orbit→exit.
 const entry=new THREE.CubicBezierCurve3(new THREE.Vector3(...(mobile?c.entry.mobileStart:c.entry.start)),new THREE.Vector3(...c.entry.control),join.clone().addScaledVector(tangent,-c.entry.tangentLength),join.clone());
 const bendControl=new THREE.Vector3(...c.exit.bendControl),bendEnd=new THREE.Vector3(...c.exit.bendEnd);
 const exitA=new THREE.CubicBezierCurve3(join.clone(),join.clone().addScaledVector(tangent,c.exit.tangentLength),bendControl,bendEnd);
 const exitB=new THREE.CubicBezierCurve3(bendEnd.clone(),bendEnd.clone().add(bendEnd.clone().sub(bendControl)),new THREE.Vector3(...c.exit.control),new THREE.Vector3(...c.exit.end));
 const exit=new THREE.CurvePath<THREE.Vector3>();exit.add(exitA);exit.add(exitB);
 for(const curve of [entry,exitA,exitB,exit]){curve.arcLengthDivisions=1600;curve.updateArcLengths();}
 const sum=c.phaseRatios.entry+c.phaseRatios.orbit+c.phaseRatios.exit;
 const entryEnd=c.phaseRatios.entry/sum,orbitEnd=entryEnd+c.phaseRatios.orbit/sum;
 // Offset is expressed as orbital arc spacing, not array index or selected-filter order.
 const gap=c.modelGapWorld/orbit.getLength()*(orbitEnd-entryEnd);
 function sample(local:number){
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
