export function calculateDailyCalories({
  gender,
  age,
  weight,
  height,
  activity,
}) {
  let bmr;

  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultiplier = {
    sedentary: 1.2,

    light: 1.375,

    moderate: 1.55,

    active: 1.725,

    athlete: 1.9,
  };

  return Math.round(bmr * activityMultiplier[activity]);
}
