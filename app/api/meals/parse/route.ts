import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { azureOpenAI } from "@/lib/azure-openai";
import { parseWithGemini } from "@/lib/ai-fallback";
import { mealParseInputSchema, parsedMealSchema } from "@/lib/validators";
import { sanitizeMealInput } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
  const shouldUseGreek = locale === "el" || /[\u0370-\u03FF]/.test(mealText);
  const targetLanguage = shouldUseGreek ? "Greek" : "English";

  // First try Azure OpenAI
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const response = await azureOpenAI.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a nutrition extraction engine.

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
}`,
          },
          {
            role: "user",
            content: `User meal:\n${mealText}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const text = response.choices[0]?.message?.content ?? "";

      if (!text) {
        throw new Error("Azure OpenAI returned an empty response");
      }

      let rawJson;
      try {
        rawJson = JSON.parse(text);
      } catch (error) {
        throw new Error(`Failed to parse Azure OpenAI response as JSON: ${getErrorMessage(error)}`);
      }

      const validatedMeal = parsedMealSchema.safeParse(rawJson);

      if (!validatedMeal.success) {
        throw new Error("Azure OpenAI response did not match expected schema");
      }

      return validatedMeal.data;
    } catch (error) {
      lastError = error;
      const errorMessage = getErrorMessage(error);

      // Check if it's a quota error - if so, don't retry Azure, go directly to fallback
      if (isQuotaError(errorMessage)) {
        console.warn("Azure quota exhausted, switching to Gemini fallback...");
        break;
      }

      const shouldRetry = isRetryableError(errorMessage) && attempt <= MAX_RETRIES;

      if (!shouldRetry) {
        // Check if we should try fallback
        if (isRetryableError(errorMessage)) {
          console.warn("Azure error, switching to Gemini fallback...");
          break;
        }
        throw error;
      }

      await sleep(RETRY_DELAY_MS);
    }
  }

  // Fallback to Gemini if Azure failed
  console.log("Attempting Gemini fallback...");
  try {
    const geminiResult = await parseWithGemini(mealText, locale);
    return geminiResult;
  } catch (fallbackError) {
    console.error("Gemini fallback also failed:", fallbackError);
    // If original error was quota-related, keep that message
    const originalMessage = getErrorMessage(lastError);
    if (isQuotaError(originalMessage)) {
      throw new Error("All AI services (Azure and Gemini) are currently unavailable due to quota exhaustion. Please try again later.");
    }
    throw lastError;
  }
}

export async function POST(req: NextRequest) {
  let requestLocale: "en" | "el" = "en";

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          ok: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const rate = await checkRateLimit({
      key: `meal-parse:${session.user.email}:${ip}`,
      limit: 30,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: "Too many meal parsing requests. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

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
    requestLocale = locale;
    // Sanitize meal input to prevent XSS
    const sanitizedText = sanitizeMealInput(mealText);

    let parsedMeal;
    try {
      parsedMeal = await parseMealWithRetry(sanitizedText, locale);
    } catch (parseError) {
      console.error("Meal parse error:", parseError);
      const errorMessage = getErrorMessage(parseError);

      // Check for specific parsing errors that indicate AI couldn't understand the input
      if (
        errorMessage.includes("did not match expected schema") ||
        errorMessage.includes("Failed to parse") ||
        errorMessage.includes("empty response") ||
        errorMessage.includes("Azure OpenAI response")
      ) {
        // Return a user-friendly message about not understanding the food
        const isGreek = locale === "el";
        return NextResponse.json(
          {
            ok: false,
            code: "PARSING_ERROR",
            message: isGreek
              ? "Δεν κατάλαβα τι έφαγες. Δοκίμασε να περιγράψεις το φαγητό σου πιο ξεκάθαρα, π.χ. '2 αυγά και ψωμί' ή 'σαλάτα κοτόπουλο με ελαιόλαδο'."
              : "I couldn't understand what you ate. Try describing your food more clearly, like '2 eggs and toast' or 'chicken salad with olive oil'.",
          },
          { status: 400 }
        );
      }

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

      throw parseError;
    }

    return NextResponse.json({
      ok: true,
      code: "SUCCESS",
      message: "Meal parsed successfully",
      data: parsedMeal,
    });
  } catch (error) {
    console.error("Meal parse route error:", error);

    const errorMessage = getErrorMessage(error);

    // Check for specific parsing errors that indicate AI couldn't understand the input
    if (
      errorMessage.includes("did not match expected schema") ||
      errorMessage.includes("Failed to parse") ||
      errorMessage.includes("empty response") ||
      errorMessage.includes("Azure OpenAI response")
    ) {
      // Return a user-friendly message about not understanding the food
      const isGreek = requestLocale === "el";
      return NextResponse.json(
        {
          ok: false,
          code: "PARSING_ERROR",
          message: isGreek
            ? "Δεν κατάλαβα τι έφαγες. Δοκίμασε να περιγράψεις το φαγητό σου πιο ξεκάθαρα, π.χ. '2 αυγά και ψωμί' ή 'σαλάτα κοτόπουλο με ελαιόλαδο'."
            : "I couldn't understand what you ate. Try describing your food more clearly, like '2 eggs and toast' or 'chicken salad with olive oil'.",
        },
        { status: 400 }
      );
    }

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
      },
      { status: 500 }
    );
  }
}