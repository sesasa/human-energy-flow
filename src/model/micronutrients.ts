import { clamp } from './config';
import { basalIronLoss, menstrualIronLoss, validateProfile, redCellIronTarget } from './profile';
import { dietDayAt, totals, foodById, type DietApplication, type DietDay, type Meal } from './diet';
export interface NutrientSettings {
 iron:'reference'|'low'; b12:'reference'|'low'; vitd:'reference'|'low'; folate:'reference'|'low';
 vitdSource:'none'|'background'; folateAbsorption:'usual'|'reduced';
 ironAbsorption:'usual'|'reduced'; ironLosses:'usual'|'higher'; b12Absorption:'usual'|'reduced';
}
export const defaultNutrientSettings:NutrientSettings={iron:'reference',b12:'reference',vitd:'reference',folate:'reference',vitdSource:'background',folateAbsorption:'usual',ironAbsorption:'usual',ironLosses:'usual',b12Absorption:'usual'};
// Model anchors, not laboratory reference intervals or recommended body stores.
export const IRON_REFERENCE_MG=600, B12_REFERENCE_UG=2500, FOLATE_REFERENCE_UG=20000, VITD_REFERENCE_UG=600;
export type PoolKey='iron'|'b12'|'vitd'|'folate';
export const poolKeys:PoolKey[]=['iron','b12','vitd','folate'];
const RBC_TARGET=2400,TISSUE_TARGET=300,MARROW_DAYS=7,TRANSPORT_TARGET=3;
export interface IronState {
 storesMg:number; transportMg:number; redCellsMg:number; tissueMg:number; marrowMg:number; marrowQueue:number[];
 index:number; intakeMg:number; absorbedMg:number; absorptionFraction:number; lossesMg:number;
 recycledMg:number; marrowUseMg:number; tissueUseMg:number; maturedMg:number;
 menstrualLossMg:number; cumulativeMenstrualMg:number; cumulativeAbsorbedMg:number; cumulativeLossesMg:number; totalMg:number; residualMg:number; missing:boolean; atLimit:boolean;
}
export interface B12State { storesUg:number;index:number;intakeUg:number;absorbedUg:number;lossesUg:number;cumulativeAbsorbedUg:number;cumulativeLossesUg:number;residualUg:number;missing:boolean }
export interface SlowPoolState {storesUg:number;index:number;intakeUg:number;absorbedUg:number;externalUg:number;lossesUg:number;cumulativeInputUg:number;cumulativeLossesUg:number;residualUg:number;missing:boolean}
export interface NutrientState { day:number;iron:IronState;b12:B12State;vitd:SlowPoolState;folate:SlowPoolState }
export interface NutrientSimulation { states:NutrientState[];settings:NutrientSettings }
export function validateNutrientSettings(s:NutrientSettings){
 for(const k of poolKeys)if(!['reference','low'].includes(s[k]))throw new Error('Choose an explicit reference or low starting store.');
 for(const k of ['ironAbsorption','b12Absorption','folateAbsorption'] as const)if(!['usual','reduced'].includes(s[k]))throw new Error('Unsupported absorption assumption.');
 if(!['none','background'].includes(s.vitdSource))throw new Error('Unsupported non-food vitamin D assumption.');
 if(!['usual','higher'].includes(s.ironLosses))throw new Error('Unsupported iron loss assumption.');
}
// Heme proportions and meal modifiers are authored teaching coefficients; CoFID gives total iron.
const hemeFractions:Record<string,number>={beef:.4,chicken:.3,salmon:.25,mackerel:.25,'burger-patty':.4,'fried-chicken':.3,sausage:.3};
const phytateFoods=new Set(['oats','bread','brown-rice','lentils','almonds','walnuts']);
export function ironMealInput(meal:Meal,storesMg:number,settings:NutrientSettings){
 const n=totals(meal.foods),intake=n.micros.iron_mg||0;
 const heme=meal.foods.reduce((sum,p)=>sum+(foodById[p.foodId].per100.iron_mg||0)*p.grams/100*(hemeFractions[p.foodId]||0),0);
 const nonheme=Math.max(0,intake-heme),vitaminC=n.micros.c_mg||0;
 const phytateMass=meal.foods.reduce((sum,p)=>sum+(phytateFoods.has(p.foodId)?p.grams:0),0);
 const regulation=clamp(Math.exp(1.2*(1-storesMg/IRON_REFERENCE_MG)),.1,2.5);
 const enhancer=1+.5*vitaminC/(vitaminC+50),inhibitor=1-.3*phytateMass/(phytateMass+150);
 const nonhemeFraction=clamp(.064*regulation*enhancer*inhibitor/(1+nonheme/40),.004,.3);
 const hemeFraction=clamp(.23*(.85+.15*regulation),.12,.35);
 const uptake=settings.ironAbsorption==='reduced'?.3:1;
 return {intake,absorbed:(heme*hemeFraction+nonheme*nonhemeFraction)*uptake,heme,nonheme,vitaminC,missing:n.missing.includes('iron_mg')};
}
export function b12MealInput(meal:Meal,settings:NutrientSettings){
 const n=totals(meal.foods),intake=n.micros.b12_ug||0;
 // Saturable food uptake per meal, plus a small passive component. Not supplement dosing.
 const active=1.5*(1-Math.exp(-.5*intake/1.5))*(settings.b12Absorption==='reduced'?.1:1);
 return {intake,absorbed:Math.min(intake,active+.01*intake),missing:n.missing.includes('b12_ug')};
}
export function nutrientInput(day:DietDay,storesMg:number,settings:NutrientSettings){
 const iron=day.meals.map(m=>ironMealInput(m,storesMg,settings)),b12=day.meals.map(m=>b12MealInput(m,settings));
 return {ironIntake:iron.reduce((n,x)=>n+x.intake,0),ironAbsorbed:iron.reduce((n,x)=>n+x.absorbed,0),b12Intake:b12.reduce((n,x)=>n+x.intake,0),b12Absorbed:b12.reduce((n,x)=>n+x.absorbed,0),ironMissing:iron.some(x=>x.missing),b12Missing:b12.some(x=>x.missing)};
}
function slowInitial(storesUg:number,reference:number):SlowPoolState {return {storesUg,index:storesUg/reference,intakeUg:0,absorbedUg:0,externalUg:0,lossesUg:0,cumulativeInputUg:0,cumulativeLossesUg:0,residualUg:0,missing:false};}
// Vitamin D is an effective availability pool, NOT circulating 25-OH D. Tissue buffering and non-food input are abstracted.
function nextVitaminD(previous:SlowPoolState,day:DietDay,settings:NutrientSettings,start:number):SlowPoolState {
 const n=totals(day.meals.flatMap(m=>m.foods)),intake=n.micros.d_ug||0,absorbed=.8*intake,external=settings.vitdSource==='background'?6.3:0;
 const loss=previous.storesUg*(1-Math.exp(-Math.LN2/35));
 Object.assign(previous,{intakeUg:intake,absorbedUg:absorbed,externalUg:external,lossesUg:loss,missing:n.missing.includes('d_ug')});
 const stores=previous.storesUg+absorbed+external-loss,input=previous.cumulativeInputUg+absorbed+external,lost=previous.cumulativeLossesUg+loss;
 return {...previous,storesUg:stores,index:stores/VITD_REFERENCE_UG,cumulativeInputUg:input,cumulativeLossesUg:lost,residualUg:stores-start-input+lost};
}
// Unfortified food folate, approximately half absorbed. Smaller reserves and much faster turnover than B12.
function nextFolate(previous:SlowPoolState,day:DietDay,settings:NutrientSettings,start:number):SlowPoolState {
 const n=totals(day.meals.flatMap(m=>m.foods)),intake=n.micros.folate_ug||0,absorbed=.5*intake*(settings.folateAbsorption==='reduced'?.3:1),loss=previous.storesUg*.0155;
 Object.assign(previous,{intakeUg:intake,absorbedUg:absorbed,externalUg:0,lossesUg:loss,missing:n.missing.includes('folate_ug')});
 const stores=previous.storesUg+absorbed-loss,input=previous.cumulativeInputUg+absorbed,lost=previous.cumulativeLossesUg+loss;
 return {...previous,storesUg:stores,index:stores/FOLATE_REFERENCE_UG,cumulativeInputUg:input,cumulativeLossesUg:lost,residualUg:stores-start-input+lost};
}
export interface IronProjectionOptions { ironStoresMg?:number; absorptionScale?:number; dailyLossMg?:number; menstrualCase?:'ml'|'low'|'high' }
function initial(settings:NutrientSettings,options:IronProjectionOptions={},rbcTarget=RBC_TARGET):NutrientState {
 const storesMg=options.ironStoresMg??IRON_REFERENCE_MG*(settings.iron==='low'?.42:1),storesUg=B12_REFERENCE_UG*(settings.b12==='low'?.32:1),marrowQueue=Array<number>(MARROW_DAYS).fill(rbcTarget/120);
 return {day:0,vitd:slowInitial(VITD_REFERENCE_UG*(settings.vitd==='low'?.45:1),VITD_REFERENCE_UG),folate:slowInitial(FOLATE_REFERENCE_UG*(settings.folate==='low'?.4:1),FOLATE_REFERENCE_UG),iron:{storesMg,transportMg:TRANSPORT_TARGET,redCellsMg:rbcTarget,tissueMg:TISSUE_TARGET,marrowMg:rbcTarget/120*MARROW_DAYS,marrowQueue,index:storesMg/IRON_REFERENCE_MG,intakeMg:0,absorbedMg:0,absorptionFraction:0,lossesMg:0,recycledMg:0,marrowUseMg:0,tissueUseMg:0,maturedMg:0,menstrualLossMg:0,cumulativeMenstrualMg:0,cumulativeAbsorbedMg:0,cumulativeLossesMg:0,totalMg:storesMg+TRANSPORT_TARGET+rbcTarget+TISSUE_TARGET+rbcTarget/120*MARROW_DAYS,residualMg:0,missing:false,atLimit:false},b12:{storesUg,index:storesUg/B12_REFERENCE_UG,intakeUg:0,absorbedUg:0,lossesUg:0,cumulativeAbsorbedUg:0,cumulativeLossesUg:0,residualUg:0,missing:false}};
}
export function simulateNutrients(app:DietApplication,days=1095,options:IronProjectionOptions={}):NutrientSimulation {
 const settings={...defaultNutrientSettings,...app.status};validateNutrientSettings(settings);
 if(!Number.isInteger(days)||days<1||days>3650)throw new Error('Choose 1–3650 nutrient simulation days.');
 for(const v of [options.ironStoresMg,options.absorptionScale,options.dailyLossMg])if(v!==undefined&&(!Number.isFinite(v)||v<0))throw new Error('Invalid iron projection assumption.');
 if(app.profile)validateProfile(app.profile);
 const rbcTarget=redCellIronTarget(app.profile),marrowTarget=rbcTarget/120*MARROW_DAYS;
 const start=initial(settings,options,rbcTarget),states=[start];
 for(let day=0;day<days;day++){
  const previous=states[day],old=previous.iron,food=nutrientInput(dietDayAt(app,day),old.storesMg,settings);
  // Daily input/flow annotations describe the interval beginning at this boundary.
  food.ironAbsorbed*=options.absorptionScale??1;
  old.intakeMg=food.ironIntake;old.absorbedMg=old.atLimit?0:food.ironAbsorbed;old.absorptionFraction=food.ironIntake&&!old.atLimit?food.ironAbsorbed/food.ironIntake:0;old.missing=food.ironMissing;
  previous.b12.intakeUg=food.b12Intake;previous.b12.absorbedUg=food.b12Absorbed;previous.b12.missing=food.b12Missing;
  let stores=old.storesMg,redCells=old.redCellsMg,tissue=old.tissueMg,marrow=[...old.marrowQueue];
  const menstrualLoss=Math.min(redCells,menstrualIronLoss(app.profile,day,options.menstrualCase));
  redCells-=menstrualLoss; // blood loss leaves the red-cell pool; marrow replacement draws gradually on stores.
  const recycledRBC=redCells/120,recycledTissue=tissue/180;
  redCells-=recycledRBC;tissue-=recycledTissue;
  const matured=marrow.shift()!;redCells+=matured;
  let transport=old.transportMg+recycledRBC+recycledTissue+food.ironAbsorbed;
  const requiredLoss=options.dailyLossMg??(basalIronLoss(app.profile)*(settings.ironLosses==='higher'?2:1));
  const basalLoss=Math.min(transport,requiredLoss);transport-=basalLoss;const losses=basalLoss+menstrualLoss;
  const queued=marrow.reduce((n,x)=>n+x,0);
  const marrowDemand=clamp(rbcTarget/120+(rbcTarget+marrowTarget-redCells-queued-rbcTarget/120)/14,0,rbcTarget/120+8);
  const tissueDemand=Math.max(0,TISSUE_TARGET-tissue);
  const release=Math.min(stores,8,Math.max(0,marrowDemand+tissueDemand+TRANSPORT_TARGET-transport));
  stores-=release;transport+=release;
  const marrowUse=Math.min(marrowDemand,transport);transport-=marrowUse;marrow.push(marrowUse);
  const tissueUse=Math.min(tissueDemand,transport);transport-=tissueUse;tissue+=tissueUse;
  // Surplus leaves the small transport buffer for storage; no invented iron excretion or clipping.
  const deposit=Math.max(0,transport-TRANSPORT_TARGET);stores+=deposit;transport-=deposit;
  const marrowMg=marrow.reduce((n,x)=>n+x,0),total=stores+transport+redCells+tissue+marrowMg;
  const absorbedTotal=old.cumulativeAbsorbedMg+food.ironAbsorbed,lossesTotal=old.cumulativeLossesMg+losses;
  old.lossesMg=losses;old.menstrualLossMg=old.atLimit?0:menstrualLoss;old.recycledMg=recycledRBC+recycledTissue;old.marrowUseMg=marrowUse;old.tissueUseMg=tissueUse;old.maturedMg=matured;
  const bLoss=previous.b12.storesUg*.001,bPool=previous.b12.storesUg+food.b12Absorbed-bLoss;
  previous.b12.lossesUg=bLoss;
  const bAbs=previous.b12.cumulativeAbsorbedUg+food.b12Absorbed,bLost=previous.b12.cumulativeLossesUg+bLoss;
  if(old.atLimit){old.lossesMg=0;old.recycledMg=0;old.marrowUseMg=0;old.tissueUseMg=0;old.maturedMg=0;}
  const foodDay=dietDayAt(app,day),vitd=nextVitaminD(previous.vitd,foodDay,settings,start.vitd.storesUg),folate=nextFolate(previous.folate,foodDay,settings,start.folate.storesUg);
  states.push({day:day+1,vitd,folate,iron:old.atLimit?{...old,marrowQueue:[...old.marrowQueue]}:{...old,storesMg:stores,transportMg:transport,redCellsMg:redCells,tissueMg:tissue,marrowMg,marrowQueue:marrow,index:stores/IRON_REFERENCE_MG,totalMg:total,cumulativeMenstrualMg:old.cumulativeMenstrualMg+menstrualLoss,cumulativeAbsorbedMg:absorbedTotal,cumulativeLossesMg:lossesTotal,residualMg:total-start.iron.totalMg-absorbedTotal+lossesTotal,atLimit:stores<=.01||marrowUse<marrowDemand-1e-6||tissueUse<tissueDemand-1e-6},b12:{...previous.b12,storesUg:bPool,index:bPool/B12_REFERENCE_UG,cumulativeAbsorbedUg:bAbs,cumulativeLossesUg:bLost,residualUg:bPool-start.b12.storesUg-bAbs+bLost}});
 }
 return {states,settings};
}
export function sampleNutrients(sim:NutrientSimulation,day:number):NutrientState {
 const x=clamp(day,0,sim.states.length-1),lo=Math.floor(x),a=sim.states[lo],b=sim.states[Math.min(lo+1,sim.states.length-1)],f=x-lo;
 const iron={...a.iron},b12={...a.b12},vitd={...a.vitd},folate={...a.folate};
 // Interpolate stocks only; input values remain the selected day's actual meal totals.
 for(const k of ['storesMg','transportMg','redCellsMg','tissueMg','marrowMg','index','totalMg','cumulativeAbsorbedMg','cumulativeLossesMg','residualMg'] as const)iron[k]=a.iron[k]+(b.iron[k]-a.iron[k])*f;
 for(const k of ['storesUg','index','cumulativeAbsorbedUg','cumulativeLossesUg','residualUg'] as const)b12[k]=a.b12[k]+(b.b12[k]-a.b12[k])*f;
 for(const key of ['storesUg','index','cumulativeInputUg','cumulativeLossesUg','residualUg'] as const){vitd[key]=a.vitd[key]+(b.vitd[key]-a.vitd[key])*f;folate[key]=a.folate[key]+(b.folate[key]-a.folate[key])*f;}
 return {day:x,iron,b12,vitd,folate};
}
export function storeTrend(sim:NutrientSimulation,day:number,key:PoolKey,horizon=28){
 const end=Math.min(sim.states.length-1,Math.floor(day)+horizon),start=Math.max(0,end-horizon),change=sim.states[end][key].index-sim.states[start][key].index;
 return Math.abs(change)<(horizon>=180?.03:.01)?'Nearly steady':change>0?'Rising':'Falling';
}
