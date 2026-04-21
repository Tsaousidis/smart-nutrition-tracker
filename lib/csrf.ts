import { createHash, randomBytes } from "crypto";

// Generate a CSRF token
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

// Hash CSRF token for storage (double-submit cookie pattern)
export function hashCsrfToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Validate CSRF token by comparing the provided token with the hashed one
export function validateCsrfToken(token: string, hashedToken: string): boolean {
  const hashedProvidedToken = hashCsrfToken(token);
  return hashedProvidedToken === hashedToken;
}
