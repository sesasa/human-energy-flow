import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Narration,type SpeechCallbacks,type SpeechPort} from '../src/engine/narration';
import {dayNarration,sprintNarration,longNarration,orderedCues,cueAt,type NarrationCue} from '../src/engine/narrationEvents';
import {Timeline} from '../src/engine/timeline';
import {cloneScenario} from '../src/model/config';
import {cloneDiet,scenarioForDay,type DietApplication} from '../src/model/diet';
import {simulateDay} from '../src/model/day';
import {simulateIntenseDay} from '../src/model/sprint';
import {simulateLongTerm} from '../src/model/longTerm';
import {simulateLabMarkers} from '../src/model/labProjection';
import {longStory} from '../src/visual/longStory';
import {dietTemplates} from '../src/model/dietTemplates';

const cue=(id:string,start:number,end:number,sentences=['First explanation.','Second explanation.']):NarrationCue=>({id,start,end,sentences,system:'metabolism',focus:'stores',emphasis:[{card:'meal',series:['glucose']}]});
class Voice implements SpeechPort{
 available=true;calls:{text:string;rate:number;cb:SpeechCallbacks}[]=[];cancels=0;
 speak(text:string,rate:number,cb:SpeechCallbacks){this.calls.push({text,rate,cb});}
 cancel(){this.cancels++;}
 get last(){return this.calls.at(-1)!;}
}
const director=()=>{const voice=new Voice(),n=new Narration(voice);n.setTrack([cue('first',0,10),cue('second',12,20,['A new event.'])]);n.toggle();return {n,voice};};

test('voice starts only with playback, queues one sentence, and completes once per event',()=>{
 const {n,voice}=director();n.sync(0,false,1,0);assert.equal(voice.calls.length,0);
 n.sync(0,true,1,100);assert.equal(voice.calls.length,1);voice.last.cb.start();
 n.sync(1,true,1,200);assert.equal(voice.calls.length,1);
 voice.last.cb.end();n.sync(2,true,1,300);assert.equal(voice.calls.length,2);assert.equal(voice.last.text,'Second explanation.');
 voice.last.cb.end();n.sync(5,true,1,400);assert.equal(voice.calls.length,2);assert.equal(n.pacing,false);
});
test('pause restarts only the unfinished sentence, and canceled callbacks cannot skip speech',()=>{
 const {n,voice}=director();n.sync(0,true,1,0);voice.last.cb.end();n.sync(2,true,1,100);
 const old=voice.last;n.pause();old.cb.end();n.sync(2,false,1,200);assert.equal(voice.calls.length,2);
 n.sync(2,true,1,300);assert.equal(voice.calls.length,3);assert.equal(voice.last.text,'Second explanation.');
});
test('seek cancels the old event even when native end/error events arrive late',()=>{
 const {n,voice}=director();n.sync(0,true,1,0);const old=voice.last;
 n.cancel();n.sync(13,false,1,200);old.cb.error('interrupted');old.cb.end();
 assert.equal(n.error,'');assert.equal(n.current?.id,'second');assert.equal(voice.calls.length,1);
 n.sync(13,true,1,300);assert.equal(voice.last.text,'A new event.');
 n.cancel();n.sync(11,true,1,400);assert.equal(voice.calls.length,2,'no stale speech in a gap');
});
test('speed changes restart the active sentence, bound speech rate and preserve the event',()=>{
 const {n,voice}=director();n.sync(1,true,1,0);const old=voice.last;
 n.sync(2,true,5,100);assert.equal(voice.calls.length,2);assert.equal(n.current?.id,'first');assert.ok(voice.last.rate<=1.22);
 old.cb.end();n.sync(2.1,true,5,200);assert.equal(voice.calls.length,2);
 n.sync(2.2,true,.5,300);assert.ok(voice.last.rate>=.85);assert.equal(voice.last.text,'First explanation.');
});
test('visual pacing stays inside the speaking event and catches short cue onsets at high speed',()=>{
 const {n,voice}=director();n.sync(9.99,true,5,0);voice.last.cb.start();
 const rate=n.maxRate(9.99,100,.1);assert.ok(9.99+rate*.1<10);
 n.sync(11.9,true,5,100);assert.ok(Math.abs(n.maxRate(11.9,100,.1)-1)<1e-8,'lands at next event, not beyond it');
 const t=new Timeline();t.phase='long';t.playing=true;t.speed=5;t.update(.1,.2);assert.ok(Math.abs(t.position-.02)<1e-12);
});
test('unavailable, errored or stuck voice never freezes the visual clock',()=>{
 for(const action of ['unavailable','error','pending','stuck']){
  const {n,voice}=director();if(action==='unavailable')voice.available=false;
  n.sync(0,true,1,0);
  if(action==='error')voice.last.cb.error('audio-busy');
  if(action==='pending')n.sync(0,true,1,4100);
  if(action==='stuck'){voice.last.cb.start();n.sync(0,true,1,100000);}
  assert.equal(n.maxRate(0,8,.1),8,action);if(action!=='unavailable')assert.ok(n.error);
 }
});
test('rebuilding a model replaces the old narrative and clears its speech queue',()=>{
 const {n,voice}=director();n.sync(1,true,1,0);const old=voice.last;
 n.setTrack([cue('changed-food',0,10,['A different meal.'])]);old.cb.end();
 n.sync(1,true,1,100);assert.equal(voice.last.text,'A different meal.');assert.equal(n.current?.id,'changed-food');
});

const week=cloneDiet(),s=scenarioForDay(cloneScenario(),week[0]),day=simulateDay(s),intense=simulateIntenseDay(s);
test('daily cues use actual meal/workout times and respond to removed food and exercise',()=>{
 const normal=dayNarration(s,day,week[0]);
 const t=(week[0].meals[0].hour-6+24)%24*60;
 assert.equal(normal.find(c=>c.id==='meal-0-plate')?.start,t);
 assert.ok(normal.some(c=>c.id==='exercise-uptake'));
 const changed=structuredClone(week[0]);changed.meals[0].foods.forEach(p=>p.grams=0);
 const rest=scenarioForDay(cloneScenario(),changed);rest.activity.exercise_minutes=0;
 const cues=dayNarration(rest,simulateDay(rest),changed);
 assert.ok(cues.some(c=>c.id==='meal-0-empty'));assert.ok(!cues.some(c=>c.id.startsWith('exercise-')));
 for(let i=1;i<cues.length;i++)assert.ok(cues[i-1].end<=cues[i].start);
 assert.equal(cueAt(orderedCues([cue('a',0,20),cue('b',10,15)],30),12)?.id,'b');
});
test('sprint cues are attached to phases of the configured protocol, not wall-clock delays',()=>{
 const c=intense.session.config,cues=sprintNarration(intense,week[0]),start=intense.session.startMinute;
 assert.equal(cueAt(cues,start-c.warmup_minutes)?.id,'sprint-intro');
 assert.equal(cueAt(cues,start+.001)?.id,'sprint-first');
 assert.equal(cueAt(cues,start+c.sprint_seconds/60+.001)?.id,'walk-first');
 assert.equal(cueAt(cues,start+2*(c.sprint_seconds+c.walk_seconds)/60+.001)?.id,'sprint-pathways');
 assert.ok(cues.some(c=>c.id==='walk-fatigue'));assert.ok(cues.some(c=>c.id==='sprint-power'));
 const noWalk=intense.session.startMinute+intense.session.lastSecond/60;
 assert.ok(cues.filter(c=>c.id.startsWith('sprint-')||c.id.startsWith('walk-')).every(c=>c.end<=noWalk));
});
test('cues that describe related plots emphasize both of them',()=>{
 const normal=dayNarration(s,day,week[0]),sprint=sprintNarration(intense,week[0]);
 for(const id of ['exercise-start','exercise-recovery'])assert.ok(normal.find(c=>c.id===id)!.emphasis.some(e=>e.card==='heart'));
 assert.ok(sprint.find(c=>c.id==='sprint-intro')!.emphasis.some(e=>e.card==='power-fatigue'));
 assert.ok(sprint.find(c=>c.id==='walk-first')!.emphasis.some(e=>e.card==='oxygen'));
});
test('long scene context follows the food-driven fat trend instead of assuming annual improvement',()=>{
 const app:DietApplication={week:structuredClone(dietTemplates['fast-food']),startDay:0};
 const states=simulateLongTerm(s,1095,app),story=longStory(states,1095);
 assert.ok(states.at(-1)!.fat-states[1005].fat>.15);assert.match(story.title,/growing/);assert.ok(story.keys.includes('Fat mass increasing'));
 assert.match(longStory(states,.1).title,/growing/,'even early playback reflects a rising rate rather than a tiny accumulated change');
});
test('long narration respects deficits, model limits, selected labs and unsupported lab forecasts',()=>{
 const app:DietApplication={week:cloneDiet(),startDay:0,micronutrients:{intent:'lab',selected:['ferritin'],observations:{ferritin:{value:400,unit:'µg/L'}}}};
 const lean=cloneScenario(s);lean.person.body_fat_fraction=.08;
 const sparse=structuredClone(app);sparse.week.forEach(d=>d.meals.forEach(m=>m.foods.forEach(p=>p.grams*=.45)));
 const states=simulateLongTerm(lean,1095,sparse),labs=simulateLabMarkers(sparse),cues=longNarration(lean,states,labs,sparse);
 assert.ok(cues.some(c=>c.id==='model-limit'));const lab=cues.find(c=>c.id==='lab-ferritin')!;
 assert.ok(lab,'lab model can still be inspected after the body projection limit');
 assert.match(lab.sentences[0],/not estimated/);assert.ok(!cues.some(c=>c.id==='lab-b12'));
});
