import { NextResponse } from "next/server";
import { generateCsrfToken, hashCsrfToken } from "@/lib/csrf";

export async function GET() {
  // Generate a new CSRF token
  const csrfToken = generateCsrfToken();
  const hashedToken = hashCsrfToken(csrfToken);

  const response = NextResponse.json(
    { csrfToken },
    { status: 200 }
  );

  // Set CSRF token in a secure HTTP-only cookie
  // The client will send back the unhashed token in header/body
  // Server will hash it and compare with cookie
  response.cookies.set({
    name: "csrf-token",
    value: hashedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
