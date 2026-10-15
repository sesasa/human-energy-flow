import { sampleCaffeine, type CaffeineDay } from '../model/caffeine';
import { dailySchedule } from '../model/day';
import type { Scenario } from '../model/config';
import { orderedCues, type NarrationCue } from './narrationEvents';

/** Same event director as meals and exercise; no separate audio clock. */
export function withCoffeeNarration(base:NarrationCue[],day:CaffeineDay,s:Scenario):NarrationCue[]{
 if(!day.event.enabled||day.event.doseMg===0)return base;
 const schedule=dailySchedule(s),t=day.event.minute;
 const focus=[{card:'caffeine',series:['caffeine']},{card:'sleepiness',series:['sleepPressure','sleepiness']}];
 let cues=base.map(c=>({...c,sentences:[...c.sentences],emphasis:[...c.emphasis]}));
 const work=cues.find(c=>c.id==='mental-work');
 if(work&&sampleCaffeine(day,work.start).bodyMg>10){
  work.sentences.push('Caffeine is still present. It can help you feel more alert for a task, while the underlying need for sleep continues to build.');
  work.emphasis=focus;
 }
 const sleep=cues.find(c=>c.id==='sleep');
 if(sleep&&sleep.start>t){
  const residual=Math.round(sampleCaffeine(day,sleep.start).bodyMg);
  sleep.sentences.push(residual>0?`About ${residual} milligrams from this cup remain in the model at scheduled bedtime. Residual caffeine does not tell us exactly how you will sleep. Timing, dose and individual sensitivity matter.`:'Very little caffeine from this cup remains by scheduled bedtime.');
  sleep.emphasis=[...sleep.emphasis,...focus];
 }
 const add=(id:string,start:number,duration:number,sentences:string[],anatomy='brain')=>{
  const end=Math.min(start+duration,1440);
  if(end-start<8||schedule.slice(start,end).some(a=>['sleep','run','resistance'].includes(a)))return;
  // Give this brief event a clean interval. Keep substantial neighboring
  // explanations; never retain an obsolete sentence across the new event.
  const shared:string[]=[];
  cues=cues.flatMap(c=>{
   if(c.end<=start||c.start>=end)return [c];
   if(start-c.start>=8)return [{...c,end:start}];
   if(c.end-end>=8)return [{...c,start:end}];
   // A very short coincident explanation (e.g. breakfast with coffee) is
   // narrated alongside the cup instead of disappearing from the track.
   shared.push(...c.sentences);return [];
  });
  cues.push({id,start,end,sentences:[...sentences,...shared],system:anatomy==='digestion'?'digestion':anatomy==='liver'?'metabolism':'brain',focus:anatomy,emphasis:focus});
 };
 add('coffee-drink',t,12,[`A black coffee brings about ${day.event.doseMg} milligrams of caffeine into this day. Watch the amount rise as it is absorbed.`,'This cup has no added sugar. It does not create the carbohydrate pulse shown after a meal.'],'digestion');
 // Find space around existing explanations. Preserve a restored storage or
 // mental-work tail, rather than cutting it again with the next coffee cue.
 for(let start=t+15;start<Math.min(t+105,1432);start++){
  if(cues.some(c=>c.start<=start&&c.end>start))continue;
  const next=Math.min(1440,start+20,...cues.filter(c=>c.start>start).map(c=>c.start));
  if(next-start<8||schedule.slice(start,next).some(a=>['meal','run','resistance','sleep'].includes(a)))continue;
  add('coffee-brain',start,next-start,['Caffeine reaches the brain and blocks some adenosine receptors. This can reduce the feeling of sleepiness.','Watch the gap between the two sleepiness curves. The underlying sleep pressure is still there. Coffee does not replace sleep.']);break;
 }
 // A short clearance cue goes in an available daytime gap, never across a meal
 // explanation, exercise, or sleep; it uses the actual modeled downward curve.
 for(let start=t+180;start<Math.min(t+360,1428);start+=10){
  if(sampleCaffeine(day,start+12).bodyMg>=sampleCaffeine(day,start).bodyMg)continue;
  if(cues.some(c=>c.start<start+12&&c.end>start)||schedule.slice(start,start+12).some(a=>['meal','run','resistance','sleep'].includes(a)))continue;
  add('coffee-clearing',start,12,['The liver is clearing caffeine gradually. The modeled amount halves roughly every five hours after absorption.','The shaded envelope shows faster and slower clearance. There is no single moment when every person’s coffee stops working.'],'liver');break;
 }
 return orderedCues(cues,1440);
}
