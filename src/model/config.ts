import data from '../../scenarios/default.json';
import { validateCycle, type MenstrualCycle } from './profile';

export interface Nutrition { protein_g:number; carbohydrate_g:number; fat_g:number; fiber_g?:number; carbohydrate_kcal_g?:number }
export interface Scenario {
  menstrualCycle?: MenstrualCycle;
  person: { age: number; sex: 'male' | 'female'; height_cm: number; weight_kg: number; body_fat_fraction: number; fitness: string };
  nutrition: Nutrition;
  meals: { hour: number; fraction: number; name: string; kind: string; nutrition?: Nutrition }[];
  activity: { ordinary_movement_kcal: number; exercise_start_hour: number; exercise_minutes: number; run_distance_km: number; run_speed_kmh: number; running_met: number; resistance_training: boolean; resistance_met: number; training_intensity: number; mental_work_hours: number; sleep_hours: number; sleep_start_hour: number };
  model: { protein_target_g_kg: number; liver_capacity_g: number; muscle_capacity_g: number; resting_hr_bpm: number; hr_adaptation_bpm: number; lean_gain_ceiling_kg: number; adaptation_time_days: number; fat_energy_kcal_kg: number; lean_energy_kcal_kg: number; thermic_fractions: { protein: number; carbohydrate: number; fat: number } };
}
export const defaultScenario: Scenario = data as Scenario;
export const cloneScenario = (s = defaultScenario): Scenario => structuredClone(s);
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export function validateScenario(s: Scenario) {
  if(!['male','female'].includes(s.person.sex))throw new Error('Choose Male or Female for the model equations.');
  if(s.menstrualCycle)validateCycle(s.menstrualCycle);
  if ([s.person.age,s.person.weight_kg,s.person.height_cm,s.person.body_fat_fraction].some(n=>!Number.isFinite(n))) throw new Error('Enter finite values for age, height, mass and body fat.');
  if (s.person.age < 18 || s.person.age > 85 || s.person.weight_kg < 40 || s.person.weight_kg > 160) throw new Error('This model supports adults 18–85 years and 40–160 kg.');
  if (s.person.height_cm < 130 || s.person.height_cm > 220) throw new Error('This model supports heights of 130–220 cm.');
  if (s.person.body_fat_fraction < (s.person.sex==='female'?.14:.06) || s.person.body_fat_fraction > 0.5) throw new Error(`This model supports initial body fat of ${s.person.sex==='female'?'14–50% for females':'6–50% for males'}. These are model limits, not clinical cutoffs.`);
  if (s.activity.exercise_minutes < 0 || s.activity.exercise_minutes > 180 || s.activity.sleep_hours < 4 || s.activity.sleep_hours > 10) throw new Error('Exercise must be 0–180 min and sleep 4–10 h.');
  if (s.activity.mental_work_hours < 0 || s.activity.mental_work_hours > 10) throw new Error('Mental work must be 0–10 h.');
  if (Object.values(s.nutrition).some(n => !Number.isFinite(n) || n < 0)) throw new Error('Macronutrients must be finite, nonnegative numbers.');
  if (Math.abs(s.meals.reduce((n, m) => n + m.fraction, 0) - 1) > 1e-6) throw new Error('Meal fractions must add to one.');
  if (s.meals.some(m => m.hour < 0 || m.hour >= 24 || m.fraction < 0)) throw new Error('Check meal timing and fractions.');
}
export const assumptions = [
  ['Population estimate', 'Resting energy', 'Mifflin–St Jeor; individual needs vary.'],
  ['Population estimate', 'Exercise', 'Compendium MET estimates, minus modeled resting cost.'],
  ['Established direction', 'Insulin', 'A signal coordinating uptake, storage and liver output.'],
  ['Established direction', 'Brain', 'Continuous demand, already part of resting expenditure.'],
  ['Teaching abstraction', 'Glucose & insulin', 'Relative activity; these are not blood-test values.'],
  ['Teaching abstraction', 'Glycogen', '100 g liver scaled with mass; 400 g muscle scaled with fat-free mass. Fat-free mass is only a proxy for muscle size.'],
  ['Teaching abstraction', 'Adaptation', 'Bounded lean gain and HR curves, not a personal forecast.'],
  ['Teaching abstraction', 'Fat & protein', 'Daily energy-equivalent ledgers; not biochemical kinetics.']
];
