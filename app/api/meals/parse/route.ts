import { NextRequest, NextResponse } from "next/server";
import { gemini } from "@/lib/gemini";
import { mealParseInputSchema, parsedMealSchema } from "@/lib/validators";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function isQuotaError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("quota") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("rate limit exceeded for quota metric") ||
    normalized.includes("credits") ||
    normalized.includes("daily limit") ||
    normalized.includes("exceeded")
  );
}

function isRetryableError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("429") ||
    normalized.includes("rate limit") ||
    normalized.includes("unavailable") ||
    normalized.includes("timeout") ||
    normalized.includes("deadline exceeded") ||
    normalized.includes("internal") ||
    normalized.includes("temporarily") ||
    normalized.includes("overloaded")
  );
}

async function parseMealWithRetry(mealText: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
You are a nutrition extraction engine.

Your task:
- Read the user's meal description
- Estimate the foods included
- Return ONLY valid JSON
- No markdown
- No explanation text
- No extra keys
- Use reasonable nutrition estimates if exact product data is not available

Return this exact JSON shape:
{
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "mealTotal": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}

User meal:
${mealText}
                `.trim(),
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    quantity: { type: "number" },
                    unit: { type: "string" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                  },
                  required: [
                    "name",
                    "quantity",
                    "unit",
                    "calories",
                    "protein",
                    "carbs",
                    "fat",
                  ],
                },
              },
              mealTotal: {
                type: "object",
                properties: {
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                },
                required: ["calories", "protein", "carbs", "fat"],
              },
            },
            required: ["items", "mealTotal"],
          },
        },
      });

      const text = response.text;

      if (!text) {
        throw new Error("Gemini returned an empty response");
      }

      const rawJson = JSON.parse(text);
      const validatedMeal = parsedMealSchema.safeParse(rawJson);

      if (!validatedMeal.success) {
        throw new Error("Gemini response did not match expected schema");
      }

      return validatedMeal.data;
    } catch (error) {
      lastError = error;
      const errorMessage = getErrorMessage(error);

      if (isQuotaError(errorMessage)) {
        throw new Error(
          "The daily Gemini quota/credits appear to be exhausted. Please try again later or tomorrow."
        );
      }

      const shouldRetry =
        isRetryableError(errorMessage) && attempt <= MAX_RETRIES;

      if (!shouldRetry) {
        throw error;
      }

      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError ?? new Error("Unknown Gemini parsing error");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsedInput = mealParseInputSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid request body",
          errors: parsedInput.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { mealText } = parsedInput.data;

    const parsedMeal = await parseMealWithRetry(mealText);

    return NextResponse.json({
      ok: true,
      message: "Meal parsed successfully",
      data: parsedMeal,
    });
  } catch (error) {
    console.error("Meal parse route error:", error);

    const errorMessage = getErrorMessage(error);

    if (
      errorMessage.includes("Το ημερήσιο quota/credits του Gemini φαίνεται να έχει εξαντληθεί")
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: errorMessage,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong while parsing the meal",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}