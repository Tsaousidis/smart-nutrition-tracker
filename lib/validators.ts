import { z } from "zod";

const mealItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().finite().gt(0).max(10000),
  unit: z.string().trim().min(1).max(40),
  calories: z.number().finite().min(0).max(20000),
  protein: z.number().finite().min(0).max(1000),
  carbs: z.number().finite().min(0).max(1000),
  fat: z.number().finite().min(0).max(1000),
});

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
  mealText: z.string().trim().min(3).max(2000),
  locale: z.enum(["en", "el"]).optional(),
});

export const parsedMealSchema = z.object({
  items: z.array(mealItemSchema).min(1).max(50),
  mealTotal: z.object({
    calories: z.number().finite().min(0).max(100000),
    protein: z.number().finite().min(0).max(5000),
    carbs: z.number().finite().min(0).max(5000),
    fat: z.number().finite().min(0).max(5000),
  }),
});

export type ParsedMeal = z.infer<typeof parsedMealSchema>;

export const saveMealSchema = z.object({
  email: z.string().email(),
  title: z.string().trim().min(1).max(80).optional(),
  mealDate: z.string().datetime({ offset: true }),
  items: z.array(mealItemSchema).min(1).max(50),
});

export type SaveMealRequestBody = z.infer<typeof saveMealSchema>;

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  locale: z.string().optional(),
});

export type SignupRequestBody = z.infer<typeof signupSchema>;