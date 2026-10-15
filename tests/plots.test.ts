import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneScenario } from '../src/model/config';
import { simulateDay, sampleDay } from '../src/model/day';
import { simulateIntenseDay, sampleSprint } from '../src/model/sprint';
import { simulateLongTerm } from '../src/model/longTerm';
import { cloneDiet, type DietApplication } from '../src/model/diet';
import { simulateLabMarkers } from '../src/model/labProjection';
import { effectiveLabRange } from '../src/model/labs';
import { defaultCycle } from '../src/model/profile';
import { interpolate, linePath, bandPath, type PlotSpec } from '../src/visual/plotCard';
import { dayPlotSpecs, sprintPlotSpecs, longPlotSpecs, minMaxDecimate, exerciseBands } from '../src/visual/plotSpecs';

const scenario=cloneScenario();
const day=simulateDay(scenario),intense=simulateIntenseDay(scenario);
const card=(specs:PlotSpec[],id:string)=>specs.find(s=>s.id===id)!;
const ids=(specs:PlotSpec[])=>Object.fromEntries(specs.map(s=>[s.id,s.series.map(x=>x.id)]));
const read=(spec:PlotSpec,series:string,x:number)=>{const s=spec.series.find(v=>v.id===series)!;return s.readout?s.readout(x):{value:s.format!(s.sample!(x)!)};};

test('decimation keeps bucket extremes and never bridges a gap',()=>{
  const pts=Array.from({length:1000},(_,i)=>({x:i,y:i>=400&&i<450?null:Math.sin(i/7)*(i%97===0?3:1)}));
  const out=minMaxDecimate(pts,0,999,50);
  assert.ok(out.length<pts.length/2);
  const finite=(a:typeof pts)=>a.filter(p=>p.y!==null).map(p=>p.y!);
  assert.equal(Math.max(...finite(out)),Math.max(...finite(pts)));assert.equal(Math.min(...finite(out)),Math.min(...finite(pts)));
  const gap=out.filter(p=>p.y===null);assert.equal(gap.length,1);
  assert.ok(out.some(p=>p.x===399)&&out.some(p=>p.x===450),'edges of the gap are kept');
  assert.ok(out.every((p,i)=>i===0||p.x>out[i-1].x),'x stays sorted');
  assert.equal(linePath([{x:0,y:1},{x:1,y:null},{x:2,y:1},{x:3,y:2}],x=>x,y=>y).match(/M/g)!.length,2);
  assert.equal(bandPath([{x:0,y:1,low:0,high:2},{x:1,y:1,low:null,high:null},{x:2,y:1,low:0,high:2}],x=>x,y=>y),'','single-point runs draw no band');
  assert.equal(interpolate([{x:0,y:1},{x:1,y:null}],.5),null);assert.equal(interpolate([{x:0,y:1},{x:2,y:3}],1),2);
});

test('day cards: ids, fixed honest scales and values from the model states',()=>{
  const specs=dayPlotSpecs(day,scenario);
  assert.deepEqual(ids(specs),{meal:['glucose','insulin'],glycogen:['liver','muscle'],heart:['hr'],fuel:['carbShare','fatShare'],recovery:['recovery']});
  const meal=card(specs,'meal'),gly=card(specs,'glycogen'),st=day.states;
  assert.deepEqual(meal.domain,[0,1]);assert.deepEqual(card(specs,'fuel').domain,[0,100]);assert.deepEqual(card(specs,'recovery').domain,[0,100]);
  assert.deepEqual(meal.xTicks.map(t=>t.label),['06','12','18','00','06']);assert.deepEqual(meal.xDomain,[0,1440]);
  assert.ok(gly.domain[1]>=st[0].muscleCapacity&&gly.domain[1]>=st[0].liverCapacity&&gly.domain[0]===0);
  for(const x of [0,137.5,600,1440]){
    const s=sampleDay(day,x);
    assert.ok(!/%|mg|mmol/.test(read(meal,'glucose',x).value),'relative index has no clinical unit');
    assert.equal(read(gly,'liver',x).value,`${Math.round(s.liver)} g`);
    assert.equal(read(card(specs,'heart'),'hr',x).value,`${Math.round(s.hr)} bpm`);
  }
  // Every decimated point is an actual model sample.
  for(const p of meal.series[0].points)assert.equal(p.y,st[p.x].glucose);
  const hr=card(specs,'heart').series[0].points.map(p=>p.y!);
  assert.equal(Math.max(...hr),Math.max(...st.map(s=>s.hr)));
  const ex=exerciseBands(st),minutes=ex.reduce((n,b)=>n+b.end-b.start,0);
  assert.equal(minutes,st.filter(s=>s.contractionUptake>0).length);
  assert.ok(!specs.some(s=>s.series.some(x=>x.id==='fatigue'||x.id==='contractionUptake')));
  assert.equal(meal.bands!.length,scenario.meals.length+ex.length);
});

test('sprint cards: fixed 0–100 ATP scale, preserved PCr sawteeth, pathways only while sprinting',()=>{
  const specs=sprintPlotSpecs(intense),sess=intense.session,c=sess.config,cycle=c.sprint_seconds+c.walk_seconds;
  assert.deepEqual(ids(specs),{'rapid-energy':['atp','pcr','glycogen'],'power-fatigue':['power','fatigue'],heart:['hr'],oxygen:['oxygen'],pathways:['pcrSource','glycolytic','aerobicSource']});
  const rapid=card(specs,'rapid-energy');assert.deepEqual(rapid.domain,[0,100]);
  assert.ok(rapid.xDomain[0]<0&&rapid.xDomain[1]>sess.durationSeconds/60,'full protocol plus brief warm-up/cooldown');
  assert.equal(rapid.toTimeline!(0),sess.startMinute);assert.equal(rapid.fromTimeline!(rapid.toTimeline!(3.25)),3.25);
  assert.equal(rapid.bands!.length,c.repetitions);
  const pcr=rapid.series.find(s=>s.id==='pcr')!.points;
  assert.ok(pcr.length<sess.states.length/3);
  for(let rep=0;rep<c.repetitions;rep++){
    const a=rep*cycle,b=(rep+1)*cycle;
    const raw=Math.min(...sess.states.filter(s=>s.seconds>=a&&s.seconds<b).map(s=>s.pcr*100));
    const kept=Math.min(...pcr.filter(p=>p.x*60>=a&&p.x*60<b).map(p=>p.y!));
    assert.ok(Math.abs(raw-kept)<1e-9,`rep ${rep+1} PCr dip preserved`);
  }
  const pw=card(specs,'pathways');
  for(const x of [.05,cycle/60*3+.02]){const total=pw.series.reduce((n,s)=>n+s.sample!(x)!,0);assert.ok(Math.abs(total-100)<1e-6,'shares sum during sprint');}
  const walk=(c.sprint_seconds+5)/60;
  for(const s of pw.series){assert.equal(s.sample!(walk),null);assert.equal(s.readout!(walk).value,'—');}
  const walkPts=pw.series[0].points.filter(p=>sampleSprint(sess,p.x*60).phase==='walk'&&p.y!==null);
  assert.equal(walkPts.length,0,'no share values plotted during walks');
  const pf=card(specs,'power-fatigue');
  assert.equal(pf.series[0].label,'Available power');assert.notEqual(pf.series[0].dash,pf.series[1].dash);
  assert.match(pf.series[0].readout!(walk).detail!,/not current output/);
  assert.match(card(specs,'oxygen').note!,/not blood oxygen saturation/);
  assert.equal(read(rapid,'atp',walk).value,`${Math.round(sampleSprint(sess,walk*60).atp*100)}%`);
});

test('long cards: kg deltas with absolute readouts; selected labs with gaps, reference and cycle marks',()=>{
  const profile={sex:'female' as const,age:30,weight_kg:60,height_cm:165,cycle:{...defaultCycle,enabled:true}};
  const app:DietApplication={week:cloneDiet(),startDay:0,profile,micronutrients:{intent:'lab',selected:['ferritin','vitd'],observations:{ferritin:{value:20,unit:'µg/L'},vitd:{value:400,unit:'nmol/L',low:50,high:125},b12:{value:300,unit:'pmol/L'}}}};
  const states=simulateLongTerm(scenario,1095,app),labs=simulateLabMarkers(app);
  const specs=longPlotSpecs(states,labs,app);
  assert.deepEqual(specs.map(s=>s.id),['composition','bodyfat','conditioning','lab-ferritin','lab-vitd']);
  const comp=card(specs,'composition');
  assert.ok(comp.domain[0]<0&&comp.domain[1]>0,'delta axis supports gain and loss');
  for(const s of comp.series)assert.equal(s.points[0].y,0);
  const end=states.at(-1)!;
  assert.deepEqual(read(comp,'mass',1095),{value:`${end.weight.toFixed(1)} kg`,change:`${end.weight>=states[0].weight?'+':'−'}${Math.abs(end.weight-states[0].weight).toFixed(1)} kg`});
  assert.match(read(card(specs,'bodyfat'),'bodyfat',500).change!,/points$/);
  assert.equal(card(specs,'conditioning').series[0].id,'hr');
  const fe=card(specs,'lab-ferritin'),p=labs.ferritin!;
  assert.deepEqual(fe.xDomain,[0,1095]);assert.deepEqual(fe.observed,{x:0,y:20});assert.equal(fe.series[0].id,'ferritin');assert.ok(fe.series[0].dash);
  const range=effectiveLabRange('ferritin',app.micronutrients!.observations.ferritin!,profile);
  assert.deepEqual(fe.reference,{low:range.low,high:range.high});
  assert.ok(fe.bands!.length>10&&fe.bands!.every(b=>b.start<b.end));
  assert.equal(card(specs,'lab-vitd').bands!.length,0,'cycle marks on ferritin only');
  assert.equal(fe.series[0].points.length,p.points.length);
  assert.match(fe.note!,/sensitivity, not precision/);
  // A ferritin start outside the model's 1–300 µg/L scope is withheld after day 0.
  const outApp={...app,micronutrients:{...app.micronutrients!,selected:['ferritin' as const],observations:{ferritin:{value:400,unit:'µg/L'}}}};
  const out=longPlotSpecs(states,simulateLabMarkers(outApp),outApp),ofe=card(out,'lab-ferritin');
  assert.deepEqual(out.map(s=>s.id),['composition','bodyfat','conditioning','lab-ferritin']);
  assert.equal(ofe.series[0].points[0].y,400);assert.ok(ofe.series[0].points.slice(1).every(q=>q.y===null),'never zero or interpolated');
  assert.deepEqual(ofe.series[0].readout!(200),{value:'Not estimated',detail:'Outside model scope'});
  assert.equal(ofe.series[0].sample!(.5),null);assert.equal(linePath(ofe.series[0].points,x=>x,y=>y).match(/L/g),null);
  assert.match(ofe.note!,/not estimated/i);
});

test('composition stops at the projection limit instead of plotting frozen copies',()=>{
  const lean=cloneScenario();lean.person.body_fat_fraction=.08;lean.nutrition.carbohydrate_g*=.4;lean.nutrition.fat_g*=.4;
  const states=simulateLongTerm(lean,1095),limit=states.find(s=>s.atLimit);
  assert.ok(limit,'scenario reaches the projection limit');
  const comp=card(longPlotSpecs(states,{},{week:cloneDiet(),startDay:0}),'composition');
  assert.ok(comp.series[0].points.filter(p=>p.x>=limit.day).every(p=>p.y===null));
  assert.equal(comp.series[0].readout!(1095).detail,'Held at projection limit');
  assert.equal(comp.series[0].readout!(1095).value,`${states.at(-1)!.weight.toFixed(1)} kg`);
});
