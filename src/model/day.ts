import { clamp, type Scenario, validateScenario } from './config';
import { energyBudget, carbFactor, calories, type EnergyBudget } from './energy';
import { muscleGlycogenCapacity } from './composition';
export type Activity = 'rest' | 'meal' | 'work' | 'run' | 'resistance' | 'recovery' | 'sleep' | 'warmup' | 'sprint' | 'walk' | 'cooldown';
export interface ExerciseSample { netKcalPerMinute:number;carbShare:number;hrTarget:number;activity:Activity|null }
export interface ExerciseProfile { totalKcal:number;at(minute:number):ExerciseSample }
export interface DayState {
  minute: number; hour: number; glucose: number; insulin: number; amino: number; dietaryFat: number;
  liver: number; muscle: number; liverCapacity: number; muscleCapacity: number;
  hr: number; activity: Activity; exercisePower: number; carbShare: number; fatShare: number;
  fatigue: number; recovery: number; absorbedCarb: number; absorbedProtein: number; absorbedFat: number;
  expenditure: number; intake: number; liverOutput: number; endogenousGlucose: number;
  contractionUptake: number; fatMobilization: number;
}
export interface DayLedger {
  carbohydrateIn: number; carbohydrateOxidized: number; carbohydrateStored: number;
  endogenousGlucose: number; proteinIn: number; proteinEnergyOxidized: number;
  fatIn: number; fatEnergyOxidized: number; fatEnergyStored: number;
  energyIn: number; energyOut: number; residual: number;
  overflowCarbohydrateOxidized: number;
  consumedEnergy: number; gutEnergyChange: number; fiberEnergy: number;
}
export interface DaySimulation { states: DayState[]; budget: EnergyBudget; ledger: DayLedger; warmupDays: number; periodicError: number }
const scheduleCache = new WeakMap<Scenario, Activity[]>();
export function dailySchedule(s: Scenario): Activity[] {
  const cached=scheduleCache.get(s);if(cached)return cached;
  const a=s.activity,b=energyBudget(s);
  const schedule=Array.from({length:1440},(_,minute):Activity=>{
    const h=(6+minute/60)%24, sleepOffset=(h-a.sleep_start_hour+24)%24, workoutOffset=(h-a.exercise_start_hour+24)%24;
    if(sleepOffset<a.sleep_hours)return 'sleep';
    if(workoutOffset<a.exercise_minutes/60)return workoutOffset<b.runMinutes/60?'run':a.resistance_training?'resistance':'recovery';
    if(s.meals.some(m=>h>=m.hour&&h<m.hour+.25))return 'meal';
    if(workoutOffset>=a.exercise_minutes/60&&workoutOffset<a.exercise_minutes/60+2&&a.exercise_minutes>0)return 'recovery';
    return 'rest';
  });
  // Prefer the default six-hour schedule, then allocate available awake minutes.
  const windows:[number,number][]=[[10,13],[14,16],[20,21],[7,8],[21,22],[9,10],[18,19]];
  let remaining=Math.round(a.mental_work_hours*60);
  const assign=(minute:number)=>{if(remaining>0&&(schedule[minute]==='rest'||schedule[minute]==='recovery')){schedule[minute]='work';remaining--;}};
  for(const [start,end]of windows)for(let m=start*60;m<end*60;m++)assign((m-360+1440)%1440);
  for(let m=0;m<1440;m++)assign(m);
  if(remaining>0)throw new Error('This schedule does not have enough awake time for the requested mental work.');
  scheduleCache.set(s,schedule);return schedule;
}
export function activityAt(s:Scenario,minute:number):Activity{return dailySchedule(s)[Math.floor((minute%1440+1440)%1440)];}
function absorption(s: Scenario, macro: 'carbohydrate_g' | 'protein_g' | 'fat_g' | 'fiber_g', scale: number) {
  const values = Array<number>(1440).fill(0);
  for (const meal of s.meals) {
    const kernel = values.map((_, minute) => {
      const dt = (minute + 360 - meal.hour * 60 + 1440) % 1440;
      return dt / scale ** 2 * Math.exp(-dt / scale);
    });
    const norm = kernel.reduce((n, x) => n + x, 0);
    kernel.forEach((x, i) => values[i] += x / norm * (meal.nutrition ? (meal.nutrition[macro] || 0) : meal.fraction * (s.nutrition[macro] || 0)));
  }
  return values;
}
export interface Absorption { carbohydrate_g:number[]; protein_g:number[]; fat_g:number[]; fiber_g:number[] }
export interface DayOptions { initial?:DayState; absorption?:Absorption; singlePass?:boolean; recoveryFoodSupport?:number }
export function simulateDay(s: Scenario, profile?:ExerciseProfile, options:DayOptions={}): DaySimulation {
  validateScenario(s);
  scheduleCache.delete(s);
  const b = energyBudget(s), cFactor=carbFactor(s.nutrition), carbs = options.absorption?.carbohydrate_g || absorption(s, 'carbohydrate_g', 50), protein = options.absorption?.protein_g || absorption(s, 'protein_g', 70), fat = options.absorption?.fat_g || absorption(s, 'fat_g', 125), fiber=options.absorption?.fiber_g || absorption(s,'fiber_g',240);
  if(options.absorption){const sum=(a:number[])=>a.reduce((n,x)=>n+x,0),t=s.model.thermic_fractions;b.thermic=sum(carbs)*cFactor*t.carbohydrate+sum(protein)*4*t.protein+sum(fat)*9*t.fat;b.total=b.resting+b.movement+b.exercise+b.thermic;b.balance=b.intake-b.total;}
  if(profile){b.exercise=profile.totalKcal;b.total=b.resting+b.movement+b.exercise+b.thermic;b.balance=b.intake-b.total;b.run=0;b.resistance=profile.totalKcal;}
  const liverCapacity = s.model.liver_capacity_g * s.person.weight_kg / 75;
  const muscleCapacity = muscleGlycogenCapacity(s);
  const foodSupport=clamp(options.recoveryFoodSupport??Math.min(s.nutrition.protein_g/(s.person.weight_kg*s.model.protein_target_g_kg),b.intake/b.total));
  let liver = liverCapacity * .65, muscle = muscleCapacity * .8, glucose = .2, insulin = .12, hr = s.model.resting_hr_bpm;
  let fatigue = .05, amino = .1, dietaryFat = .1;
  if(options.initial)({liver,muscle,glucose,insulin,hr,fatigue,amino,dietaryFat}=options.initial);
  let states: DayState[] = [], ledger!: DayLedger, periodicError = 0, warmupDays = 0;
  const awakeMinutes = 1440 - s.activity.sleep_hours * 60;
  for (let day = 0; day < (options.singlePass ? 1 : 90); day++) {
    const startLiver = liver, startMuscle = muscle;
    let absorbedCarb = 0, absorbedProtein = 0, absorbedFat = 0, expenditure = 0, intake = 0, carbOx = 0, endogenous = 0, overflowCarbohydrateOxidized = 0;
    const startCarbShare = clamp(.38 + carbs[0] * .25, .32, .7);
    states = [{ minute:0,hour:6,glucose,insulin,amino,dietaryFat,liver,muscle,liverCapacity,muscleCapacity,hr,
      activity:activityAt(s,0),exercisePower:0,carbShare:startCarbShare,fatShare:1-startCarbShare,
      fatigue,recovery:1-fatigue,absorbedCarb:0,absorbedProtein:0,absorbedFat:0,expenditure:0,intake:0,
      liverOutput:0,endogenousGlucose:0,contractionUptake:0,fatMobilization:clamp(.75-insulin*.5) }];
    for (let minute = 0; minute < 1440; minute++) {
      const custom=profile?.at(minute);
      const h = (6 + minute / 60) % 24, i = minute % 1440, activity = custom?.activity||activityAt(s, Math.min(minute,1439));
      const run = activity === 'run', lifting = activity === 'resistance';
      const workoutOffset=(minute+360-s.activity.exercise_start_hour*60+1440)%1440;
      const inWorkout = custom?custom.netKcalPerMinute>0:workoutOffset<s.activity.exercise_minutes;
      const exercisePower = custom?custom.netKcalPerMinute:inWorkout ? run ? b.run / Math.max(1,b.runMinutes) : b.resistance / Math.max(1,b.resistanceMinutes) : 0;
      const workoutCarbShare = custom?custom.carbShare:run ? .78 : lifting ? .62 : .4;
      const available = carbs[i];
      const glucoseTarget = clamp(.18 + available * .65 + (inWorkout ? .03 : 0), .08, .92);
      const insulinTarget = clamp(.08 + available * .75 + protein[i] * .25, .05, .98) * (inWorkout ? .65 : 1);
      const carbShare = inWorkout ? workoutCarbShare : clamp(.38 + available * .25, .32, .7);
      if (minute < 1440) {
        glucose += (glucoseTarget - glucose) / 14;
        insulin += (insulinTarget - insulin) / 12;
        amino += (clamp(protein[i] * 1.8,.03,.95) - amino) / 22;
        dietaryFat += (clamp(fat[i] * 2,.02,.95) - dietaryFat) / 35;
        const targetHR = custom?.activity?custom.hrTarget:activity === 'sleep' ? s.model.resting_hr_bpm - 10 : run ? 145 : lifting ? 112 + 12 * Math.sin(minute * .4) : inWorkout ? 94 : s.model.resting_hr_bpm + (activity === 'meal' ? 5 : 0);
        hr += (targetHR - hr) / (inWorkout ? 2 : 5);
        // Illustrative recovery support from actual food, never a diet-label penalty.
        // Keep at least half the usual rate; this is a relative teaching signal.
        fatigue = clamp(fatigue + (inWorkout ? .0035 : -.0004*(.5+.5*foodSupport)));
      }
      const before = { liver, muscle };
      let liverOutput = 0, endogenousGlucose = 0;
      if (minute < 1440) {
        const desiredExerciseCarb = exercisePower * workoutCarbShare / cFactor;
        const desiredMuscle = .03 * s.person.weight_kg / 75 + desiredExerciseCarb * .75;
        const muscleUsed = Math.min(Math.max(0, muscle - muscleCapacity * .08), desiredMuscle);
        muscle -= muscleUsed;
        const desiredCirculating = .09 * s.person.weight_kg / 75 + desiredExerciseCarb * .25;
        const immediate = Math.min(available, desiredCirculating);
        // Gluconeogenesis shares fasting supply; insulin suppresses endogenous liver output.
        const unmet = desiredCirculating - immediate;
        liverOutput = Math.min(Math.max(0,liver - liverCapacity * .05), unmet * (inWorkout ? .9 : .8 - insulin * .2));
        liver -= liverOutput;
        endogenousGlucose = Math.max(0,unmet - liverOutput);
        // Unmet demand is a gluconeogenic/recycled-carbon marker, not additional meal energy.
        endogenous += endogenousGlucose;
        let remainder = available - immediate;
        const liverIn = Math.min(liverCapacity - liver, remainder * .35);
        liver += liverIn; remainder -= liverIn;
        const muscleIn = Math.min(muscleCapacity - muscle, remainder);
        muscle += muscleIn; remainder -= muscleIn;
        overflowCarbohydrateOxidized += remainder;
        carbOx += immediate + liverOutput + muscleUsed + remainder;
        absorbedCarb += available; absorbedProtein += protein[i]; absorbedFat += fat[i];
        const stepEnergy = cFactor * available + 4 * protein[i] + 9 * fat[i] + 2*fiber[i];
        intake += stepEnergy;
        const tef = available * cFactor * s.model.thermic_fractions.carbohydrate + protein[i] * 4 * s.model.thermic_fractions.protein + fat[i] * 9 * s.model.thermic_fractions.fat;
        expenditure += b.resting / 1440 + (activity === 'sleep' ? 0 : b.movement / awakeMinutes) + exercisePower + tef;
      }
      states.push({ minute:minute+1, hour:(6+(minute+1)/60)%24, glucose, insulin, amino, dietaryFat, liver, muscle, liverCapacity, muscleCapacity, hr,
        activity:profile?.at(minute+1).activity||activityAt(s,minute+1), exercisePower, carbShare, fatShare: 1-carbShare, fatigue, recovery: 1-fatigue,
        absorbedCarb, absorbedProtein, absorbedFat, expenditure, intake, liverOutput, endogenousGlucose,
        contractionUptake: inWorkout ? 1 : 0, fatMobilization: clamp(.75 - insulin * .5 + (inWorkout ? .2 : 0)) });
      // Internal invariant detects errors before they reach the visual layer.
      if (liver < 0 || muscle < 0 || !Number.isFinite(before.liver + muscle)) throw new Error('Invalid glycogen state');
    }
    const stored = liver + muscle - startLiver - startMuscle;
    const proteinEnergyOxidized = absorbedProtein * 4;
    const fiberEnergy=fiber.reduce((n,x)=>n+x,0)*2;
    const fatEnergyOxidized = expenditure - carbOx * cFactor - proteinEnergyOxidized - fiberEnergy;
    const fatEnergyStored = absorbedFat * 9 - fatEnergyOxidized;
    ledger = { carbohydrateIn: absorbedCarb, carbohydrateOxidized: carbOx, carbohydrateStored: stored, endogenousGlucose: endogenous,
      proteinIn: absorbedProtein, proteinEnergyOxidized, fatIn: absorbedFat, fatEnergyOxidized, fatEnergyStored,
      energyIn: intake, energyOut: expenditure,
      residual: intake - expenditure - stored * cFactor - fatEnergyStored, overflowCarbohydrateOxidized, consumedEnergy:calories(s), gutEnergyChange:calories(s)-intake, fiberEnergy };
    periodicError = Math.max(Math.abs(liver - startLiver),Math.abs(muscle - startMuscle));
    warmupDays = day + 1;
    if (day >= 5 && periodicError < .00001) break;
  }
  return { states, budget: b, ledger, warmupDays, periodicError };
}
export function sampleDay(day: DaySimulation, minute: number): DayState {
  const m = clamp(minute,0,1440), lo = Math.floor(m), hi = Math.min(1440,lo+1), a = day.states[lo], b = day.states[hi], f = m-lo;
  const out = {...a};
  for (const key of Object.keys(a) as (keyof DayState)[]) {
    if (typeof a[key] === 'number') (out as unknown as Record<string,unknown>)[key] = (a[key] as number) + ((b[key] as number)-(a[key] as number))*f;
  }
  out.hour=(6+m/60)%24;
  return out;
}
