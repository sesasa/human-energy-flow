import { basalIronLoss, bleedingEvents, bleedingScenarios, cycleActive, ironPerMlBlood, type PhysiologyProfile } from './profile';
import { dayTotals, dietDayAt, foodById, totals, weeklyAverage, type DietApplication, type DietWeek } from './diet';
import { canonicalFactor, observationError, selectedLabMarkers, type LabObservation, type NutritionMarker } from './labs';
import { b12MealInput, defaultNutrientSettings, simulateNutrients } from './micronutrients';

export const markerNutrients:Record<NutritionMarker,{key:string;name:string;unit:string;color:string}>={
 ferritin:{key:'iron_mg',name:'iron',unit:'mg',color:'#dcb18b'},
 b12:{key:'b12_ug',name:'B12',unit:'µg',color:'#a7c6e7'},
 folate:{key:'folate_ug',name:'folate',unit:'µg',color:'#aed098'},
 vitd:{key:'d_ug',name:'vitamin D',unit:'µg',color:'#e1ca87'}
};
export interface LabPoint { day:number; value:number|null; low:number|null; high:number|null }
export interface LabProjection { marker:NutritionMarker; measured:number; unit:string; points:LabPoint[]; intake:number; absorbed:number|null; missing:boolean; note:string; limit?:string; sensitivityLimit?:{day:number;message:string}; method:string; sources:string[]; profile?:PhysiologyProfile; cycleEvents?:{start:number;end:number}[]; menstrualIronPerCycle?:number; anchorIntake?:number; reserveIllustration?:{day:number;relative:number}[] }
const ironSource='https://pmc.ncbi.nlm.nih.gov/articles/PMC477879/';
export const projectionSources={
 ferritin:[ironSource,'https://jcp.bmj.com/content/64/4/287','https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'],
 b12:['https://pubmed.ncbi.nlm.nih.gov/23269815/','https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/'],
 folate:['https://pmc.ncbi.nlm.nih.gov/articles/PMC4425166/','https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/'],
 vitd:['https://pubmed.ncbi.nlm.nih.gov/34308818/','https://www.sciencedirect.com/science/article/pii/S0022316622027948','https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/']
};
export function labProjection(app:DietApplication,marker:NutritionMarker,o:LabObservation,days=365):LabProjection {
 if(observationError(marker,o)||o.value===undefined)throw new Error('A valid measured result is required.');
 if(!Number.isInteger(days)||days<1||days>1095)throw new Error('Choose a supported projection duration.');
 const factor=canonicalFactor(marker,o.unit),measured=o.value,canonical=measured*factor,meta=markerNutrients[marker];
 const ns=Array.from({length:7},(_,d)=>dayTotals(dietDayAt(app,d))),intake=ns.reduce((a,n)=>a+(n.micros[meta.key]||0),0)/7,missing=ns.some(n=>n.missing.includes(meta.key));
 const result:LabProjection={marker,measured,unit:o.unit,points:[{day:0,value:measured,low:measured,high:measured}],intake,absorbed:null,missing,note:'',method:'',sources:projectionSources[marker],profile:app.profile};
 const illustrateReserves=()=>{
  if((marker==='b12'||marker==='folate')&&!missing){
   // Separate teaching state: never derive stores from a serum concentration.
   const states=simulateNutrients({...app,status:{...defaultNutrientSettings}},days).states,start=states[0][marker].storesUg;
   result.reserveIllustration=states.map(s=>({day:s.day,relative:s[marker].storesUg/start}));
  }
 };
 const withhold=(reason:string)=>{result.limit=reason;result.points.push(...Array.from({length:days},(_,i)=>({day:i+1,value:null,low:null,high:null})));return result;};
 if(missing)return withhold('Food data are incomplete for this marker. Intake is a lower bound; a numerical laboratory trajectory is not inferred from missing values.');
 if(marker==='ferritin'){
  result.note='Iron balance with regulated absorption and losses. Shading spans different uptake/loss assumptions; it is not a personal prediction interval.';
  result.method='Roughly 8 mg stored iron per µg/L ferritin is a historical healthy-adult approximation, not a calibration for an individual. The existing model retains recycling, red cells, tissue demand and a marrow delay. Cases vary store conversion (6–10), uptake (0.3–1.25×) and losses (1–2.4 mg/day); these sensitivity bounds are authored, not clinical confidence limits. Assumes no inflammation or extra functional iron deficit.';
  const hb=app.micronutrients?.observations.hemoglobin;
  if(hb?.value!==undefined&&hb.low!==undefined&&hb.value<hb.low)return withhold('Low hemoglobin needs clinical context. A food-only ferritin projection is not supported here.');
  if(canonical<1||canonical>300)return withhold('This simplified ferritin model covers starts of 1–300 µg/L. The entered result remains recorded; no trajectory is extrapolated outside that scope.');
  const basal=basalIronLoss(app.profile);
  const cases=app.profile?[{conversion:8,scale:1,loss:basal,cycle:'ml' as const},{conversion:10,scale:.3,loss:basal*1.3,cycle:'high' as const},{conversion:6,scale:1.25,loss:basal*.8,cycle:'low' as const}]:[{conversion:8,scale:1,loss:1.2,cycle:'ml' as const},{conversion:10,scale:.3,loss:2.4,cycle:'high' as const},{conversion:6,scale:1.25,loss:1,cycle:'low' as const}];
  if(app.profile){result.method=result.method.replace('losses (1–2.4 mg/day)','basal losses (0.8–1.3× 0.014 mg/kg/day)');result.method+=' Functional red-cell iron starts from a Nadler blood-volume estimate, with assumed normal hemoglobin 150 g/L male / 135 g/L female; this is not a predicted hemoglobin test.';result.sources=[...result.sources,'https://pubmed.ncbi.nlm.nih.gov/21936146/'];}
  result.cycleEvents=bleedingEvents(app.profile,days);
  if(cycleActive(app.profile)){result.menstrualIronPerCycle=bleedingScenarios[app.profile!.cycle.level].ml*ironPerMlBlood;result.note='Cycle ticks mark modeled bleeding days. Blood loss removes red-cell iron; gradual replacement draws on stores. Uptake adapts to stores. Shading shows sensitivity, not a personal prediction interval.';result.method+=' Menstrual losses use representative 15/30/80 mL cycles for light/typical/heavy (sensitivity 5–20/20–60/60–120 mL), with assumed hemoglobin 135 g/L ×3.39 mg iron/g. These are illustrative categories, not measurements. Duration spreads a fixed total across bleeding days. A shorter cycle repeats losses more often. No smoothing, hormone oscillation or menstrual loss is added to other markers.';result.sources=[...result.sources,'https://www.ncbi.nlm.nih.gov/books/NBK222309/'];}
  const sims=cases.map(c=>simulateNutrients({...app,status:{...defaultNutrientSettings}},days,{ironStoresMg:canonical*c.conversion,absorptionScale:c.scale,dailyLossMg:c.loss,menstrualCase:c.cycle}));
  result.absorbed=sims[0].states.slice(0,7).reduce((a,s)=>a+s.iron.absorbedMg,0)/Math.min(7,days+1);
  for(let d=1;d<=days;d++){
   const values=sims.map((sim,i)=>sim.states[d].iron.storesMg/cases[i].conversion/factor),central=sims[0].states[d].iron;
   if(central.atLimit){result.points.push({day:d,value:null,low:null,high:null});result.limit='Projection stops when reserves cannot support the model’s functional pools. Subsequent laboratory values are not inferred.';}
   else {
    const exhausted=sims.findIndex((sim,i)=>i>0&&sim.states[d].iron.atLimit);
    if(exhausted>0&&!result.sensitivityLimit)result.sensitivityLimit={day:d,message:`${exhausted===1?'Lower':'Upper'} case reaches the model’s depletion limit at day ${d}; sensitivity shading ends there.`};
    // A frozen, out-of-scope case is not a future laboratory value. Keep the valid
    // central trajectory, but withhold the envelope once a bounding case stops.
    result.points.push({day:d,value:values[0],low:result.sensitivityLimit?null:Math.min(...values),high:result.sensitivityLimit?null:Math.max(...values)});
   }
  }
  return result;
 }
 // B12, folate and D cannot be inferred from a tank percentage. The entered result anchors a
 // food-response scenario, holding non-food influences constant. No arbitrary population lab target.
 const anchor=o.dietAtResult??{week:app.week,startDay:app.startDay},anchorIntake=weeklyAverage(anchor.week).micros[meta.key]||0;
 result.anchorIntake=anchorIntake;
 result.absorbed=marker==='b12'?Array.from({length:7},(_,d)=>dietDayAt(app,d).meals.reduce((s,m)=>s+b12MealInput(m,defaultNutrientSettings).absorbed,0)).reduce((a,b)=>a+b,0)/7:intake*(marker==='folate'?.5:.8);
 result.note='Assumes the entered result reflects the food plan in use when entered. Other influences stay constant; unchanged intake can remain low. Shading shows food-response sensitivity, not an individual prediction interval.';
 const methods={
  b12:'Adult pooled evidence suggests about 8% higher serum B12 per doubling of intake (mixed adult/elderly studies: 11%). We use the adult coefficient, with response cases from no response to the pooled upper coefficient (12.5%). The 90-day adjustment time is an illustrative buffer, not a fitted recovery curve. Serum B12 is not a direct measure of liver stores.',
  folate:'Natural-food studies suggest about 7% higher serum folate per 10% higher food folate intake. Evidence is mainly in women aged 12–49, so extension to this adult scenario is uncertain. Cases include no response and the study’s upper coefficient (12% per 10% intake). A 21-day adjustment is illustrative; no red-cell folate or body-store conversion is made.',
  vitd:'Food-fortification meta-analyses report about 0.8–1.2 nmol/L higher 25-OH D per extra µg/day. We use 0.8 with sensitivity from no response to 1.68; applying fortification evidence to ordinary foods or decreases is an extrapolation. Adjustment uses the approximately 15-day circulating half-life. Sunlight, supplements and other non-food influences are held constant, not prescribed.'
 };
 result.method=methods[marker];
 if(canonical<=0)return withhold('A positive measured value is needed to anchor a food-response scenario.');
 if(weeklyAverage(anchor.week).missing.includes(meta.key))return withhold('The food plan at the result has incomplete data for this marker; a numerical intake-response relationship cannot be anchored.');
 if(marker!=='vitd'&&anchorIntake<=0){illustrateReserves();return withhold('The food plan at the result has no known intake for this nutrient. A numerical intake-response relationship cannot be anchored.');}
 const series=Array.from({length:days},(_,d)=>dayTotals(dietDayAt(app,d)).micros[meta.key]||0),history=Array.from({length:6},(_,i)=>dayTotals(anchor.week[(app.startDay+i+1)%7]).micros[meta.key]||0);
 let center=canonical,upperCase=canonical;const tau=marker==='b12'?90:marker==='folate'?21:15/Math.LN2,step=1-Math.exp(-1/tau);
 for(let d=0;d<days;d++){
  history.push(series[d]);if(history.length>7)history.shift();const current=history.reduce((a,b)=>a+b,0)/7,ratio=anchorIntake>0?current/anchorIntake:1,delta=current-anchorIntake;
  // Do not extend small/moderate intake-response evidence to starvation, massive portions or clinical correction.
  if((marker!=='vitd'&&(ratio<.5||ratio>2))||(marker==='vitd'&&Math.abs(delta)>25)){
   result.limit='The food change exceeds this modest intake-response model. No precise laboratory trajectory is extrapolated; intake and food controls still update.';
   illustrateReserves();
   result.points.push(...Array.from({length:days-d},(_,i)=>({day:d+i+1,value:null,low:null,high:null})));break;
  }
  const beta=marker==='b12'?Math.log(1.08)/Math.LN2:Math.log(1.07)/Math.log(1.1),betaUpper=marker==='b12'?Math.log(1.125)/Math.LN2:Math.log(1.12)/Math.log(1.1);
  const target=marker==='vitd'?canonical+.8*delta:canonical*Math.pow(ratio,beta),wide=marker==='vitd'?canonical+1.68*delta:canonical*Math.pow(ratio,betaUpper);
  center+=step*(Math.max(0,target)-center);upperCase+=step*(Math.max(0,wide)-upperCase);
  result.points.push({day:d+1,value:center/factor,low:Math.min(canonical,center,upperCase)/factor,high:Math.max(canonical,center,upperCase)/factor});
 }
 return result;
}
export function simulateLabMarkers(app:DietApplication,days=1095){
 return Object.fromEntries(selectedLabMarkers(app.micronutrients).flatMap(marker=>{const o=app.micronutrients?.observations[marker];return !o||o.value===undefined||observationError(marker,o)?[]:[[marker,labProjection(app,marker,o,days)]];})) as Partial<Record<NutritionMarker,LabProjection>>;
}
export function labTrend(p:LabProjection,day=365){const a=p.points[Math.min(p.points.length-1,Math.floor(day))]?.value;if(a===null||a===undefined)return 'Outside model scope';const delta=a-p.measured;return Math.abs(delta)<Math.max(.5,p.measured*.02)?'Approximately stable':delta>0?'Rising':'Falling';}
export interface ContributorOccurrence { day:number; meal:number; portion:number; grams:number; label:string }
export interface NutrientContributor { foodId:string; amount:number; grams:number; occurrences:ContributorOccurrence[] }
export function topContributors(week:DietWeek,marker:NutritionMarker):NutrientContributor[]{
 const key=markerNutrients[marker].key,all=new Map<string,NutrientContributor>();
 week.forEach((d,di)=>d.meals.forEach((m,mi)=>m.foods.forEach((p,pi)=>{const amount=totals([p]).micros[key]||0;if(p.grams<=0||amount<=0)return;let entry=all.get(p.foodId);if(!entry){entry={foodId:p.foodId,amount:0,grams:0,occurrences:[]};all.set(p.foodId,entry);}entry.amount+=amount;entry.grams+=p.grams;entry.occurrences.push({day:di,meal:mi,portion:pi,grams:p.grams,label:`${d.name.slice(0,3)} · ${m.name.toLowerCase()}`});})));
 return [...all.values()].sort((a,b)=>b.amount-a.amount||a.foodId.localeCompare(b.foodId)).slice(0,3);
}
// One named serving in the shared weekly draft. No hidden calorie balancing or changes to other days.
export function editContributor(week:DietWeek,where:ContributorOccurrence,grams:number):DietWeek {
 if(!Number.isFinite(grams))throw new Error('Enter a finite portion.');const next=structuredClone(week),p=next[where.day]?.meals[where.meal]?.foods[where.portion];if(!p)throw new Error('The selected serving no longer exists.');
 p.grams=Math.max(0,Math.min(foodById[p.foodId].max,Math.round(grams*10)/10));return next;
}
