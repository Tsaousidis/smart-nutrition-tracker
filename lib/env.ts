// Validate all required environment variables at startup
export function validateEnv() {
  const requiredVars = [
    "DATABASE_URL",
    "DIRECT_URL",
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT_NAME",
    "AUTH_SECRET",
  ];
  const requiredInProduction = ["RESEND_API_KEY", "NEXT_PUBLIC_APP_URL"];

  // Gemini fallback keys (optional - used if Azure fails)
  const geminiKeys = [
    "GEMINI_API_KEY1",
    "GEMINI_API_KEY2",
    "GEMINI_API_KEY3",
    "GEMINI_API_KEY4",
    "GEMINI_API_KEY5",
    "GEMINI_API_KEY6",
  ];

  const missing: string[] = [];

  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }
  if (process.env.NODE_ENV === "production") {
    for (const variable of requiredInProduction) {
      if (!process.env[variable]) {
        missing.push(variable);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// Note: Validation is now handled by instrumentation.ts on server startup
// This file exports the validateEnv function for use there
