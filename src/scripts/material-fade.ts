import type {Material} from 'three';

/** Remember authored alpha before any fade, including when a podium slot is reused. */
export class MaterialFade {
 private originals=new WeakMap<Material,{opacity:number;transparent:boolean}>();
 apply(material:Material,fade:number){
  let original=this.originals.get(material);
  if(!original){original={opacity:material.opacity,transparent:material.transparent};this.originals.set(material,original);}
  const transparent=original.transparent||fade<1||original.opacity<1;
  if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true;}
  material.opacity=original.opacity*fade;
 }
}
