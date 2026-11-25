import {Color} from 'three';
export const HIGHLIGHT={selected:0x138b78,related:0xc28a24,dimOpacity:.16};
export function applyHighlight(object,baseColor,outline,{active=false,related=false,focused=true,baseOpacity=1,dimOpacity=HIGHLIGHT.dimOpacity}={}){
  const material=object.material,selected=active&&focused,dim=focused&&!active&&!related;
  material.color.copy(baseColor);if(selected)material.color.lerp(new Color(HIGHLIGHT.selected),.4);
  material.opacity=dim?Math.min(baseOpacity,dimOpacity):baseOpacity;material.transparent=material.opacity<1;material.depthWrite=!material.transparent;
  material.emissive?.set(selected?HIGHLIGHT.selected:related?HIGHLIGHT.related:0);if('emissiveIntensity'in material)material.emissiveIntensity=(selected||related) ? .25 : 0;
  if(outline){outline.visible=selected||related;outline.material.color.set(selected?HIGHLIGHT.selected:HIGHLIGHT.related);}
}
