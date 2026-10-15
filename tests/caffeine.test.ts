import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cloneScenario} from '../src/model/config';
import {dailySchedule,simulateDay} from '../src/model/day';
import {defaultCoffee,caffeineAmount,simulateCaffeine,sampleCaffeine,coffeeSlots,coffeeForSchedule,sleepPressureAt} from '../src/model/caffeine';
import {coffeePlotSpecs} from '../src/visual/coffee';
import {cloneDiet,scenarioForDay} from '../src/model/diet';
import {dayNarration,cueAt} from '../src/engine/narrationEvents';
import {withCoffeeNarration} from '../src/engine/coffeeNarration';

const week=cloneDiet(),s=scenarioForDay(cloneScenario(),week[0]),cup=simulateCaffeine(s);
const close=(a:number,b:number,eps=1e-7)=>assert.ok(Math.abs(a-b)<eps,`${a} ≈ ${b}`);
test('one oral cup conserves mass, peaks gradually, and clears by its half-life',()=>{
 for(const t of [0,.1,5,30,90,300,1000,3000]){
  const a=caffeineAmount(90,t);close(a.gutMg+a.bodyMg+a.clearedMg,90);
  assert.ok(a.bodyMg>=0&&a.gutMg>=0&&a.clearedMg>=0);
 }
 assert.ok(cup.states.slice(0,210).every(x=>x.bodyMg===0));
 assert.equal(cup.states[210].bodyMg,0);assert.equal(cup.states[210].gutMg,90);
 assert.ok(cup.peakMinute-210>=30&&cup.peakMinute-210<=90);
 close(caffeineAmount(90,480).bodyMg/caffeineAmount(90,180).bodyMg,.5,1e-4);
 assert.ok(cup.halfPeakMinute!==null&&cup.halfPeakMinute-cup.peakMinute>=280);
 // The equal-rate limit has a finite analytic solution too.
 const equal=caffeineAmount(90,30,Math.LN2/4);assert.ok(Number.isFinite(equal.bodyMg));close(equal.gutMg+equal.bodyMg+equal.clearedMg,90);
});
test('dose and time drive the curve, and the clearance envelope stays ordered',()=>{
 const large=simulateCaffeine(s,{...defaultCoffee,doseMg:180}),late=simulateCaffeine(s,{...defaultCoffee,minute:840});
 for(const [i,a]of cup.states.entries()){
  close(large.states[i].bodyMg,a.bodyMg*2);assert.ok(a.lowMg<=a.bodyMg+1e-9&&a.bodyMg<=a.highMg+1e-9);
 }
 assert.ok(late.states[960].bodyMg>cup.states[960].bodyMg*3);
 close(sampleCaffeine(cup,260.5).bodyMg,(cup.states[260].bodyMg+cup.states[261].bodyMg)/2);
});
test('coffee masks the illustrative sleepiness signal without changing sleep pressure or making a crash',()=>{
 const off=simulateCaffeine(s,{...defaultCoffee,enabled:false});
 for(const [i,a]of cup.states.entries()){
  close(a.sleepPressure,off.states[i].sleepPressure);close(off.states[i].sleepiness,off.states[i].sleepPressure);
  assert.ok(a.sleepiness>=0&&a.sleepiness<=a.sleepPressure&&a.alerting>=0&&a.alerting<1);
  assert.equal(a.asleep,off.states[i].asleep);
 }
 assert.ok(cup.states[260].sleepiness<off.states[260].sleepiness);
 assert.ok(cup.states[260].sleepPressure>cup.states[210].sleepPressure);
 close(sleepPressureAt(s,0),sleepPressureAt(s,1440));
 assert.ok(sleepPressureAt(s,1200)<sleepPressureAt(s,960));
});
test('skipping and zero caffeine are real zero-input comparisons',()=>{
 for(const event of [{...defaultCoffee,enabled:false},{...defaultCoffee,doseMg:0}]){
  const d=simulateCaffeine(s,event);assert.equal(d.peakMg,0);assert.equal(d.halfPeakMinute,null);
  assert.ok(d.states.every(x=>x.bodyMg===0&&x.gutMg===0&&x.alerting===0&&!x.drinking));
 }
});
test('coffee slots are awake breaks and model inputs reject invalid values',()=>{
 const schedule=dailySchedule(s);
 for(const m of coffeeSlots(s))assert.ok(schedule.slice(m,m+10).every(a=>!['sleep','run','resistance'].includes(a)));
 assert.ok(!coffeeSlots(s).includes(600));assert.ok(!coffeeSlots(s).includes(1080));
 for(const event of [{...defaultCoffee,doseMg:NaN},{...defaultCoffee,minute:Infinity},{...defaultCoffee,doseMg:-1},{...defaultCoffee,minute:600}])assert.throws(()=>simulateCaffeine(s,event));
});
test('coffee is isolated from calories, meals, metabolic state and the profile',()=>{
 const original=structuredClone(s),before=simulateDay(s);
 simulateCaffeine(s);simulateCaffeine(s,{...defaultCoffee,doseMg:180,minute:840});
 assert.deepEqual(s,original);assert.deepEqual(simulateDay(s),before);assert.deepEqual(cloneDiet(),week);
});
test('coffee plots use separate units and the shared clock; no subjective sleepiness during sleep',()=>{
 const [amount,effect]=coffeePlotSpecs(cup);
 assert.deepEqual(amount.domain,[0,200]);assert.equal(amount.unit,'mg · this cup only');assert.equal(effect.unit,'Illustrative index');
 for(const spec of [amount,effect])assert.deepEqual(spec.xDomain,[0,1440]);
 close(amount.series[0].sample!(260)!,cup.states[260].bodyMg);
 assert.ok(amount.series[0].points.some(p=>p.high!>p.low!));
 assert.ok(effect.series[1].points.filter(p=>cup.states[p.x].asleep).every(p=>p.y===null));
 assert.equal(effect.series[1].sample!(1080),null);assert.match(effect.series[1].readout!(1080).detail!,/not predicted/);
});
test('coffee event narration follows the cup and cancels cleanly when skipped',()=>{
 const base=dayNarration(s,simulateDay(s),week[0]),cues=withCoffeeNarration(base,cup,s),schedule=dailySchedule(s);
 assert.equal(cueAt(cues,211)?.id,'coffee-drink');assert.equal(cueAt(cues,226)?.id,'coffee-brain');
 assert.match(cues.find(c=>c.id==='sleep')!.sentences.join(' '),/milligrams.*scheduled bedtime/);
 for(let i=1;i<cues.length;i++)assert.ok(cues[i-1].end<=cues[i].start);
 for(const c of cues.filter(c=>c.id.startsWith('coffee-'))){assert.ok(c.end-c.start>=8);assert.ok(schedule.slice(c.start,c.end).every(a=>!['run','resistance','sleep'].includes(a)));}
 const off=simulateCaffeine(s,{...defaultCoffee,enabled:false});assert.deepEqual(withCoffeeNarration(base,off,s),base);
 const late=simulateCaffeine(s,{...defaultCoffee,minute:840}),lc=withCoffeeNarration(base,late,s);
 assert.equal(cueAt(lc,841)?.id,'coffee-drink');assert.ok(!lc.some(c=>c.id.startsWith('coffee-')&&c.start<840));
});
test('coffee during storage or the first work block preserves their explanations',()=>{
 const base=dayNarration(s,simulateDay(s),week[0]);
 const workStart=dailySchedule(s).findIndex(a=>a==='work');
 for(const [minute,id]of [[180,'meal-0-storage'],[workStart,'mental-work']] as const){
  const d=simulateCaffeine(s,{...defaultCoffee,minute}),cues=withCoffeeNarration(base,d,s),kept=cues.find(c=>c.id===id)!;
  assert.ok(kept&&kept.end-kept.start>=8,id);assert.ok(cues.some(c=>c.id==='coffee-brain'));
  assert.equal(kept.start,minute+12,'keep the explanation after the overlapping drink cue');
  const brain=cues.find(c=>c.id==='coffee-brain')!;assert.ok(brain.start>=kept.end,'brain cue uses a later free gap');
 }
 // Drinking with breakfast shares its brief explanation instead of losing it.
 const breakfast=withCoffeeNarration(base,simulateCaffeine(s,{...defaultCoffee,minute:120}),s);
 for(const sentence of base.find(c=>c.id==='meal-0-plate')!.sentences)assert.ok(breakfast.some(c=>c.sentences.includes(sentence)));
 const ten=withCoffeeNarration(base,simulateCaffeine(s,{...defaultCoffee,minute:240}),s);
 assert.equal(cueAt(ten,420)?.id,'meal-1-plate');assert.ok(ten.find(c=>c.id==='coffee-clearing')!.start>=520);
 assert.equal(ten.find(c=>c.id==='coffee-drink')!.system,'digestion');assert.equal(ten.find(c=>c.id==='coffee-clearing')!.focus,'liver');
});
test('an edited starting sleep schedule gives coffee an available slot before rendering',()=>{
 const night=cloneScenario(s);night.activity.sleep_start_hour=3;
 const fitted=coffeeForSchedule(night,defaultCoffee);assert.ok(coffeeSlots(night).includes(fitted.minute));
 assert.doesNotThrow(()=>simulateCaffeine(night,fitted));
});
