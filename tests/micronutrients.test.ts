import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneDiet, referenceDiet, dayTotals, dietDayAt, type DietApplication, type Meal } from '../src/model/diet';
import { defaultNutrientSettings as normal, simulateNutrients, sampleNutrients, nutrientInput, ironMealInput, b12MealInput } from '../src/model/micronutrients';
import { withIronPair } from '../src/visual/nutrientPanel';
import { simulateLongTerm } from '../src/model/longTerm';
import { cloneScenario } from '../src/model/config';
const near=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const app: DietApplication={week:cloneDiet(),startDay:0},low={...app,status:{...normal,iron:'low' as const,b12:'low' as const}};
const reference=simulateNutrients(app),depleted=simulateNutrients(low);
const meal=(foods:Meal['foods']):Meal=>({name:'Lunch',title:'Test meal',hour:13,foods});

test('reference iron and B12 stores stay near steady for three years',()=>{
 for(const state of reference.states)for(const key of ['iron','b12'] as const)assert.ok(Math.abs(state[key].index-1)<.02);
});
test('explicit low reserves preserve functional iron and replenish gradually',()=>{
 near(depleted.states[0].iron.index,.42);near(depleted.states[0].b12.index,.32);
 near(depleted.states[0].iron.redCellsMg,reference.states[0].iron.redCellsMg);
 assert.ok(depleted.states[1].iron.index<.43);assert.ok(depleted.states[28].iron.index<.5);
 assert.ok(depleted.states[84].iron.index>depleted.states[28].iron.index);
 assert.ok(depleted.states[365].iron.index<.9);assert.ok(depleted.states[365].iron.index>depleted.states[84].iron.index);
 assert.ok(depleted.states[365].b12.index<.6);assert.ok(depleted.states[1095].b12.index>depleted.states[365].b12.index);
});
test('iron and B12 mass balance closes at every daily boundary',()=>{
 for(const sim of [reference,depleted])for(let d=1;d<sim.states.length;d++){
  const a=sim.states[d-1],b=sim.states[d],iron=b.iron;
  near(iron.totalMg,iron.storesMg+iron.transportMg+iron.redCellsMg+iron.tissueMg+iron.marrowQueue.reduce((s,n)=>s+n,0));
  near(iron.totalMg-a.iron.totalMg,a.iron.absorbedMg-a.iron.lossesMg);
  near(b.b12.storesUg-a.b12.storesUg,a.b12.absorbedUg-a.b12.lossesUg);
  near(iron.residualMg,0);near(b.b12.residualUg,0);
  assert.ok(iron.storesMg>=0&&iron.transportMg>=0&&iron.tissueMg>=0&&b.b12.storesUg>=0);
 }
});
test('functional iron recycling is much larger than external intake and loss',()=>{
 const s=depleted.states[0].iron;
 assert.ok(s.recycledMg>20&&s.recycledMg<25);assert.ok(s.absorbedMg<s.recycledMg/5);
 near(s.lossesMg,1.2);near(s.marrowUseMg,20);assert.equal(s.marrowQueue.length,7);
 for(let d=0;d<365;d++)near(depleted.states[d+7].iron.maturedMg,depleted.states[d].iron.marrowUseMg);
});
test('food iron absorption uses current stores and same-meal vitamin C',()=>{
 const base=meal([{foodId:'lentils',grams:150}]),paired=meal([...base.foods,{foodId:'orange',grams:150}]);
 const plain=ironMealInput(base,252,normal),withC=ironMealInput(paired,252,normal);
 assert.ok(withC.absorbed/withC.intake>plain.absorbed/plain.intake);
 assert.ok(ironMealInput(base,600,normal).absorbed<plain.absorbed);
 const apart={name:'Test day',meals:[base,meal([{foodId:'orange',grams:150}])]};
 assert.ok(nutrientInput({name:'Test day',meals:[paired]},252,normal).ironAbsorbed>nutrientInput(apart,252,normal).ironAbsorbed);
 assert.ok(plain.absorbed<plain.intake);
});
test('iron pairing edits only Monday/Thursday and changes the year curve',()=>{
 const before=JSON.stringify(referenceDiet),edit=withIronPair(cloneDiet()),repeat=simulateNutrients({...low,week:edit},365);
 assert.equal(JSON.stringify(referenceDiet),before);assert.deepEqual(withIronPair(edit),edit,'The pairing must not stack on repeated use');
 for(const day of [1,2,4,5,6])assert.deepEqual(edit[day],referenceDiet[day]);
 assert.ok(dayTotals(edit[0]).micros.iron_mg>dayTotals(referenceDiet[0]).micros.iron_mg);
 assert.ok(repeat.states[365].iron.index>depleted.states[365].iron.index+.01);
 near(repeat.states[0].iron.index,depleted.states[0].iron.index);
});
test('a one-day iron food experiment resumes the actual week and has a small lasting effect',()=>{
 const edit=withIronPair(cloneDiet()),onceApp={...low,once:edit[0]},once=simulateNutrients(onceApp,365),repeat=simulateNutrients({...low,week:edit},365);
 assert.deepEqual(dietDayAt(onceApp,3),referenceDiet[3]);assert.deepEqual(dietDayAt(onceApp,7),referenceDiet[0]);
 near(once.states[1].iron.intakeMg,dayTotals(referenceDiet[1]).micros.iron_mg);
 assert.ok(once.states[365].iron.index>depleted.states[365].iron.index);
 assert.ok(once.states[365].iron.index-depleted.states[365].iron.index<.003);
 assert.ok(repeat.states[365].iron.index>once.states[365].iron.index+.01);
});
test('day offset and stock sampling keep intake distinct from stored reserve',()=>{
 const sim=simulateNutrients({...low,startDay:3},14);
 near(sim.states[0].iron.intakeMg,dayTotals(referenceDiet[3]).micros.iron_mg);
 const half=sampleNutrients(sim,1.5);near(half.iron.index,(sim.states[1].iron.index+sim.states[2].iron.index)/2);
 near(half.iron.intakeMg,dayTotals(referenceDiet[4]).micros.iron_mg);
});
test('reduced iron absorption and higher losses can reverse adequate-food recovery',()=>{
 for(const status of [{...normal,iron:'low' as const,ironAbsorption:'reduced' as const},{...normal,iron:'low' as const,ironLosses:'higher' as const}]){
  const sim=simulateNutrients({...app,status},90);assert.ok(sim.states[90].iron.index<sim.states[0].iron.index);
 }
});
test('empty food sources deplete gradually; projection stops without inventing anemia',()=>{
 const week=cloneDiet();for(const day of week)for(const m of day.meals)for(const f of m.foods)f.grams=0;
 const sim=simulateNutrients({...low,week}),stop=sim.states.findIndex(s=>s.iron.atLimit);
 assert.ok(stop>150&&stop<300);assert.ok(sim.states[28].iron.storesMg>200);
 for(let d=0;d<stop;d++)near(sim.states[d].iron.redCellsMg,2400);
 for(const s of sim.states){near(s.iron.residualMg,0);near(s.b12.residualUg,0);assert.ok(s.iron.storesMg>=0&&s.b12.storesUg>0);}
 near(sim.states[1095].iron.totalMg,sim.states[stop].iron.totalMg);
 assert.ok(sim.states[1095].b12.storesUg<sim.states[stop].b12.storesUg);
});
test('B12 uptake saturates by meal; absorption assumptions matter independently of intake',()=>{
 const one=meal([{foodId:'salmon',grams:150}]),big=meal([{foodId:'salmon',grams:300}]);
 const small=b12MealInput(one,normal),large=b12MealInput(big,normal),reduced=b12MealInput(one,{...normal,b12Absorption:'reduced'});
 near(large.intake,2*small.intake);assert.ok(large.absorbed<2*small.absorbed);assert.ok(reduced.absorbed<small.absorbed/2);
 const sim=simulateNutrients({...app,status:{...normal,b12Absorption:'reduced'}},365);
 assert.ok(sim.states[365].b12.index<.8);near(sim.states[365].iron.index,reference.states[365].iron.index);
});
test('selected low stores do not automatically infer body-composition or performance changes',()=>{
 assert.deepEqual(simulateLongTerm(cloneScenario(),14,app),simulateLongTerm(cloneScenario(),14,low));
 const copy=JSON.stringify(low);simulateNutrients(low,2);assert.equal(JSON.stringify(low),copy);
});
test('invalid nutrient assumptions are rejected',()=>{
 assert.throws(()=>simulateNutrients({...app,status:{...normal,iron:'symptoms' as any}},1));
 assert.throws(()=>simulateNutrients({...app,status:{...normal,b12Absorption:'magic' as any}},1));
 assert.throws(()=>simulateNutrients(app,0));assert.throws(()=>simulateNutrients(app,2.5));
});
