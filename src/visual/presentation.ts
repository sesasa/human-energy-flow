import { type Chapter } from '../engine/timeline';
import { type SprintState } from '../model/sprint';
import { type DayState } from '../model/day';
import { type AdaptationState } from '../model/longTerm';
import { type Scenario } from '../model/config';
export interface Story {title:string;eyebrow:string;keys:string[];caption:string;focus:string;id:string}
const concise:Record<string,[string,string[]]>={
 baseline:['Energy never stops.',['Organs using energy','Glucose held steady','Glycogen available']],
 breakfast:['A meal arrives.',['Digestion begins','Nutrients entering blood','Insulin rising']],
 absorption:['Meal absorbed.',['Glucose → liver first','Amino acids available','Fat travels via lymph']],
 insulin:['Insulin signals.',['Glucose uptake','Liver glycogen refilling','Muscle glycogen refilling']],
 distribution:['Use. Store. Repeat.',['Energy used now','Liver glycogen refilling','Muscle fuel available']],
 settling:['Between meals.',['Insulin settling','Liver supports glucose','Stored fuels available']],
 lunch:['Fresh nutrients.',['Meal absorbed','Glycogen replenished','Protein turnover']],
 work:['Thinking, steadily.',['Brain demand continues','Steady glucose supply','Small extra energy cost']],
 run:['Fuel into movement.',['Muscle glycogen used','Fat contributes too','Circulation increasing']],
 resistance:['Load the muscle.',['Chest · shoulders · triceps','Training stimulus','Recovery comes next']],
 recovery:['Recover & restore.',['Heart rate settling','Muscle repair supported','Glycogen replenishment']],
 dinner:['Refill the reserves.',['Carbohydrate absorbed','Glycogen refilling','Amino acids for repair']],
 summary:['The daily picture.',['Food energy accounted','Energy used throughout day','Recovery continues']],
 sleep:['Recovery continues.',['Lower heart rate','Liver supports glucose','Tissue maintenance']]
};
export function normalStory(c:Chapter):Story{const x=concise[c.id]||[c.title,[]];return {id:c.id,title:x[0],keys:x[1],caption:c.caption,eyebrow:c.eyebrow,focus:c.focus};}
export function sprintStory(st:SprintState):Story {
  const reduced=st.rep>1&&st.powerCapacity<.85;
  if(st.phase==='warmup')return {id:'warmup',title:'Prepare to sprint.',eyebrow:'INTENSE DAY / WARM-UP',keys:['Blood flow increasing','Muscles warming','PCr ready'],caption:'The warm-up raises circulation before the interval session. ATP is continually regenerated, and PCr is available as a rapid buffer.',focus:'muscle'};
  if(st.phase==='sprint')return {id:`sprint-${st.rep}-${reduced}`,title:reduced?'Same effort. Less power.':'Maximal intent.',eyebrow:'INTENSE DAY / SPRINT',keys:reduced?['PCr falling','Fatigue accumulating','Fuel still available']:['High-intensity output','PCr falling rapidly','Glycolysis contributing'],caption:reduced?'Effort stays maximal, but power is lower. Incomplete PCr recovery and accumulated fatigue limit output even though glycogen and other fuels remain.':'PCr and glycolysis rapidly regenerate ATP. Oxygen supply is rising, but it cannot support maximal sprint power alone.',focus:'muscle'};
  if(st.phase==='walk')return {id:`walk-${st.rep}`,title:'Walk. Partly restore.',eyebrow:'INTENSE DAY / WALKING RECOVERY',keys:['Partial PCr restoration',reduced?'Fatigue carries forward':'Oxygen supports recovery','ATP continually rebuilt'],caption:'Oxidative metabolism helps restore PCr. This brief walking interval gives only partial recovery; it does not reset the muscle for the next sprint.',focus:'recovery'};
  return {id:'sprint-after',title:'Fuel remains. Recover.',eyebrow:'INTENSE DAY / AFTER THE INTERVALS',keys:['PCr restoring','Fatigue clears more slowly','Glycogen refills with food'],caption:'The session ends with energy stores still available. PCr recovers over minutes, fatigue over longer periods, and glycogen is replenished as carbohydrate becomes available.',focus:'recovery'};
}
// side: 'right' rows are the scene's main readouts; 'left' rows are quieter context in #secondary-metrics.
// Placement depends only on the scene type, never on sprint/walk phase, so rows do not hop between columns mid-session.
export interface Metric {id:string;label:string;value:string;fraction:number;note:string;color:string;emphasis?:'primary'|'secondary'|'quiet'; hollow?:boolean;second?:number;change?:string;side?:'right'|'left'}
export function metricsMarkup(rows:Metric[]){return rows.map(r=>`<div id="row-${r.id}" tabindex="0" data-tip="metric-${r.id}" class="metric ${r.emphasis||'quiet'} ${r.hollow?'capacity-only':''}" style="--metric-color:${r.color}"><div class="metric-head"><span>${r.label}</span><strong id="${r.id}-value">${r.value}</strong></div><div class="metric-track" role="meter" aria-label="${r.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(r.fraction*100)}"><i id="${r.id}-bar" style="width:${Math.max(0,Math.min(1,r.fraction))*100}%"></i>${r.second!==undefined?`<b style="width:${r.second*100}%"></b>`:''}</div><small id="${r.id}-note">${r.note}</small><span class="metric-delta" id="${r.id}-change" ${r.change?'':'hidden'}>${r.change||''}</span></div>`).join('');}
const clamp01=(n:number)=>Math.min(1,Math.max(0,n));
const signed=(n:number,d=1)=>`${n>=0?'+':'−'}${Math.abs(n).toFixed(d)}`;
export type MetricScene='fuel'|'exercise'|'recovery';
export function metricScene(s:DayState,focus:string):MetricScene{return s.exercisePower>0?'exercise':focus==='recovery'?'recovery':'fuel';}
const placements:Record<MetricScene,[string[],string[]]>={
 fuel:[['glucose','insulin','liver','muscle'],['fat','aerobic','recovery']],
 exercise:[['muscle','fat','aerobic'],['glucose','insulin','liver','recovery']],
 recovery:[['recovery','muscle','liver'],['glucose','insulin','fat','aerobic']]
};
export function normalMetrics(s:DayState,focus:string,restingHR=60):Metric[]{
 const scene=metricScene(s,focus),meal=['digestion','insulin','stores'].includes(focus),exercise=scene==='exercise',recovery=scene==='recovery';
 const e=(main:boolean,secondary=false):Metric['emphasis']=>main?'primary':secondary?'secondary':'quiet';
 // Relative circulatory/oxidative support derived from modeled heart rate; deliberately not SpO₂ or VO₂.
 const aerobic=clamp01((s.hr-restingHR)/(185-restingHR));
 const rows:Record<string,Metric>={
 glucose:{id:'glucose',label:'Blood glucose',value:s.glucose>.35?'Elevated':'Steady',fraction:s.glucose,note:'Relative response',color:'#e6b66f',emphasis:e(meal)},
 insulin:{id:'insulin',label:'Insulin signal',value:s.insulin>.4?'Raised':s.insulin>.2?'Active':'Low',fraction:s.insulin,note:'Coordinates nutrient uptake',color:'#b5a1df',emphasis:e(meal)},
 liver:{id:'liver',label:'Liver glycogen',value:`${Math.round(s.liver)} g`,fraction:s.liver/s.liverCapacity,note:'Supports circulating glucose',color:'#b0ca95',emphasis:e(false,meal||recovery)},
 muscle:{id:'muscle',label:'Muscle glycogen',value:`${Math.round(s.muscle)} g`,fraction:s.muscle/s.muscleCapacity,note:'Stored locally in muscle',color:'#90bd98',emphasis:e(exercise,meal||recovery)},
 fat:{id:'fat',label:'Fat use',value:s.fatMobilization>.7?'Higher':s.fatMobilization>.5?'Moderate':'Lower',fraction:s.fatMobilization,note:'Relative mobilization',color:'#cdbd8e',emphasis:e(exercise)},
 aerobic:{id:'aerobic',label:'Aerobic support',value:aerobic<.06?'At rest':`${Math.round(aerobic*100)} / 100`,fraction:aerobic,note:'Relative circulation & oxidative support · not blood oxygen',color:'#82c1c6',emphasis:e(false,exercise)},
 recovery:{id:'recovery',label:'Recovery state',value:s.recovery>.93?'High':`${Math.round(s.recovery*100)} / 100`,fraction:s.recovery,note:'Illustrative recovery index',color:'#86bfbb',emphasis:e(recovery)}
 };
 const [right,left]=placements[scene];
 return [...right.map(id=>({...rows[id],side:'right' as const})),...left.map(id=>({...rows[id],side:'left' as const}))];
}
export function sprintMetrics(s:SprintState):Metric[]{
 const work=s.phase==='sprint',walk=s.phase==='walk',late=s.rep>1&&s.powerCapacity<.85;
 const flux=s.pcrFlux+s.glycolyticFlux+s.aerobicFlux,glycolytic=flux>0?s.glycolyticFlux/flux:0;
 return [
 {id:'power',label:work?'Sprint power':'Available sprint power',value:`${Math.round(s.powerCapacity*100)}%`,fraction:s.powerCapacity,note:'Relative to fresh peak capacity',color:'#edbb86',emphasis:work?'primary':'quiet',hollow:!work,side:'right'},
 {id:'pcr',label:'Phosphocreatine · PCr',value:`${Math.round(s.pcr*100)}%`,fraction:s.pcr,note:work?'Rapid buffer being used':walk?'Partly restoring with oxygen':'Relative to resting availability',color:'#a8bced',emphasis:'primary',side:'right'},
 {id:'glycolytic',label:'Glycolytic contribution',value:`${Math.round(glycolytic*100)}%`,fraction:glycolytic,note:work?'Share of ATP regeneration right now':'Small while aerobic metabolism leads recovery',color:'#dcb075',emphasis:work?'secondary':'quiet',side:'right'},
 {id:'fatigue',label:'Muscle fatigue',value:`${Math.round(s.fatigue*100)} / 100`,fraction:s.fatigue,note:'Fast stress + slower fatigue',color:'#cf9490',emphasis:late&&walk?'primary':late?'secondary':'quiet',second:Math.min(s.fatigue,.8*s.slowFatigue),side:'right'},
 {id:'atp',label:'ATP availability ↻',value:`${Math.round(s.atp*100)}%`,fraction:s.atp,note:'Maintained by continuous regeneration',color:'#d9d6aa',emphasis:'quiet',side:'right'},
 {id:'glycogen',label:'Working-muscle glycogen',value:`${Math.round(s.glycogen*100)}%`,fraction:s.glycogen,note:'Relative to the modeled active-pool capacity',color:'#9ebf8b',emphasis:'quiet',side:'left'},
 {id:'oxygen',label:'Oxygen support',value:`${Math.round(s.oxygen*100)} / 100`,fraction:s.oxygen,note:'Relative delivery / oxidative support',color:'#82c1c6',emphasis:walk&&!late?'primary':late&&walk?'secondary':'quiet',side:'left'}
 ];
}
export type CompositionKey='mass'|'lean'|'fatmass'|'bodyfat';
export function longMetrics(a:AdaptationState,person:Scenario['person'],leanCeiling:number,highlight:CompositionKey):Metric[]{
 const baseFat=person.weight_kg*person.body_fat_fraction,pct=a.fat/a.weight*100,basePct=person.body_fat_fraction*100;
 const e=(id:CompositionKey):Metric['emphasis']=>id===highlight?'primary':'secondary';
 return [
 {id:'mass',label:'Body mass',value:`~${a.weight.toFixed(1)} kg`,fraction:a.weight/(person.weight_kg*1.25),note:'Current total body mass',change:`${signed(a.weight-person.weight_kg)} kg vs baseline`,color:'#c4cfa2',emphasis:e('mass'),side:'right'},
 {id:'lean',label:'Lean mass',value:`~${a.lean.toFixed(1)} kg`,fraction:a.lean/(person.weight_kg*(1-person.body_fat_fraction)+leanCeiling),note:'Includes muscle, organs, bone & water',change:`${signed(a.leanGain)} kg vs baseline`,color:'#a7c295',emphasis:e('lean'),side:'right'},
 {id:'fatmass',label:'Fat mass',value:`~${a.fat.toFixed(1)} kg`,fraction:a.fat/(baseFat*1.5),note:`${pct.toFixed(1)}% of body mass`,change:`${signed(a.fat-baseFat)} kg vs baseline`,color:'#c9b88d',emphasis:e('fatmass'),side:'right'},
 {id:'bodyfat',label:'Body fat',value:`${pct.toFixed(1)}%`,fraction:pct/45,note:'Fat mass ÷ body mass',change:`${signed(pct-basePct)} points vs baseline`,color:'#d7a98a',emphasis:e('bodyfat'),side:'right'},
 {id:'conditioning',label:'Additional conditioning',value:`${Math.round(a.fitness*100)} / 100`,fraction:a.fitness,note:'Relative change from a fit baseline',color:'#87c1bf',emphasis:'quiet',side:'left'}
 ];
}
const captions:Record<string,string>={rest:'Resting',work:'Reading · mental work',run:'Running',resistance:'Strength training',recovery:'Recovering',sleep:'Sleeping',warmup:'Warming up',sprint:'Sprinting',walk:'Recovery walk',cooldown:'Cooling down'};
// Visible caption under the activity figure. Meals name the actual meal on the plate.
export function activityCaption(activity:string,meal?:{name:string;empty:boolean}):string{
 if(activity!=='meal')return captions[activity]||'Recovering';
 if(!meal)return 'Eating';
 return meal.empty?`${meal.name} skipped`:`Eating ${meal.name==='Snack'?'a snack':meal.name.toLowerCase()}`;
}
