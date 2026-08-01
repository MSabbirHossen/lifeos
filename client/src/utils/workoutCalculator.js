import { EXERCISE_DATASET } from "../data/exercises";

const DEFAULT_WEIGHT_KG = 70;
const DEFAULT_SECONDS_PER_REP = 4;
const DEFAULT_REST_SECONDS_BETWEEN_SETS = 45;

/**
 * Calculates total calories burned based on exercise ID, body weight, and time.
 * @param {string} exerciseId
 * @param {number} durationMinutes
 * @param {number} [userWeightKg=70]
 * @returns {number}
 */
export function calculateWorkoutCalories(
  exerciseId,
  durationMinutes,
  userWeightKg = DEFAULT_WEIGHT_KG,
) {
  const exercise = EXERCISE_DATASET.find((item) => item.id === exerciseId);

  if (!exercise || durationMinutes <= 0 || userWeightKg <= 0) {
    return 0;
  }

  const caloriesBurned =
    ((exercise.met * 3.5 * userWeightKg) / 200) * durationMinutes;

  return Math.round(caloriesBurned);
}

/**
 * Estimates total active time in minutes from sets and reps.
 * @param {number} sets
 * @param {number} reps
 * @param {number} [secondsPerRep=4]
 * @param {number} [restSecondsBetweenSets=45]
 * @returns {number}
 */
export function estimateDurationFromSetsReps(
  sets,
  reps,
  secondsPerRep = DEFAULT_SECONDS_PER_REP,
  restSecondsBetweenSets = DEFAULT_REST_SECONDS_BETWEEN_SETS,
) {
  const safeSets = Number(sets) || 0;
  const safeReps = Number(reps) || 0;

  if (safeSets <= 0 || safeReps <= 0) {
    return 0;
  }

  const activeSeconds = safeSets * safeReps * secondsPerRep;
  const restSeconds = Math.max(safeSets - 1, 0) * restSecondsBetweenSets;

  return Math.round((activeSeconds + restSeconds) / 60);
}

/**
 * Calculates calories using sets/reps-derived duration.
 * @param {string} exerciseId
 * @param {number} sets
 * @param {number} reps
 * @param {number} [userWeightKg=70]
 * @returns {{ calories: number, estimatedDurationMinutes: number }}
 */
export function calculateWorkoutCaloriesFromSetsReps(
  exerciseId,
  sets,
  reps,
  userWeightKg = DEFAULT_WEIGHT_KG,
) {
  const estimatedDurationMinutes = estimateDurationFromSetsReps(sets, reps);
  const calories = calculateWorkoutCalories(
    exerciseId,
    estimatedDurationMinutes,
    userWeightKg,
  );

  return { calories, estimatedDurationMinutes };
}
