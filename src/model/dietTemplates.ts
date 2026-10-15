import { cloneDiet, referenceDiet, type DietWeek, type Meal } from './diet';

export type DietTemplateId = 'healthy' | 'fast-food' | 'low-variety';
export const dietTemplateInfo:Record<DietTemplateId,{name:string;shortName:string;caption:string}>={
 healthy:{name:'Healthy',shortName:'Healthy',caption:'The original seven-day reference diet, unchanged.'},
 'fast-food':{name:'Fast-food / ultra-processed',shortName:'Fast food',caption:'Burgers, fries, pizza and sugary drinks. A few meals repeat through the week.'},
 'low-variety':{name:'Low-variety nutrient-limited',shortName:'Low variety',caption:'Two staple-based meals a day. This example is limited in energy and variety.'}
};
export const dietTemplateIds=Object.keys(dietTemplateInfo) as DietTemplateId[];
const meal=(name:string,title:string,hour:number,foods:[string,number][]):Meal=>({name,title,hour,foods:foods.map(([foodId,grams])=>({foodId,grams}))});
// Authored ordinary portions, never calorie/micronutrient targets. All food values
// come from pinned CoFID records, including fortified UK white bread.
const fast: DietWeek=referenceDiet.map((d,i)=>({name:d.name,meals:[
 meal('Breakfast','Sausage bun & tea',8,[['bun',80],['sausage',75],['tea',300]]),
 meal('Lunch','Cheeseburger, fries & cola',13,[['burger-patty',100],['bun',80],['cheese',20],['fries',150],['cola',400]]),
 i%2===0?meal('Dinner','Pizza & cola',19,[['pizza',300],['cola',330]]):meal('Dinner','Fried chicken, fries & cola',19,[['fried-chicken',180],['fries',200],['cola',330]]),
 meal('Snack','A slice of cake',15,[['cake',80]])
]}));
const limited:DietWeek=referenceDiet.map((d,i)=>({name:d.name,meals:[
 meal('First meal','Bread, potatoes & tea',10,[['white-bread',160],['potato',200],['oil',10],['salt',1],['tea',300]]),
 meal('Evening meal','Rice, potatoes & bread',19,[['rice',i%3===0?300:400],['potato',i%3===0?300:200],['white-bread',80],['oil',10],['salt',1],['tea',300]])
]}));
function freeze<T>(v:T):T{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
export const dietTemplates:Record<DietTemplateId,DietWeek>=freeze({healthy:referenceDiet,'fast-food':fast,'low-variety':limited});
export const cloneTemplate=(id:DietTemplateId)=>cloneDiet(dietTemplates[id]);
