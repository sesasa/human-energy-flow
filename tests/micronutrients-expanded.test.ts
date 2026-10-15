import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneDiet, dayTotals, weeklyAverage, type DietApplication } from '../src/model/diet';
import { simulateNutrients, defaultNutrientSettings as normal, sampleNutrients, storeTrend } from '../src/model/micronutrients';
import { applyFoodExperiment, foodExperiments, experimentIncluded } from '../src/model/foodExperiments';
import { compareObservation, observationError, validateMicronutrientContext } from '../src/model/labs';
const near=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const app: DietApplication={week:cloneDiet(),startDay:0},ref=simulateNutrients(app),low=simulateNutrients({...app,status:{...normal,folate:'low',vitd:'low',b12:'low'}});
test('vitamin D and folate have conserved input-loss ledgers and gradual first-day changes',()=>{
 for(const sim of [ref,low])for(let d=1;d<sim.states.length;d++)for(const k of ['vitd','folate'] as const){const before=sim.states[d-1][k],after=sim.states[d][k];near(after.storesUg-before.storesUg,before.absorbedUg+before.externalUg-before.lossesUg);near(after.residualUg,0);assert.ok(after.storesUg>0);}
 assert.ok(low.states[1].folate.index<.42);assert.ok(low.states[1].vitd.index<.48);
});
test('folate and vitamin D change over weeks/months, distinct from slower B12',()=>{
 assert.ok(low.states[91].folate.index>.8&&low.states[91].folate.index<.9);assert.ok(low.states[91].vitd.index>.9);assert.ok(low.states[91].b12.index<.4);
 for(const s of ref.states){assert.ok(Math.abs(s.folate.index-1)<.03);assert.ok(Math.abs(s.vitd.index-1)<.05);}
 const sample=sampleNutrients(low,2.5);near(sample.folate.index,(low.states[2].folate.index+low.states[3].folate.index)/2);near(sample.vitd.intakeUg,low.states[2].vitd.intakeUg);
});
test('removing non-food D input can lower status despite unchanged food intake',()=>{
 const none=simulateNutrients({...app,status:{...normal,vitdSource:'none'}},365);
 near(none.states[0].vitd.intakeUg,ref.states[0].vitd.intakeUg);near(none.states[0].vitd.externalUg,0);
 assert.ok(none.states[365].vitd.index<.5);assert.ok(none.states[365].vitd.index>0);
 near(none.states[365].iron.index,ref.states[365].iron.index);near(none.states[365].folate.index,ref.states[365].folate.index);
});
test('reduced folate absorption can worsen a low starting reserve',()=>{
 const sim=simulateNutrients({...app,status:{...normal,folate:'low',folateAbsorption:'reduced'}},365);assert.ok(sim.states[365].folate.index<sim.states[0].folate.index);
});
test('core pool solver only uses explicit initial-state options; lab calibration stays in its wrapper',()=>{
 const a=simulateNutrients({...app,micronutrients:{intent:'lab',observations:{ferritin:{value:18,low:30,high:300,unit:'µg/L'},vitd:{value:38,unit:'nmol/L'}}}},91);
 const b=simulateNutrients({...app,micronutrients:{intent:'lab',observations:{ferritin:{value:500,unit:'ng/mL'},vitd:{value:85,unit:'ng/mL'}}}},91);
 assert.deepEqual(a,b);assert.equal(a.states[0].iron.index,1);
});
test('lab comparison uses only supplied limits, including one-sided ranges',()=>{
 assert.match(compareObservation('ferritin',{value:18,low:30,high:300,unit:'µg/L'}),/^Below supplied/);
 assert.match(compareObservation('b12',{value:185,low:200,high:600,unit:'pmol/L'}),/^Below supplied/);
 assert.equal(compareObservation('vitd',{value:38,unit:'nmol/L'}),'Reference range not supplied');
 assert.match(compareObservation('folate',{value:8,low:5,unit:'ng/mL'}),/^Within supplied one-sided/);
 assert.match(compareObservation('calcium',{value:2.2,low:2.2,high:2.6,unit:'mmol/L'}),/^Within supplied/);
 assert.match(compareObservation('magnesium',{value:3,high:2.5,unit:'mg/dL'}),/^Above supplied/);
 assert.equal(compareObservation('ferritin',{unit:'µg/L'}),'No result entered');
});
test('lab validation rejects unsupported units, negative values, inverted ranges and impossible percentages',()=>{
 assert.ok(observationError('b12',{value:185,unit:'mg/L'}));assert.ok(observationError('ferritin',{value:-1,unit:'µg/L'}));assert.ok(observationError('ferritin',{value:18,low:300,high:30,unit:'µg/L'}));assert.ok(observationError('tsat',{value:101,unit:'%'}));
 assert.throws(()=>validateMicronutrientContext({intent:'lab',observations:{b12:{value:NaN,unit:'pmol/L'}}}));
});
test('food experiments are idempotent, preserve other weekdays, and disclose actual energy effects',()=>{
 for(const e of foodExperiments){const before=cloneDiet(),copy=JSON.stringify(before),next=applyFoodExperiment(before,e.id);assert.equal(JSON.stringify(before),copy);assert.ok(experimentIncluded(next,e));assert.deepEqual(applyFoodExperiment(next,e.id),next);
  for(let d=0;d<7;d++){if(!e.days.includes(d))assert.deepEqual(next[d],before[d]);const n=dayTotals(next[d]);assert.ok(n.kcal>0&&Number.isFinite(n.kcal));}
  assert.ok(Math.abs(weeklyAverage(next).kcal-weeklyAverage(before).kcal)<15,'Side-food swaps preserve approximate weekly energy');
 }
});
test('food choices affect actual uptake and trajectories without forcing a cure',()=>{
 const status={...normal,iron:'low' as const,vitd:'low' as const,vitdSource:'none' as const},base=simulateNutrients({...app,status},365);
 const pair=simulateNutrients({...app,status,week:applyFoodExperiment(app.week,'iron-pair')},365);assert.ok(pair.states[365].iron.index>base.states[365].iron.index);
 const fish=simulateNutrients({...app,status,week:applyFoodExperiment(app.week,'salmon-swap')},365);assert.ok(fish.states[365].vitd.index>base.states[365].vitd.index);assert.ok(fish.states[365].vitd.index<.9,'Food swap does not guarantee a reference reserve');
 const poor=simulateNutrients({...app,status:{...status,ironAbsorption:'reduced',ironLosses:'higher'},week:applyFoodExperiment(app.week,'iron-pair')},365);assert.ok(poor.states[365].iron.atLimit);
});

test('headline trends use the full requested window and avoid implying a universal recovery speed',()=>{
 const foodOnly=simulateNutrients({...app,status:{...normal,vitd:'low',vitdSource:'none'}},365);
 assert.equal(storeTrend(foodOnly,0,'vitd',365),'Nearly steady');
 const falling=simulateNutrients({...app,status:{...normal,folate:'low',folateAbsorption:'reduced'}},365);
 assert.equal(storeTrend(falling,0,'folate',365),'Falling');
 assert.equal(storeTrend(low,0,'b12',365),'Rising');
 assert.equal(storeTrend(ref,0,'folate',365),'Nearly steady');
});
