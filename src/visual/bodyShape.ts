import { clamp, defaultScenario, type Scenario } from '../model/config';
import { bodyComposition, withBodyPreset } from '../model/composition';
import { outline } from './anatomy';
export interface BodyShape {outline:string;baseOutline:string;leanWidth:number;fatSignal:number;definition:number}
type Sex=Scenario['person']['sex'];
// Softness and definition are read relative to the authored baseline example for the same sex
// (male 75 kg/17%, female 75 kg/27% at 175 cm); lean width always compares with the male default lean tissue.
const fatReference:Record<Sex,ReturnType<typeof bodyComposition>>={
  male:bodyComposition(defaultScenario.person),
  female:bodyComposition(withBodyPreset({...defaultScenario,person:{...defaultScenario.person,sex:'female'}},'baseline').person)
};
// Moderate female contour: slightly narrower shoulder cap and waist, slightly wider pelvis and upper thigh.
// Hands, arms below the elbow, inner thighs and all internal coordinates are unchanged.
function femaleOffset(x:number,y:number){
  const distance=Math.abs(x-310);
  if(y>105&&y<136&&distance<22)return -1;
  if(y>135&&y<240&&distance>30){
    const reach=clamp((distance-30)/60,0,1),fade=y<200?1:(240-y)/40;
    return -4*reach*fade;
  }
  if(y>=235&&y<345&&distance>55&&distance<82)return -3.5*Math.exp(-(((y-285)/30)**2));
  if(y>=345&&y<480&&distance>45&&distance<95)return 6*Math.exp(-(((y-375)/38)**2));
  return 0;
}
export function bodyShape(person:Scenario['person'],weight=person.weight_kg,fat=weight*person.body_fat_fraction):BodyShape{
  const female=person.sex==='female',current=bodyComposition(person,weight,fat),lean=fatReference.male,soft=fatReference[person.sex];
  const heightScale=(person.height_cm/defaultScenario.person.height_cm)**2;
  const leanWidth=clamp(Math.sqrt(current.lean/lean.lean/heightScale),.78,1.2);
  const fatSignal=clamp((fat/heightScale-soft.fat)/15,-.8,1.7);
  // Female examples store relatively more gluteofemoral and less central fat at the same fat signal.
  const torsoFat=female?.21:.26,thighFat=female?.24:.20;
  const point=(x:number,y:number):[number,number,number]=>{
    const side=x<310?-1:1,distance=Math.abs(x-310),base=female?x+side*femaleOffset(x,y):x;
    let center=310,amount=0;
    if(y<110){amount=.015;}
    else if(y<155){amount=.06;}
    else if(y<390){
      const armCenter=310+side*(80+(Math.min(y,370)-175)*.29);
      if(distance>95&&y>195){center=armCenter;amount=.20;}
      else{amount=.08+torsoFat*Math.exp(-(((y-302)/77)**2));}
    }else if(y<430&&distance>100){
      // Hands overlap the pelvis vertically, but should not use the thigh center.
      center=310+side*145;amount=.025;
    }else{
      center=310+side*(y<510?43:y<635?49:58);
      amount=y<505?thighFat:y<635?.13:.025;
    }
    let next=center+(base-center)*(1+fatSignal*amount);
    // Keep the inner thigh contours separated at the midline.
    if(y>398&&y<510&&distance<40)next=side<0?Math.min(next,306):Math.max(next,314);
    return [next,y,base];
  };
  // The source outline contains absolute M/L/C/Q/Z commands only.
  const tokens=outline.match(/[MLCQZ]|-?\d*\.?\d+/g)!;
  const deformed:string[]=[],sexBase:string[]=[];
  for(let i=0;i<tokens.length;){
    if(/^[MLCQZ]$/.test(tokens[i])){sexBase.push(tokens[i]);deformed.push(tokens[i++]);}
    else{const [x,y,base]=point(Number(tokens[i++]),Number(tokens[i++]));deformed.push(x.toFixed(2),y.toFixed(2));sexBase.push(base.toFixed(2),y.toFixed(2));}
  }
  return {outline:deformed.join(' '),baseOutline:female?sexBase.join(' '):outline,leanWidth,fatSignal,definition:clamp(1-(current.fatFraction-soft.fatFraction)*1.6,.55,1.12)};
}
