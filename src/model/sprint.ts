import parameters from '../../scenarios/sprint.json';
import { clamp, cloneScenario, type Scenario } from './config';
import { restingEnergy, carbFactor } from './energy';
import { leanSizeScale, muscleGlycogenCapacity } from './composition';
import { simulateDay, sampleDay, type DaySimulation, type DayOptions, type DayState, type ExerciseProfile, type ExerciseSample } from './day';
export type SprintConfig = typeof parameters;
export const defaultSprintConfig: SprintConfig = parameters;
export type SprintPhase = 'before'|'warmup'|'sprint'|'walk'|'cooldown'|'after';
export interface SprintState {
  seconds:number;phase:SprintPhase;rep:number;elapsed:number;remaining:number;
  atp:number;pcr:number;glycogen:number;glycolyticReserve:number;fastFatigue:number;slowFatigue:number;fatigue:number;
  powerCapacity:number;deliveredPower:number;oxygen:number;hr:number;
  pcrFlux:number;glycolyticFlux:number;aerobicFlux:number;turnover:number;
  netKcalPerSecond:number;carbShare:number;energyKcal:number;muscleGlycogenUsedG:number;
}
export interface SprintSimulation {
  config:SprintConfig;states:SprintState[];startMinute:number;durationSeconds:number;firstSecond:number;lastSecond:number;
  profile:ExerciseProfile;activePoolG:number;
}
export function phaseAt(seconds:number,c:SprintConfig):{phase:SprintPhase;rep:number;elapsed:number;remaining:number} {
  seconds=Math.round(seconds*1e6)/1e6;
  const cycle=c.sprint_seconds+c.walk_seconds,total=cycle*c.repetitions;
  if(seconds < -c.warmup_minutes*60)return {phase:'before',rep:0,elapsed:0,remaining:0};
  if(seconds<0)return {phase:'warmup',rep:0,elapsed:seconds+c.warmup_minutes*60,remaining:-seconds};
  if(seconds>=total)return {phase:seconds<total+c.cooldown_minutes*60?'cooldown':'after',rep:c.repetitions,elapsed:seconds-total,remaining:Math.max(0,total+c.cooldown_minutes*60-seconds)};
  const rep=Math.floor(seconds/cycle)+1,t=seconds%cycle,work=t<c.sprint_seconds;
  return {phase:work?'sprint':'walk',rep,elapsed:work?t:t-c.sprint_seconds,remaining:work?c.sprint_seconds-t:cycle-t};
}
export function simulateSprints(s:Scenario,c:SprintConfig={...defaultSprintConfig}, initialGlycogen=1):SprintSimulation {
  if(c.repetitions<1||c.repetitions>30||!Number.isInteger(c.repetitions)||c.sprint_seconds<3||c.sprint_seconds>10||c.walk_seconds<10||c.walk_seconds>180||c.integration_step_seconds<=0||c.integration_step_seconds>.25)throw new Error('Unsupported sprint protocol.');
  const dt=c.integration_step_seconds,first=-c.warmup_minutes*60,total=c.repetitions*(c.sprint_seconds+c.walk_seconds),last=total+c.cooldown_minutes*60;
  const activePoolG=muscleGlycogenCapacity(s)*c.active_glycogen_fraction;
  const restingPerSecond=restingEnergy(s)/86400;
  let atp=1,pcr=1,glycogen=clamp(initialGlycogen),fast=0,slow=0,oxygen=.1,hr=s.model.resting_hr_bpm,workSeconds=0,energy=0,glycogenUsed=0;
  const states:SprintState[]=[],minuteKcal=new Map<number,number>(),minuteCarb=new Map<number,number>();
  const startMinute=(c.start_hour-6)*60;
  const netMet=(met:number)=>Math.max(0,met*s.person.weight_kg/3600-restingPerSecond);
  function snapshot(seconds:number):SprintState {
    const phase=phaseAt(seconds,c),sprinting=phase.phase==='sprint';
    // Relative ATP-resynthesis capacities. These are educational rates, not mmol/s.
    const pcrCapacity=.51*Math.sqrt(pcr)*(1-.18*slow);
    const glycolCapacity=.44*Math.exp(-workSeconds/c.glycolytic_decline_seconds)*(1-.45*fast)*(.8+.2*glycogen)*(.65+.35*clamp(glycogen/.45));
    const oxidativeCapacity=.015+.32*Math.max(0,oxygen-.2);
    const capacity=clamp((pcrCapacity+glycolCapacity+oxidativeCapacity)*(1-.18*fast-.20*slow),.15,1);
    const pcrFlux=sprinting?pcrCapacity:0;
    const glycolyticFlux=sprinting?glycolCapacity:phase.phase==='warmup'?.018:.006;
    const aerobicFlux=sprinting?oxidativeCapacity:phase.phase==='warmup'?.18:phase.phase==='walk'?.13+.07*oxygen:.08;
    const delivered=sprinting?capacity:phase.phase==='warmup'?.18:phase.phase==='walk'?.09:phase.phase==='cooldown'?.065:0;
    const netKcalPerSecond=sprinting?Math.max(0,c.peak_power_w*leanSizeScale(s)*delivered/c.effective_efficiency/4184-restingPerSecond):phase.phase==='warmup'?netMet(6):phase.phase==='walk'?netMet(3.3):phase.phase==='cooldown'?netMet(3):0;
    const carbShare=sprinting?.9:phase.phase==='warmup'?.6:.4;
    return {seconds,...phase,atp,pcr,glycogen,glycolyticReserve:Math.exp(-workSeconds/c.glycolytic_decline_seconds),fastFatigue:fast,slowFatigue:slow,fatigue:clamp(.62*fast+.8*slow),powerCapacity:capacity,deliveredPower:delivered,oxygen,hr,pcrFlux,glycolyticFlux,aerobicFlux,turnover:pcrFlux+glycolyticFlux+aerobicFlux,netKcalPerSecond,carbShare,energyKcal:energy,muscleGlycogenUsedG:glycogenUsed};
  }
  for(let step=0;step<=Math.round((last-first)/dt);step++){
    const seconds=first+step*dt,st=snapshot(seconds);states.push(st);
    if(seconds>=last)break;
    const sprint=st.phase==='sprint',walk=st.phase==='walk',active=sprint||walk;
    if(sprint){
      pcr=clamp(pcr-st.pcrFlux*dt/5.1,.035,1);
      fast=clamp(fast+.037*st.powerCapacity*(1-fast)*dt);
      slow=clamp(slow+.006*st.powerCapacity*(1-slow)*dt);
      workSeconds+=dt;
    }else{
      const tau=c.pcr_recovery_tau_seconds*(1+.75*fast+.45*slow)*(walk?c.walking_recovery_penalty:1)/(.6+.65*oxygen);
      pcr+= (1-pcr)*(1-Math.exp(-dt/tau));
      fast*=Math.exp(-dt/(walk?105:80));slow*=Math.exp(-dt/(active?2100:5400));
      // Reduced glycolytic capacity persists across short walks, then recovers gradually.
      if(st.phase==='cooldown')workSeconds*=Math.exp(-dt/600);
    }
    const oxygenTarget=sprint?.98:walk?.42+.36*(1-Math.exp(-st.rep/5)):st.phase==='warmup'?.32:.13;
    oxygen+=(oxygenTarget-oxygen)*(1-Math.exp(-dt/(sprint?28:walk?24:45)));
    const hrTarget=s.model.resting_hr_bpm+(c.hr_ceiling_bpm-s.model.resting_hr_bpm)*oxygen;
    hr+=(hrTarget-hr)*(1-Math.exp(-dt/9));
    // ATP is defended by resynthesis; a modest drift is possible, never total exhaustion.
    const atpTarget=1-(sprint?.045:.008)-.1*slow-.035*fast;
    atp+=(atpTarget-atp)*(1-Math.exp(-dt/1.5));
    const kcal=st.netKcalPerSecond*dt,used=kcal*st.carbShare*.75/carbFactor(s.nutrition);
    energy+=kcal;glycogenUsed+=used;glycogen=clamp(initialGlycogen-glycogenUsed/activePoolG);
    const minute=Math.floor(startMinute+seconds/60+1e-7);
    minuteKcal.set(minute,(minuteKcal.get(minute)||0)+kcal);
    minuteCarb.set(minute,(minuteCarb.get(minute)||0)+kcal*st.carbShare);
  }
  const simulation: SprintSimulation={config:c,states,startMinute,durationSeconds:total,firstSecond:first,lastSecond:last,activePoolG,profile:null!};
  simulation.profile={totalKcal:energy,at(minute:number):ExerciseSample{
    const t=(minute-startMinute)*60,sample=sampleSprint(simulation,t);
    const net=minuteKcal.get(Math.floor(minute))||0;
    return {netKcalPerMinute:net,carbShare:net>0?(minuteCarb.get(Math.floor(minute))||0)/net:0,hrTarget:sample.hr,activity:sample.phase==='before'||sample.phase==='after'?null:sample.phase};
  }};
  return simulation;
}
export function sampleSprint(sim:SprintSimulation,seconds:number):SprintState {
  const c=sim.config,clamped=clamp(seconds,sim.firstSecond,sim.lastSecond),index=(clamped-sim.firstSecond)/c.integration_step_seconds,lo=Math.floor(index),hi=Math.min(sim.states.length-1,lo+1),f=index-lo;
  const a=sim.states[Math.min(lo,sim.states.length-1)],b=sim.states[hi],out={...a};
  for(const key of Object.keys(a) as (keyof SprintState)[])if(typeof a[key]==='number')(out as unknown as Record<string,unknown>)[key]=(a[key] as number)+((b[key] as number)-(a[key] as number))*f;
  Object.assign(out,phaseAt(seconds,c));out.seconds=seconds;
  // Stocks interpolate continuously; demand and ATP pathways switch with the activity.
  if(a.phase!==b.phase){
    const active=a.phase===out.phase?a:b;
    for(const key of ['pcrFlux','glycolyticFlux','aerobicFlux','turnover','netKcalPerSecond','deliveredPower'] as const)out[key]=active[key];
  }
  if(seconds<sim.firstSecond){
    out.deliveredPower=0;out.netKcalPerSecond=0;out.pcrFlux=0;
    out.glycolyticFlux=.004;out.aerobicFlux=.06;out.turnover=.064;
  }
  if(seconds>sim.lastSecond){
    const t=seconds-sim.lastSecond;out.pcr=1-(1-out.pcr)*Math.exp(-t/35);out.atp=1-(1-out.atp)*Math.exp(-t/60);
    out.fastFatigue*=Math.exp(-t/120);out.slowFatigue*=Math.exp(-t/5400);out.fatigue=clamp(.62*out.fastFatigue+.8*out.slowFatigue);
    out.glycolyticReserve=Math.exp(Math.log(out.glycolyticReserve)*Math.exp(-t/600));
    out.deliveredPower=0;out.oxygen=.1+(out.oxygen-.1)*Math.exp(-t/180);
    const restingHR=sim.states[0].hr;out.hr=restingHR+(out.hr-restingHR)*Math.exp(-t/180);
    const pcrCapacity=.51*Math.sqrt(out.pcr)*(1-.18*out.slowFatigue);
    const glycolCapacity=.44*out.glycolyticReserve*(1-.45*out.fastFatigue)*(.8+.2*out.glycogen)*(.65+.35*clamp(out.glycogen/.45));
    out.powerCapacity=clamp((pcrCapacity+glycolCapacity+.015+.32*Math.max(0,out.oxygen-.2))*(1-.18*out.fastFatigue-.20*out.slowFatigue),.15,1);
    out.pcrFlux=0;out.glycolyticFlux=.004;out.aerobicFlux=.06;out.turnover=.064;out.netKcalPerSecond=0;
  }
  return out;
}
export interface IntenseDay { day:DaySimulation;session:SprintSimulation;scenario:Scenario;endMuscleG:number }
export function simulateIntenseDay(s:Scenario,c:SprintConfig={...defaultSprintConfig}, options?:DayOptions):IntenseDay {
  let initialGlycogen=1;
  if(options){const resting=cloneScenario(s);resting.activity.exercise_minutes=0;const before=simulateDay(resting,undefined,options),state=sampleDay(before,(c.start_hour-c.warmup_minutes/60-6)*60);initialGlycogen=state.muscle/state.muscleCapacity;}
  const session=simulateSprints(s,c,initialGlycogen),copy=cloneScenario(s);
  copy.activity.exercise_start_hour=c.start_hour-c.warmup_minutes/60;
  copy.activity.exercise_minutes=c.warmup_minutes+session.durationSeconds/60+c.cooldown_minutes;
  copy.activity.run_distance_km=0;copy.activity.resistance_training=false;
  const day=simulateDay(copy,session.profile,options);
  return {day,session,scenario:copy,endMuscleG:sampleDay(day,session.startMinute+session.lastSecond/60).muscle};
}
export function sampleIntenseDay(model:IntenseDay,minute:number):{body:DayState;sprint:SprintState} {
  const body=sampleDay(model.day,minute),sprint=sampleSprint(model.session,(minute-model.session.startMinute)*60);
  if(sprint.phase==='after'){
    // Same muscle store as the day model; replenishment cannot be invented by a timer.
    const restored=Math.max(0,body.muscle-model.endMuscleG);
    sprint.glycogen=clamp(sprint.glycogen+restored/model.session.activePoolG);
  }
  if(['warmup','sprint','walk','cooldown'].includes(sprint.phase)){
    body.hr=sprint.hr;body.activity=sprint.phase as DayState['activity'];body.exercisePower=sprint.netKcalPerSecond*60;
    body.fatigue=sprint.fatigue;body.recovery=1-sprint.fatigue;
    body.glucose=Math.max(body.glucose,.24+(sprint.phase==='sprint'?.06:0));body.insulin*=.75;
  }else if(sprint.phase==='after'){body.fatigue=Math.max(body.fatigue,sprint.fatigue);body.recovery=1-body.fatigue;}
  return {body,sprint};
}
