import { cloneScenario, type Scenario } from './config';
import { dietDayAt, type DietApplication } from './diet';
import { simulateDiet, type DietSimulation } from './dietSimulation';
import { sampleLongTerm, type AdaptationState } from './longTerm';

// A representative acute day at a selected body, not a replay of historical
// minute states. Re-equilibrate the food week at that body's capacities.
export function scenarioAtBody(base:Scenario,body:AdaptationState):Scenario {
 const next=cloneScenario(base);
 next.person.weight_kg=body.weight;
 next.person.body_fat_fraction=body.fat/body.weight;
 next.person.age=base.person.age+body.day/365;
 next.model.resting_hr_bpm=body.restingHR;
 // Preserve the same movement routine and the mass scaling used in Over Time.
 next.activity.ordinary_movement_kcal*=body.weight/base.person.weight_kg;
 return next;
}

export function supportsDailyBody(base:Scenario,body:AdaptationState):boolean {
 // The daily solver has a narrower validated input domain than the long view.
 return base.person.age+body.day/365<=85&&body.weight>=40&&body.weight<=160;
}

export function representativeDay(base:Scenario,app:DietApplication,states:AdaptationState[],position:number,baseline?:DietSimulation){
 const body=sampleLongTerm(states,position),elapsed=Math.min(states.length-2,Math.floor(body.day)),index=elapsed%7;
 const week=body.day===0&&baseline?baseline:simulateDiet(scenarioAtBody(base,body),elapsed>=7?{...app,once:undefined,onceTemplate:undefined}:app);
 return {position:body.day,elapsed,body,day:week.days[index],scenario:week.scenarios[index],options:week.options[index],food:dietDayAt(app,elapsed)};
}
