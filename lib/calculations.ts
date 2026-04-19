type Sex = "MALE" | "FEMALE";

type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "VERY_ACTIVE"
  | "EXTRA_ACTIVE";

type GoalType =
  | "MAINTAIN"
  | "LOSE_WEIGHT"
  | "LOSE_FAT"
  | "GAIN_MUSCLE"
  | "RECOMP";

type ProfileInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
};

export function calculateBMR(profile: ProfileInput): number {
  const { sex, age, heightCm, weightKg } = profile;

  if (sex === "MALE") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }

  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function getActivityMultiplier(activityLevel: ActivityLevel): number {
  switch (activityLevel) {
    case "SEDENTARY":
      return 1.2;
    case "LIGHT":
      return 1.375;
    case "MODERATE":
      return 1.55;
    case "VERY_ACTIVE":
      return 1.725;
    case "EXTRA_ACTIVE":
      return 1.9;
    default:
      return 1.2;
  }
}

export function calculateDailyCalories(
  profile: ProfileInput,
  goalType: GoalType
): number {
  const bmr = calculateBMR(profile);
  const tdee = bmr * getActivityMultiplier(profile.activityLevel);

  switch (goalType) {
    case "LOSE_WEIGHT":
    case "LOSE_FAT":
      return Math.round(tdee - 400);
    case "GAIN_MUSCLE":
      return Math.round(tdee + 250);
    case "RECOMP":
      return Math.round(tdee);
    case "MAINTAIN":
    default:
      return Math.round(tdee);
  }
}

export function calculateMacroTargets(
  profile: ProfileInput,
  goalType: GoalType
) {
  const dailyCalories = calculateDailyCalories(profile, goalType);

  let proteinPerKg = 1.8;

  if (goalType === "GAIN_MUSCLE") proteinPerKg = 2.0;
  if (goalType === "LOSE_WEIGHT" || goalType === "LOSE_FAT") proteinPerKg = 2.0;

  const proteinTarget = Math.round(profile.weightKg * proteinPerKg);
  const fatTarget = Math.round(profile.weightKg * 0.8);

  const usedCalories = proteinTarget * 4 + fatTarget * 9;
  const carbsTarget = Math.max(0, Math.round((dailyCalories - usedCalories) / 4));

  return {
    dailyCalories,
    proteinTarget,
    carbsTarget,
    fatTarget,
  };
}