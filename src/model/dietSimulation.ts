import { type Scenario } from './config';
import { simulateDay, type Absorption, type DaySimulation, type DayOptions } from './day';
import { scenarioForDay, totals, type DietWeek, type Meal, type DietApplication } from './diet';
import { energyBudget } from './energy';
import { clamp } from './config';
const macros=['carbohydrate_g','protein_g','fat_g','fiber_g'] as const;
const empty=(length:number):Absorption=>Object.fromEntries(macros.map(k=>[k,Array(length).fill(0)])) as unknown as Absorption;
// Finite two-day kernels conserve the entered food, including the slow colonic stream.
export function addMealAbsorption(out:Absorption,meal:Meal,start:number,periodic:boolean,sign=1){
 const n=totals(meal.foods), length=out.protein_g.length;
 const mixed=1+Math.min(.35,n.fat_g/150+n.fiber_g/100);
 for(const macro of macros){
  const scale=({carbohydrate_g:50*mixed,protein_g:70*mixed,fat_g:125,fiber_g:240})[macro];
  const delay=macro==='fiber_g'?240:0;
  const kernel=Array.from({length:2880},(_,dt)=>dt<delay?0:(dt-delay)/scale**2*Math.exp(-(dt-delay)/scale));
  const norm=kernel.reduce((a,b)=>a+b,0);
  kernel.forEach((v,dt)=>{const index=periodic?(start+dt+length)%length:start+dt;if(index>=0&&index<length)out[macro][index]+=sign*v/norm*n[macro];});
 }
}
export function weekAbsorption(week:DietWeek):Absorption {
 const out=empty(10080);
 week.forEach((d,day)=>d.meals.forEach(m=>addMealAbsorption(out,m,day*1440+((m.hour-6+24)%24)*60,true)));
 return out;
}
export function absorptionDay(a:Absorption,day:number):Absorption {return Object.fromEntries(macros.map(k=>[k,a[k].slice(day*1440,(day+1)*1440)])) as unknown as Absorption;}
export interface DietSimulation { days:DaySimulation[]; scenarios:Scenario[]; options:DayOptions[]; warmupWeeks:number; periodicError:number }
export function simulateDiet(base:Scenario,app:DietApplication):DietSimulation {
 const rotated=Array.from({length:7},(_,i)=>app.week[(app.startDay+i)%7]), scenarios=rotated.map((d,i)=>{const s=scenarioForDay(base,d);if((app.startDay+i)%7===6)s.activity.resistance_training=false;return s;});
 const absorption=weekAbsorption(rotated);
 const budgets=scenarios.map(s=>energyBudget(s)),mean=(values:number[])=>values.reduce((a,b)=>a+b,0)/values.length;
 // Habitual energy/protein support spans the repeating week. A one-off meal does
 // not instantly replace that background; its absorbed nutrients still update.
 const recoveryFoodSupport=clamp(Math.min(mean(scenarios.map(s=>s.nutrition.protein_g))/(base.person.weight_kg*base.model.protein_target_g_kg),mean(budgets.map(b=>b.intake))/mean(budgets.map(b=>b.total))));
 let initial:DayOptions['initial'], days:DaySimulation[]=[], periodicError=Infinity,warmupWeeks=0;
 for(let week=0;week<30;week++){
  const start=initial;days=[];
  for(let d=0;d<7;d++){const result=simulateDay(scenarios[d],undefined,{initial,absorption:absorptionDay(absorption,d),singlePass:true,recoveryFoodSupport});days.push(result);initial=result.states[1440];}
  periodicError=start?Math.max(Math.abs(initial!.liver-start.liver),Math.abs(initial!.muscle-start.muscle)):Infinity;
  warmupWeeks=week+1;if(week>=2&&periodicError<.00001)break;
 }
 const options=days.map((d,i)=>({initial:d.states[0],absorption:absorptionDay(absorption,i),singlePass:true,recoveryFoodSupport}));
 if(app.once){
  // Replace only this occurrence: no backwards wrap of the edited meal into yesterday.
  rotated[0].meals.forEach(m=>addMealAbsorption(absorption,m,((m.hour-6+24)%24)*60,false,-1));
  app.once.meals.forEach(m=>addMealAbsorption(absorption,m,((m.hour-6+24)%24)*60,false));
  scenarios[0]=scenarioForDay(base,app.once);if(app.startDay===6)scenarios[0].activity.resistance_training=false;initial=days[0].states[0];days=[];
  for(let d=0;d<7;d++){
   options[d]={initial,absorption:absorptionDay(absorption,d),singlePass:true,recoveryFoodSupport};
   const result=simulateDay(scenarios[d],undefined,options[d]);days.push(result);initial=result.states[1440];
  }
 }
 return {days,scenarios,options,warmupWeeks,periodicError};
}
