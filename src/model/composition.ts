import { cloneScenario, defaultScenario, type Scenario } from './config';
export type BodyPreset = 'underweight' | 'baseline' | 'overweight';
export const bodyPresets: {id:BodyPreset;label:string;weightAt175:number;fatFraction:number}[] = [
  {id:'underweight',label:'Underweight',weightAt175:55,fatFraction:.12},
  {id:'baseline',label:'Fit baseline',weightAt175:75,fatFraction:.17},
  {id:'overweight',label:'Overweight',weightAt175:88,fatFraction:.30}
];
export function bodyComposition(person:Scenario['person'],weight=person.weight_kg,fat=weight*person.body_fat_fraction){
  return {weight,fat,lean:weight-fat,fatFraction:fat/weight,bmi:weight/(person.height_cm/100)**2};
}
export function withBodyPreset(s:Scenario,id:BodyPreset):Scenario {
  const preset=bodyPresets.find(p=>p.id===id)!;
  const next=cloneScenario(s);
  next.person.weight_kg=Math.round(preset.weightAt175*(s.person.height_cm/175)**2*10)/10;
  next.person.body_fat_fraction=s.person.sex==='female'?({underweight:.22,baseline:.27,overweight:.38})[id]:preset.fatFraction;
  return next;
}
export function selectedBodyPreset(s:Scenario):BodyPreset|'custom'{
  return bodyPresets.find(p=>{
    const next=withBodyPreset(s,p.id);
    return Math.abs(next.person.weight_kg-s.person.weight_kg)<.051&&Math.abs(next.person.body_fat_fraction-s.person.body_fat_fraction)<1e-6;
  })?.id||'custom';
}
// Fat-free mass is a practical teaching proxy for active tissue, not a muscle measurement.
export function leanSizeScale(s:Scenario){return bodyComposition(s.person).lean/bodyComposition(defaultScenario.person).lean;}
export function muscleGlycogenCapacity(s:Scenario){return s.model.muscle_capacity_g*leanSizeScale(s);}

// Equal relative teaching potential: absolute gains scale with initial lean tissue, not sex.
export const leanGainCeiling=(s:Scenario)=>s.model.lean_gain_ceiling_kg*leanSizeScale(s);
