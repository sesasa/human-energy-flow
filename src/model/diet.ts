import type { PhysiologyProfile } from './profile';
import type { DietTemplateId } from './dietTemplates';
import catalogue from '../../data/foods.json';
import type { NutrientSettings } from './micronutrients';
import type { MicronutrientContext } from './labs';
import { cloneScenario, type Scenario, type Nutrition } from './config';
import { nutritionCalories } from './energy';
export type NutrientKey = keyof typeof catalogue.foods[0]['per100'];
export type Food = typeof catalogue.foods[number];
export const foods: Food[] = catalogue.foods;
export const foodById = Object.fromEntries(foods.map(f => [f.id, f])) as Record<string, Food>;
export interface Portion { foodId: string; grams: number }
export interface Meal { name: string; title: string; hour: number; foods: Portion[] }
export interface DietDay { name: string; meals: Meal[] }
export type DietWeek = DietDay[];
export interface Nutrients extends Nutrition { fiber_g: number; carbohydrate_kcal_g: number; kcal: number; micros: Record<string, number>; missing: string[] }
export function totals(portions: Portion[]): Nutrients {
 const result: Nutrients = { protein_g:0, carbohydrate_g:0, fat_g:0, fiber_g:0, carbohydrate_kcal_g:3.75, kcal:0, micros:{}, missing:[] };
 const missing = new Set<string>();
 for (const p of portions) {
  const food=foodById[p.foodId];
  if(!food || !Number.isFinite(p.grams) || p.grams<0 || p.grams>food.max) throw new Error('Choose a supported food portion.');
  if(p.grams===0)continue;
  for(const [key,value] of Object.entries(food.per100)) {
   if(value===null){missing.add(key);continue;}
   if(['protein_g','carbohydrate_g','fat_g','fiber_g'].includes(key)) (result as unknown as Record<string,number>)[key]+=value*p.grams/100;
   else result.micros[key]=(result.micros[key]||0)+value*p.grams/100;
  }
 }
 result.kcal=nutritionCalories(result);result.missing=[...missing];return result;
}
export const dayTotals=(day:DietDay)=>totals(day.meals.flatMap(m=>m.foods));
export function weeklyAverage(week:DietWeek):Nutrients {
 const days=week.map(dayTotals), result=structuredClone(days[0]);
 for(const key of ['protein_g','carbohydrate_g','fat_g','fiber_g','kcal'] as const)result[key]=days.reduce((n,d)=>n+d[key],0)/week.length;
 result.micros=Object.fromEntries([...new Set(days.flatMap(d=>Object.keys(d.micros)))].map(k=>[k,days.reduce((n,d)=>n+(d.micros[k]||0),0)/week.length]));
 result.missing=[...new Set(days.flatMap(d=>d.missing))];return result;
}
const meal=(name:string,title:string,hour:number,items:[string,number][]):Meal=>({name,title,hour,foods:items.map(([foodId,grams])=>({foodId,grams}))});
const breakfast=(title:string,items:[string,number][])=>meal('Breakfast',title,8,items);
const lunch=(title:string,items:[string,number][])=>meal('Lunch',title,13,items);
const dinner=(title:string,items:[string,number][])=>meal('Dinner',title,19,items);
const snack=(title:string,items:[string,number][])=>meal('Snack',title,15,items);
const reference: DietWeek = [
 {name:'Monday',meals:[breakfast('Banana & almond oats',[['oats',80],['milk',300],['banana',120],['almonds',20]]),lunch('Chicken, rice & greens',[['chicken',100],['rice',300],['broccoli',150],['oil',10],['salt',1]]),dinner('Steak & warm potato salad',[['beef',140],['potato',400],['carrot',150],['spinach',100],['oil',10],['salt',1]]),snack('Yogurt, apple & chocolate',[['yogurt',200],['apple',180],['chocolate',20],['bread',80]])]},
 {name:'Tuesday',meals:[breakfast('Eggs on toast',[['eggs',100],['bread',120],['tomato',100],['orange',180],['milk',250]]),lunch('Lentil & rice bowl',[['lentils',180],['rice',250],['carrot',150],['oil',15],['salt',1]]),dinner('Salmon with potatoes',[['salmon',150],['potato',400],['broccoli',150],['oil',10],['salt',1]]),snack('Yogurt, banana & almonds',[['yogurt',250],['banana',120],['almonds',30],['chocolate',20]])]},
 {name:'Wednesday',meals:[breakfast('Apple & walnut porridge',[['oats',90],['milk',300],['apple',180],['walnuts',20]]),lunch('Chicken & tomato sandwich',[['chicken',100],['bread',120],['tomato',150],['oil',10],['orange',180]]),dinner('Lentil & vegetable pasta',[['pasta',300],['lentils',150],['tomato',200],['spinach',100],['cheese',20],['oil',10],['salt',1]]),snack('Yogurt & a slice of cake',[['yogurt',250],['cake',70]])]},
 {name:'Thursday',meals:[breakfast('Eggs, toast & fruit',[['eggs',100],['bread',120],['orange',180],['milk',300]]),lunch('Steak & brown rice',[['beef',130],['brown-rice',300],['broccoli',150],['oil',10],['salt',1]]),dinner('Chicken & roast-style potatoes',[['chicken',100],['potato',450],['carrot',150],['spinach',100],['oil',15],['salt',1]]),snack('Banana, yogurt & nuts',[['yogurt',200],['banana',180],['almonds',30],['chocolate',20]])]},
 {name:'Friday',meals:[breakfast('Banana & walnut oats',[['oats',80],['milk',300],['banana',120],['walnuts',15]]),lunch('Egg & cheese sandwiches',[['eggs',100],['bread',120],['cheese',20],['tomato',150],['apple',180]]),dinner('Mackerel, rice & greens',[['mackerel',140],['rice',300],['broccoli',150],['carrot',100],['oil',10],['salt',1]]),snack('Yogurt & orange',[['yogurt',250],['orange',180],['almonds',20]])]},
 {name:'Saturday',meals:[breakfast('Weekend eggs & toast',[['eggs',100],['bread',120],['tomato',150],['milk',300],['orange',180]]),lunch('Chicken & lentil rice bowl',[['chicken',80],['lentils',100],['rice',250],['spinach',100],['oil',10],['salt',1]]),dinner('Steak with potatoes & carrots',[['beef',130],['potato',400],['carrot',200],['oil',10],['salt',1]]),snack('A little cake & yogurt',[['cake',80],['yogurt',200],['apple',180],['almonds',20]])]},
 {name:'Sunday',meals:[breakfast('Apple & almond oats',[['oats',80],['milk',300],['apple',180],['almonds',25]]),lunch('Salmon & potato salad',[['salmon',120],['potato',350],['tomato',150],['spinach',100],['oil',10],['salt',1]]),dinner('Chicken & vegetable pasta',[['chicken',100],['pasta',300],['broccoli',150],['tomato',150],['oil',10],['salt',1]]),snack('Yogurt, banana & chocolate',[['yogurt',250],['banana',180],['chocolate',20],['bread',80]])]}
];
function freeze<T>(value:T):T { if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value; }
export const referenceDiet: DietWeek = freeze(reference);
export const cloneDiet = (week: DietWeek = referenceDiet): DietWeek => structuredClone(week);
export function scenarioForDay(base:Scenario,day:DietDay):Scenario {
 const s=cloneScenario(base), n=dayTotals(day), dailyKcal=n.kcal;s.nutrition={protein_g:n.protein_g,carbohydrate_g:n.carbohydrate_g,fat_g:n.fat_g,fiber_g:n.fiber_g,carbohydrate_kcal_g:3.75};
 s.meals=day.meals.map(m=>{const n=totals(m.foods);return {name:m.name,kind:m.title,hour:m.hour,fraction:dailyKcal>0?n.kcal/dailyKcal:1/day.meals.length,nutrition:n};});
 return s;
}
export interface DietApplication { template?:DietTemplateId; onceTemplate?:DietTemplateId; profile?:PhysiologyProfile; week:DietWeek; startDay:number; once?:DietDay; status?:NutrientSettings; micronutrients?:MicronutrientContext }
export function dietDayAt(app:DietApplication,elapsedDay:number):DietDay {return elapsedDay===0&&app.once?app.once:app.week[(app.startDay+elapsedDay)%7];}
