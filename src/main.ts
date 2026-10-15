import './style.css';
import { cloneScenario, type Scenario } from './model/config';
import { bodyComposition, selectedBodyPreset, withBodyPreset, type BodyPreset } from './model/composition';
import { sampleDay } from './model/day';
import { defaultCoffee, coffeeForSchedule, coffeeSlots, coffeeClock, simulateCaffeine, sampleCaffeine } from './model/caffeine';
import { coffeeMarkup, coffeePlotSpecs, coffeeDuration, coffeeScene, coffeeMoment, coffeeCup } from './visual/coffee';
import { withCoffeeNarration } from './engine/coffeeNarration';
import { simulateLongTerm, sampleLongTerm } from './model/longTerm';
import { simulateIntenseDay, sampleIntenseDay, defaultSprintConfig } from './model/sprint';
import { chapters, chapterAt, Timeline } from './engine/timeline';
import { Narration } from './engine/narration';
import { BodyView } from './visual/body';
import { PlotCard, type PlotSpec, type SystemId } from './visual/plotCard';
import { dayPlotSpecs, sprintPlotSpecs, longPlotSpecs } from './visual/plotSpecs';
import { plotTip } from './visual/plotTips';
import { longStory } from './visual/longStory';
import { dayNarration, sprintNarration, longNarration } from './engine/narrationEvents';
import { normalStory,sprintStory,activityCaption,type Story } from './visual/presentation';
import { dialogsMarkup } from './visual/dialogs';
import { cloneDiet, dietDayAt, foodById, totals, scenarioForDay, type DietApplication, type DietDay } from './model/diet';
import { simulateDiet } from './model/dietSimulation';
import { representativeDay, supportsDailyBody } from './model/dayContext';
import { energyBudget } from './model/energy';
import { dietDialogMarkup, setupDiet } from './visual/dietPanel';
import { mealPlate } from './visual/plates';
import { ActivityView } from './visual/activity';
import { EducationalTooltips, setTip } from './visual/tooltips';
import { simulateLabMarkers } from './model/labProjection';
import { defaultCycle, validateCycle, profileFromScenario, bleedingScenarios, ironPerMlBlood, type MenstrualCycle } from './model/profile';
import './visual/status.css';
import './visual/viewer.css';
import './visual/profile.css';
import './visual/plots.css';
import './visual/documentary.css';
import './visual/coffee.css';

const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const fmt=(n:number)=>Math.round(n).toLocaleString('en');
const signed=(n:number,d=1)=>`${n>=0?'+':'−'}${Math.abs(n).toFixed(d)}`;
const clock=(minute:number,seconds=false)=>{const t=Math.round((360+minute)*60)%86400;return `${String(Math.floor(t/3600)).padStart(2,'0')}:${String(Math.floor(t%3600/60)).padStart(2,'0')}${seconds?':'+String(t%60).padStart(2,'0'):''}`;};
// Write only on change, so per-frame rendering does not churn DOM nodes.
const setText=(el:Element,text:string)=>{if(el.textContent!==text)el.textContent=text;};
let scenario=cloneScenario(),sprintConfig={...defaultSprintConfig};
let dietApplication:DietApplication={template:'healthy',week:cloneDiet(),startDay:0,profile:profileFromScenario(scenario)};
let weekSimulation=simulateDiet(scenario,dietApplication);scenario=scenarioForDay(scenario,dietDayAt(dietApplication,0));
let day=weekSimulation.days[0],longStates=simulateLongTerm(scenario,1095,dietApplication),intense=simulateIntenseDay(scenario,sprintConfig,weekSimulation.options[0]),scenes=chapters(scenario);
let nutrientSimulation=simulateLabMarkers(dietApplication);
// The daily view holds the selected modeled body through its acute food/activity
// sequence. A cached representative week supplies fuel at that body's capacities.
let baseIntense=intense,dayContext:ReturnType<typeof representativeDay>|null=null,dayScenario=weekSimulation.scenarios[0],activeFoodDay:DietDay=dietDayAt(dietApplication,0);
let coffee=coffeeForSchedule(dayScenario,defaultCoffee),coffeeDay=simulateCaffeine(dayScenario,coffee);
let representative:number|null=null,longPosition=0,lastDay:{phase:'day'|'intense';position:number}={phase:'day',position:0};
const timeline=new Timeline(),narrator=new Narration();timeline.seek('long',0);
let sceneId='',layoutKey='',chartKey='',cameoKey='',narrationKey='',visualSeconds=0,lastFrame=performance.now(),lastRender=0;
let chosenSystem:SystemId='guided',plotCards:PlotCard[]=[],plotSpecs:PlotSpec[]=[],captionsEnabled=false,captionsChosen=false;
let mobilePlot:PlotCard|null=null,mobilePlotSpec:PlotSpec|null=null;
const mobileLayout=matchMedia('(max-width:760px)');
const systems:[SystemId,string,string][]=[['cardiovascular','Cardiovascular','♡'],['metabolism','Metabolism','⇄'],['muscular','Muscular','↟'],['digestion','Digestion','◌'],['brain','Brain','⌁'],['micronutrients','Micronutrients','⠿']];
const focusFor:Record<SystemId,string>={guided:'all',cardiovascular:'blood',metabolism:'stores',muscular:'muscle',digestion:'digestion',brain:'brain',micronutrients:'stores'};
const icon='<svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M3 15h6l3-8 4 14 3-6h6" stroke="currentColor" stroke-width="1.6"/><circle cx="14" cy="14" r="12" stroke="currentColor" stroke-opacity=".4"/></svg>';
$('app').innerHTML=`
<header class="site-header"><a class="brand" href="/">${icon}<span>HUMAN ENERGY FLOW</span></a><span class="header-note">AN INSIDE VIEW OF EVERYDAY PHYSIOLOGY</span><div class="header-actions"><span id="active-diet" class="active-diet"></span><button id="diet-open" class="text-button">Diet ＋</button><button id="scenario-open" class="text-button"><span id="profile-badge">Male · 35</span><span> · Adjust scenario ↗</span></button><button id="science-open" class="text-button">The science ＋</button></div></header>
<main><section class="intro"><div><div class="eyebrow">FOOD · EFFORT · RECOVERY</div><h1>Follow the fuel. <em>See what changes.</em></h1></div><nav class="view-nav" aria-label="Simulation views"><div id="view-group-long" class="view-group active"><span id="view-tab-long" class="view-tab active">Over Time</span><button id="view-tab-day" class="text-button">↗ Show Inside a Day</button></div><div id="view-group-day" class="view-group" hidden><button id="back-to-long" class="text-button">← Back to Over Time</button><div class="view-modes" role="group" aria-label="Inside a Day examples"><button id="phase-day" class="active" aria-pressed="true">Healthy day</button><button id="phase-intense" aria-pressed="false">Sprint session</button></div></div></nav></section>
<section class="simulation" aria-label="Interactive metabolism simulation">
<aside class="story-panel"><div id="day-context" class="day-context" hidden><span id="day-context-label"></span><strong id="day-context-body"></strong><small id="day-context-note"></small><div><button id="day-context-reset" type="button" class="text-button">Show day 1</button></div></div><div class="eyebrow" id="scene-eyebrow"></div><h2 id="scene-title"></h2><ul id="scene-keys" class="scene-keys"></ul><div id="meal-cameo" class="meal-cameo" hidden></div><div id="coffee-cameo" class="coffee-cameo" hidden></div><div id="scene-facts" class="scene-facts"></div><details class="why-panel" id="why-panel"><summary>Why this happens <span>＋</span></summary><p id="caption"></p></details><div id="inspector" class="inspector" hidden></div><div class="explore-hint">Select an organ to explore <span>↗</span></div></aside>
<div class="body-stage"><div class="stage-top"><div class="anatomy-controls"><div class="view-picker" role="group" aria-label="Anatomical view"><button id="view-front" class="active" aria-pressed="true">Front</button><button id="view-back" aria-pressed="false">Back</button></div></div><span id="activity-tag" class="sr-only">RESTING</span><div id="activity-wrap" class="activity-wrap"><div id="activity-person" class="activity-vignette"></div><span id="activity-caption" class="activity-caption" aria-hidden="true">Resting</span></div></div><div id="body-host"></div><nav class="system-rail" aria-label="Physiological systems">${systems.map(([id,label,icon])=>`<button type="button" data-system="${id}" aria-pressed="false"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`).join('')}</nav><div class="legend body-legend" id="body-legend" role="group" aria-label="Nutrient signals"><span class="gold"><i aria-hidden="true">●</i>Glucose</span><span class="purple"><i aria-hidden="true">◎</i>Insulin</span><span class="cyan"><i aria-hidden="true">◆</i>Amino acids</span><span class="sand"><i aria-hidden="true">▪</i>Fat</span><span id="coffee-legend" class="coffee-legend" hidden><i aria-hidden="true">⬡</i>Caffeine</span></div><div class="body-bottom"><span id="body-note" class="body-note">SELECT A SYSTEM TO FOLLOW</span><span id="person-label" class="person-label"></span></div><div id="mobile-follow" class="mobile-follow"><span class="tiny-label">FOLLOWING THIS MOMENT</span><div id="mobile-plot-host"></div></div>
<section class="transport" aria-label="Playback controls"><div class="transport-top"><div class="play-controls"><button id="play" class="play-button" aria-label="Play simulation">▶</button><button id="restart" class="icon-button" aria-label="Restart simulation">↺</button><span class="time-display" id="time-display">06:00</span><span id="time-context" class="tiny-label">DAY 01</span></div><div class="transport-middle"><button id="go-intervals" class="text-button" hidden>Go to intervals →</button></div><div class="secondary-controls"><button id="voice" class="text-button" aria-pressed="false">Voice off ♫</button><button id="captions" class="text-button" aria-pressed="false">Captions off</button><label class="speed-label" for="speed"><span id="rate-badge">Speed</span><select id="speed"><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="5">5×</option></select></label></div></div>
<div id="session-transport" hidden><div class="session-caption"><strong id="rep-counter">REP 1 / 20</strong><span id="interval-phase">SPRINT</span><strong id="interval-countdown">6.0 <small>s</small></strong><span class="session-key"><i></i> Sprint <i></i> Walk</span></div><div id="interval-strip" class="interval-strip" role="group" aria-label="Sprint repetitions"></div><input id="interval-scrubber" type="range" min="0" max="720" step=".1" value="0" aria-label="Interval session time"/><div class="interval-endpoints"><span>First effort</span><span>Incomplete recovery accumulates</span><span>Last effort</span></div></div>
<div id="day-timeline"><label class="tiny-label" id="day-timeline-label" for="scrubber">FULL DAY</label><input id="scrubber" type="range" min="0" max="1440" value="0" step="1" aria-label="Simulation time"/><div id="transport-axis" class="transport-axis" aria-hidden="true"></div><div class="jump-links"><span class="tiny-label">JUMP TO</span><div id="milestones" class="milestones"></div></div></div></section>${coffeeMarkup()}<div class="narration-guide" id="narration-guide" aria-live="off" hidden><div><span class="narration-dot" aria-hidden="true"></span><span id="narration-status">TIMELINE GUIDE</span></div><p id="narration-caption"></p></div></div>
<aside class="state-panel" aria-label="Physiology plots"><div class="panel-heading"><span class="eyebrow" id="stores-heading">ADAPTATION OVER TIME</span><span id="panel-units">DRAG TO EXPLORE</span></div><div id="physiology-plots"></div><button id="stores-watch-open" type="button" class="nutrient-shortcut text-button">Micronutrients · explore diet & labs ↗</button><div class="energy-card"><div><span id="energy-heading">DAY BUDGET</span><strong><span id="intake-value"></span> <small>in</small> <i>/</i> <span id="spent-value"></span> <small>out</small></strong></div><small id="balance-note"></small><details id="energy-details"><summary>Energy details</summary><div id="budget-details"></div></details></div></aside>
</section>
<footer><span>EDUCATIONAL ANATOMY & PHYSIOLOGY <i>·</i> Relative states, approximate estimates.</span><span id="footer-status">Food. Movement. Recovery.</span></footer></main>${dialogsMarkup()}${dietDialogMarkup()}`;
const body=new BodyView($('body-host')),activityView=new ActivityView($('activity-person')),tooltipUI=new EducationalTooltips(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');

const organText:Record<string,[string,string]>={brain:['Brain','Continuous energy demand; thinking adds only a small extra cost.'],heart:['Heart','Pumps blood through lungs and tissues. Oxygen delivery rises with effort.'],lungs:['Lungs','Blood gains oxygen and releases carbon dioxide across the pulmonary circulation.'],liver:['Liver','Stores glycogen and helps maintain circulating glucose between meals.'],gut:['Digestive system','Glucose and amino acids go first to the liver; most dietary fat arrives through lymph.'],pancreas:['Pancreas','Insulin is a signal, not stored energy. It coordinates nutrient uptake and storage.'],kidneys:['Kidneys','Filter blood and regulate water, electrolytes and waste. They lie behind the bowel.']};
for(const organ of document.querySelectorAll<HTMLElement>('[data-organ]')){
 const show=()=>{const [name,text]=organText[organ.dataset.organ!];$('inspector').innerHTML=`<div><strong>${name}</strong><button id="close-inspector" aria-label="Close organ details">×</button></div><p>${text}</p>`;$('inspector').hidden=false;$('close-inspector').onclick=()=>$('inspector').hidden=true;};
 organ.addEventListener('click',show);organ.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});
}
function selectView(view:'front'|'back'){body.setView(view);for(const id of ['front','back']){$(`view-${id}`).classList.toggle('active',id===view);$(`view-${id}`).setAttribute('aria-pressed',String(id===view));}}
$('view-front').onclick=()=>selectView('front');$('view-back').onclick=()=>selectView('back');
// Switching phase or view always pauses. The exact long-term float position and the last day position are remembered.
function setPhase(phase:Timeline['phase'],position:number){
 tooltipUI.hide();
 if(timeline.phase==='long'&&phase!=='long')longPosition=timeline.position;
 if(timeline.phase!=='long')lastDay={phase:timeline.phase,position:timeline.position};
 timeline.playing=false;timeline.seek(phase,position);visualSeconds=position*60;narrator.cancel();sceneId='';layoutKey='';render();
}
// Manual seeks (scrubbers, milestones, chart) pause playback.
function seek(position:number){tooltipUI.hide();timeline.playing=false;timeline.position=position;visualSeconds=position*60;narrator.cancel();sceneId='';render();}
function setDayContext(position:number|null){
 tooltipUI.hide();
 if(position===null){
  dayContext=null;representative=null;day=weekSimulation.days[0];dayScenario=weekSimulation.scenarios[0];activeFoodDay=dietDayAt(dietApplication,0);intense=baseIntense;
 }else{
  if(dayContext?.position!==position)dayContext=representativeDay(scenario,dietApplication,longStates,position,weekSimulation);
  representative=dayContext.elapsed;day=dayContext.day;dayScenario=dayContext.scenario;activeFoodDay=dayContext.food;
  intense=position===0?baseIntense:simulateIntenseDay(dayScenario,sprintConfig,dayContext.options);
 }
 scenes=chapters(dayScenario);
 rebuildCoffee();
 layoutKey='';chartKey='';narrationKey='';cameoKey='';sceneId='';
}
function updateLayout(){
 const isLong=timeline.phase==='long',isIntense=timeline.phase==='intense';
 const key=`${timeline.phase}|${representative}`;if(key===layoutKey)return;layoutKey=key;chartKey='';narrationKey='';
 $('go-intervals').hidden=!isIntense;$('session-transport').hidden=!isIntense;$('day-timeline-label').textContent=isLong?'LONG-TERM VIEW':isIntense?'FULL DAY':'A SINGLE DAY';
 $('milestones').classList.toggle('long-milestones',isLong);
 $('transport-axis').innerHTML=(isLong?['Start','Year 1','Year 2','Year 3']:['06:00','12:00','18:00','00:00','06:00']).map(label=>`<span>${label}</span>`).join('');
 const slider=$<HTMLInputElement>('scrubber');slider.max=isLong?'1095':'1440';slider.step=isLong?'any':isIntense?'.01':'1';
 const marks:[string,number][]=isLong?[['Start',0],['3 months',91],['6 months',182],['Year 1',365],['Year 2',730],['Year 3',1095]]:[['Morning',0],...dayScenario.meals.filter(m=>m.name!=='Snack').map(m=>[m.name,(m.hour-6+24)%24*60] as [string,number]),[isIntense?'Intervals':'Exercise',isIntense?intense.session.startMinute:(dayScenario.activity.exercise_start_hour-6+24)%24*60],['Sleep',(dayScenario.activity.sleep_start_hour-6+24)%24*60],['Day ends',1440]];
 if(timeline.phase==='day'&&coffee.enabled)marks.push(['Coffee',coffee.minute]);
 $('coffee-controls').hidden=timeline.phase!=='day';
 $('milestones').innerHTML=marks.sort((a,b)=>a[1]-b[1]).map(([name,pos])=>`<button data-seek="${pos}">${name}</button>`).join('');
 $('milestones').querySelectorAll<HTMLElement>('button').forEach(b=>b.onclick=()=>seek(Number(b.dataset.seek)));
 if(isIntense){
  $('interval-strip').innerHTML=Array.from({length:sprintConfig.repetitions},(_,i)=>`<button data-rep="${i+1}" aria-label="Go to repetition ${i+1}"><span class="rep-segments"><i style="flex:${sprintConfig.sprint_seconds}"></i><b style="flex:${sprintConfig.walk_seconds}"></b></span><small>${i+1}</small></button>`).join('');
  $('interval-strip').querySelectorAll<HTMLElement>('button').forEach(b=>b.onclick=()=>seek(intense.session.startMinute+(Number(b.dataset.rep)-1)*(sprintConfig.sprint_seconds+sprintConfig.walk_seconds)/60));
  $<HTMLInputElement>('interval-scrubber').max=String(intense.session.durationSeconds);
 }
 $('view-group-long').hidden=!isLong;$('view-group-day').hidden=isLong;
 $('day-context').hidden=isLong||representative===null;
 if(dayContext){
  $('day-context-label').textContent=`Representative ${activeFoodDay.name} · day ${fmt(dayContext.elapsed+1)}`;
  $('day-context-body').textContent=`${dayContext.body.weight.toFixed(1)} kg · ${(dayContext.body.fat/dayContext.body.weight*100).toFixed(1)}% body fat`;
  $('day-context-note').textContent=dayContext.body.atLimit?'Body held at the projection limit. Acute physiology is illustrative.':`Body at month ${(dayContext.position/365*12).toFixed(1)} · held through this day.`;
 }
}
function updatePlots(kind:string){
 if(chartKey===kind)return;
 // Preserve the coordinate system through a gesture, including a boundary crossing.
 if(chartKey&&timeline.phase==='intense'&&(plotCards.some(card=>card.interacting)||mobilePlot?.interacting))return;
 chartKey=kind;tooltipUI.hide();
 plotCards.forEach(card=>card.dispose());
 plotSpecs=kind==='long'?longPlotSpecs(longStates,nutrientSimulation,dietApplication):kind==='sprint'?sprintPlotSpecs(intense):dayPlotSpecs(kind==='intense-day'?intense.day:day,kind==='intense-day'?intense.scenario:dayScenario);
 if(kind==='day')plotSpecs.splice(2,0,...coffeePlotSpecs(coffeeDay));
 plotCards=plotSpecs.map(spec=>new PlotCard(spec,seek));
 $('physiology-plots').replaceChildren(...plotCards.map(card=>card.element));
}
function updateNarrationTrack(){
 const key=`${timeline.phase}|${representative}`;if(narrationKey===key)return;narrationKey=key;
 narrator.setTrack(timeline.phase==='long'?longNarration(scenario,longStates,nutrientSimulation,dietApplication):timeline.phase==='intense'?sprintNarration(intense,activeFoodDay):withCoffeeNarration(dayNarration(dayScenario,day,activeFoodDay),coffeeDay,dayScenario));
}
function guidePlots(focus:string){
 const cue=narrator.current,automatic=chosenSystem==='guided';
 const sceneSystem:SystemId=focus==='muscle'||focus==='recovery'?'muscular':focus==='blood'?'cardiovascular':focus==='digestion'?'digestion':focus==='brain'?'brain':'metabolism';
 const system=automatic?(cue?.system||sceneSystem):chosenSystem;
 const targets=automatic?cue?.emphasis.filter(e=>plotSpecs.some(spec=>spec.id===e.card)):undefined;
 const anyRelevant=plotSpecs.some(spec=>spec.systems.includes(system));
 for(let i=0;i<plotCards.length;i++){
  const spec=plotSpecs[i],highlight=automatic?cue?.emphasis.find(e=>e.card===spec.id):null;
  const active=targets?.length?!!highlight:anyRelevant?spec.systems.includes(system):null;
  plotCards[i].update(timeline.position);plotCards[i].emphasize(active,highlight?.series);
  for(const series of spec.series)setTip(`metric-${series.id}`,plotTip(spec,series,timeline.position));
 }
 document.querySelectorAll<HTMLElement>('.system-rail [data-system]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.system===chosenSystem));b.classList.toggle('guided-focus',automatic&&b.dataset.system===system);});
 document.querySelector<HTMLElement>('.body-stage')!.dataset.focusSystem=system;
 // One followed plot beside mobile playback; the full set remains below.
 const followed=plotSpecs.find(spec=>targets?.some(t=>t.card===spec.id))||plotSpecs.find(spec=>spec.systems.includes(system))||plotSpecs[0];
 if(mobileLayout.matches&&followed){
  if(mobilePlotSpec!==followed&&!mobilePlot?.interacting){mobilePlot?.dispose();mobilePlot=new PlotCard(followed,seek,'mobile-');mobilePlotSpec=followed;delete mobilePlot.element.dataset.plot;mobilePlot.element.dataset.previewPlot=followed.id;mobilePlot.element.querySelector('[role=slider]')!.setAttribute('aria-label',`Following ${followed.title} — time position`);$('mobile-plot-host').replaceChildren(mobilePlot.element);}
  mobilePlot?.update(timeline.position);mobilePlot?.emphasize(anyRelevant||targets?.length?true:null,targets?.find(t=>t.card===mobilePlotSpec?.id)?.series);
 }else if(mobilePlot){mobilePlot.dispose();mobilePlot=null;mobilePlotSpec=null;$('mobile-plot-host').replaceChildren();}
 const guide=$('narration-guide');guide.hidden=!captionsEnabled&&!narrator.error&&narrator.available;
 guide.setAttribute('aria-live',!narrator.enabled&&!guide.hidden?'polite':'off');
 guide.dataset.cue=cue?.id||'';
 setText($('narration-caption'),narrator.caption||'The next explanation begins with the next event.');
 setText($('narration-status'),narrator.error||(!timeline.playing?'PAUSED · TIMELINE GUIDE':narrator.pacing?'NARRATING · TIMELINE PACING':'TIMELINE GUIDE'));
 $('voice').textContent=!narrator.available?'Captions only':narrator.error?'Retry voice ♫':`Voice ${narrator.enabled?'on':'off'} ♫`;
 $('voice').setAttribute('aria-pressed',String(narrator.enabled));
 $('captions').setAttribute('aria-pressed',String(captionsEnabled));$('captions').textContent=`Captions ${captionsEnabled?'on':'off'}`;
 return automatic?(cue?.focus||focus):focusFor[chosenSystem];
}
// The meal being eaten at this minute of the active day (meal activity lasts 15 minutes after the meal hour).
function mealAt(minute:number){return activeFoodDay.meals.map(m=>({meal:m,elapsed:minute-(m.hour-6+24)%24*60})).filter(m=>m.elapsed>=0&&m.elapsed<30).sort((a,b)=>a.elapsed-b.elapsed)[0]?.meal;}
function render(){
 updateLayout();updateNarrationTrack();narrator.sync(timeline.position,timeline.playing,timeline.speed,performance.now());const isLong=timeline.phase==='long',isIntense=timeline.phase==='intense',position=timeline.position;
 const bundle=isIntense?sampleIntenseDay(intense,position):null;
 const s=bundle?bundle.body:sampleDay(isLong?weekSimulation.days[0]:day,isLong?90:position),sp=bundle?.sprint||null;
 const sessionRelevant=!!sp&&sp.phase!=='before'&&position<=intense.session.startMinute+intense.session.lastSecond/60;
 const adaptation=isLong?sampleLongTerm(longStates,position):null;
 const elapsedDay=Math.min(1094,Math.floor(position)),longScenario=isLong?scenarioForDay(scenario,dietDayAt(dietApplication,elapsedDay)):null;
 const budget=isLong?energyBudget(longScenario!,adaptation!.weight,scenario.person.age+elapsedDay/365,(dietApplication.startDay+elapsedDay)%7===6):isIntense?intense.day.budget:day.budget;
 let story:Story=normalStory(chapterAt(scenes,position));
 if(sessionRelevant)story=sprintStory(sp!);
 if(isIntense&&!sessionRelevant&&story.id==='baseline')story={...story,eyebrow:'INTENSE EXERCISE DAY',keys:['Meals support the day',`${sprintConfig.repetitions} short sprints ahead`,'Recovery between efforts']};
 if(story.id==='summary')story={...story,keys:[Math.abs(budget.balance)<50?'Near energy balance':budget.balance>0?'Energy surplus':'Energy deficit',`${fmt(budget.intake)} kcal eaten`,`${fmt(budget.total)} kcal expended`],caption:`This day supplies ${fmt(budget.intake)} kcal and uses approximately ${fmt(budget.total)} kcal. Repeated energy balance affects stored energy; a single day does not predict a body transformation.`};
 if(isLong)story=longStory(longStates,position);
 const mealCandidate=activeFoodDay.meals.map((m,i)=>({meal:m,index:i,elapsed:position-(m.hour-6+24)%24*60})).filter(m=>m.elapsed>=0&&m.elapsed<90).sort((a,b)=>a.elapsed-b.elapsed)[0];
 const showMeal=!isLong&&!sessionRelevant&&s.exercisePower<=0&&!!mealCandidate;
 if(showMeal){const {meal,elapsed,index}=mealCandidate,stage=elapsed<25?0:elapsed<55?1:2;
  const emptyMeal=totals(meal.foods).kcal<1;
  story={id:`food-${index}-${stage}`,title:emptyMeal?'Meal skipped.':stage===0?meal.title:stage===1?'From plate to circulation.':'Use some. Store some.',eyebrow:`${activeFoodDay.name.toUpperCase()} / ${meal.name.toUpperCase()}`,keys:emptyMeal?['No food at this meal','Earlier nutrients still circulating']:stage===0?['Meal arriving','Digestion begins']:stage===1?['Glucose & amino acids arriving','Insulin responding']:['Glucose uptake','Glycogen replenishment'],caption:'The actual foods supply this meal’s carbohydrate, protein, fat and fibre. Their quantities determine nutrient absorption; mixed meals digest over several hours. Glucose and amino acids travel first through the liver, while most dietary fat enters through lymph.',focus:stage===2?'stores':'digestion'};
 }
 const caffeine=timeline.phase==='day'?sampleCaffeine(coffeeDay,position):null;
 const coffeeStory=caffeine&&s.exercisePower<=0&&!showMeal?coffeeScene(coffeeDay,caffeine,narrator.current?.id==='coffee-clearing'):null;
 if(coffeeStory)story=coffeeStory;
 updateMealCameo(showMeal&&!coffeeStory?mealCandidate:null,activeFoodDay.name);
 updateCoffeeCameo(!!coffeeStory,caffeine);
 $('coffee-legend').hidden=!caffeine||!coffee.enabled||position<coffee.minute;
 if(story.id!==sceneId){
  $('scene-title').textContent=story.title;$('scene-eyebrow').textContent=story.eyebrow;$('scene-keys').innerHTML=story.keys.map((k,i)=>`<li><span class="key-marker">${i===0?'↗':i===1?'↻':'·'}</span>${k}</li>`).join('');$('caption').textContent=story.caption;
  $('scene-facts').innerHTML=sessionRelevant?`<div class="protocol-line"><strong>${sprintConfig.sprint_seconds}<small>s sprint</small></strong><span>/</span><strong>${sprintConfig.walk_seconds}<small>s walk</small></strong></div>`:isLong?'<span class="tiny-label">TRAIN · NOURISH · RECOVER</span>':'';
  sceneId=story.id;
 }
 for(const [id,active]of [['phase-day',timeline.phase==='day'],['phase-intense',isIntense]] as [string,boolean][]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));}
 $('view-group-day').classList.toggle('active',!isLong);$('view-group-long').classList.toggle('active',isLong);
 document.body.classList.toggle('is-paused',!timeline.playing);document.body.classList.toggle('intense-mode',isIntense);document.body.classList.toggle('long-view',isLong);
 $('play').textContent=timeline.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',timeline.playing?'Pause simulation':'Play simulation');
 $('time-display').textContent=isLong?`Month ${(position/365*12).toFixed(1)}`:clock(position,isIntense&&sessionRelevant);
 $('time-context').textContent=isLong?`DAY ${fmt(elapsedDay+1)} · ${dietDayAt(dietApplication,elapsedDay).name.toUpperCase()}`:`${representative!==null?'REPRESENTATIVE ':''}${activeFoodDay.name.toUpperCase()}${isIntense?' · INTENSE':''}`;
 if(isLong)$<HTMLButtonElement>('view-tab-day').disabled=!supportsDailyBody(scenario,adaptation!);
 const slider=$<HTMLInputElement>('scrubber');slider.value=String(position);slider.style.setProperty('--progress',`${position/Number(slider.max)*100}%`);slider.setAttribute('aria-valuetext',$('time-display').textContent!);
 $('profile-badge').textContent=`${scenario.person.sex==='female'?'Female':'Male'} · ${scenario.person.age}`;
 const shownPerson=isLong?scenario.person:dayScenario.person;
 $('person-label').textContent=`${Math.floor(shownPerson.age)} years · ${shownPerson.sex} · ${Number(shownPerson.weight_kg.toFixed(1))} kg`;
 $('footer-status').textContent=isIntense?`One session · ${sprintConfig.repetitions}-rep illustration extends shorter-study evidence`:`${scenario.activity.sleep_hours} h sleep · ${scenario.activity.mental_work_hours} h mental work`;
 const labels:Record<string,string>={rest:'RESTING',meal:'MEAL',work:'MENTAL WORK',run:'RUNNING',resistance:'RESISTANCE',recovery:'RECOVERING',sleep:'SLEEPING',warmup:'WARM-UP',sprint:'SPRINT',walk:'WALKING RECOVERY',cooldown:'COOLDOWN'};
 $('activity-wrap').hidden=isLong;$('activity-person').hidden=isLong;
 if(!isLong){
  const drinking=!!caffeine&&coffeeMoment(coffeeDay,position);
  const meal=s.activity==='meal'?mealAt(position):undefined,caption=drinking?'Drinking coffee':activityCaption(s.activity,meal&&{name:meal.name,empty:totals(meal.foods).kcal<1});
  activityView.update(s.activity,visualSeconds,dayScenario.person,timeline.playing,reducedMotion.matches,caption,drinking);
  setText($('activity-caption'),caption);$('activity-caption').classList.toggle('sprint',sp?.phase==='sprint');
 }
 $('activity-tag').textContent=isLong?'GRADUAL ADAPTATION':caffeine?.drinking?'DRINKING COFFEE':labels[s.activity]||'RECOVERING';$('activity-tag').classList.toggle('sprint-tag',sp?.phase==='sprint');
 $('body-note').textContent=isLong?'ORGANS SHOW A REPRESENTATIVE RESTING DAY':sessionRelevant?'MUSCLE LIGHTNESS FOLLOWS PCr AVAILABILITY':'SELECT A SYSTEM TO FOLLOW';
 $('phase-day').textContent=((representative===null||representative===0)&&dietApplication.once?dietApplication.onceTemplate||dietApplication.template||'healthy':dietApplication.template||'healthy')==='healthy'?'Healthy day':'Daily routine';
 $('stores-heading').textContent=isLong?'ADAPTATION OVER TIME':sessionRelevant?'OUTPUT & RECOVERY':'IN THIS MOMENT';
 updatePlots(isLong?'long':sessionRelevant?'sprint':isIntense?'intense-day':'day');
 const bodyFocus=guidePlots(story.focus);
 tooltipUI.refresh(!timeline.playing);
 $('energy-heading').textContent=isLong?'THIS DAY’S BUDGET':'DAY BUDGET';
 $('intake-value').textContent=fmt(budget.intake);$('spent-value').textContent=fmt(budget.total);$('balance-note').textContent=`${signed(budget.balance,0)} kcal · ${Math.abs(budget.balance)<50?'near energy balance':budget.balance>0?'estimated surplus':'estimated deficit'}`;
 $('budget-details').innerHTML=`<span>Resting organs <b>${fmt(budget.resting)}</b></span><span>Ordinary movement <b>${fmt(budget.movement)}</b></span><span>${isIntense?'Sprint session':'Exercise above rest'} <b>${fmt(budget.exercise)}</b></span><span>Food processing <b>${fmt(budget.thermic)}</b></span><small>kcal/day · approximate</small>`;
 $('go-intervals').hidden=!isIntense||sp?.phase==='sprint'||sp?.phase==='walk';
 if(isIntense&&sp){
  $('rep-counter').textContent=`REP ${sp.rep||'—'} / ${sprintConfig.repetitions}`;$('interval-phase').textContent=sp.phase==='before'?'SESSION AHEAD':sp.phase==='after'?'SESSION COMPLETE':sp.phase==='walk'?'WALK / RECOVER':sp.phase.toUpperCase();
  $('interval-countdown').innerHTML=`${sp.remaining.toFixed(1)} <small>s left</small>`;
  const it=$<HTMLInputElement>('interval-scrubber');it.value=String(Math.max(0,Math.min(intense.session.durationSeconds,sp.seconds)));it.style.setProperty('--progress',`${Math.max(0,Math.min(1,sp.seconds/intense.session.durationSeconds))*100}%`);it.setAttribute('aria-valuetext',`Repetition ${sp.rep}, ${sp.phase}, ${sp.remaining.toFixed(1)} seconds remaining`);
  $('interval-strip').querySelectorAll<HTMLElement>('button').forEach(b=>{const n=Number(b.dataset.rep);b.classList.toggle('current',n===sp.rep&&['sprint','walk'].includes(sp.phase));b.classList.toggle('complete',n<sp.rep||sp.phase==='after');b.setAttribute('aria-pressed',String(n===sp.rep));});
 }
 body.update(s,adaptation,visualSeconds,'all',sessionRelevant?sp:null,bodyFocus,shownPerson,dayContext?.body.leanGain??0,caffeine);
}
$('play').onclick=()=>{tooltipUI.hide();if(timeline.position>=(timeline.phase==='long'?1095:1440)){timeline.position=0;visualSeconds=0;narrator.cancel();}timeline.playing=!timeline.playing;if(!timeline.playing)narrator.pause();render();};
$('restart').onclick=()=>{tooltipUI.hide();timeline.playing=false;timeline.seek(timeline.phase,0);visualSeconds=0;narrator.cancel();sceneId='';render();};
$('phase-day').onclick=()=>setPhase('day',0);$('phase-intense').onclick=()=>setPhase('intense',intense.session.startMinute-sprintConfig.warmup_minutes);
$('view-tab-day').onclick=()=>{if(timeline.phase==='long'){if(dayContext?.position!==timeline.position){setDayContext(timeline.position);setPhase('day',0);}else setPhase(lastDay.phase,lastDay.position);$('view-group-day').querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({preventScroll:true});}};

$('back-to-long').onclick=()=>{setPhase('long',longPosition);$('view-tab-day').focus({preventScroll:true});};
$('day-context-reset').onclick=()=>{setDayContext(null);setPhase(timeline.phase,timeline.phase==='intense'?intense.session.startMinute-sprintConfig.warmup_minutes:0);};
$('go-intervals').onclick=()=>seek(intense.session.startMinute);
$('scrubber').oninput=()=>seek(Number($<HTMLInputElement>('scrubber').value));$('interval-scrubber').oninput=()=>seek(intense.session.startMinute+Number($<HTMLInputElement>('interval-scrubber').value)/60);
$('speed').onchange=()=>{timeline.speed=Number($<HTMLSelectElement>('speed').value);render();};
$('voice').onclick=()=>{if(narrator.toggle()&&!captionsChosen)captionsEnabled=true;render();};
$('captions').onclick=()=>{captionsChosen=true;captionsEnabled=!captionsEnabled;render();};
if(!narrator.available){$<HTMLButtonElement>('voice').disabled=true;$('voice').textContent='Captions only';}
for(const btn of document.querySelectorAll<HTMLElement>('.system-rail [data-system]'))btn.onclick=()=>{
 const selected=btn.dataset.system as SystemId;
 chosenSystem=chosenSystem===selected?'guided':selected;tooltipUI.hide();render();
 if(chosenSystem==='micronutrients'&&(timeline.phase!=='long'||!Object.keys(nutrientSimulation).length))dietUI.openStores();
};

function rebuildCoffee(){
 const slots=coffeeSlots(dayScenario);
 coffee=coffeeForSchedule(dayScenario,coffee);
 coffeeDay=simulateCaffeine(dayScenario,coffee);
 const select=$<HTMLSelectElement>('coffee-time');
 select.innerHTML=slots.map(m=>`<option value="${m}">${coffeeClock(m)}</option>`).join('');select.value=String(coffee.minute);
 $<HTMLInputElement>('coffee-enabled').checked=coffee.enabled;$<HTMLSelectElement>('coffee-dose').value=String(coffee.doseMg);
 select.disabled=!coffee.enabled;$<HTMLSelectElement>('coffee-dose').disabled=!coffee.enabled;$<HTMLButtonElement>('coffee-jump').disabled=!coffee.enabled;
 $('coffee-duration').innerHTML=coffeeDuration(coffeeDay);
 chartKey='';narrationKey='';layoutKey='';sceneId='';narrator.cancel();
}
function editCoffee(){
 timeline.playing=false;tooltipUI.hide();
 coffee={enabled:$<HTMLInputElement>('coffee-enabled').checked,minute:Number($<HTMLSelectElement>('coffee-time').value),doseMg:Number($<HTMLSelectElement>('coffee-dose').value)};
 rebuildCoffee();render();
}
for(const id of ['coffee-enabled','coffee-time','coffee-dose'])$(id).onchange=editCoffee;
$('coffee-jump').onclick=()=>{chosenSystem='guided';seek(coffee.minute);};
let coffeeCameoKey='';
function updateCoffeeCameo(show:boolean,state:ReturnType<typeof sampleCaffeine>|null){
 const host=$('coffee-cameo');host.hidden=!show;
 if(!show||!state){coffeeCameoKey='';return;}
 const elapsed=state.minute-coffee.minute,stage=elapsed<10?0:elapsed<35?1:elapsed<75?2:3;
 const key=`${coffee.minute}|${coffee.doseMg}|${stage}`;if(key===coffeeCameoKey)return;coffeeCameoKey=key;
 host.innerHTML=`${coffeeCup}<strong>Black coffee · ~${coffee.doseMg} mg caffeine</strong><div class="coffee-flow"><span class="${stage===0?'active':''}">Cup</span>→<span class="${stage===1?'active':''}">Absorption</span>→<span class="${stage===2?'active':''}">Brain</span>→<span class="${stage===3?'active':''}">Clearance</span></div><small class="coffee-behavior">${stage<2?'Effect builds over tens of minutes.':stage===2?'Alertness ↑ · sleepiness signal ↓':'Gradual fading · no fixed finish time'}</small>`;
}

function applyScenario(next:Scenario,config=sprintConfig,app=dietApplication){
 app={...app,profile:profileFromScenario(next)};
 const micronutrients=simulateLabMarkers(app);
 const w=simulateDiet(next,app),selected=scenarioForDay(next,dietDayAt(app,0)),y=simulateLongTerm(selected,1095,app),i=simulateIntenseDay(selected,config,w.options[0]);
 nutrientSimulation=micronutrients;tooltipUI.hide();scenario=selected;dietApplication=structuredClone(app);weekSimulation=w;sprintConfig=config;longStates=y;baseIntense=i;
 // New inputs invalidate the representative body/week and remembered positions.
 longPosition=0;lastDay={phase:'day',position:0};setDayContext(null);
 const mode=timeline.phase;timeline.reset();timeline.seek(mode,mode==='intense'?intense.session.startMinute-sprintConfig.warmup_minutes:0);visualSeconds=timeline.position*60;
 narrator.cancel();sceneId='';layoutKey='';chartKey='';narrationKey='';cameoKey='';render();
}
function updateMealCameo(candidate:{meal:DietDay['meals'][number];index:number;elapsed:number}|null,weekday:string){
 const host=$('meal-cameo');host.hidden=!candidate;
 if(!candidate){cameoKey='';return;}
 const {meal,index,elapsed}=candidate,stage=elapsed<25?0:elapsed<55?1:2,key=`${weekday}-${index}-${stage}`;
 if(key===cameoKey)return;cameoKey=key;
 const n=totals(meal.foods);
 host.className=`meal-cameo ${stage===1?'meal-cameo-absorbing':''}`;
 host.innerHTML=`<span class="tiny-label">${meal.name} · ${weekday}</span>${stage<2?mealPlate(meal,'scene-meal'):''}<strong>≈ ${Math.round(n.kcal/10)*10} kcal</strong><div class="meal-macros"><span>P ${fmt(n.protein_g)} g</span><span>C ${fmt(n.carbohydrate_g)} g</span><span>F ${fmt(n.fat_g)} g</span></div><div class="meal-causal"><span class="${stage===0?'active':''}">Plate</span>→<span class="${stage===1?'active':''}">Digestion</span>→<span class="${stage===2?'active':''}">Tissues</span></div>`;
 host.title=meal.foods.filter(p=>p.grams>0).map(p=>`${foodById[p.foodId].name}: ${p.grams} g`).join(' · ');
}
let formSex:Scenario['person']['sex']='male';
function formCycle():MenstrualCycle{const c:MenstrualCycle={enabled:$<HTMLInputElement>('input-cycle-enabled').checked,lengthDays:Number($<HTMLInputElement>('input-cycle-length').value),bleedingDays:Number($<HTMLInputElement>('input-cycle-duration').value),startDay:Number($<HTMLInputElement>('input-cycle-start').value),level:document.querySelector<HTMLInputElement>('input[name="bleeding-level"]:checked')!.value as MenstrualCycle['level']};if(!c.enabled||formSex==='male'){try{validateCycle(c);}catch{return {...defaultCycle,enabled:c.enabled};}}return c;}
function formScenario(){const d=cloneScenario(scenario),n=(id:string)=>Number($<HTMLInputElement>(`input-${id}`).value);d.person={...d.person,sex:formSex,age:n('age'),weight_kg:n('weight'),height_cm:n('height'),body_fat_fraction:n('bodyfat')/100};d.activity={...d.activity,exercise_minutes:n('exercise'),sleep_hours:n('sleep'),mental_work_hours:n('work')};d.menstrualCycle=formCycle();return d;}
function updateCycleForm(){
 const c=formCycle(),female=formSex==='female';$('cycle-settings').hidden=!female;$<HTMLFieldSetElement>('cycle-fields').disabled=!female||!c.enabled;$<HTMLInputElement>('input-cycle-start').max=String(c.lengthDays);
 const valid=Number.isInteger(c.lengthDays)&&c.lengthDays>=21&&c.lengthDays<=40;
 $('cycle-preview').innerHTML=valid?Array.from({length:c.lengthDays},(_,i)=>`<i class="${i<c.bleedingDays?'bleeding':''} ${i+1===c.startDay?'selected':''}" title="Cycle day ${i+1}" aria-hidden="true"></i>`).join(''):'';
 const loss=bleedingScenarios[c.level].ml*ironPerMlBlood;
 $('cycle-loss-summary').textContent=`≈ ${Math.round(loss)} mg iron per cycle · spread over ${c.bleedingDays} bleeding days`;
 $('cycle-heavy-note').hidden=c.level!=='heavy';
}
function updateFormComposition(){
 const draft=formScenario(),p=draft.person;
 $<HTMLInputElement>('input-bodyfat').min=formSex==='female'?'14':'6';
 if(!Number.isFinite(p.weight_kg+p.height_cm+p.body_fat_fraction)||p.weight_kg<=0||p.height_cm<=0||p.body_fat_fraction<0||p.body_fat_fraction>1){$('form-body-preview').textContent='Enter weight, height and body fat to preview.';return;}
 const c=bodyComposition(p),selected=selectedBodyPreset(draft);
 document.querySelectorAll<HTMLButtonElement>('[data-body-preset]').forEach(b=>{const id=b.dataset.bodyPreset as BodyPreset,w=withBodyPreset(draft,id).person.weight_kg;b.classList.toggle('active',selected===id);b.setAttribute('aria-pressed',String(selected===id));b.disabled=w<40||w>160;});
 $('body-custom').classList.toggle('active',selected==='custom');$('body-custom').setAttribute('aria-pressed',String(selected==='custom'));
 $('form-body-preview').innerHTML=`<span>Lean <b>${c.lean.toFixed(1)} kg</b></span><span>Fat <b>${c.fat.toFixed(1)} kg</b></span><span>BMI <b>${c.bmi.toFixed(1)}</b></span>`;
 const budget=energyBudget(draft),weekBudgets=dietApplication.week.map((day,i)=>energyBudget(scenarioForDay(draft,day),p.weight_kg,p.age,i===6)),dailyUse=weekBudgets.reduce((n,b)=>n+b.total,0)/7,balance=weekBudgets.reduce((n,b)=>n+b.balance,0)/7,balanceNote=Math.abs(balance)<25?'roughly matches this energy estimate':`gives an estimated ${Math.round(Math.abs(balance))} kcal/day ${balance>0?'surplus':'deficit'}`;$('form-energy-preview').innerHTML=`<span>Resting energy <b>≈ ${fmt(budget.resting)} kcal/day</b></span><span>Daily use · week average <b>≈ ${fmt(dailyUse)} kcal/day</b></span><small>Mifflin–St Jeor + activity + food processing. Keeping the chosen food week ${balanceNote}. This is an illustrative scenario, not a personal forecast.</small>`;
 updateCycleForm();
}
for(const id of ['age','weight','height','bodyfat','exercise','sleep','work'])$(`input-${id}`).addEventListener('input',updateFormComposition);
for(const id of ['cycle-enabled','cycle-length','cycle-duration','cycle-start'])$(`input-${id}`).addEventListener('input',updateCycleForm);
document.querySelectorAll<HTMLInputElement>('input[name="bleeding-level"]').forEach(el=>el.onchange=updateCycleForm);
for(const sex of ['male','female'] as const)$(`sex-${sex}`).onchange=()=>{const draft=formScenario(),preset=selectedBodyPreset(draft);formSex=sex;draft.person.sex=sex;
 if(preset!=='custom'){const p=withBodyPreset(draft,preset).person;$<HTMLInputElement>('input-weight').value=String(p.weight_kg);$<HTMLInputElement>('input-bodyfat').value=String(p.body_fat_fraction*100);}
 $('profile-change-note').textContent=preset==='custom'?`Custom body values kept. ${sex==='female'?'Female model range: 14–50% body fat.':'Model reference values updated.'}`:'Corresponding illustrative body example selected. You can edit every body value.';updateFormComposition();
};
document.querySelectorAll<HTMLButtonElement>('[data-body-preset]').forEach(b=>b.onclick=()=>{const next=withBodyPreset(formScenario(),b.dataset.bodyPreset as BodyPreset);$<HTMLInputElement>('input-weight').value=String(next.person.weight_kg);$<HTMLInputElement>('input-bodyfat').value=String(next.person.body_fat_fraction*100);updateFormComposition();});
$('body-custom').onclick=()=>$<HTMLInputElement>('input-weight').focus();
function fillForm(s:Scenario,reset=false){formSex=s.person.sex;$<HTMLInputElement>(`sex-${formSex}`).checked=true;const c={...defaultCycle,...s.menstrualCycle};$<HTMLInputElement>('input-cycle-enabled').checked=c.enabled;$<HTMLInputElement>(`input-cycle-length`).value=String(c.lengthDays);$<HTMLInputElement>(`input-cycle-duration`).value=String(c.bleedingDays);$<HTMLInputElement>(`input-cycle-start`).value=String(c.startDay);document.querySelector<HTMLInputElement>(`input[name="bleeding-level"][value="${c.level}"]`)!.checked=true;const vals:Record<string,number>={age:s.person.age,weight:s.person.weight_kg,height:s.person.height_cm,bodyfat:s.person.body_fat_fraction*100,exercise:s.activity.exercise_minutes,sleep:s.activity.sleep_hours,work:s.activity.mental_work_hours,reps:reset?defaultSprintConfig.repetitions:sprintConfig.repetitions,'sprint-seconds':reset?defaultSprintConfig.sprint_seconds:sprintConfig.sprint_seconds,'walk-seconds':reset?defaultSprintConfig.walk_seconds:sprintConfig.walk_seconds};for(const [id,value]of Object.entries(vals))$<HTMLInputElement>(`input-${id}`).value=String(value);$('scenario-error').textContent='';$('profile-change-note').textContent='Used for energy equations, anatomy and reference values.';updateFormComposition();}
$('scenario-open').onclick=()=>{timeline.playing=false;narrator.cancel();render();fillForm(scenario);$<HTMLDialogElement>('scenario-dialog').showModal();};$('science-open').onclick=()=>{timeline.playing=false;narrator.pause();render();$<HTMLDialogElement>('science-dialog').showModal();};
document.querySelectorAll<HTMLElement>('.dialog-close').forEach(b=>b.onclick=()=>b.closest('dialog')!.close());$('scenario-dialog').setAttribute('aria-label','Adjust simulation scenario');$('science-dialog').setAttribute('aria-label','Scientific assumptions and sources');
$('default-settings').onclick=()=>fillForm(cloneScenario(),true);
$('download-settings').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({...scenario,sprint:sprintConfig,diet:dietApplication,dailyCoffee:{...coffee,clock:coffeeClock(coffee.minute)},dietDraft:dietUI.getDraft(),dietTemplateDraft:dietUI.getTemplateDraft(),nutrientStatusDraft:dietUI.getStatusDraft(),micronutrientDraft:dietUI.getMicronutrientDraft()},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='human-energy-scenario.json';a.click();URL.revokeObjectURL(url);};
$('scenario-form').onsubmit=e=>{e.preventDefault();const next=formScenario(),num=(id:string)=>Number($<HTMLInputElement>(`input-${id}`).value),config={...sprintConfig,repetitions:num('reps'),sprint_seconds:num('sprint-seconds'),walk_seconds:num('walk-seconds')};try{applyScenario(next,config);dietUI.setProfile(profileFromScenario(next));$<HTMLDialogElement>('scenario-dialog').close();}catch(err){$('scenario-error').textContent=String(err);}};
window.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body&&!document.querySelector('dialog[open]')){e.preventDefault();$('play').click();}});
document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();if(document.hidden){timeline.playing=false;narrator.pause();render();}});
const dietUI=setupDiet(dietApplication,app=>applyScenario(scenario,sprintConfig,app),()=>{timeline.playing=false;narrator.cancel();render();},()=>setPhase('long',0));
$('stores-watch-open').onclick=()=>dietUI.openStores();
rebuildCoffee();render();
function frame(now:number){const seconds=Math.min(.1,(now-lastFrame)/1000);lastFrame=now;if(!document.hidden){
 narrator.sync(timeline.position,timeline.playing,timeline.speed,now);
 let maxRate=timeline.phase==='long'?(timeline.position<365?5:18)*timeline.speed:8*timeline.speed;
 if(timeline.phase==='intense'){
  const st=sampleIntenseDay(intense,timeline.position).sprint;
  if(['warmup','sprint','walk','cooldown'].includes(st.phase)){
   maxRate=(st.phase==='sprint'?1:st.phase==='walk'?3:40)*timeline.speed/60;
   if(st.remaining>1e-6&&seconds>0)maxRate=Math.min(maxRate,st.remaining/60/seconds);
  }
 }
 timeline.update(seconds,narrator.maxRate(timeline.position,maxRate,seconds));
 if(timeline.playing)visualSeconds+=seconds;
 if(now-lastRender>40){render();lastRender=now;}
 }requestAnimationFrame(frame);}
requestAnimationFrame(frame);
