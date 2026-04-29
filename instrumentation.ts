// Instrumentation hook for Next.js
// This runs once when the server starts

export async function register() {
  // Import and run env validation on server startup
  const { validateEnv } = await import("@/lib/env");
  
  try {
    validateEnv();
    console.log("✓ Environment variables validated");
  } catch (error) {
    console.error("✗ Environment validation failed:", error);
    // Let Next.js handle the error - don't call process.exit
    throw error;
  }
}