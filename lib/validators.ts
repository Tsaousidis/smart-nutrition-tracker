import { z } from "zod";

export const profileSchema = z.object({
  email: z.email(),
  sex: z.enum(["MALE", "FEMALE"]),
  age: z.number().int().min(10).max(100),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "VERY_ACTIVE",
    "EXTRA_ACTIVE",
  ]),
  goalType: z.enum([
    "MAINTAIN",
    "LOSE_WEIGHT",
    "LOSE_FAT",
    "GAIN_MUSCLE",
    "RECOMP",
  ]),
});

export type ProfileRequestBody = z.infer<typeof profileSchema>;

export const mealParseInputSchema = z.object({
  mealText: z.string().min(3),
  locale: z.enum(["en", "el"]).optional(),
});

export const parsedMealSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
  ),
  mealTotal: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
});

export type ParsedMeal = z.infer<typeof parsedMealSchema>;

export const saveMealSchema = z.object({
  email: z.string().email(),
  title: z.string().optional(),
  mealDate: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
  ),
});

export type SaveMealRequestBody = z.infer<typeof saveMealSchema>;

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export type SignupRequestBody = z.infer<typeof signupSchema>;