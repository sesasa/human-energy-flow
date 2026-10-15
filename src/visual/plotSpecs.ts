// Adapters from existing model outputs to immutable PlotSpecs. Read-only: every point and readout
// comes from the model's own states/sample functions; nothing here changes the physiology.
import { sampleDay, type DaySimulation, type DayState } from '../model/day';
import type { Scenario } from '../model/config';
import { sampleSprint, type IntenseDay, type SprintState } from '../model/sprint';
import { sampleLongTerm, type AdaptationState } from '../model/longTerm';
import type { DietApplication } from '../model/diet';
import { effectiveLabRange, labMarkers, nutritionMarkers, selectedLabMarkers, type NutritionMarker } from '../model/labs';
import { markerNutrients, type LabProjection } from '../model/labProjection';
import { interpolate, type PlotPoint, type PlotSpec } from './plotCard';

export type { PlotSpec, PlotPoint } from './plotCard';
const signed=(n:number,d=1)=>`${n>=0?'+':'−'}${Math.abs(n).toFixed(d)}`;
const labNumber=(n:number)=>Math.abs(n)>=10?String(Math.round(n)):String(Math.round(n*10)/10);
// One-entry cache: a frame asks several series for the same x.
function memo<T>(f:(x:number)=>T){let lastX=NaN,last:T;return (x:number)=>{if(x!==lastX){lastX=x;last=f(x);}return last;};}

/**
 * Min/max decimation per x bucket. Keeps each bucket's extreme samples (so PCr sawteeth survive),
 * the samples adjoining a gap, and the series ends. Null y values are never dropped or bridged:
 * consecutive nulls collapse to one break point.
 */
export function minMaxDecimate(points:PlotPoint[],x0:number,x1:number,buckets:number):PlotPoint[]{
  if(points.length<=buckets*2)return points.slice();
  const out:PlotPoint[]=[],width=(x1-x0)/buckets;
  let seg:PlotPoint[]=[],segBucket=NaN,afterGap=true;
  const flush=(beforeGap:boolean)=>{
    if(!seg.length)return;
    let mn=seg[0],mx=seg[0];for(const p of seg){if(p.y!<mn.y!)mn=p;if(p.y!>mx.y!)mx=p;}
    const keep=new Set([mn,mx]);if(afterGap)keep.add(seg[0]);if(beforeGap)keep.add(seg.at(-1)!);
    out.push(...seg.filter(p=>keep.has(p)));seg=[];afterGap=false;
  };
  for(const p of points){
    if(p.y===null){flush(true);if(out.length&&out.at(-1)!.y!==null)out.push({x:p.x,y:null,low:null,high:null});afterGap=true;continue;}
    const b=Math.min(buckets-1,Math.floor((p.x-x0)/width));
    if(b!==segBucket){flush(false);segBucket=b;}
    seg.push(p);
  }
  flush(true);
  return out;
}

// ─── Day ──────────────────────────────────────────────────────────────────────
const minuteOfHour=(hour:number)=>((hour-6)%24+24)%24*60;
const clockLabel=(minute:number)=>{const h=(6+minute/60)%24,hh=Math.floor(h),mm=Math.floor((h-hh)*60+1e-6);return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;};
const DAY_TICKS=[{x:0,label:'06'},{x:360,label:'12'},{x:720,label:'18'},{x:1080,label:'00'},{x:1440,label:'06'}];
const EXERCISE_BAND='rgba(137,197,206,.13)',MEAL_BAND='rgba(230,182,111,.12)',SPRINT_BAND='rgba(237,187,134,.11)',CYCLE_TICK='#c79394';
/** Contiguous minutes where the model flags contraction (workout) — a binary band, not an uptake curve. */
export function exerciseBands(states:DayState[]){
  const bands:{start:number;end:number}[]=[];
  for(let i=1;i<states.length;i++)if(states[i].contractionUptake>0){const m=states[i-1].minute,last=bands.at(-1);if(last&&last.end===m)last.end=m+1;else bands.push({start:m,end:m+1});}
  return bands;
}
const niceUp=(n:number,step:number)=>Math.ceil(n/step)*step,niceDown=(n:number,step:number)=>Math.floor(n/step)*step;
function bpmDomain(values:number[]):[number,number]{return [niceDown(Math.min(...values)-5,10),niceUp(Math.max(...values)+5,10)];}

export function dayPlotSpecs(day:DaySimulation,scenario:Scenario):PlotSpec[]{
  const st=day.states,at=memo(x=>sampleDay(day,x)),last=st.at(-1)!.minute;
  const xDomain:[number,number]=[0,last];
  const series=(f:(s:DayState)=>number)=>minMaxDecimate(st.map(s=>({x:s.minute,y:f(s)})),0,last,360);
  const exercise=exerciseBands(st).map(b=>({...b,color:EXERCISE_BAND}));
  // Unlabelled: meal names can be long and overlap; the note explains the colour.
  const meals=scenario.meals.map(m=>({start:minuteOfHour(m.hour),end:minuteOfHour(m.hour)+15,color:MEAL_BAND}));
  const base={xDomain,xTicks:DAY_TICKS,xLabel:'Clock time',formatX:(x:number)=>clockLabel(x),step:5,pageStep:60};
  const exNote=exercise.length?' Teal shading: exercise.':'';
  const liverCap=st[0].liverCapacity,muscleCap=st[0].muscleCapacity,gTop=niceUp(Math.max(liverCap,muscleCap),50);
  const hr=st.map(s=>s.hr);
  const pct=(v:number)=>`${Math.round(v)}%`;
  return [
    {...base,id:'meal',title:'Glucose & insulin',unit:'Relative index 0–1 · not lab units',domain:[0,1],systems:['digestion','metabolism'],
      bands:[...meals,...exercise],yTicks:[0,.5,1],formatY:v=>v.toFixed(1),
      note:`Model signals for teaching, not blood-test values. Amber marks: meals.${exNote}`,
      series:[
        {id:'glucose',label:'Glucose',color:'#e6b66f',points:series(s=>s.glucose),sample:x=>at(x).glucose,format:v=>v.toFixed(2)},
        {id:'insulin',label:'Insulin',color:'#b5a1df',points:series(s=>s.insulin),sample:x=>at(x).insulin,format:v=>v.toFixed(2),dash:'5 3'}
      ]},
    {...base,id:'glycogen',title:'Glycogen stores',unit:'grams',domain:[0,gTop],systems:['metabolism','muscular'],bands:exercise,
      limits:[{y:liverCap,color:'#b0ca95'},{y:muscleCap,color:'#90bd98'}],
      note:`Dotted lines: modeled capacity (liver ${Math.round(liverCap)} g, muscle ${Math.round(muscleCap)} g).${exNote}`,
      series:[
        {id:'liver',label:'Liver',color:'#b0ca95',points:series(s=>s.liver),sample:x=>at(x).liver,readout:x=>({value:`${Math.round(at(x).liver)} g`,detail:`of ${Math.round(liverCap)} g`})},
        {id:'muscle',label:'Muscle',color:'#90bd98',points:series(s=>s.muscle),sample:x=>at(x).muscle,dash:'5 3',readout:x=>({value:`${Math.round(at(x).muscle)} g`,detail:`of ${Math.round(muscleCap)} g`})}
      ]},
    {...base,id:'heart',title:'Heart rate',unit:'bpm',domain:bpmDomain(hr),systems:['cardiovascular'],bands:exercise.map((b,i)=>i===0?{...b,label:'Exercise'}:b),
      note:'Modeled heart rate.',
      series:[{id:'hr',label:'Heart rate',color:'#e08f8f',points:series(s=>s.hr),sample:x=>at(x).hr,format:v=>`${Math.round(v)} bpm`}]},
    {...base,id:'fuel',title:'Fuel mix',unit:'% of modeled energy demand',domain:[0,100],systems:['metabolism','muscular'],bands:exercise,yTicks:[0,50,100],
      note:`Modeled carbohydrate/fat share of energy demand, not measured fuel oxidation.${exNote}`,
      series:[
        {id:'carbShare',label:'Carbohydrate',color:'#dcb075',points:series(s=>s.carbShare*100),sample:x=>at(x).carbShare*100,format:pct},
        {id:'fatShare',label:'Fat',color:'#cdbd8e',points:series(s=>s.fatShare*100),sample:x=>at(x).fatShare*100,format:pct,dash:'5 3'}
      ]},
    {...base,id:'recovery',title:'Recovery',unit:'Illustrative index 0–100',domain:[0,100],systems:['muscular'],bands:exercise,yTicks:[0,50,100],
      note:`Teaching index, not a measurement.${exNote}`,
      series:[{id:'recovery',label:'Recovery',color:'#86bfbb',points:series(s=>s.recovery*100),sample:x=>at(x).recovery*100,format:v=>`${Math.round(v)} / 100`}]}
  ];
}

// ─── Sprint session ───────────────────────────────────────────────────────────
// x = minutes from the first sprint (negative = end of warm-up). Maps back to master daily minutes.
export function sprintPlotSpecs(intense:IntenseDay):PlotSpec[]{
  const sess=intense.session,c=sess.config,total=sess.durationSeconds,cycle=c.sprint_seconds+c.walk_seconds;
  const lead=c.warmup_minutes,tail=c.cooldown_minutes,x0=-lead,x1=total/60+tail;
  const xDomain:[number,number]=[x0,x1],start=sess.startMinute;
  const states=sess.states.filter(s=>s.seconds>=x0*60-1e-6&&s.seconds<=x1*60+1e-6);
  const at=memo(x=>sampleSprint(sess,x*60));
  const series=(f:(s:SprintState)=>number|null)=>minMaxDecimate(states.map(s=>({x:s.seconds/60,y:f(s)})),x0,x1,600);
  const share=(s:SprintState,flux:number)=>s.phase==='sprint'&&s.turnover>0?flux/s.turnover*100:null;
  const sprints=Array.from({length:c.repetitions},(_,i)=>({start:i*cycle/60,end:(i*cycle+c.sprint_seconds)/60,color:SPRINT_BAND}));
  const span=total/60,step=[1,2,3,5,10,15,20,30].find(s=>s>=span/4)??30;
  const xTicks=[{x:x0,label:'Warm-up'},...Array.from({length:Math.floor(span/step+1e-9)+1},(_,i)=>({x:i*step,label:i===0?'0':String(i*step)})),{x:x1,label:'Cool-down'}];
  const phaseText:Record<string,string>={before:'Before',warmup:'Warm-up',sprint:'Sprint',walk:'Walk',cooldown:'Cooldown',after:'After'};
  const formatX=(x:number)=>{const s=at(x),sec=x*60,sign=sec<0?'−':'',a=Math.abs(sec);return `${sign}${Math.floor(a/60)}:${String(Math.floor(a%60)).padStart(2,'0')} · ${phaseText[s.phase]}${s.phase==='sprint'||s.phase==='walk'?` ${s.rep}/${c.repetitions}`:''}`;};
  const base={xDomain,xTicks,bands:sprints,xLabel:'Minutes from first sprint · shaded: sprints',formatX,step:c.sprint_seconds/120,pageStep:cycle/60,
    toTimeline:(x:number)=>start+x,fromTimeline:(t:number)=>t-start};
  const pct=(v:number)=>`${Math.round(v)}%`;
  const hr=states.map(s=>s.hr);
  return [
    {...base,id:'rapid-energy',title:'Rapid energy',unit:'% of each reference',domain:[0,100],yTicks:[0,50,100],systems:['muscular','metabolism'],
      note:'ATP and PCr vs resting levels; glycogen vs the working-muscle pool.',
      series:[
        {id:'atp',label:'ATP',color:'#d9d6aa',points:series(s=>s.atp*100),sample:x=>at(x).atp*100,format:pct},
        {id:'pcr',label:'PCr',color:'#a8bced',points:series(s=>s.pcr*100),sample:x=>at(x).pcr*100,format:pct},
        {id:'glycogen',label:'Muscle glycogen',color:'#9ebf8b',points:series(s=>s.glycogen*100),sample:x=>at(x).glycogen*100,format:pct,dash:'5 3'}
      ]},
    {...base,id:'power-fatigue',title:'Power & fatigue',unit:'Separate indices 0–100',domain:[0,100],yTicks:[0,50,100],systems:['muscular'],
      note:'Separate indices: fatigue is not 100 − power. Between sprints, power shows capacity.',
      series:[
        {id:'power',label:'Available power',color:'#edbb86',points:series(s=>s.powerCapacity*100),sample:x=>at(x).powerCapacity*100,
          readout:x=>{const s=at(x);return {value:pct(s.powerCapacity*100),detail:s.phase==='sprint'?'Delivered at maximal effort':'Capacity, not current output'};}},
        {id:'fatigue',label:'Fatigue',color:'#cf9490',points:series(s=>s.fatigue*100),sample:x=>at(x).fatigue*100,dash:'2 3',format:v=>`${Math.round(v)} / 100`}
      ]},
    {...base,id:'heart',title:'Heart rate',unit:'bpm',domain:bpmDomain(hr),systems:['cardiovascular'],note:'Modeled heart rate.',
      series:[{id:'hr',label:'Heart rate',color:'#e08f8f',points:series(s=>s.hr),sample:x=>at(x).hr,format:v=>`${Math.round(v)} bpm`}]},
    {...base,id:'oxygen',title:'Oxygen support',unit:'Relative index 0–100',domain:[0,100],yTicks:[0,50,100],systems:['cardiovascular','muscular'],
      note:'Relative delivery and oxidative support, not blood oxygen saturation.',
      series:[{id:'oxygen',label:'Oxygen support',color:'#82c1c6',points:series(s=>s.oxygen*100),sample:x=>at(x).oxygen*100,format:v=>`${Math.round(v)} / 100`}]},
    {...base,id:'pathways',title:'ATP regeneration',unit:'% of relative flux',domain:[0,100],yTicks:[0,50,100],systems:['metabolism','muscular'],
      note:'Shares shown during sprints only. During walks PCr is rebuilt aerobically, so a share would mislead; lines break.',
      series:([['pcrSource','PCr','#a8bced','pcrFlux',undefined],['glycolytic','Glycolytic','#dcb075','glycolyticFlux','5 3'],['aerobicSource','Aerobic','#82c1c6','aerobicFlux','2 3']] as const).map(([id,label,color,key,dash])=>({
        id,label,color,dash,points:series(s=>share(s,s[key])),sample:(x:number)=>{const s=at(x);return share(s,s[key]);},
        readout:(x:number)=>{const v=share(at(x),at(x)[key]);return v===null?{value:'—',detail:'Sprints only'}:{value:pct(v)};}
      }))}
  ];
}

// ─── Long term ────────────────────────────────────────────────────────────────
const LONG_TICKS=[{x:0,label:'Start'},{x:365,label:'Year 1'},{x:730,label:'Year 2'},{x:1095,label:'Year 3'}];
function deltaDomain(values:number[]):[number,number]{
  const step=(n:number)=>n<=5?.5:n<=20?1:5,lo=Math.max(.5,-Math.min(0,...values)*1.15),hi=Math.max(.5,Math.max(0,...values)*1.15);
  return [-niceUp(lo,step(lo)),niceUp(hi,step(hi))];
}
// Name the test, not the nutrient: serum ferritin is not body iron.
const LAB_LABEL:Record<NutritionMarker,string>={ferritin:'Ferritin',b12:'Serum B12',folate:'Serum folate',vitd:'25-OH D'};
function niceTop(max:number){const unit=Math.max(1,Math.pow(10,Math.floor(Math.log10(Math.max(1,max)))-1));return Math.ceil(max*1.18/unit)*unit;}

export function longPlotSpecs(states:AdaptationState[],labs:Partial<Record<NutritionMarker,LabProjection>>,app:DietApplication):PlotSpec[]{
  const days=states.at(-1)!.day,s0=states[0],at=memo(x=>sampleLongTerm(states,x));
  // Frozen copies after the projection limit are not model results: they become a gap.
  const limitDay=states.find(s=>s.atLimit)?.day??Infinity;
  const valid=(x:number)=>Math.ceil(x)<limitDay;
  const bodyfat=(s:AdaptationState)=>s.fat/s.weight*100;
  const series=(f:(s:AdaptationState)=>number)=>minMaxDecimate(states.map(s=>({x:s.day,y:s.day<limitDay?f(s):null})),0,days,365);
  const xDomain:[number,number]=[0,days];
  const base={xDomain,xTicks:LONG_TICKS.filter(t=>t.x<=days),xLabel:'Days of the repeating routine',formatX:(x:number)=>`Day ${Math.min(days,Math.floor(x)+1)}, month ${(x/365*12).toFixed(1)}`,step:1,pageStep:30};
  const held=(x:number)=>valid(x)?{}:{detail:'Held at projection limit'};
  const kg=(key:'weight'|'lean'|'fat')=>({
    points:series(s=>s[key]-s0[key]),sample:(x:number)=>valid(x)?at(x)[key]-s0[key]:null,
    readout:(x:number)=>({value:`${at(x)[key].toFixed(1)} kg`,change:`${signed(at(x)[key]-s0[key])} kg`,...held(x)})
  });
  const live=states.filter(s=>s.day<limitDay);
  const deltas=live.flatMap(s=>[s.weight-s0.weight,s.lean-s0.lean,s.fat-s0.fat]),compDomain=deltaDomain(deltas);
  const fats=live.map(bodyfat),f0=bodyfat(s0),hrs=live.map(s=>s.restingHR);
  const limitNote=Number.isFinite(limitDay)?` Line ends where the projection leaves the supported range (day ${limitDay}).`:'';
  const specs:PlotSpec[]=[
    {...base,id:'composition',title:'Body composition',unit:'Change from start · kg',domain:compDomain,yTicks:[compDomain[0],0,compDomain[1]],systems:['metabolism','muscular'],formatY:v=>v===0?'0':signed(v),
      note:`Signed values: change from start. Mass change = lean + fat change. Illustration, not a forecast.${limitNote}`,
      series:[
        {id:'mass',label:'Body mass',color:'#c4cfa2',...kg('weight')},
        {id:'lean',label:'Lean mass',color:'#9ec9a2',dash:'5 3',...kg('lean')},
        {id:'fatmass',label:'Fat mass',color:'#d1bc8d',dash:'2 3',...kg('fat')}
      ]},
    {...base,id:'bodyfat',title:'Body fat',unit:'% of body mass',domain:[Math.floor(Math.min(f0-1,...fats)-.5),Math.ceil(Math.max(f0+1,...fats)+.5)],systems:['metabolism'],
      limits:[{y:f0}],note:`Fat mass ÷ body mass. Dotted line: start; signed value: change in points.${limitNote}`,
      series:[{id:'bodyfat',label:'Body fat',color:'#d7a98a',points:series(bodyfat),sample:x=>valid(x)?bodyfat(at(x)):null,
        readout:x=>({value:`${bodyfat(at(x)).toFixed(1)}%`,change:`${signed(bodyfat(at(x))-f0)} points`,...held(x)})}]},
    {...base,id:'conditioning',title:'Resting heart rate',unit:'bpm',domain:[Math.floor(Math.min(...hrs)-3),Math.ceil(Math.max(...hrs)+3)],systems:['cardiovascular'],
      note:`Modeled resting heart rate as conditioning builds; illustrative. Signed value: change from start.${limitNote}`,
      series:[{id:'hr',label:'Resting heart rate',color:'#e08f8f',points:series(s=>s.restingHR),sample:x=>valid(x)?at(x).restingHR:null,
        readout:x=>({value:`${Math.round(at(x).restingHR)} bpm`,change:`${signed(at(x).restingHR-s0.restingHR,0)} bpm`,...held(x)})}]}
  ];
  const selected=new Set(selectedLabMarkers(app.micronutrients));
  for(const marker of nutritionMarkers){
    const p=labs[marker],o=app.micronutrients?.observations[marker];
    if(!p||!selected.has(marker))continue;
    const range=o?effectiveLabRange(marker,o,p.profile??app.profile):undefined;
    const points:PlotPoint[]=p.points.filter(q=>q.day<=days).map(q=>({x:q.day,y:q.value,low:q.low,high:q.high}));
    const finite=points.flatMap(q=>[q.y,q.low,q.high]).filter((v):v is number=>v!==null&&v!==undefined&&Number.isFinite(v));
    const peak=Math.max(1,p.measured,range?.low??0,...finite),top=niceTop(range?.high!==undefined&&range.high<=peak*1.5?Math.max(peak,range.high):peak);
    const cycles=marker==='ferritin'?(p.cycleEvents??[]).filter(e=>e.start<days).map(e=>({start:e.start,end:Math.min(days,e.end),color:CYCLE_TICK,tick:true})):[];
    const sens=marker==='ferritin'?'uptake/loss':'food-response';
    const refText=range?(range.supplied?'Green: your lab range.':marker==='vitd'?'Green: NIH guide, not a lab range.':'Green: default reference.'):'';
    const value=(x:number)=>interpolate(points,x);
    const lows=points.map(q=>({x:q.x,y:q.low??null})),highs=points.map(q=>({x:q.x,y:q.high??null}));
    specs.push({...base,id:`lab-${marker}`,title:labMarkers[marker].name,unit:p.unit,domain:[0,top],yTicks:[0,top/2,top],formatY:labNumber,systems:['micronutrients'],
      reference:range?{low:range.low,high:range.high}:undefined,referenceLabel:range?`${range.low!==undefined?labNumber(range.low):'…'}–${range.high!==undefined?labNumber(range.high):'…'} ${p.unit} · ${range.label}`:undefined,observed:{x:0,y:p.measured},bands:cycles,
      note:[`Dot: entered result. Dashed: educational estimate. Shading: ${sens} sensitivity, not precision.`,refText,cycles.length?'Red ticks: modeled bleeding days.':'',
        p.limit?'Gaps: not estimated (outside model scope).':'',p.sensitivityLimit?`Shading ends at day ${p.sensitivityLimit.day}.`:''].filter(Boolean).join(' '),
      series:[{id:marker,label:LAB_LABEL[marker],color:markerNutrients[marker].color,dash:'6 4',points,sample:value,
        readout:x=>{
          const v=value(x);if(v===null)return {value:'Not estimated',detail:'Outside model scope'};
          if(x<.5)return {value:`${labNumber(p.measured)} ${p.unit}`,detail:'Entered result'};
          const lo=interpolate(lows,x),hi=interpolate(highs,x);
          return {value:`${labNumber(v)} ${p.unit}`,detail:lo!==null&&hi!==null?`Estimate · sensitivity ${labNumber(lo)}–${labNumber(hi)}`:'Estimate',change:`${signed(v-p.measured,Math.abs(v-p.measured)>=10?0:1)} vs entered`};
        }}]});
  }
  return specs;
}
