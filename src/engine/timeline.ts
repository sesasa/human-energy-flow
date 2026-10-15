import { type Scenario } from '../model/config';
import { activityAt } from '../model/day';
import { energyBudget } from '../model/energy';
export interface Chapter { id: string; start: number; title: string; eyebrow: string; caption: string; focus: string; icon: string }
export function chapters(s: Scenario): Chapter[] {
  const minute = (hour: number) => (hour-6+24)%24*60;
  const sorted=[...s.meals].sort((a,b)=>minute(a.hour)-minute(b.hour));
  const meal=sorted[0],dinner=sorted.at(-1)!,lunch=sorted.length>2?sorted[1]:undefined;
  const work=Array.from({length:1440},(_,m)=>m).find(m=>activityAt(s,m)==='work');
  const exercise = minute(s.activity.exercise_start_hour), b = energyBudget(s);
  const list: Chapter[] = [
    {id:'baseline',start:0,title:'Always in motion.',eyebrow:'01 / THE LIVING BASELINE',caption:'Even at rest, your heart, brain and organs use energy. Liver glycogen helps maintain the supply of glucose between meals.',focus:'blood',icon:'◉'},
    {id:'breakfast',start:minute(meal.hour),title:'A meal. Many pathways.',eyebrow:'02 / FOOD BECOMES AVAILABLE',caption:'Carbohydrate supplies glucose, protein supplies amino acids, and dietary fat follows a different route. Digestion unfolds over several hours.',focus:'digestion',icon:'◌'},
    {id:'absorption',start:minute(meal.hour)+25,title:'From the gut to the body.',eyebrow:'03 / ABSORPTION',caption:'Glucose and amino acids travel first to the liver through the portal circulation. Most dietary fat reaches blood through lymph. These processes overlap.',focus:'digestion',icon:'↗'},
    {id:'insulin',start:minute(meal.hour)+55,title:'A signal, not a fuel.',eyebrow:'04 / INSULIN RESPONDS',caption:'The pancreas releases insulin as nutrients arrive. This signal coordinates tissue uptake and storage, and reduces the liver’s glucose output.',focus:'insulin',icon:'◎'},
    {id:'distribution',start:minute(meal.hour)+110,title:'Use some. Store some.',eyebrow:'05 / NUTRIENT DISTRIBUTION',caption:'Glucose supports immediate energy use and replenishes two different glycogen stores. Muscle glycogen stays in muscle; liver glycogen can support blood glucose.',focus:'stores',icon:'⇄'},
    {id:'settling',start:minute(meal.hour)+240,title:'Toward a steady state.',eyebrow:'06 / BETWEEN MEALS',caption:'Glucose and insulin drift toward baseline as absorption slows. Glycogen remains available, while the body continues to use a mix of fuels.',focus:'stores',icon:'≈'},
    {id:'lunch',start:lunch?minute(lunch.hour):0,title:'Replenish the supply.',eyebrow:'07 / A SECOND MIXED MEAL',caption:'Another meal renews circulating nutrients. Amino acids support tissue turnover throughout the body; only a small amount becomes new tissue.',focus:'digestion',icon:'◌'},
    {id:'work',start:work??0,title:'A quietly demanding brain.',eyebrow:'08 / READING & LEARNING',caption:'Your brain needs energy continuously. Concentrated thinking changes local activity, but adds little to whole-body energy use compared with exercise.',focus:'brain',icon:'⌁'},
    {id:'run',start:exercise,title:'Stored fuel meets movement.',eyebrow:'09 / THE RUN',caption:'Blood flow and oxygen delivery rise. Working muscles use local glycogen, blood glucose and fat together. Contraction also increases glucose uptake independently of insulin.',focus:'muscle',icon:'↗'},
    {id:'resistance',start:exercise+b.runMinutes,title:'Load creates a signal.',eyebrow:'10 / RESISTANCE TRAINING',caption:'Active muscle groups use carbohydrate and fat. Resistance work stimulates adaptation; a workout does not instantly make muscle larger.',focus:'muscle',icon:'↟'},
    {id:'recovery',start:exercise+s.activity.exercise_minutes,title:'The work after the work.',eyebrow:'11 / RECOVERY',caption:'Heart rate settles. Recovery and adequate protein support repair and normal turnover. Glycogen is replenished over hours; adaptation takes repeated sessions.',focus:'recovery',icon:'✧'},
    {id:'dinner',start:minute(dinner.hour),title:'Refuel. Repair. Repeat.',eyebrow:'12 / EVENING MEAL',caption:'Dinner supplies carbohydrate to replenish glycogen and amino acids for tissue maintenance. Dietary fat may continue entering circulation during sleep.',focus:'digestion',icon:'◌'},
    {id:'summary',start:minute(dinner.hour)+90,title:Math.abs(b.balance)<100?'Near energy balance.':b.balance>0?'More in than out.':'Drawing on reserves.',eyebrow:'13 / THE DAILY PICTURE',caption:`This menu supplies about ${Math.round(b.intake)} kcal; modeled use is about ${Math.round(b.total)} kcal. ${Math.abs(b.balance)<100?'Intake and expenditure are close.':b.balance>0?'Repeated surplus can add body stores.':'A sustained deficit draws on fat and lean tissue.'} Food, training and recovery together shape longer-term change.`,focus:'stores',icon:'≋'},
    {id:'sleep',start:minute(s.activity.sleep_start_hour),title:'Rest is part of the cycle.',eyebrow:'14 / SLEEP',caption:'Sleep supports recovery while energy use continues. The liver helps maintain glucose availability overnight. Muscle glycogen is not emptied by an ordinary workout.',focus:'recovery',icon:'☾'}
  ];
  return list.filter(c=>(c.id!=='lunch'||!!lunch)&&(c.id!=='dinner'||sorted.length>1)&&(c.id!=='work'||work!==undefined)).filter(c=> !['run','resistance','recovery'].includes(c.id) || s.activity.exercise_minutes>0).filter(c=>c.id!=='resistance'||(b.resistanceMinutes>0&&s.activity.resistance_training)).sort((a,b)=>a.start-b.start);
}
export function chapterAt(list: Chapter[], minute: number) {
  for (let i=list.length-1;i>=0;i--) if (list[i].start<=minute) return list[i];
  return list[0];
}
export class Timeline {
  phase: 'day' | 'intense' | 'long' = 'day';
  position = 0;
  playing = false;
  speed = 1;
  update(seconds: number, maxRate = Infinity) {
    if (!this.playing) return;
    const rate=Math.min(this.phase!=='long'?8*this.speed:(this.position<365?5:18)*this.speed,maxRate);
    this.position += seconds * rate;
    // Days end paused; the long-term view is only entered explicitly.
    if (this.phase !== 'long' && this.position>=1440) { this.position=1440;this.playing=false; }
    if (this.phase === 'long' && this.position>=1095) { this.position=1095;this.playing=false; }
  }
  seek(phase: 'day' | 'intense' | 'long', position: number) { this.phase=phase;this.position=position; }
  reset() { this.phase='day';this.position=0;this.playing=false; }
}
