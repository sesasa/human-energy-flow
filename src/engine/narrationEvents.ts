import type { Scenario } from '../model/config';
import { dailySchedule, sampleDay, type DaySimulation } from '../model/day';
import { totals, weeklyAverage, type DietApplication, type DietDay } from '../model/diet';
import { sampleLongTerm, type AdaptationState } from '../model/longTerm';
import { labTrend, type LabProjection } from '../model/labProjection';
import { labMarkers, type NutritionMarker } from '../model/labs';
import { cycleActive } from '../model/profile';
import { sampleSprint, type IntenseDay } from '../model/sprint';
import type { SystemId } from '../visual/plotCard';

export interface NarrationCue {
 id:string;start:number;end:number;sentences:string[];system:SystemId;
 emphasis:{card:string;series:string[]}[];focus:string;
}
const minute=(hour:number)=>(hour-6+24)%24*60;
const focusFor:Record<SystemId,string>={guided:'all',cardiovascular:'blood',metabolism:'stores',muscular:'muscle',digestion:'digestion',brain:'brain',micronutrients:'stores'};
function cue(id:string,start:number,end:number,sentences:string[],system:SystemId,card:string,series:string[],related:NarrationCue['emphasis']=[]):NarrationCue {
 return {id,start,end,sentences,system,focus:focusFor[system],emphasis:[{card,series},...related]};
}
export function orderedCues(cues:NarrationCue[],end:number):NarrationCue[]{
 const sorted=cues.filter(c=>c.start>=0&&c.start<end&&c.end>c.start).sort((a,b)=>a.start-b.start);
 return sorted.map((c,i)=>({...c,end:Math.min(end,c.end,sorted[i+1]?.start??end)})).filter(c=>c.end-c.start>.000001);
}
export function cueAt(cues:NarrationCue[],position:number):NarrationCue|null {
 return cues.find(c=>position>=c.start&&position<c.end)||null;
}

export function dayNarration(s:Scenario,day:DaySimulation,food:DietDay):NarrationCue[]{
 const schedule=dailySchedule(s),state=(t:number)=>sampleDay(day,Math.max(0,Math.min(1440,t))),list:NarrationCue[]=[];
 list.push(cue('day-intro',0,35,[`Here we follow one day with this person's chosen meals${s.activity.exercise_minutes>0?', activity, and recovery': ' and daily activity'}.`,'Watch glucose and insulin respond to food, and follow the liver and muscle glycogen reserves.'],'metabolism','meal',['glucose','insulin']));
 food.meals.forEach((meal,index)=>{
  const t=minute(meal.hour),n=totals(meal.foods),id=`meal-${index}`;
  const add=(part:string,start:number,end:number,sentences:string[],card='meal',series=['glucose','insulin'],system:SystemId='digestion')=>{
   if(!['run','resistance','sleep'].includes(schedule[Math.min(1439,Math.floor(start))]))list.push(cue(`${id}-${part}`,start,end,sentences,system,card,series));
  };
  if(n.kcal<1){add('empty',t,t+20,['This meal has been removed. Earlier nutrients and stored fuels still support the body.']);return;}
  const nutrients=([['carbohydrate',n.carbohydrate_g],['protein',n.protein_g],['fat',n.fat_g]] as const).filter(([,grams])=>grams>=.5).map(([name])=>name);
  const supplied=nutrients.length>1?`${nutrients.slice(0,-1).join(', ')} and ${nutrients.at(-1)}`:nutrients[0]||'a small amount of nutrients';
  add('plate',t,t+12,[`${meal.name} supplies ${supplied} in the amounts shown on the plate.`,'The nutrients enter circulation gradually as the meal is digested.']);
  const rise=state(t+32).glucose-state(t+12).glucose;
  add('absorption',t+12,t+32,[n.carbohydrate_g<5?'This meal contains little carbohydrate, so the glucose response is small.':rise>.025?'The glucose signal is rising as carbohydrate from the meal is absorbed.':'Watch the glucose response to this meal. Its size and timing follow the actual carbohydrate portion.'],'meal',['glucose']);
  add('insulin',t+32,t+58,[n.carbohydrate_g+n.protein_g<5?'There is little new carbohydrate or protein here, so the modeled insulin response stays small.':'Insulin responds as nutrients arrive. It helps muscle and other tissues take up glucose.','Follow the two curves together as the meal response develops and then settles.'],'meal',['glucose','insulin'],'metabolism');
  const stored=state(t+90).liver+state(t+90).muscle-state(t+58).liver-state(t+58).muscle;
  add('storage',t+58,t+100,[stored>1?'Some incoming glucose is replenishing glycogen.':'These stores are not rising much in this part of the day. Their starting level and ongoing use matter too.','Liver glycogen supports blood glucose between meals; muscle glycogen is reserved for local activity.'],'glycogen',['liver','muscle'],'metabolism');
 });
 const work=schedule.findIndex(a=>a==='work');
 if(work>=0)list.push(cue('mental-work',work,work+20,['The brain keeps using energy during mental work. Most of that need is already included in resting metabolism.'],'brain','meal',['glucose']));
 const start=minute(s.activity.exercise_start_hour),duration=s.activity.exercise_minutes;
 if(duration>0){
  list.push(cue('exercise-start',start,start+Math.min(8,duration),['Working muscle now uses local glycogen and takes up glucose from the blood.','Watch the muscle store alongside the rising heart rate.'],'muscular','glycogen',['muscle'],[{card:'heart',series:['hr']}]));
  if(duration>9){
   const lower=state(start+10).insulin<Math.max(...day.states.slice(Math.max(0,start-120),start).map(x=>x.insulin))-.03;
   list.push(cue('exercise-uptake',start+8,start+Math.min(18,duration),[lower?'Insulin is lower here even while active muscle takes up glucose.':'Active muscle can increase glucose uptake without needing a stronger insulin signal.','Contraction brings glucose transporters to the cell surface through signals partly separate from insulin.'],'metabolism','meal',['insulin','glucose']));
  }
  if(duration>20)list.push(cue('exercise-liver',start+18,start+Math.min(30,duration),['The liver helps supply circulating glucose while muscles consume fuel.',state(start+28).liver<state(start+18).liver?'The falling liver glycogen curve shows part of that support.':'Food is still supplying glucose here, helping preserve the liver reserve.'],'metabolism','glycogen',['liver']));
  const resistance=schedule.findIndex(a=>a==='resistance');
  if(resistance>=0)list.push(cue('exercise-resistance',resistance,resistance+Math.min(12,duration),['Resistance work places a load on muscle and creates an adaptation signal.','Any lasting increase in tissue comes from repeated training and recovery, not this single contraction.'],'muscular','glycogen',['muscle']));
  const end=start+duration;
  list.push(cue('exercise-recovery',end,end+25,['Effort has eased and the heart rate begins to settle.','Dietary carbohydrate supports glycogen restoration; protein supplies amino acids for ongoing repair.'],'muscular','recovery',['recovery'],[{card:'heart',series:['hr']},{card:'glycogen',series:['liver','muscle']}]));
 }
 const sleep=schedule.findIndex((a,i)=>a==='sleep'&&i>0&&schedule[i-1]!=='sleep');
 if(sleep>=0)list.push(cue('sleep',sleep,sleep+40,['Energy use continues during sleep. Organs still need fuel while the body carries out maintenance and repair.','Liver glycogen helps bridge the gap until the next meal.'],'metabolism','glycogen',['liver']));
 return orderedCues(list,1440);
}

export function sprintNarration(model:IntenseDay,food:DietDay):NarrationCue[]{
 const sim=model.session,c=sim.config,start=sim.startMinute,end=start+sim.lastSecond/60,cycle=c.sprint_seconds+c.walk_seconds;
 const list=dayNarration(model.scenario,model.day,food).filter(x=>!x.id.startsWith('exercise-')&&(x.end<=start-c.warmup_minutes||x.start>=end));
 list.push(cue('sprint-intro',start-c.warmup_minutes,start,[`This session alternates ${c.repetitions} all-out sprints with short recovery walks.`,'Watch phosphocreatine, or P C R, refill between efforts while fatigue and available power change.'],'muscular','rapid-energy',['atp','pcr'],[{card:'power-fatigue',series:['power','fatigue']}]));
 for(let rep=1;rep<=c.repetitions;rep++){
  const t=start+(rep-1)*cycle/60,walk=t+c.sprint_seconds/60,next=t+cycle/60;
  if(rep===1){
   list.push(cue('sprint-first',t,t+c.sprint_seconds/120,['ATP demand rises rapidly. Phosphocreatine helps regenerate ATP.'],'muscular','rapid-energy',['atp','pcr']));
   list.push(cue('sprint-pcr-fall',t+c.sprint_seconds/120,walk,['Watch P C R fall while ATP stays relatively stable.'],'muscular','rapid-energy',['atp','pcr']));
   list.push(cue('walk-first',walk,next,['Effort falls during walking. Aerobic metabolism helps rebuild phosphocreatine.','This is recovery of a rapid buffer, not instant restoration of every muscle function.'],'cardiovascular','rapid-energy',['pcr'],[{card:'oxygen',series:['oxygen']}]));
  }else if(rep===2){
   const st=sampleSprint(sim,(rep-1)*cycle);
   list.push(cue('sprint-repeat',t,walk,[st.pcr<.95?'The next sprint starts before phosphocreatine has fully recovered.':'This longer recovery has restored most of the phosphocreatine buffer.'],'muscular','rapid-energy',['pcr']));
  }else if(rep===3){
   list.push(cue('sprint-pathways',t,walk,['Glycolysis also supplies ATP quickly. Rising oxygen support cannot sustain all-out power by itself.'],'metabolism','pathways',['glycolytic','aerobicSource']));
  }else if(rep===Math.max(4,Math.round(c.repetitions*.4))){
   list.push(cue('walk-fatigue',walk,next,['The fatigue curve summarizes stress building inside muscle.','In real muscle, phosphate buildup and altered calcium handling can make contraction less effective.'],'muscular','power-fatigue',['fatigue']));
  }else if(rep===Math.max(4,Math.round(c.repetitions*.65))){
   list.push(cue('walk-glycogen',walk,next,['The working-muscle glycogen curve reflects local carbohydrate use across the session.','Recovery walks refill P C R much faster than food can restore muscle glycogen.'],'metabolism','rapid-energy',['glycogen','pcr']));
  }else if(rep===Math.max(5,c.repetitions-2)){
   const st=sampleSprint(sim,(rep-1)*cycle+c.sprint_seconds*.8);
   list.push(cue('sprint-power',t,walk,[st.powerCapacity<.9?'Available sprint power is lower now, even though fuel remains.':'Power is holding up better with this recovery pattern.'],'muscular','power-fatigue',['power','fatigue']));
  }
 }
 const last=sampleSprint(sim,sim.durationSeconds);
 list.push(cue('sprint-conclusion',start+sim.durationSeconds/60,end,[last.powerCapacity<.95?'Repeated effort has reduced the power available for another sprint.':'The session is complete. Recovery continues after the final effort.','The limit is a combination of P C R recovery, local fuel availability, and muscle fatigue, rather than the body simply running out of blood glucose.'],'muscular','power-fatigue',['power','fatigue']));
 return orderedCues(list,1440);
}

export function longNarration(s:Scenario,states:AdaptationState[],labs:Partial<Record<NutritionMarker,LabProjection>>,app:DietApplication):NarrationCue[]{
 const list:NarrationCue[]=[],avg=weeklyAverage(app.week),at=(d:number)=>sampleLongTerm(states,d),last=states.length-1;
 list.push(cue('long-intro',0,10,['Now we move from hours to months. Repeating a pattern of meals, activity, and recovery gradually changes the modeled body.','The curves show change from the starting person. Body mass is the sum of lean and fat mass.'],'metabolism','composition',['mass','lean','fatmass']));
 for(const day of [21,365,730]){
  const a=at(day),b=at(Math.min(last,day+90)),change=b.fat-a.fat;
  if(a.atLimit)continue;
  list.push(cue(`balance-${day}`,day,day+25,[change>.15?'With this food and activity pattern, the model is adding fat over the coming months.':change<-.15?'This food and activity pattern draws on stored fat over the coming months.':'Fat mass is fairly steady here because modeled intake and expenditure are close.','Follow the fat and total-mass curves; changing the food changes this balance.'],'metabolism','composition',['fatmass','mass']));
 }
 for(const day of [65,430,820]){
  const a=at(day),b=at(Math.min(last,day+90));if(a.atLimit)continue;
  const loss=b.lean-a.lean<-.1,gain=b.lean-a.lean>.1;
  list.push(cue(`lean-${day}`,day,day+30,[loss?'Lean tissue is declining in this sustained energy deficit. Lean mass includes water, organs, and other tissue as well as muscle.':gain?'Repeated resistance work, food, and recovery support a gradual increase in modeled lean mass.':'Lean mass changes little over this part of the projection.',s.activity.resistance_training&&s.activity.exercise_minutes>0?'The training response also depends on protein and energy availability, and gains slow over time.':'This scenario has no effective resistance-training stimulus; food alone does not create the same adaptation.'],'muscular','composition',['lean']));
 }
 const heartDay=125,h0=at(heartDay),h1=at(heartDay+90);
 list.push(cue('conditioning',heartDay,heartDay+30,[h1.restingHR<h0.restingHR-.2?'The resting heart-rate curve is gradually falling with repeated aerobic activity.':'The modeled resting heart rate is fairly steady with this activity pattern.','Real cardiovascular adaptation involves several changes. Here we show only the modeled resting heart rate.'],'cardiovascular','conditioning',['hr']));
 const selected=Object.keys(labs) as NutritionMarker[];
 selected.forEach((marker,index)=>{
  const p=labs[marker]!,day=182+index*30,trend=labTrend(p,day),name=labMarkers[marker].name;
  const sentences=trend==='Outside model scope'?[`${name} is outside this food-response model's supported range here. A future laboratory value is not estimated.`]:[`${name} is ${trend==='Rising'?'rising':trend==='Falling'?'falling':'approximately stable'} in this educational food-response scenario.`,'Daily intake, absorption, and losses accumulate over time. The shaded region shows sensitivity to assumptions, not a personal prediction interval.'];
  if(marker==='ferritin'&&cycleActive(app.profile))sentences.push('The cycle marks show modeled menstrual blood loss, whose effect on iron balance accumulates gradually.');
  list.push(cue(`lab-${marker}`,day,day+26,sentences,'micronutrients',`lab-${marker}`,[marker]));
 });
 if(!selected.length)list.push(cue('food-pattern',182,212,[`This repeating week supplies about ${Math.round(avg.kcal/10)*10} calories and ${Math.round(avg.protein_g)} grams of protein per day.`,'The person and activity settings stay the same when you compare different food templates.'],'metabolism','composition',['mass','lean','fatmass']));
 const limit=states.find(st=>st.atLimit);
 if(limit){
  // A held curve is an explicit model boundary, never a claim of equilibrium.
  const stop=cue('model-limit',limit.day,Math.min(last,limit.day+25),['This projection has reached the supported body-composition limit.','The body curve stops here; it does not predict what would happen beyond this range.'],'metabolism','composition',['mass','lean','fatmass']);
  return orderedCues([...list.filter(c=>c.start<limit.day||c.id.startsWith('lab-')),stop],last);
 }
 list.push(cue('long-conclusion',Math.max(0,last-30),last,['The long-term picture comes from repeated inputs and gradual adaptation.','These curves help compare scenarios; they are not an individual forecast.'],'metabolism','composition',['mass','lean','fatmass']));
 return orderedCues(list,last);
}
