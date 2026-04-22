// Validate all required environment variables at startup
export function validateEnv() {
  const requiredVars = [
    "DATABASE_URL",
    "DIRECT_URL",
    "GEMINI_API_KEY",
    "AUTH_SECRET",
  ];

  const missing: string[] = [];

  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// Call this on app startup
if (typeof window === "undefined") {
  try {
    validateEnv();
  } catch (error) {
    console.error("Environment validation failed:", error);
    process.exit(1);
  }
}
