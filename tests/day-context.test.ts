import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneScenario } from '../src/model/config';
import { cloneTemplate, dietTemplateIds } from '../src/model/dietTemplates';
import { cloneDiet, dietDayAt, type DietApplication } from '../src/model/diet';
import { simulateDiet } from '../src/model/dietSimulation';
import { simulateLongTerm, sampleLongTerm } from '../src/model/longTerm';
import { representativeDay, scenarioAtBody, supportsDailyBody } from '../src/model/dayContext';
import { energyBudget } from '../src/model/energy';
import { muscleGlycogenCapacity, withBodyPreset } from '../src/model/composition';
import { defaultSprintConfig, simulateIntenseDay, sampleIntenseDay } from '../src/model/sprint';
const near=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);

test('representative body preserves a fractional snapshot and the same physical activity cost',()=>{
 const base=cloneScenario(),app:DietApplication={week:cloneTemplate('fast-food'),startDay:0},original=JSON.stringify({base,app});
 const states=simulateLongTerm(base,365,app),body=sampleLongTerm(states,180.4),context=representativeDay(base,app,states,180.4);
 assert.deepEqual(context.body,body);near(context.scenario.person.weight_kg,body.weight);near(context.scenario.person.body_fat_fraction,body.fat/body.weight);near(context.scenario.person.age,base.person.age+180.4/365);
 near(context.scenario.model.resting_hr_bpm,body.restingHR);
 const expected=energyBudget({...base,nutrition:context.scenario.nutrition},body.weight,base.person.age+180.4/365,context.elapsed%7===6);
 for(const k of ['resting','movement','exercise'] as const)near(context.day.budget[k],expected[k]);
 assert.deepEqual(context.food,dietDayAt(app,180));assert.equal(context.elapsed,180);near(context.day.states[0].muscleCapacity,muscleGlycogenCapacity(context.scenario));near(context.day.ledger.residual,0);
 assert.equal(JSON.stringify({base,app}),original,'Inspecting a day cannot mutate the profile or menu');
});

test('all templates start with the same body and food-dependent daily input',()=>{
 const base=cloneScenario(),intakes:number[]=[];
 for(const id of dietTemplateIds){const app:DietApplication={week:cloneTemplate(id),startDay:0},baseline=simulateDiet(base,app),states=simulateLongTerm(base,90,app),context=representativeDay(base,app,states,0,baseline);
  assert.strictEqual(context.day,baseline.days[0]);assert.deepEqual(context.scenario.person,base.person);near(context.body.leanGain,0);intakes.push(context.day.budget.intake);
 }
 assert.equal(new Set(intakes).size,3,'The food changes immediately; body composition changes over time');
});

test('diet-dependent gain and loss carry through male and female routine and sprint physiology',()=>{
 for(const sex of ['male','female'] as const)for(const id of ['fast-food','low-variety'] as const){
  const base=withBodyPreset({...cloneScenario(),person:{...cloneScenario().person,sex}},'baseline'),app:DietApplication={week:cloneTemplate(id),startDay:0},states=simulateLongTerm(base,90,app),context=representativeDay(base,app,states,42);
  assert.equal(context.scenario.person.sex,sex);assert.ok(id==='fast-food'?context.body.weight>base.person.weight_kg:context.body.weight<base.person.weight_kg);
  near(context.day.states[600].muscleCapacity,muscleGlycogenCapacity(context.scenario));
  const intense=simulateIntenseDay(context.scenario,defaultSprintConfig,context.options),active=sampleIntenseDay(intense,intense.session.startMinute+4/60);
  near(active.body.muscleCapacity,context.day.states[600].muscleCapacity);assert.ok(active.body.hr>context.body.restingHR+10);assert.ok(active.sprint.atp>.85);near(intense.day.ledger.residual,0);
  near(context.scenario.activity.ordinary_movement_kcal,base.activity.ordinary_movement_kcal*context.body.weight/base.person.weight_kg);
  assert.deepEqual({...context.scenario.activity,ordinary_movement_kcal:base.activity.ordinary_movement_kcal},base.activity);
 }
});

test('one-day food edits do not recur in a later representative week',()=>{
 const base=cloneScenario(),app:DietApplication={week:cloneDiet(),startDay:0,once:cloneTemplate('low-variety')[0]},before=JSON.stringify(app),states=simulateLongTerm(base,21,app);
 const first=representativeDay(base,app,states,0),later=representativeDay(base,app,states,7),withoutOnce=simulateDiet(scenarioAtBody(base,later.body),{...app,once:undefined});
 assert.deepEqual(first.food,app.once);assert.deepEqual(later.food,app.week[0]);assert.deepEqual(later.day.states,withoutOnce.days[0].states);assert.equal(JSON.stringify(app),before);
});

test('a stopped body stays frozen in daily views and unsupported inputs are identified',()=>{
 const base=cloneScenario(),app:DietApplication={week:cloneTemplate('low-variety'),startDay:0},states=simulateLongTerm(base,365,app),body=states[365],context=representativeDay(base,app,states,365);
 assert.ok(body.atLimit);near(context.scenario.person.weight_kg,body.weight);near(context.body.leanGain,body.leanGain);assert.ok(supportsDailyBody(base,body));
 assert.equal(supportsDailyBody(base,{...body,weight:161}),false);assert.equal(supportsDailyBody(base,{...body,weight:39}),false);assert.equal(supportsDailyBody({...base,person:{...base.person,age:85}},body),false);
});
