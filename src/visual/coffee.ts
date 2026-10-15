import { caffeineAssumptions, coffeeClock, sampleCaffeine, type CaffeineDay, type CaffeineState } from '../model/caffeine';
import type { PlotSpec } from './plotCard';
import type { Story } from './presentation';

const amber='#e9aa73',violet='#bbabe0';
export function coffeePlotSpecs(day:CaffeineDay):PlotSpec[]{
 const at=(m:number)=>sampleCaffeine(day,m),pts=(key:'bodyMg'|'sleepPressure'|'sleepiness')=>day.states.filter(s=>s.minute%3===0||s.minute===day.event.minute).map(s=>({x:s.minute,y:s[key]*(key==='bodyMg'?1:100),...(key==='bodyMg'?{low:s.lowMg,high:s.highMg}:{})}));
 const bands:NonNullable<PlotSpec['bands']>=[];
 // Preserve split sleep windows for edited schedules crossing 06:00.
 for(let m=0;m<1440;m++)if(day.states[m].asleep){const start=m;while(m<1440&&day.states[m].asleep)m++;bands.push({start,end:m,color:'rgba(161,151,205,.10)',label:'Scheduled sleep'});}
 if(day.event.enabled)bands.push({start:day.event.minute,end:day.event.minute+10,color:'rgba(233,170,115,.24)',label:'Coffee'});
 const base={xDomain:[0,1440] as [number,number],xTicks:[{x:0,label:'06'},{x:360,label:'12'},{x:720,label:'18'},{x:1080,label:'00'},{x:1440,label:'06'}],formatX:coffeeClock,step:5,pageStep:60,bands,systems:['brain'] as PlotSpec['systems']};
 return [
  {...base,id:'caffeine',title:'Caffeine in the body',unit:'mg · this cup only',domain:[0,200],yTicks:[0,100,200],
   note:'5 h half-life. Envelope: 2–8 h clearance scenarios. Vertical shading: scheduled sleep; no exact “wear-off” time.',
   series:[{id:'caffeine',label:'Caffeine',color:amber,points:pts('bodyMg'),sample:(m:number)=>at(m).bodyMg,format:(v:number)=>`${Math.round(v)} mg`,
    tip:'Caffeine from this one cup, after absorption and liver clearance. This is total amount in the model, not a blood concentration. The shaded range changes only clearance speed, not every source of individual variation.',
    readout:(m:number)=>({value:`${Math.round(at(m).bodyMg)} mg`,detail:day.event.enabled?`${Math.round(at(m).lowMg)}–${Math.round(at(m).highMg)} mg · sensitivity`:'Coffee skipped'})}]},
  {...base,id:'sleepiness',title:'Sleep pressure & sleepiness',unit:'Illustrative index',domain:[0,100],yTicks:[0,50,100],
   note:'The gap illustrates masked sleepiness. Sleep need remains. These are conceptual signals, not predicted alertness scores.',
   series:[
    {id:'sleepPressure',label:'Sleep pressure',color:'#a5b69b',dash:'5 4',points:pts('sleepPressure'),sample:(m:number)=>at(m).sleepPressure*100,format:(v:number)=>`${Math.round(v)} / 100`,
     tip:'A simplified sleep-need curve: rising while awake, falling during scheduled sleep. It is identical with and without coffee. It is not measured adenosine, and it leaves out circadian arousal.'},
    {id:'sleepiness',label:'Sleepiness signal',color:violet,points:pts('sleepiness'),sample:(m:number)=>at(m).asleep?null:at(m).sleepiness*100,format:(v:number)=>`${Math.round(v)} / 100`,
     readout:(m:number)=>at(m).asleep?{value:'Asleep',detail:'Scheduled, not predicted'}:{value:`${Math.round(at(m).sleepiness*100)} / 100`},
     tip:'An illustrative reduction in the sleepiness signal while caffeine acts at adenosine receptors. The gap suggests feeling more awake, not restored sleep or measured performance. Individual response, tolerance and withdrawal are not calculated.'}
   ].map(series=>series.id==='sleepiness'?{...series,points:series.points.map(p=>({...p,y:day.states[p.x].asleep?null:p.y}))}:series)}
 ];
}

export const coffeeCup=`<svg viewBox="0 0 130 100" class="coffee-cup" aria-hidden="true"><ellipse cx="59" cy="85" rx="40" ry="7" fill="#0d1914"/><ellipse cx="59" cy="81" rx="43" ry="7" fill="#83987a"/><path d="M87 39H96C116 39 114 66 93 65H87" fill="none" stroke="#ced7bd" stroke-width="7"/><path d="M28 36H91L86 68Q84 80 59 80Q36 80 33 68Z" fill="#cbd6b9"/><ellipse cx="59" cy="36" rx="31.5" ry="9" fill="#edf0db"/><ellipse cx="59" cy="36" rx="27" ry="6" fill="#5c3e2c"/><path d="M42 17Q36 11 42 4M60 20Q67 13 60 7M76 19Q72 12 77 5" fill="none" stroke="#d5d1b5" stroke-width="2" stroke-linecap="round" class="coffee-steam"/><path d="M38 46L41 62" stroke="#eef2df" stroke-width="3" stroke-linecap="round" opacity=".6"/></svg>`;

export function coffeeMarkup(){return `<section id="coffee-controls" class="coffee-controls" aria-label="Coffee experiment" hidden><div class="coffee-heading"><span aria-hidden="true">☕</span><strong>Coffee break</strong><label class="coffee-toggle"><input type="checkbox" id="coffee-enabled" checked/> Include cup</label></div><div class="coffee-options"><label>Time<select id="coffee-time" aria-label="Coffee time"></select></label><label>Black coffee<select id="coffee-dose" aria-label="Coffee caffeine amount"><option value="45">Half cup · ~45 mg</option><option value="90" selected>Cup · ~90 mg</option><option value="180">Large cup · ~180 mg</option></select></label><button type="button" id="coffee-jump" class="text-button">See coffee →</button></div><div class="coffee-duration" id="coffee-duration"></div><details class="coffee-method"><summary>How to read this</summary><p>One cup today, starting without residual caffeine. Plain coffee’s small food-energy contribution is omitted. Caffeine in the weekly menu is not counted here. The existing meals and activity remain the comparison baseline.</p><p>The amount curve uses rapid absorption and a 5-hour half-life. The 2–8-hour envelope shows clearance sensitivity, not a personal confidence interval. The sleepiness curves illustrate a mechanism, not measured brain chemicals or a prediction of sleep quality.</p><p>More alert, less sleepy — temporarily. Some people feel jittery or anxious. Heart-rate responses vary. Habit, medicines and individual biology affect the response. Late caffeine may disturb sleep; the scheduled sleep animation does not predict this.</p><a href="https://www.efsa.europa.eu/en/topics/topic/caffeine" target="_blank" rel="noreferrer">EFSA · coffee, caffeine & sleep ↗</a></details></section>`;}
export function coffeeDuration(day:CaffeineDay){
 if(!day.event.enabled||day.event.doseMg===0)return '<span>Cup skipped</span><span>Sleepiness follows the same underlying sleep pressure.</span>';
 const bedtime=sampleCaffeine(day,day.sleepStart),half=day.halfPeakMinute===null?'beyond this day':coffeeClock(Math.round(day.halfPeakMinute/5)*5);
 return `<span>Onset <b>~15–30 min</b></span><span>Peak <b>~${coffeeClock(Math.round(day.peakMinute/5)*5)}</b></span><span>Half of peak <b>~${half}</b></span><span>At ${day.sleepStart===1440?'day end':coffeeClock(day.sleepStart)} <b>~${Math.round(bedtime.bodyMg)} mg remains</b></span>`;
}
export function coffeeScene(day:CaffeineDay,st:CaffeineState,clearing=false):Story|null {
 const elapsed=st.minute-day.event.minute;
 if(!day.event.enabled||!day.event.doseMg||elapsed<0)return null;
 const phase=clearing?'clearing':elapsed<10?'drink':elapsed<35?'absorbing':elapsed<75?'brain':null;
 if(!phase||st.asleep)return null;
 const titles={drink:'A coffee break.',absorbing:'Caffeine reaches the brain.',brain:'More awake. Same sleep need.',clearing:'The effect fades gradually.'};
 const keys={drink:[`Black coffee · ~${day.event.doseMg} mg`,'Absorption begins'],absorbing:['Caffeine in circulation ↑','Alerting effect building'],brain:['Adenosine signaling partly blocked','Sleepiness signal ↓'],clearing:['Liver clearing caffeine','Sleepiness masking fades']};
 return {id:`coffee-${phase}`,title:titles[phase],eyebrow:'COFFEE / ONE CUP TODAY',keys:keys[phase],focus:phase==='drink'?'digestion':phase==='clearing'?'liver':'brain',
  caption:'Caffeine blocks some adenosine receptors, temporarily reducing the feeling of sleepiness. It does not remove adenosine or restore missed sleep. Absorption raises caffeine over tens of minutes; liver clearance lowers it over hours. Amount and effects vary between people.'};
}
export function coffeeMoment(day:CaffeineDay,minute:number){const elapsed=minute-day.event.minute;return day.event.enabled&&day.event.doseMg>0&&elapsed>=0&&elapsed<caffeineAssumptions.drinkMinutes;}
