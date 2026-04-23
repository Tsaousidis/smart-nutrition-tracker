import { NextRequest, NextResponse } from "next/server";
import { gemini } from "@/lib/gemini";
import { mealParseInputSchema, parsedMealSchema } from "@/lib/validators";
import { sanitizeMealInput } from "@/lib/sanitize";

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

async function parseMealWithRetry(mealText: string, locale: "en" | "el") {
  let lastError: unknown;
  const shouldUseGreek =
    locale === "el" || /[\u0370-\u03FF]/.test(mealText);
  const targetLanguage = shouldUseGreek ? "Greek" : "English";

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

Preferred output language: ${targetLanguage}.
If the request locale is "el" or the input contains Greek text, return food names in Greek.
Do not translate Greek food names into English. For example, return "Φέτα 12% λιπαρά" not "Feta cheese 12% fat".
If the input is not Greek, return food names in English.

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
              }
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

      let rawJson;
      try {
        rawJson = JSON.parse(text);
      } catch (error) {
        throw new Error(`Failed to parse Gemini response as JSON: ${getErrorMessage(error)}`);
      }

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
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const parsedInput = mealParseInputSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          errors: parsedInput.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { mealText, locale = "en" } = parsedInput.data;
    // Sanitize meal input to prevent XSS
    const sanitizedText = sanitizeMealInput(mealText);

    const parsedMeal = await parseMealWithRetry(sanitizedText, locale);

    return NextResponse.json({
      ok: true,
      code: "SUCCESS",
      message: "Meal parsed successfully",
      data: parsedMeal,
    });
  } catch (error) {
    console.error("Meal parse route error:", error);

    const errorMessage = getErrorMessage(error);

    if (isQuotaError(errorMessage)) {
      return NextResponse.json(
        {
          ok: false,
          code: "QUOTA_EXCEEDED",
          message: "The daily Gemini quota/credits appear to be exhausted. Please try again later or tomorrow.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "PARSING_ERROR",
        message: "Something went wrong while parsing the meal",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}