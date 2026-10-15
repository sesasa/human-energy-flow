import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { referenceDiet, foods, foodById, totals, weeklyAverage, scenarioForDay, type DietApplication } from '../src/model/diet';
import { cloneTemplate, dietTemplates, dietTemplateIds } from '../src/model/dietTemplates';
import { cloneScenario } from '../src/model/config';
import { simulateDiet, weekAbsorption } from '../src/model/dietSimulation';
import { simulateLongTerm } from '../src/model/longTerm';
import { simulateIntenseDay, defaultSprintConfig, sampleSprint } from '../src/model/sprint';
import { simulateNutrients, ironMealInput, defaultNutrientSettings } from '../src/model/micronutrients';
import { labProjection } from '../src/model/labProjection';
import { chapters } from '../src/engine/timeline';
import { mealPlate } from '../src/visual/plates';
const near=(a:number,b:number,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const base=cloneScenario(),app=(id:typeof dietTemplateIds[number]):DietApplication=>({template:id,week:cloneTemplate(id),startDay:0});
const simulations=Object.fromEntries(dietTemplateIds.map(id=>[id,simulateDiet(base,app(id))]));
test('Healthy preserves the exact original seven days and all 28 original food records',()=>{
 const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 assert.equal(hash(referenceDiet),'9bc75533c0aaf3c7701cd950d29e1a32fc7931c00da22cf7b173540b7012e2a4');
 assert.equal(hash(foods.slice(0,28)),'f8bacd19904c23fe95820b32cd10c60a31e23ea81541bef414b62c3f8fffbe37');
 assert.strictEqual(dietTemplates.healthy,referenceDiet);assert.deepEqual(dietTemplateIds,['healthy','fast-food','low-variety']);
});
test('templates are immutable ordinary portions, with two repeating menus for each new week',()=>{
 for(const id of dietTemplateIds){const week=dietTemplates[id];assert.equal(week.length,7);assert.ok(Object.isFrozen(week[0].meals[0].foods));for(const d of week)for(const m of d.meals){assert.ok(m.hour>=0&&m.hour<24);for(const p of m.foods){assert.ok(p.grams>0&&p.grams<=foodById[p.foodId].max);assert.ok(foodById[p.foodId].code);}}}
 for(const id of ['fast-food','low-variety'] as const)assert.equal(new Set(dietTemplates[id].map(d=>JSON.stringify(d.meals))).size,2);
 assert.ok(dietTemplates['low-variety'].every(d=>d.meals.length===2));const edit=cloneTemplate('fast-food');edit[0].meals[0].foods[0].grams=0;assert.equal(dietTemplates['fast-food'][0].meals[0].foods[0].grams,80);
});
test('new food values retain exact CoFID entries and no lab-nutrient data are fabricated',()=>{
 assert.equal(foodById['burger-patty'].code,'19-490');near(foodById['burger-patty'].per100.protein_g,28.5);near(foodById.cola.per100.carbohydrate_g,10.9);near(foodById.pizza.per100.sodium_mg,397);assert.equal(foodById.sausage.per100.ala_g,null);
 for(const id of dietTemplateIds){const w=weeklyAverage(dietTemplates[id]);for(const k of ['iron_mg','b12_ug','folate_ug','d_ug'])assert.ok(!w.missing.includes(k));near(w.kcal,4*w.protein_g+3.75*w.carbohydrate_g+9*w.fat_g+2*w.fiber_g);}
 const low=weeklyAverage(dietTemplates['low-variety']);near(low.micros.b12_ug,0);near(low.micros.d_ug,0);assert.ok(low.micros.calcium_mg>400,'UK fortified bread still supplies calcium; no blanket nutrient penalty');
});
test('switching food leaves person and activity untouched and conserves actual absorbed energy',()=>{
 const before=JSON.stringify(base);
 for(const id of dietTemplateIds){const sim=simulations[id];assert.ok(sim.periodicError<1e-5);const a=weekAbsorption(dietTemplates[id]),w=weeklyAverage(dietTemplates[id]);for(const k of ['carbohydrate_g','protein_g','fat_g','fiber_g'] as const)near(a[k].reduce((n,v)=>n+v,0),w[k]*7,1e-5);
 for(let d=0;d<7;d++){assert.deepEqual(sim.scenarios[d].person,base.person);assert.deepEqual(sim.scenarios[d].activity,{...base.activity,...(d===6?{resistance_training:false}:{})});near(sim.days[d].ledger.residual,0);}}
 assert.equal(JSON.stringify(base),before);
});
test('real food affects daily signals, recovery and sprint substrate without a category penalty',()=>{
 const h=simulations.healthy,f=simulations['fast-food'],l=simulations['low-variety'];assert.notEqual(h.days[0].states[490].glucose,f.days[0].states[490].glucose);assert.notEqual(h.days[0].states[490].insulin,l.days[0].states[490].insulin);assert.ok(l.days[0].states[570].amino<h.days[0].states[570].amino);assert.ok(l.days[0].states[740].recovery<h.days[0].states[740].recovery);
 const low=app('low-variety');for(const d of low.week)for(const m of d.meals)for(const p of m.foods)if(['rice','white-bread','potato'].includes(p.foodId))p.grams*=.5;
 const reduced=simulateDiet(base,low),sprint=(sim:typeof h)=>sampleSprint(simulateIntenseDay(sim.scenarios[0],defaultSprintConfig,sim.options[0]).session,4);
 assert.ok(sprint(reduced).glycogen<sprint(l).glycogen);assert.ok(sprint(reduced).powerCapacity<sprint(l).powerCapacity);assert.ok(sprint(reduced).atp>.85);
 assert.deepEqual(simulateDiet(base,{...app('fast-food'),template:'healthy'}).days[0].states,f.days[0].states,'Metadata cannot alter physiology');
});
test('sustained deficit changes both lean and fat with a closed ledger; surplus can increase mass',()=>{
 const h=simulateLongTerm(base,365,app('healthy')),f=simulateLongTerm(base,365,app('fast-food')),l=simulateLongTerm(base,365,app('low-variety'));
 assert.ok(f[91].weight>h[91].weight);assert.ok(l[91].fat<l[0].fat&&l[91].lean<l[0].lean);assert.ok(f[91].lean>f[0].lean,'Fast food still has protein and calories; no automatic lean-loss penalty');
 for(const states of [h,f,l])for(const s of states){near(s.residual,0);assert.ok(Number.isFinite(s.weight)&&s.fat>0&&s.lean>0);}
 assert.ok(l.some(s=>s.atLimit),'Severe restriction stops at model scope');
 assert.deepEqual(simulateLongTerm(base,91,{...app('low-variety'),template:'healthy'}),l.slice(0,92));
});
test('B12 depletion emerges gradually from food, while lab extrapolation stays bounded and separately labeled',()=>{
 const healthy=app('healthy'),low=app('low-variety'),obs={value:185,unit:'pmol/L',dietAtResult:{week:healthy.week,startDay:0}},before=JSON.stringify(obs);
 const h=simulateNutrients(healthy,365),l=simulateNutrients(low,365);near(l.states[0].b12.storesUg,h.states[0].b12.storesUg);assert.ok(l.states[365].b12.storesUg<l.states[0].b12.storesUg);assert.ok(l.states[1].b12.storesUg/l.states[0].b12.storesUg>.99);
 const p=labProjection(low,'b12',obs);assert.equal(p.points[365].value,null);assert.ok(p.reserveIllustration);near(p.reserveIllustration[365].relative,l.states[365].b12.storesUg/l.states[0].b12.storesUg);assert.equal(JSON.stringify(obs),before);
 const iron=labProjection(low,'ferritin',{value:40,unit:'µg/L'}),rich=labProjection(healthy,'ferritin',{value:40,unit:'µg/L'});assert.ok(iron.points[91].value!<rich.points[91].value!);
 const food={name:'Patty',title:'Patty',hour:13,foods:[{foodId:'burger-patty',grams:100}]};assert.ok(ironMealInput(food,600,defaultNutrientSettings).heme>0);
});
test('one or two meals create valid chapters and honest energy summaries',()=>{
 for(const id of dietTemplateIds){const s=scenarioForDay(base,dietTemplates[id][0]),c=chapters(s);assert.ok(c.every(x=>Number.isFinite(x.start)));if(id==='low-variety'){assert.ok(!c.some(x=>x.id==='lunch'));assert.match(c.find(x=>x.id==='summary')!.caption,/deficit/);}}
 const s=scenarioForDay(base,dietTemplates['low-variety'][0]);s.meals=[s.meals[0]];assert.ok(chapters(s).every(c=>Number.isFinite(c.start)));
});
test('new plates contain the foods and liquid portions and update with edits',()=>{
 const m=structuredClone(dietTemplates['fast-food'][0].meals[1]),a=mealPlate(m,'new-foods');assert.match(a,/Beef burger patty/);assert.match(a,/Cola 400 g/);assert.doesNotMatch(a,/NaN|undefined/);m.foods.find(p=>p.foodId==='fries')!.grams=75;assert.notEqual(mealPlate(m,'new-foods'),a);
 const tea=mealPlate(dietTemplates['low-variety'][0].meals[0]);assert.match(tea,/Black tea 300 g/);
});

test('projection stays stopped after a scope limit even when a later day changes the energy balance',()=>{
 const s=cloneScenario();s.person.body_fat_fraction=.44999;const diet=app('fast-food');diet.week[1].meals.forEach(m=>m.foods.forEach(p=>p.grams=0));
 const states=simulateLongTerm(s,21,diet),first=states.findIndex(s=>s.atLimit);assert.equal(first,1);for(const state of states.slice(first)){assert.equal(state.atLimit,true);near(state.weight,states[first].weight);near(state.residual,0);}
});
test('routine recovery support uses the actual repeating week and is not reset by one meal',()=>{
 const healthy=simulations.healthy;assert.ok(healthy.options.every(o=>o.recoveryFoodSupport===healthy.options[0].recoveryFoodSupport));near(healthy.options[0].recoveryFoodSupport!,1);
 const limited=simulations['low-variety'];assert.ok(limited.options[0].recoveryFoodSupport!<.4);
 const one={...app('healthy'),once:cloneTemplate('low-variety')[0]},sim=simulateDiet(base,one);near(sim.options[0].recoveryFoodSupport!,healthy.options[0].recoveryFoodSupport!);assert.notEqual(sim.days[0].states[550].amino,healthy.days[0].states[550].amino);
});
