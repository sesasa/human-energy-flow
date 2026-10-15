import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneScenario, validateScenario } from '../src/model/config.ts';
import { bodyComposition, withBodyPreset, selectedBodyPreset, muscleGlycogenCapacity, bodyPresets } from '../src/model/composition.ts';
import { energyBudget, restingEnergy } from '../src/model/energy.ts';
import { simulateDay } from '../src/model/day.ts';
import { simulateLongTerm } from '../src/model/longTerm.ts';
import { simulateIntenseDay } from '../src/model/sprint.ts';
import { bodyShape } from '../src/visual/bodyShape.ts';
const s=cloneScenario();
const near=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);
test('starting examples distinguish weight-for-height from fat percentage',()=>{
 const under=withBodyPreset(s,'underweight'),over=withBodyPreset(s,'overweight');
 near(under.person.weight_kg,55);near(over.person.weight_kg,88);
 assert.ok(bodyComposition(under.person).bmi<18.5);assert.ok(bodyComposition(over.person).bmi>=25&&bodyComposition(over.person).bmi<30);
 near(bodyComposition(under.person).lean,48.4);near(bodyComposition(over.person).fat,26.4);
 assert.equal(selectedBodyPreset(s),'baseline');assert.equal(selectedBodyPreset(over),'overweight');
 const custom=cloneScenario(over);custom.person.body_fat_fraction=.2;assert.equal(selectedBodyPreset(custom),'custom');
 near(bodyComposition(custom.person).bmi,bodyComposition(over.person).bmi);
});
test('presets preserve meals, activity and conditioning, and scale weight with height',()=>{
 const source=cloneScenario();source.person.height_cm=190;source.nutrition.fat_g=70;
 const over=withBodyPreset(source,'overweight');validateScenario(over);
 assert.deepEqual(over.nutrition,source.nutrition);assert.deepEqual(over.activity,source.activity);assert.equal(over.model.resting_hr_bpm,source.model.resting_hr_bpm);
 assert.equal(over.person.fitness,source.person.fitness);assert.equal(over.person.height_cm,190);
 near(bodyComposition(over.person).bmi,bodyComposition(withBodyPreset(s,'overweight').person).bmi,.02);
 near(source.person.weight_kg,75);
});
test('additional fat is not counted as extra muscle glycogen capacity',()=>{
 const moreFat=cloneScenario();moreFat.person.body_fat_fraction=.3;
 assert.ok(muscleGlycogenCapacity(moreFat)<muscleGlycogenCapacity(s));
 near(restingEnergy(moreFat),restingEnergy(s)); // Mifflin is unchanged at the same mass/height/age.
 const sameLean=cloneScenario(moreFat);sameLean.person.weight_kg=bodyComposition(s.person).lean/(1-.3);
 near(muscleGlycogenCapacity(sameLean),muscleGlycogenCapacity(s));
 near(simulateDay(sameLean).states[0].muscleCapacity,simulateDay(s).states[0].muscleCapacity);
});
test('all starting presets initialize correct composition and conserve modeled day/long-term energy',()=>{
 for(const p of bodyPresets){
  const next=withBodyPreset(s,p.id),c=bodyComposition(next.person),day=simulateDay(next),long=simulateLongTerm(next),intense=simulateIntenseDay(next);
  near(long[0].lean,c.lean);near(long[0].fat,c.fat);near(long[0].weight,c.weight);
  near(day.ledger.residual,0);near(intense.day.ledger.residual,0);
  near(intense.session.activePoolG,muscleGlycogenCapacity(next)*intense.session.config.active_glycogen_fraction);
  for(const st of long){near(st.residual,0);assert.ok(st.fat>0&&st.lean>0);}
 }
 assert.ok(energyBudget(withBodyPreset(s,'underweight')).total<energyBudget(s).total);
 assert.ok(energyBudget(withBodyPreset(s,'overweight')).total>energyBudget(s).total);
});
test('anatomy separates soft tissue from lean width and reflects later composition',()=>{
 const baseline=bodyShape(s.person),under=bodyShape(withBodyPreset(s,'underweight').person),overPerson=withBodyPreset(s,'overweight').person,over=bodyShape(overPerson);
 near(baseline.leanWidth,1);assert.ok(under.leanWidth<baseline.leanWidth);assert.ok(over.fatSignal>baseline.fatSignal);
 assert.notEqual(over.outline,baseline.outline);assert.notEqual(under.outline,baseline.outline);
 assert.ok(!over.outline.includes('NaN'));
 const coords=over.outline.match(/-?\d*\.?\d+/g)!.map(Number);
 assert.ok(Math.max(...coords.filter((_,i)=>i%2===0))<495,'Fat envelope must not distort hand coordinates as though they were thighs');assert.notEqual(bodyShape(overPerson,80,18.4).outline,over.outline);
});
test('invalid numeric body inputs cannot contaminate the simulation',()=>{
 for(const field of ['weight_kg','height_cm','body_fat_fraction'] as const){const bad=cloneScenario();bad.person[field]=NaN;assert.throws(()=>validateScenario(bad));}
});
