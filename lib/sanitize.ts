// Server-side input sanitization using simple regex patterns
// Note: For full sanitization of HTML content, use DOMPurify on client or a server library

export function sanitizeString(input: string, options?: { maxLength?: number }): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input.trim();

  // Limit length
  if (options?.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Remove potential XSS patterns
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove on* event handlers
    .replace(/on\w+\s*=\s*[^\s>]*/gi, "") // Remove on* event handlers without quotes
    .replace(/javascript:/gi, ""); // Remove javascript: protocol

  return sanitized;
}

export function sanitizeEmail(email: string): string {
  const trimmed = email.toLowerCase().trim();
  // Basic email validation to prevent XSS through email field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    throw new Error("Invalid email format");
  }

  return trimmed;
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
    return parsed.toString();
  } catch {
    throw new Error("Invalid URL");
  }
}

export function sanitizeMealInput(input: string): string {
  return sanitizeString(input, { maxLength: 500 });
}
