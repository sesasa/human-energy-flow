import { type Scenario, type Nutrition } from './config';
export interface EnergyBudget { resting: number; movement: number; exercise: number; run: number; resistance: number; thermic: number; total: number; intake: number; balance: number; runMinutes: number; resistanceMinutes: number }
export const carbFactor = (n: Nutrition) => n.carbohydrate_kcal_g ?? 4;
export const nutritionCalories = (n: Nutrition) => 4*n.protein_g + carbFactor(n)*n.carbohydrate_g + 9*n.fat_g + 2*(n.fiber_g || 0);
export const calories = (s: Scenario) => nutritionCalories(s.nutrition);
export const restingEnergy = (s: Scenario, weight = s.person.weight_kg, age = s.person.age) => 10 * weight + 6.25 * s.person.height_cm - 5 * age + (s.person.sex === 'male' ? 5 : -161);
export function energyBudget(s: Scenario, weight = s.person.weight_kg, age = s.person.age, lightDay = false): EnergyBudget {
  const resting = restingEnergy(s, weight, age);
  const runMinutes = Math.min(s.activity.exercise_minutes, s.activity.run_distance_km / s.activity.run_speed_kmh * 60);
  const resistanceMinutes = Math.max(0, s.activity.exercise_minutes - runMinutes);
  const net = (met: number, minutes: number) => Math.max(0, met * weight * minutes / 60 - resting * minutes / 1440);
  const run = net(s.activity.running_met, runMinutes);
  const resistance = net(lightDay || !s.activity.resistance_training ? 3.3 : s.activity.resistance_met, resistanceMinutes);
  const movement = s.activity.ordinary_movement_kcal * weight / s.person.weight_kg;
  const t = s.model.thermic_fractions;
  const thermic = s.nutrition.protein_g * 4 * t.protein + s.nutrition.carbohydrate_g * carbFactor(s.nutrition) * t.carbohydrate + s.nutrition.fat_g * 9 * t.fat;
  const intake = calories(s), exercise = run + resistance;
  const total = resting + movement + exercise + thermic;
  return { resting, movement, exercise, run, resistance, thermic, total, intake, balance: intake - total, runMinutes, resistanceMinutes };
}
