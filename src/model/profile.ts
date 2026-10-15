import type { Scenario } from './config';
export type Sex='male'|'female';
export type BleedingLevel='light'|'typical'|'heavy';
export interface MenstrualCycle {enabled:boolean;lengthDays:number;bleedingDays:number;level:BleedingLevel;startDay:number}
export interface PhysiologyProfile {sex:Sex;age:number;weight_kg:number;height_cm:number;cycle:MenstrualCycle}
export const defaultCycle:MenstrualCycle={enabled:false,lengthDays:28,bleedingDays:5,level:'typical',startDay:1};
// Representative scenarios, NOT an estimate of a user's measured blood loss.
// DRI iron chapter: median ~28–30 mL/cycle; 80 mL is a high-loss threshold.
export const bleedingScenarios:Record<BleedingLevel,{ml:number;low:number;high:number;label:string}>={
 light:{ml:15,low:5,high:20,label:'Light'},typical:{ml:30,low:20,high:60,label:'Typical'},heavy:{ml:80,low:60,high:120,label:'Heavy'}
};
export const ironPerMlBlood=.135*3.39; // assumed135g Hb/L ×3.39mg Fe/g Hb /1000
export const profileFromScenario=(s:Scenario):PhysiologyProfile=>({sex:s.person.sex,age:s.person.age,weight_kg:s.person.weight_kg,height_cm:s.person.height_cm,cycle:{...defaultCycle,...s.menstrualCycle}});
export function validateCycle(c:MenstrualCycle){
 if(typeof c.enabled!=='boolean'||!Object.hasOwn(bleedingScenarios,c.level))throw new Error('Choose a supported menstrual-cycle setting.');
 if(![c.lengthDays,c.bleedingDays,c.startDay].every(Number.isInteger)||c.lengthDays<21||c.lengthDays>40||c.bleedingDays<1||c.bleedingDays>10||c.bleedingDays>=c.lengthDays||c.startDay<1||c.startDay>c.lengthDays)throw new Error('Cycle length: 21–40 days; bleeding: 1–10 days; starting cycle day: 1 through cycle length.');
}
export function validateProfile(p:PhysiologyProfile){
 if(!['male','female'].includes(p.sex)||!Number.isFinite(p.age)||p.age<18||p.age>85||!Number.isFinite(p.weight_kg)||p.weight_kg<40||p.weight_kg>160||!Number.isFinite(p.height_cm)||p.height_cm<130||p.height_cm>220)throw new Error('Check the adult physiology profile.');validateCycle(p.cycle);
}
export const cycleActive=(p?:PhysiologyProfile)=>p?.sex==='female'&&p.cycle.enabled;
export const basalIronLoss=(p?:PhysiologyProfile)=>p?.weight_kg!==undefined?.014*p.weight_kg:1.2;
export function cycleDayAt(p:PhysiologyProfile,elapsed:number){return ((Math.floor(elapsed)+p.cycle.startDay-1)%p.cycle.lengthDays+p.cycle.lengthDays)%p.cycle.lengthDays+1;}
export function menstrualIronLoss(p:PhysiologyProfile|undefined,day:number,caseName:'ml'|'low'|'high'='ml'){
 if(!cycleActive(p))return 0;const c=p!.cycle,cycleDay=cycleDayAt(p!,day);if(cycleDay>c.bleedingDays)return 0;
 // Linear taper is an authored within-period pattern. Normalizing preserves total loss
 // when duration changes: the category sets total volume, duration only distributes it.
 const weights=Array.from({length:c.bleedingDays},(_,i)=>c.bleedingDays-i),sum=weights.reduce((a,b)=>a+b,0);
 return bleedingScenarios[c.level][caseName]*ironPerMlBlood*weights[cycleDay-1]/sum;
}
export function bleedingEvents(p:PhysiologyProfile|undefined,days:number){
 if(!cycleActive(p))return [];const events:{start:number;end:number}[]=[];
 for(let d=0;d<days;d++)if(menstrualIronLoss(p,d)>0){const last=events.at(-1);if(last?.end===d)last.end=d+1;else events.push({start:d,end:d+1});}return events;
}
// Population food-intake comparisons. Menstrual loss is already reflected in the
// age/sex iron RDA; never add the modeled cycle loss to this dietary comparison.
export function intakeReference(key:string,fallback:number,p?:PhysiologyProfile){
 if(!p)return fallback;const female=p.sex==='female',age=p.age;
 const values:Record<string,number>={iron_mg:age<19?(female?15:11):female&&age<=50?18:8,
 calcium_mg:age<19?1300:age>70||female&&age>50?1200:1000,
 magnesium_mg:age<19?(female?360:410):age<31?(female?310:400):(female?320:420),
 potassium_mg:age<19?(female?2300:3000):(female?2600:3400),zinc_mg:female?(age<19?9:8):11,
 c_mg:age<19?(female?65:75):(female?75:90),d_ug:age>70?20:15,ala_g:female?1.1:1.6};return values[key]??fallback;
}

// Nadler adult blood-volume estimate (L), with an explicitly assumed normal Hb.
// This initializes a functional pool, not a modeled laboratory Hb result.
export function redCellIronTarget(p?:PhysiologyProfile){
 if(!p)return 2400;const h=p.height_cm/100,w=p.weight_kg;
 const liters=p.sex==='female'?.3561*h**3+.03308*w+.1833:.3669*h**3+.03219*w+.6041;
 return liters*(p.sex==='female'?135:150)*3.39;
}
