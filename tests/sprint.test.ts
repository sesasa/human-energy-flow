import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneScenario } from '../src/model/config.ts';
import { energyBudget } from '../src/model/energy.ts';
import { defaultSprintConfig, phaseAt, simulateSprints, sampleSprint, simulateIntenseDay, sampleIntenseDay } from '../src/model/sprint.ts';
import { Timeline } from '../src/engine/timeline.ts';
const scenario=cloneScenario(),config={...defaultSprintConfig},model=simulateIntenseDay(scenario,config),sim=model.session;
const at=(t:number)=>sampleSprint(sim,t);
const near=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);
test('twenty maximal-intent bouts alternate with walking, including exact boundaries',()=>{
  assert.equal(sim.durationSeconds,720);
  for(let rep=1;rep<=20;rep++){
    const start=(rep-1)*36;
    assert.equal(phaseAt(start,config).phase,'sprint');assert.equal(phaseAt(start+6,config).phase,'walk');
    assert.equal(phaseAt(start,config).rep,rep);
  }
  assert.equal(phaseAt(720,config).phase,'cooldown');assert.equal(phaseAt(1020,config).phase,'after');
  assert.equal(phaseAt(36-1e-9,config).phase,'sprint');
});
test('ATP is maintained while PCr drops rapidly and only partly returns between sprints',()=>{
  assert.ok(sim.states.every(s=>s.atp>.85&&s.atp<=1));
  assert.ok(at(5.9).pcr<at(0).pcr*.6);
  assert.ok(at(35.9).pcr>at(5.9).pcr);assert.ok(at(35.9).pcr<.9);
  assert.ok(at(719.9).pcr<at(35.9).pcr);
});
test('late efforts have less available power despite remaining glycogen and protected ATP',()=>{
  assert.ok(at(689.9).powerCapacity<at(5.9).powerCapacity*.75);
  assert.ok(at(689.9).glycogen>.65);assert.ok(at(689.9).atp>.85);
  assert.ok(at(689.9).fatigue>at(5.9).fatigue);assert.ok(at(719.9).fatigue>.3);
});
test('glycolytic contribution declines and oxidative share rises over successive efforts',()=>{
  const first=at(5.9),late=at(689.9);
  assert.ok(first.glycolyticFlux/first.turnover>.3);
  assert.ok(first.aerobicFlux/first.turnover<.15);
  assert.ok(at(329.9).aerobicFlux/at(329.9).turnover>first.aerobicFlux/first.turnover+.15);
  assert.ok(late.glycolyticFlux<first.glycolyticFlux*.4);
  assert.ok(late.aerobicFlux/late.turnover>first.aerobicFlux/first.turnover);
  assert.ok(late.aerobicFlux<late.powerCapacity);
});
test('walking requires less ATP turnover and heart rate remains elevated',()=>{
  assert.ok(at(20).turnover<at(5).turnover*.3);
  assert.equal(at(20).pcrFlux,0);assert.equal(at(35.99).pcrFlux,0);assert.ok(at(20).aerobicFlux>at(20).glycolyticFlux*10);
  assert.ok(at(35.9).hr>scenario.model.resting_hr_bpm+45);
  assert.ok(at(5.9).hr<at(35.9).hr,'Circulation should lag the first short effort');
});
test('longer walking recovery improves PCr availability and subsequent capacity',()=>{
  const long=simulateSprints(scenario,{...config,walk_seconds:60});
  const shortNext=at(36),longNext=sampleSprint(long,66);
  assert.ok(longNext.pcr>shortNext.pcr);assert.ok(longNext.powerCapacity>shortNext.powerCapacity);
});
test('recovery is gradual across the end of cooldown, and local glycogen needs food',()=>{
  for(const key of ['pcr','powerCapacity','atp','fatigue','oxygen','hr'] as const)near(at(1020)[key],at(1020.0001)[key],1e-4);
  assert.ok(at(1620).powerCapacity>at(1020).powerCapacity);
  assert.ok(at(1620).fatigue>0);near(at(1620).glycogen,at(1020).glycogen);
  const atDinner=sampleIntenseDay(model,850);assert.ok(atDinner.sprint.glycogen>at(1020).glycogen);
  near(atDinner.body.recovery,1-atDinner.body.fatigue);
});
test('pre-session activity is resting and post-session heart rate uses the configured baseline',()=>{
  assert.equal(at(-600).phase,'before');assert.equal(at(-600).deliveredPower,0);assert.equal(at(-600).netKcalPerSecond,0);
  const custom=cloneScenario();custom.model.resting_hr_bpm=58;
  const trace=simulateSprints(custom,config);near(sampleSprint(trace,12000).hr,58);
});
test('intense session replaces normal training, with one energy and muscle-use ledger',()=>{
  const budget=model.day.budget,last=sim.states.at(-1)!;
  near(budget.exercise,last.energyKcal);assert.ok(budget.exercise<energyBudget(scenario).exercise);
  near(budget.total,budget.resting+budget.movement+budget.thermic+last.energyKcal);
  near(model.day.ledger.energyOut,budget.total);near(model.day.ledger.residual,0);
  near(last.glycogen,1-last.muscleGlycogenUsedG/sim.activePoolG);
  assert.ok(last.muscleGlycogenUsedG>15&&last.muscleGlycogenUsedG<35);
  assert.equal(model.scenario.activity.run_distance_km,0);assert.equal(model.scenario.activity.resistance_training,false);
});
test('seeking is deterministic and does not alter the precomputed session',()=>{
  const a=at(320.75);at(710);at(0);assert.deepEqual(at(320.75),a);
  const original=sim.states[0].pcr;a.pcr=0;near(sim.states[0].pcr,original);
});
test('all relative states remain finite and bounded throughout the session',()=>{
  for(const s of sim.states){
    for(const key of ['atp','pcr','glycogen','fastFatigue','slowFatigue','fatigue','powerCapacity','oxygen'] as const)assert.ok(Number.isFinite(s[key])&&s[key]>=0&&s[key]<=1,key);
    assert.ok(s.hr>=scenario.model.resting_hr_bpm&&s.hr<=config.hr_ceiling_bpm);
    assert.ok(s.energyKcal>=0&&s.netKcalPerSecond>=0);
  }
});
test('an intense day stops without projecting daily sprint sessions into three years',()=>{
  const t=new Timeline();t.seek('intense',1439.9);t.playing=true;t.update(1);
  assert.equal(t.phase,'intense');assert.equal(t.position,1440);assert.equal(t.playing,false);
});
test('out-of-scope protocols fail validation',()=>{
  for(const patch of [{repetitions:0},{repetitions:31},{sprint_seconds:30},{walk_seconds:0}])assert.throws(()=>simulateSprints(scenario,{...config,...patch}));
});
