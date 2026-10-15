import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneScenario, validateScenario } from '../src/model/config';
import { withBodyPreset, bodyComposition, leanGainCeiling } from '../src/model/composition';
import { energyBudget, restingEnergy } from '../src/model/energy';
import { simulateLongTerm } from '../src/model/longTerm';
import { simulateNutrients } from '../src/model/micronutrients';
import { cloneDiet, type DietApplication } from '../src/model/diet';
import { profileFromScenario, menstrualIronLoss, defaultCycle, bleedingScenarios, ironPerMlBlood, basalIronLoss, bleedingEvents, intakeReference, validateCycle, type PhysiologyProfile } from '../src/model/profile';
import { labProjection } from '../src/model/labProjection';
import { defaultLabRange, effectiveLabRange } from '../src/model/labs';
import { labChart } from '../src/visual/labChart';
import { bodyShape } from '../src/visual/bodyShape';
const near=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const male=cloneScenario(),female=withBodyPreset({...cloneScenario(),person:{...male.person,sex:'female'}},'baseline');
const profile=(on=true):PhysiologyProfile=>({...profileFromScenario(female),cycle:{...defaultCycle,enabled:on}});
const app=(p=profile()):DietApplication=>({week:cloneDiet(),startDay:0,profile:p});
test('sex changes Mifflin by its published166kcal term at matched body dimensions and reaches TDEE',()=>{
 const matched=cloneScenario(male);matched.person.sex='female';near(restingEnergy(male)-restingEnergy(matched),166);assert.ok(energyBudget(matched).total<energyBudget(male).total);
 near(energyBudget(matched).intake,energyBudget(male).intake);assert.ok(energyBudget(matched).balance>energyBudget(male).balance);
});
test('female examples have distinct lean/fat composition with the same preset BMI',()=>{
 for(const id of ['underweight','baseline','overweight'] as const){const m=withBodyPreset(male,id),f=withBodyPreset(female,id);validateScenario(f);near(bodyComposition(m.person).bmi,bodyComposition(f.person).bmi);assert.ok(f.person.body_fat_fraction>m.person.body_fat_fraction);assert.ok(bodyComposition(f.person).lean<bodyComposition(m.person).lean);}
 near(leanGainCeiling(female)/leanGainCeiling(male),bodyComposition(female.person).lean/bodyComposition(male.person).lean);
 const same=cloneScenario(male);same.person.sex='female';near(leanGainCeiling(same),leanGainCeiling(male));
});
test('female long-term energy remains conserved with lean-scaled adaptation',()=>{
 const states=simulateLongTerm(female,1095,app(profile(false)));for(const s of states){near(s.residual,0,1e-6);assert.ok(s.lean>0&&s.fat/s.weight>=.14);}
 assert.notEqual(states[365].weight,simulateLongTerm(male,365,app({...profile(false),sex:'male'}))[365].weight);
});
test('cycle categories fix total blood iron per cycle independent of bleeding duration and phase',()=>{
 for(const level of ['light','typical','heavy'] as const)for(const bleedingDays of [1,3,5,10])for(const startDay of [1,7,28]){
 const p={...profile(),cycle:{...profile().cycle,level,bleedingDays,startDay}};
 for(const scenario of ['ml','low','high'] as const){const total=Array.from({length:84},(_,day)=>menstrualIronLoss(p,day,scenario)).reduce((a,b)=>a+b,0);near(total,3*bleedingScenarios[level][scenario]*ironPerMlBlood);}
 }
 const a=profile();assert.equal(menstrualIronLoss(a,5),0);assert.ok(menstrualIronLoss(a,0)>menstrualIronLoss(a,4));
});
test('male and cycle-off ignore cycle settings; shorter cycles increase cumulative annual loss',()=>{
 for(const p of [profile(false),{...profile(),sex:'male' as const}])for(let d=0;d<365;d++)near(menstrualIronLoss(p,d),0);
 const yearly=(lengthDays:number)=>Array.from({length:365},(_,d)=>menstrualIronLoss({...profile(),cycle:{...profile().cycle,lengthDays}},d)).reduce((a,b)=>a+b,0);assert.ok(yearly(21)>yearly(35));
 assert.deepEqual(bleedingEvents(profile(false),365),[]);assert.deepEqual(bleedingEvents(profile(),35),[{start:0,end:5},{start:28,end:33}]);
});
test('blood loss is removed from red cells, conserved, and never counted twice',()=>{
 const a=simulateNutrients(app(),1095,{ironStoresMg:600}),off=simulateNutrients(app(profile(false)),1095,{ironStoresMg:600});
 assert.ok(a.states[1].iron.redCellsMg<off.states[1].iron.redCellsMg);
 for(let d=0;d<1095;d++){
  const x=a.states[d].iron,y=a.states[d+1].iron;near(x.lossesMg,basalIronLoss(profile())+x.menstrualLossMg);near(y.totalMg-x.totalMg,x.absorbedMg-x.lossesMg,1e-6);near(y.residualMg,0,1e-6);
  near(y.cumulativeMenstrualMg-x.cumulativeMenstrualMg,menstrualIronLoss(profile(),d));assert.equal(x.atLimit,false);
 }
 const sum=Array.from({length:1095},(_,d)=>menstrualIronLoss(profile(),d)).reduce((a,b)=>a+b,0);near(a.states[1095].iron.cumulativeMenstrualMg,sum);
 assert.ok(a.states[1095].iron.storesMg<off.states[1095].iron.storesMg);
});
test('heavier losses lower ferritin cumulatively without artificial jumps or display smoothing',()=>{
 const observed={value:40,unit:'µg/L'},runs=['light','typical','heavy'].map(level=>labProjection(app({...profile(),cycle:{...profile().cycle,level:level as 'light'|'typical'|'heavy'}}),'ferritin',observed));
 for(const p of runs){near(p.points[0].value!,40);assert.equal(p.limit,undefined);assert.ok(p.cycleEvents!.length>12);for(let d=1;d<366;d++)assert.ok(Math.abs(p.points[d].value!-p.points[d-1].value!)<1,'No monthly reset/jump');}
 assert.ok(runs[0].points[365].value!>runs[1].points[365].value!);assert.ok(runs[1].points[365].value!>runs[2].points[365].value!);
 const solver=simulateNutrients(app(),365,{ironStoresMg:320,dailyLossMg:basalIronLoss(profile()),absorptionScale:1});for(let d=0;d<=365;d++)near(runs[1].points[d].value!,solver.states[d].iron.storesMg/8);
});
test('the female iron balance responds to real foods and can recover or worsen',()=>{
 const p=profile(),poor=app(p);poor.week.forEach(d=>d.meals.forEach(m=>m.foods.forEach(f=>f.grams*=.4)));
 const low=labProjection(poor,'ferritin',{value:40,unit:'µg/L'}),adequate=labProjection(app(p),'ferritin',{value:40,unit:'µg/L'});
 assert.ok(low.points[91].value!<40);assert.ok(adequate.points[365].value!>low.points[365].value!);assert.ok(adequate.absorbed!>low.absorbed!);
});
test('cycling does not create B12, folate or D oscillations',()=>{
 for(const [marker,value,unit]of [['b12',185,'pmol/L'],['folate',6,'nmol/L'],['vitd',38,'nmol/L']] as const){const on=labProjection(app(),marker,{value,unit}),off=labProjection(app(profile(false)),marker,{value,unit});assert.deepEqual(on.points,off.points);assert.equal(on.cycleEvents,undefined);}
});
test('ferritin defaults depend on sex and age, supplied laboratory bounds still win',()=>{
 near(defaultLabRange('ferritin','µg/L',profile()).low,6);near(defaultLabRange('ferritin','µg/L',{...profile(),age:51}).low,11);near(defaultLabRange('ferritin','µg/L',profileFromScenario(male)).low,31);
 const o={value:10,low:12,high:300,unit:'µg/L'};assert.deepEqual(effectiveLabRange('ferritin',o,profile()),effectiveLabRange('ferritin',o,profileFromScenario(male)));
 near(intakeReference('iron_mg',8,profile()),18);near(intakeReference('iron_mg',8,profile(false)),18);near(intakeReference('iron_mg',8,{...profile(),age:55}),8);near(intakeReference('magnesium_mg',420,profile()),320);
});
test('cycle/body validation rejects unsupported or nonfinite inputs',()=>{
 for(const c of [{...defaultCycle,lengthDays:NaN},{...defaultCycle,startDay:29},{...defaultCycle,bleedingDays:11}])assert.throws(()=>validateCycle(c));
 const f=cloneScenario(female);f.person.body_fat_fraction=.06;assert.throws(()=>validateScenario(f),/14–50% for females/);
});
test('female shape responds to sex independently of composition and maintains neutral reference softness',()=>{
 const p={...male.person,sex:'female' as const};assert.notEqual(bodyShape(p).outline,bodyShape(male.person).outline);near(bodyShape(female.person).fatSignal,0);near(bodyShape(female.person).definition,1);
 for(const id of ['underweight','baseline','overweight'] as const){const shape=bodyShape(withBodyPreset(female,id).person);assert.ok(!shape.outline.includes('NaN'));const coords=shape.outline.match(/-?\d*\.?\d+/g)!.map(Number);assert.ok(Math.max(...coords.filter((_,i)=>i%2===0))<495);}
});

test('depleted ferritin sensitivity stops shading without hiding a valid central trajectory',()=>{
 const input=app({...profile(),cycle:{...profile().cycle,level:'heavy'}}),o={value:40,unit:'µg/L'},p=labProjection(input,'ferritin',o);
 const lower=simulateNutrients(input,365,{ironStoresMg:400,absorptionScale:.3,dailyLossMg:basalIronLoss(input.profile)*1.3,menstrualCase:'high'});
 const day=lower.states.findIndex(s=>s.iron.atLimit);assert.ok(day>1&&day<365);assert.equal(p.sensitivityLimit!.day,day);
 for(let d=0;d<=365;d++){assert.ok(p.points[d].value!==null);if(d>=day){assert.equal(p.points[d].low,null);assert.equal(p.points[d].high,null);}else{assert.ok(p.points[d].low!==null&&p.points[d].high!==null);}}
 const html=labChart(p,o),area=html.match(/class="lab-uncertainty" d="([^"]*)"/)![1];
 const xs=[...area.matchAll(/(?:M|L)([\d.]+),/g)].map(m=>Number(m[1]));near(Math.max(...xs),(day-1)/365*600);
 assert.match(html,/Uptake\/loss sensitivity/);assert.match(html,/with modeled bleeding days marked/);assert.doesNotMatch(html,/NaN|undefined/);
});
