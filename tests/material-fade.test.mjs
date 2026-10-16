import test from 'node:test';
import assert from 'node:assert/strict';
import {MeshStandardMaterial} from 'three';
import {MaterialFade} from '../src/scripts/material-fade.ts';

test('repeated fades preserve authored GLB alpha and blend mode',()=>{
 const fader=new MaterialFade();
 for(const settings of [{opacity:.4,transparent:true},{opacity:1,transparent:true},{opacity:1,transparent:false}]){
  const material=new MeshStandardMaterial(settings);
  for(let cycle=0;cycle<3;cycle++){
   fader.apply(material,.5);assert.equal(material.opacity,settings.opacity*.5);assert(material.transparent);
   fader.apply(material,0);assert.equal(material.opacity,0);
   fader.apply(material,1);assert.equal(material.opacity,settings.opacity);assert.equal(material.transparent,settings.transparent);
  }
  material.dispose();
 }
});
