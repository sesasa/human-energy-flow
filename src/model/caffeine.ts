import { clamp, type Scenario } from './config';
import { dailySchedule } from './day';

// One cup on one simulated day. This module does not change the repeated diet,
// sleep schedule, energy ledger, glucose, heart rate, or sprint/long-term model.
// Evidence and the explicitly illustrative effect coefficients: docs/caffeine/MODEL.md.
export interface CoffeeEvent { enabled:boolean; minute:number; doseMg:number }
export const defaultCoffee:Readonly<CoffeeEvent>={enabled:true,minute:210,doseMg:90};
export const caffeineAssumptions={absorptionPerHour:4,halfLifeHours:5,fastHalfLifeHours:2,slowHalfLifeHours:8,drinkMinutes:10} as const;
export interface CaffeineState {
 minute:number; gutMg:number; bodyMg:number; clearedMg:number; lowMg:number; highMg:number;
 sleepPressure:number; sleepiness:number; alerting:number; asleep:boolean; drinking:boolean;
}
export interface CaffeineDay {
 event:CoffeeEvent; states:CaffeineState[]; sleepStart:number; allowedMinutes:number[];
 peakMinute:number; peakMg:number; halfPeakMinute:number|null;
}
export const coffeeClock=(minute:number)=>{const m=(Math.round(minute)+360)%1440;return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;};
export function coffeeSlots(s:Scenario):number[]{
 const schedule=dailySchedule(s);
 return Array.from({length:48},(_,i)=>i*30).filter(t=>t+caffeineAssumptions.drinkMinutes<=1440&&
  schedule.slice(t,t+caffeineAssumptions.drinkMinutes).every(a=>['rest','work','meal','recovery'].includes(a)));
}
export function coffeeForSchedule(s:Scenario,event:CoffeeEvent):CoffeeEvent {
 const slots=coffeeSlots(s);
 if(!slots.length)return {...event,enabled:false};
 return {...event,minute:slots.includes(event.minute)?event.minute:slots.reduce((a,b)=>Math.abs(b-event.minute)<Math.abs(a-event.minute)?b:a,slots[0])};
}
export function validateCoffee(event:CoffeeEvent){
 if(typeof event.enabled!=='boolean'||!Number.isFinite(event.minute)||event.minute<0||event.minute>1430||
  !Number.isFinite(event.doseMg)||event.doseMg<0||event.doseMg>200)throw new Error('Coffee requires a time inside the day and 0–200 mg caffeine.');
}
// Analytic first-order oral absorption and elimination (F=1). Body mg is not
// a plasma concentration. Cleared includes metabolites, which are not modeled.
export function caffeineAmount(doseMg:number,elapsedMinutes:number,halfLifeHours:number=caffeineAssumptions.halfLifeHours){
 if(!Number.isFinite(doseMg)||doseMg<0||!Number.isFinite(elapsedMinutes)||!Number.isFinite(halfLifeHours)||halfLifeHours<=0)throw new Error('Invalid caffeine kinetics input.');
 if(elapsedMinutes<0||doseMg===0)return {gutMg:0,bodyMg:0,clearedMg:0};
 const t=elapsedMinutes/60,ka=caffeineAssumptions.absorptionPerHour,ke=Math.LN2/halfLifeHours;
 const gutMg=doseMg*Math.exp(-ka*t);
 const bodyMg=doseMg*(Math.abs(ka-ke)<1e-8?ka*t*Math.exp(-ka*t):ka/(ka-ke)*(Math.exp(-ke*t)-Math.exp(-ka*t)));
 return {gutMg,bodyMg,clearedMg:Math.max(0,doseMg-gutMg-bodyMg)};
}
// Periodic homeostatic drive: a teaching curve, not measured adenosine,
// a sleepiness questionnaire, circadian arousal, or a prediction of sleep quality.
export function sleepPressureAt(s:Scenario,minute:number){
 const sleepHours=s.activity.sleep_hours,awakeHours=24-sleepHours,wake=(s.activity.sleep_start_hour+sleepHours)%24;
 const sinceWake=(6+minute/60-wake+48)%24,awakeDecay=Math.exp(-awakeHours/18),sleepDecay=Math.exp(-sleepHours/4);
 const waking=sleepDecay*(1-awakeDecay)/(1-awakeDecay*sleepDecay),bedtime=1-(1-waking)*awakeDecay;
 return sinceWake<awakeHours?1-(1-waking)*Math.exp(-sinceWake/18):bedtime*Math.exp(-(sinceWake-awakeHours)/4);
}
export function simulateCaffeine(s:Scenario,event:CoffeeEvent=defaultCoffee):CaffeineDay {
 validateCoffee(event);
 const allowedMinutes=coffeeSlots(s),schedule=dailySchedule(s);
 if(event.enabled&&!allowedMinutes.includes(event.minute))throw new Error('Choose an awake coffee break outside exercise.');
 const sleepStart=schedule.findIndex((a,i)=>a==='sleep'&&(i===0||schedule[i-1]!=='sleep')&&i>event.minute);
 const states=Array.from({length:1441},(_,minute):CaffeineState=>{
  const elapsed=minute-event.minute,dose=event.enabled?event.doseMg:0,amount=caffeineAmount(dose,elapsed);
  const lowMg=caffeineAmount(dose,elapsed,caffeineAssumptions.fastHalfLifeHours).bodyMg,highMg=caffeineAmount(dose,elapsed,caffeineAssumptions.slowHalfLifeHours).bodyMg;
  const sleepPressure=sleepPressureAt(s,minute),asleep=schedule[minute%1440]==='sleep';
  // Saturating visual effect only. 75 mg and 0.45 are teaching constants,
  // not receptor affinity or an experimentally calibrated behavioral response.
  const alerting=amount.bodyMg/(amount.bodyMg+75),sleepiness=sleepPressure*(1-.45*alerting);
  return {minute,...amount,lowMg,highMg,sleepPressure,sleepiness,alerting,asleep,
   drinking:event.enabled&&event.doseMg>0&&elapsed>=0&&elapsed<caffeineAssumptions.drinkMinutes};
 });
 const peak=states.reduce((a,b)=>b.bodyMg>a.bodyMg?b:a,states[0]);
 const halfPeak=peak.bodyMg>0?states.find(x=>x.minute>peak.minute&&x.bodyMg<=peak.bodyMg/2):undefined;
 return {event:{...event},states,allowedMinutes,sleepStart:sleepStart<0?1440:sleepStart,peakMinute:peak.minute,peakMg:peak.bodyMg,halfPeakMinute:halfPeak?.minute??null};
}
export function sampleCaffeine(day:CaffeineDay,minute:number):CaffeineState {
 const t=clamp(minute,0,1440),lo=Math.floor(t),a=day.states[lo],b=day.states[Math.min(1440,lo+1)],f=t-lo;
 const out={...a,minute:t};
 for(const key of ['gutMg','bodyMg','clearedMg','lowMg','highMg','sleepPressure','sleepiness','alerting'] as const)out[key]=a[key]+(b[key]-a[key])*f;
 return out;
}
