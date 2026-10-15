import { cloneDiet, foodById, totals, type DietWeek, type Meal } from './diet';
import type { PoolKey } from './micronutrients';
export interface FoodExperiment {id:string;title:string;why:string;keys:PoolKey[];days:number[];meal:string;targets:Record<string,number>;remove?:string[];trim:string[]}
export const foodExperiments:FoodExperiment[]=[
 {id:'iron-pair',title:'Lentils + vitamin C',why:'Pair plant iron with vitamin C in the same meal.',keys:['iron','folate'],days:[0,3],meal:'Lunch',targets:{lentils:150,orange:150},trim:['rice','brown-rice','oil']},
 {id:'beef-swap',title:'A beef & potato dinner',why:'Swap one dinner a week; the change in daily average absorption may be small.',keys:['iron'],days:[3],meal:'Dinner',targets:{beef:150},remove:['chicken'],trim:['potato','oil']},
 {id:'salmon-swap',title:'Salmon & vegetable pasta',why:'An oily-fish meal adds B12 and vitamin D.',keys:['b12','vitd'],days:[6],meal:'Dinner',targets:{salmon:150},remove:['chicken','beef'],trim:['pasta','oil']},
 {id:'mackerel-swap',title:'Mackerel, potatoes & greens',why:'A second oily-fish option with a different nutrient mix.',keys:['b12','vitd'],days:[0],meal:'Dinner',targets:{mackerel:150},remove:['beef'],trim:['potato','oil']},
 {id:'greens-swap',title:'More greens, less potato',why:'Add folate-rich spinach alongside the existing dinner.',keys:['folate'],days:[5],meal:'Dinner',targets:{spinach:150},trim:['potato','oil']}
];
export function experimentIncluded(week:DietWeek,experiment:FoodExperiment):boolean {
 return experiment.days.every(d=>{const m=week[d].meals.find(m=>m.name===experiment.meal);if(!m)return false;return Object.entries(experiment.targets).every(([id,g])=>(m.foods.find(p=>p.foodId===id)?.grams||0)>=Math.min(g,foodById[id].max))&&!experiment.remove?.some(id=>(m.foods.find(p=>p.foodId===id)?.grams||0)>0);});
}
export function applyFoodExperiment(week:DietWeek,id:string):DietWeek {
 const experiment=foodExperiments.find(e=>e.id===id);if(!experiment)throw new Error('Unknown food experiment.');
 const next=cloneDiet(week);
 for(const d of experiment.days){
  const meal=next[d].meals.find(m=>m.name===experiment.meal);if(!meal)continue;
  const included=Object.entries(experiment.targets).every(([id,g])=>(meal.foods.find(p=>p.foodId===id)?.grams||0)>=Math.min(g,foodById[id].max))&&!experiment.remove?.some(id=>(meal.foods.find(p=>p.foodId===id)?.grams||0)>0);if(included)continue;
  const before=totals(meal.foods).kcal;
  for(const [id,grams]of Object.entries(experiment.targets)){const p=meal.foods.find(p=>p.foodId===id);if(p)p.grams=Math.min(foodById[id].max,Math.max(p.grams,grams));else meal.foods.push({foodId:id,grams:Math.min(foodById[id].max,grams)});}
  for(const id of experiment.remove||[]){const p=meal.foods.find(p=>p.foodId===id);if(p)p.grams=0;}
  // Replace side portions to approach the previous meal energy; never subtract an extra amount on a second click.
  let extra=totals(meal.foods).kcal-before;
  for(const id of experiment.trim){const p=meal.foods.find(p=>p.foodId===id);if(!p||extra<=0)continue;const perGram=totals([{foodId:id,grams:1}]).kcal,min=id==='oil'?3:80;const remove=Math.max(0,Math.min(p.grams-min,extra/perGram));const old=p.grams;p.grams=Math.round((p.grams-remove)*10)/10;extra-=(old-p.grams)*perGram;}
  meal.title=experiment.title;
 }
 return next;
}
export function mealChanges(before:Meal,after:Meal){
 return [...new Set([...before.foods,...after.foods].map(p=>p.foodId))].map(id=>({id,name:foodById[id].name,before:before.foods.find(p=>p.foodId===id)?.grams||0,after:after.foods.find(p=>p.foodId===id)?.grams||0})).filter(x=>Math.abs(x.after-x.before)>.05);
}
