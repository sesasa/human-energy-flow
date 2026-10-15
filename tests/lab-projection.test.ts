import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneDiet, dayTotals, foodById, totals, weeklyAverage, type DietApplication } from '../src/model/diet';
import { labProjection, simulateLabMarkers, topContributors, editContributor, markerNutrients } from '../src/model/labProjection';
import { canonicalFactor, effectiveLabRange, compareLabResult, type NutritionMarker, type LabObservation } from '../src/model/labs';
const app: DietApplication={week:cloneDiet(),startDay:0};
const near=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const units={ferritin:'µg/L',b12:'pmol/L',folate:'nmol/L',vitd:'nmol/L'};
const observations:Record<NutritionMarker,LabObservation>={ferritin:{value:10,unit:units.ferritin},b12:{value:185,unit:units.b12},folate:{value:6,unit:units.folate},vitd:{value:38,unit:units.vitd}};
const scaled=(scale:number)=>{const week=cloneDiet();week.forEach(d=>d.meals.forEach(m=>m.foods.forEach(p=>p.grams*=scale)));return {...app,week};};
const anchored=(marker:NutritionMarker)=>({...observations[marker],dietAtResult:structuredClone(app)});
test('selected markers alone produce curves; result and diet inputs stay immutable',()=>{
 const input={...app,micronutrients:{intent:'lab' as const,selected:['ferritin' as const],observations:structuredClone(observations)}},before=JSON.stringify(input),p=simulateLabMarkers(input,365);
 assert.deepEqual(Object.keys(p),['ferritin']);assert.equal(p.ferritin!.points[0].value,10);assert.equal(JSON.stringify(input),before);
 assert.deepEqual(simulateLabMarkers({...input,micronutrients:{...input.micronutrients,selected:[]}}),{});
});
test('canonical conversions preserve every projected value and supplied range takes priority',()=>{
 for(const marker of Object.keys(observations) as NutritionMarker[]){
  const other={ferritin:'ng/mL',b12:'pg/mL',folate:'ng/mL',vitd:'ng/mL'}[marker],factor=canonicalFactor(marker,other),a=labProjection(scaled(1.2),marker,anchored(marker)),b=labProjection(scaled(1.2),marker,{...anchored(marker),value:observations[marker].value!/factor,unit:other});
  for(const d of [0,1,91,365])for(const k of ['value','low','high'] as const){if(a.points[d][k]===null)assert.equal(b.points[d][k],null);else near(a.points[d][k]!,b.points[d][k]!*factor);}
 }
 const o={value:10,unit:'µg/L',low:12,high:300};assert.equal(effectiveLabRange('ferritin',o).low,12);assert.equal(effectiveLabRange('ferritin',o).high,300);assert.match(compareLabResult('ferritin',o),/^Below supplied/);
 assert.equal(effectiveLabRange('b12',{value:185,unit:'pmol/L',low:200}).high,undefined);
 assert.equal(effectiveLabRange('folate',{unit:'ng/mL'}).low,4);assert.equal(effectiveLabRange('folate',{unit:'ng/mL'}).high,undefined);
 near(effectiveLabRange('vitd',{unit:'ng/mL'}).low!,20);
});
test('iron can increase or deteriorate from the food/loss balance and stops at functional depletion',()=>{
 const ordinary=labProjection(app,'ferritin',observations.ferritin),poor=labProjection(scaled(.3),'ferritin',observations.ferritin),lessPoor=labProjection(scaled(.35),'ferritin',observations.ferritin);
 assert.ok(ordinary.points[365].value!>10);assert.ok(ordinary.points[1].value!<11);
 assert.ok(poor.points[30].value!<10);assert.ok(lessPoor.intake>poor.intake);assert.ok(lessPoor.points[30].value!<10,'More iron does not guarantee positive balance');
 assert.equal(poor.points[365].value,null);assert.match(poor.limit!,/functional pools/);
 assert.ok(ordinary.points.some(p=>p.low!==null&&p.low<10&&p.high!>10),'Valid sensitivity includes deterioration as well as recovery');
 assert.equal(ordinary.points[365].low,null);assert.equal(ordinary.points[365].high,null);assert.match(ordinary.sensitivityLimit!.message,/Lower case/);
});
test('ferritin model withholds unsupported starts and low supporting hemoglobin without inventing zero absorption',()=>{
 const high=labProjection(app,'ferritin',{value:400,unit:'µg/L'});assert.equal(high.points[0].value,400);assert.equal(high.points[1].value,null);assert.equal(high.absorbed,null);
 const lowHb=labProjection({...app,micronutrients:{intent:'lab',observations:{hemoglobin:{value:110,unit:'g/L',low:130}}}},'ferritin',observations.ferritin);
 assert.match(lowHb.limit!,/hemoglobin/);assert.equal(lowHb.points[365].value,null);
});
test('unchanged food does not force B12, folate or D to normalize from a low measured start',()=>{
 for(const marker of ['b12','folate','vitd'] as const)for(let startDay=0;startDay<7;startDay++){const p=labProjection({...app,startDay},marker,anchored(marker));for(const d of [0,1,91,365])near(p.points[d].value!,observations[marker].value!);assert.equal(p.limit,undefined);}
});
test('food-response curves rise and fall, include no response, and keep an immutable measured start',()=>{
 for(const marker of ['b12','folate','vitd'] as const){
  const o=anchored(marker),up=labProjection(scaled(1.25),marker,o),down=labProjection(scaled(.75),marker,o),start=o.value!;
  near(up.points[0].value!,start);near(down.points[0].value!,start);assert.ok(up.points[365].value!>start);assert.ok(down.points[365].value!<start);
  near(up.points[365].low!,start);near(down.points[365].high!,start);assert.equal(o.value,start);
  assert.ok(Math.abs(up.points[1].value!-start)<Math.abs(up.points[91].value!-start));
 }
});
test('response times differ and food changes do not overwrite the lab anchor after applying',()=>{
 const b=labProjection(scaled(1.25),'b12',anchored('b12')),f=labProjection(scaled(1.25),'folate',anchored('folate'));
 const progress=(p:typeof b)=>(p.points[30].value!-p.measured)/(p.points[365].value!-p.measured);
 assert.ok(progress(f)>progress(b)*2);
 const applied={...scaled(1.25),micronutrients:{intent:'lab' as const,selected:['b12' as const],observations:{b12:anchored('b12')}}};assert.deepEqual(simulateLabMarkers(applied,365).b12,b);
});
test('a once-only food change is transient; repeating it has a larger sustained effect',()=>{
 const changed=scaled(1.25),once={...app,once:changed.week[0]};
 for(const marker of ['b12','folate','vitd'] as const){const a=labProjection(once,marker,anchored(marker)),b=labProjection(changed,marker,anchored(marker));assert.ok(b.points[365].value!>a.points[365].value!);assert.ok(a.points[15].value!>a.measured);assert.ok(Math.abs(a.points[365].value!-a.measured)<.05);}
});
test('large unsupported response extrapolations are withheld rather than converted into false precision',()=>{
 for(const marker of ['b12','folate'] as const){const p=labProjection(scaled(.1),marker,anchored(marker));assert.equal(p.points.length,366);assert.equal(p.points[365].value,null);assert.match(p.limit!,/modest intake-response/);}
});
test('top contributors equal independently summed catalogue nutrients and exclude zero portions',()=>{
 for(const marker of Object.keys(observations) as NutritionMarker[]){const key=markerNutrients[marker].key,manual=new Map<string,number>();
  for(const d of app.week)for(const m of d.meals)for(const p of m.foods){const amount=Number((foodById[p.foodId].per100 as Record<string,number|null>)[key]||0)*p.grams/100;manual.set(p.foodId,(manual.get(p.foodId)||0)+amount);}
  const expected=[...manual].filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3),actual=topContributors(app.week,marker);
  assert.deepEqual(actual.map(c=>c.foodId),expected.map(c=>c[0]));actual.forEach((c,i)=>near(c.amount,expected[i][1]));
 }
 assert.deepEqual(topContributors(scaled(0).week,'ferritin'),[]);
});
test('editing a contributor changes one named serving, energy, nutrient input and trajectory together',()=>{
 const c=topContributors(app.week,'b12')[0],where=c.occurrences[0],f=foodById[c.foodId],next=editContributor(app.week,where,where.grams+f.step),before=JSON.stringify(app.week);
 assert.equal(app.week[where.day].meals[where.meal].foods[where.portion].grams,where.grams);
 for(let d=0;d<7;d++)if(d!==where.day)assert.deepEqual(next[d],app.week[d]);
 near((weeklyAverage(next).kcal-weeklyAverage(app.week).kcal)*7,totals([{foodId:f.id,grams:f.step}]).kcal);
 assert.ok(weeklyAverage(next).micros.b12_ug>weeklyAverage(app.week).micros.b12_ug);
 const p=labProjection({...app,week:next},'b12',anchored('b12'));assert.ok(p.points[365].value!>185);assert.equal(JSON.stringify(app.week),before);
 assert.throws(()=>editContributor(app.week,where,NaN));
});
test('diet accounting and deterministic projections contain finite nonnegative ordered sensitivity values',()=>{
 for(const marker of Object.keys(observations) as NutritionMarker[]){const p=labProjection(app,marker,anchored(marker));assert.deepEqual(labProjection(app,marker,anchored(marker)),p);
  near(p.intake,app.week.reduce((n,d)=>n+(dayTotals(d).micros[markerNutrients[marker].key]||0),0)/7);
  for(const s of p.points)if(s.value!==null){assert.ok(Number.isFinite(s.value)&&s.value>=0);if(s.low===null||s.high===null){assert.equal(s.low,null);assert.equal(s.high,null);assert.ok(p.sensitivityLimit&&s.day>=p.sensitivityLimit.day);}else assert.ok(s.low>=0&&s.high>=s.value&&s.value>=s.low);}
 }
});
