import { GoogleGenerativeAI } from "@google/generative-ai";

// Get all available Gemini API keys from environment
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const key = process.env[`GEMINI_API_KEY${i}`];
    if (key) {
      keys.push(key);
    }
  }
  return keys;
}

// Check if a Gemini key is valid (format check)
function isValidGeminiKey(key: string): boolean {
  // Gemini keys typically start with AIza or AQ.
  return key.startsWith("AIza") || key.startsWith("AQ.");
}

let cachedKeys: string[] | null = null;

export function getAvailableGeminiKeys(): string[] {
  if (cachedKeys) {
    return cachedKeys;
  }

  const allKeys = getGeminiKeys();
  cachedKeys = allKeys.filter(isValidGeminiKey);
  return cachedKeys;
}

export interface NutritionItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealParseResult {
  items: NutritionItem[];
  mealTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export async function parseWithGemini(
  mealText: string,
  locale: "en" | "el"
): Promise<MealParseResult> {
  const keys = getAvailableGeminiKeys();

  if (keys.length === 0) {
    throw new Error("No Gemini API keys available");
  }

  const shouldUseGreek = locale === "el" || /[\u0370-\u03FF]/.test(mealText);
  const targetLanguage = shouldUseGreek ? "Greek" : "English";

  let lastError: Error | null = null;

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `You are a nutrition extraction engine.

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
${mealText}`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      // Parse the JSON response
      const parsed = JSON.parse(text) as MealParseResult;

      // Validate the response structure
      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error("Invalid response structure from Gemini");
      }

      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last key, throw
      if (i === keys.length - 1) {
        break;
      }

      // Log which key failed (for debugging)
      console.warn(
        `Gemini key ${i + 1} failed, trying next key...`,
        lastError.message
      );
    }
  }

  throw lastError || new Error("All Gemini keys failed");
}