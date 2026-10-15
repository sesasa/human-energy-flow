import { clamp, type Scenario } from './config';
import { leanGainCeiling } from './composition';
import { energyBudget } from './energy';
import { scenarioForDay, type DietApplication } from './diet';
export interface AdaptationState { day: number; weight: number; fat: number; lean: number; leanGain: number; fitness: number; restingHR: number; energyBalance: number; cumulativeBalance: number; storedEnergy: number; residual: number; training: string; atLimit: boolean }
export const trainingRotation = ['Push','Pull','Legs','Push','Pull','Legs','Active recovery'];
export const muscleResponse: Record<string, number> = { chest:.8, back:1, shoulders:.85, biceps:.65, triceps:.65, quadriceps:1, hamstrings:.7, gluteals:.9, calves:.45, core:.35 };
export function simulateLongTerm(s: Scenario, days = 1095, diet?:DietApplication): AdaptationState[] {
  const week=diet?.week.map(d=>scenarioForDay(s,d));
  const once=diet?.once?scenarioForDay(s,diet.once):undefined;
  const nutritionDay=(index:number)=>index===0&&once?once:week![(diet!.startDay+index+7)%7];
  const ceiling=leanGainCeiling(s);
  const initialFat = s.person.weight_kg*s.person.body_fat_fraction, initialLean = s.person.weight_kg-initialFat;
  // fitness is additional conditioning relative to the already-fit scenario baseline.
  // Zero here does not mean an unfit individual; the gain ceiling is chosen for this baseline.
  let fat = initialFat, lean = initialLean, fitness = 0, cumulativeBalance = 0;
  const out: AdaptationState[] = [{ day:0,weight:fat+lean,fat,lean,leanGain:0,fitness:0,restingHR:s.model.resting_hr_bpm,energyBalance:energyBudget(s).balance,cumulativeBalance:0,storedEnergy:0,residual:0,training:'Push',atLimit:false }];
  for (let day = 1; day <= days; day++) {
    if(out.at(-1)!.atLimit){out.push({...out.at(-1)!,day});continue;}
    const weekday=((diet?.startDay || 0)+day-1)%7;
    const current=diet?nutritionDay(day-1):s;
    const lightDay = weekday === 6;
    const b = energyBudget(current,fat+lean,s.person.age+(day-1)/365,lightDay);
    // An illustrative gain rule, not a validated biological equation.
    const rollingProtein=diet?Array.from({length:7},(_,i)=>{const index=day-1-i;return nutritionDay(index).nutrition.protein_g;}).reduce((a,b)=>a+b,0)/7:s.nutrition.protein_g;
    const proteinAdequacy = clamp(rollingProtein / ((fat+lean)*s.model.protein_target_g_kg));
    const recovery = clamp(s.activity.sleep_hours / 8);
    const energyAdequacy = clamp(1+b.balance/600,0,1);
    const volume = clamp(b.resistanceMinutes / 42) * s.activity.training_intensity/.75;
    const stimulus = s.activity.resistance_training && !lightDay ? volume : 0;
    const trainingGain = ceiling / s.model.adaptation_time_days * stimulus * proteinAdequacy * recovery * energyAdequacy * Math.max(0,1-(lean-initialLean)/ceiling);
    // Forbes/Hall differential composition relation: dL/dW = 10.4/(10.4+F).
    // Apply to sustained (seven-day mean) deficit, not every low-intake meal/day.
    // This is generic fat-free tissue partitioning, not a muscle-loss prediction.
    const meanBalance=Array.from({length:7},(_,i)=>{
      const index=day-1-i,prior=diet?nutritionDay(index):s,light=((diet?.startDay||0)+index+7)%7===6;
      return energyBudget(prior,fat+lean,s.person.age+(day-1)/365,light).balance;
    }).reduce((a,b)=>a+b,0)/7;
    const leanShare=10.4/(10.4+fat),lossEnergy=Math.max(0,-meanBalance);
    const leanLoss=lossEnergy*leanShare/(leanShare*s.model.lean_energy_kcal_kg+(1-leanShare)*s.model.fat_energy_kcal_kg);
    const gain=trainingGain-leanLoss;
    const proposedFat = fat + (b.balance-gain*s.model.lean_energy_kcal_kg)/s.model.fat_energy_kcal_kg;
    // Stop projecting rather than silently violating conservation beyond supported composition.
    if (proposedFat/(proposedFat+lean+gain) < (s.person.sex==='female'?.14:.06) || proposedFat/(proposedFat+lean+gain) > .45) {
      out.push({...out.at(-1)!,day,training:'Outside model range',atLimit:true});
      continue;
    }
    lean += gain; fat = proposedFat;
    const cardioTarget = clamp(s.activity.exercise_minutes/60)*recovery;
    fitness += (cardioTarget-fitness)/210;
    cumulativeBalance += b.balance;
    const storedEnergy = (fat-initialFat)*s.model.fat_energy_kcal_kg+(lean-initialLean)*s.model.lean_energy_kcal_kg;
    out.push({day,weight:fat+lean,fat,lean,leanGain:lean-initialLean,fitness,restingHR:s.model.resting_hr_bpm-s.model.hr_adaptation_bpm*fitness,
      energyBalance:b.balance,cumulativeBalance,storedEnergy,residual:cumulativeBalance-storedEnergy,
      training:s.activity.exercise_minutes===0 ? 'No exercise' : lightDay || !s.activity.resistance_training || b.resistanceMinutes===0 ? 'Active recovery' : trainingRotation[weekday],atLimit:false });
  }
  return out;
}
export function sampleLongTerm(states: AdaptationState[], day: number): AdaptationState {
  const d = clamp(day,0,states.length-1), lo = Math.floor(d), a = states[lo], b = states[Math.min(lo+1,states.length-1)], f = d-lo;
  const out = {...a};
  for (const key of Object.keys(a) as (keyof AdaptationState)[]) if (typeof a[key] === 'number') (out as unknown as Record<string,unknown>)[key] = (a[key] as number) + ((b[key] as number)-(a[key] as number))*f;
  return out;
}
