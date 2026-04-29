import { createHmac, randomBytes } from "crypto";

// Generate a CSRF token
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

// Hash CSRF token for storage using HMAC with AUTH_SECRET
export function hashCsrfToken(token: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not defined");
  }
  return createHmac("sha256", secret).update(token).digest("hex");
}

// Validate CSRF token by comparing the provided token with the hashed one
export function validateCsrfToken(token: string, hashedToken: string): boolean {
  const hashedProvidedToken = hashCsrfToken(token);
  return hashedProvidedToken === hashedToken;
}
