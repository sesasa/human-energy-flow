import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneScenario } from '../src/model/config';
import { cloneDiet, referenceDiet, dayTotals, weeklyAverage, totals, scenarioForDay, dietDayAt, foodById } from '../src/model/diet';
import { simulateDiet, weekAbsorption } from '../src/model/dietSimulation';
import { simulateLongTerm } from '../src/model/longTerm';
import { simulateIntenseDay, sampleSprint, defaultSprintConfig } from '../src/model/sprint';
import { nutritionCalories, energyBudget } from '../src/model/energy';
import { mealPlate } from '../src/visual/plates';
const near=(a:number,b:number,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
const base=cloneScenario(),app={week:cloneDiet(),startDay:0},normal=simulateDiet(base,app);
const rice=(week=cloneDiet())=>week[0].meals[1].foods.find(p=>p.foodId==='rice')!;
test('reference has seven varied days and balanced approximate weekly nutrition',()=>{
 assert.equal(referenceDiet.length,7);assert.equal(new Set(referenceDiet.map(d=>JSON.stringify(d.meals))).size,7);
 const n=weeklyAverage(referenceDiet);assert.ok(n.kcal>=2500&&n.kcal<=2700);assert.ok(n.protein_g>=120&&n.protein_g<=140);assert.ok(n.carbohydrate_g>280);assert.ok(n.fiber_g>=30);
 for(const d of referenceDiet){const n=dayTotals(d);near(n.kcal,nutritionCalories(n));assert.equal(d.meals.length,4);assert.ok(n.kcal>2400&&n.kcal<2800);}
 assert.ok(n.micros.d_ug<15,'food-only vitamin D is not claimed adequate');assert.ok(n.missing.includes('ala_g'));
});
test('real foods have distinct macros and micronutrients, with nulls preserved',()=>{
 const chicken=totals([{foodId:'chicken',grams:150}]),beef=totals([{foodId:'beef',grams:150}]);
 assert.ok(chicken.protein_g>beef.protein_g);assert.ok(beef.fat_g>chicken.fat_g*3);assert.ok(beef.micros.iron_mg>chicken.micros.iron_mg);
 assert.equal(foodById.beef.per100.ala_g,null);assert.ok(beef.missing.includes('ala_g'));
 assert.throws(()=>totals([{foodId:'rice',grams:NaN}]));assert.throws(()=>totals([{foodId:'unknown',grams:50}]));assert.throws(()=>totals([{foodId:'rice',grams:-1}]));
});
test('day-specific portion edits preserve reference and other weekdays',()=>{
 const edit=cloneDiet();rice(edit).grams+=150;assert.equal(rice().grams,300);assert.deepEqual(edit[1],referenceDiet[1]);
 const delta=totals([{foodId:'rice',grams:150}]);near(dayTotals(edit[0]).kcal-dayTotals(referenceDiet[0]).kcal,delta.kcal);near(weeklyAverage(edit).kcal-weeklyAverage(referenceDiet).kcal,delta.kcal/7);
 assert.ok(Object.isFrozen(referenceDiet[0].meals[0].foods));
});
test('weekly convolution independently conserves all nutrients including fibre',()=>{
 const a=weekAbsorption(referenceDiet);
 for(const key of ['carbohydrate_g','protein_g','fat_g','fiber_g'] as const)near(a[key].reduce((n,x)=>n+x,0),referenceDiet.reduce((n,d)=>n+dayTotals(d)[key],0),1e-5);
 assert.ok(a.fat_g[0]>0,'the previous dinner carries into Monday morning');
});
test('weekly state continues through real weekdays and energy includes gut carryover',()=>{
 assert.ok(normal.periodicError<1e-5);
 for(let i=0;i<7;i++){
  const d=normal.days[i],next=normal.days[(i+1)%7];near(d.states[1440].muscle,next.states[0].muscle,1e-5);near(d.states[1440].liver,next.states[0].liver,1e-5);
  near(d.ledger.consumedEnergy-d.ledger.gutEnergyChange,d.ledger.energyIn);near(d.ledger.energyOut,d.budget.total,1e-5);near(d.ledger.residual,0);
 }
 near(normal.days.reduce((n,d)=>n+d.ledger.gutEnergyChange,0),0,1e-5);
 near(normal.days.reduce((n,d)=>n+d.ledger.energyIn,0),referenceDiet.reduce((n,d)=>n+dayTotals(d).kcal,0),1e-5);
 assert.equal(normal.scenarios[6].activity.resistance_training,false);assert.equal(base.activity.resistance_training,true);
});
test('one-day meal edits affect only future absorption; the tail continues tomorrow',()=>{
 const edit=cloneDiet();rice(edit).grams+=150;
 const once=simulateDiet(base,{...app,once:edit[0]});
 for(let m=0;m<=420;m++){near(once.days[0].states[m].glucose,normal.days[0].states[m].glucose);near(once.days[0].states[m].muscle,normal.days[0].states[m].muscle);}
 assert.ok(once.days[0].states[490].glucose>normal.days[0].states[490].glucose);
 assert.ok(once.days[1].ledger.carbohydrateIn>normal.days[1].ledger.carbohydrateIn,'meal tails enter next actual day');
 near(once.days[0].states[1440].muscle,once.days[1].states[0].muscle);
 const expected=totals([{foodId:'rice',grams:150}]).kcal;
 near(once.days.reduce((n,d,i)=>n+d.ledger.energyIn-normal.days[i].ledger.energyIn,0),expected,1e-5);
});
test('one-day scope resumes the applied week and does not silently apply other drafts',()=>{
 const modified=cloneDiet();rice(modified).grams+=150;modified[3].meals[0].foods[0].grams+=50;
 const one={week:cloneDiet(),startDay:0,once:modified[0]};assert.deepEqual(dietDayAt(one,0),modified[0]);assert.deepEqual(dietDayAt(one,3),referenceDiet[3]);assert.deepEqual(dietDayAt(one,7),referenceDiet[0]);
 const once=simulateLongTerm(base,14,one),repeat=simulateLongTerm(base,14,{week:modified,startDay:0}),baseline=simulateLongTerm(base,14,app);
 assert.ok(once[1].cumulativeBalance>baseline[1].cumulativeBalance+150);assert.ok(repeat[14].cumulativeBalance>once[14].cumulativeBalance+150);
 const delta=once[14].fat-baseline[14].fat;assert.ok(delta>0&&delta<.1,'one meal must not cause a repeated-day fat gain');
});
test('weekday alignment changes food and matches the light-day training schedule',()=>{
 const sunday={week:cloneDiet(),startDay:6},states=simulateLongTerm(base,2,sunday);
 assert.equal(states[1].training,'Active recovery');assert.equal(states[2].training,'Push');
 const expected=energyBudget(scenarioForDay(base,referenceDiet[6]),75,35,true);near(states[1].energyBalance,expected.balance);
});
test('removing carbohydrate lowers available muscle fuel and repeated sprint support',()=>{
 const low=cloneDiet();for(const d of low)for(const m of d.meals)for(const p of m.foods)if(foodById[p.foodId].per100.carbohydrate_g>8)p.grams=0;
 const lowApp={week:low,startDay:0},lowWeek=simulateDiet(base,lowApp);
 const normalSprint=simulateIntenseDay(normal.scenarios[0],defaultSprintConfig,normal.options[0]);
 const lowSprint=simulateIntenseDay(lowWeek.scenarios[0],defaultSprintConfig,lowWeek.options[0]);
 assert.ok(lowWeek.days[0].states[590].muscle<normal.days[0].states[590].muscle*.5);
 const n=sampleSprint(normalSprint.session,4),l=sampleSprint(lowSprint.session,4);assert.ok(l.glycogen<n.glycogen*.5);assert.ok(l.powerCapacity<n.powerCapacity);assert.ok(l.atp>.85,'ATP remains protected even in low-fuel illustration');
 near(lowSprint.day.ledger.energyOut,lowSprint.day.budget.total,1e-5);
});
test('plates represent food quantities and omit zero portions',()=>{
 const meal=structuredClone(referenceDiet[0].meals[1]);meal.foods.find(p=>p.foodId==='rice')!.grams=100;const small=mealPlate(meal,'test');meal.foods.find(p=>p.foodId==='rice')!.grams=300;const large=mealPlate(meal,'test');assert.notEqual(small,large);assert.ok(large.includes('Rice 300 g'));
 meal.foods.find(p=>p.foodId==='rice')!.grams=0;assert.ok(!mealPlate(meal,'test').includes('Rice 0 g'));
});
test('empty Monday does not erase nutrient totals for Tuesday through Sunday',()=>{
 const week=cloneDiet();for(const m of week[0].meals)for(const p of m.foods)p.grams=0;
 const n=weeklyAverage(week);near(n.micros.calcium_mg,week.slice(1).reduce((sum,d)=>sum+dayTotals(d).micros.calcium_mg,0)/7);assert.ok(n.micros.calcium_mg>1000);
});
test('plate portion scale is stable across layouts and grows through the supported range',()=>{
 const meal=structuredClone(referenceDiet[0].meals[1]),only={...meal,foods:[{foodId:'rice',grams:300}]};
 const scale=(svg:string)=>Number(svg.match(/data-food="rice" data-grams="[\d.]+" data-portion-scale="([\d.]+)"/)![1]);
 near(scale(mealPlate(meal)),scale(mealPlate(only)));
 let previous=0;for(const grams of [10,100,300,450,600]){only.foods[0].grams=grams;const next=scale(mealPlate(only));assert.ok(next>previous);previous=next;}
});
