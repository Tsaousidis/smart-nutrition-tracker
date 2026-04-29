import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { validateCsrfToken } from "@/lib/csrf";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // ---------------------------------------------------------------------------
  // CSRF protection for ALL state-changing requests
  // ---------------------------------------------------------------------------
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    // Paths that are exempt from CSRF checks:
    //   • NextAuth internal endpoints  → use their own signed tokens
    //   • Health check                 → read-only, no state change
    //   • Webhooks                     → use signature verification instead
    //   • CSRF token issuer itself
    const isExemptPath =
      req.nextUrl.pathname.startsWith("/api/auth") ||
      req.nextUrl.pathname === "/api/health/db" ||
      req.nextUrl.pathname.startsWith("/api/webhook") ||
      req.nextUrl.pathname === "/api/csrf";

    if (!isExemptPath) {
      const csrfToken = req.headers.get("x-csrf-token");
      const cookieToken = req.cookies.get("csrf-token")?.value;

      if (!csrfToken || !cookieToken) {
        return new Response(
          JSON.stringify({
            error: "CSRF token missing",
            message: "CSRF token missing",
            code: "CSRF_MISSING",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!validateCsrfToken(csrfToken, cookieToken)) {
        return new Response(
          JSON.stringify({
            error: "CSRF token invalid",
            message: "CSRF token invalid",
            code: "CSRF_INVALID",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // API routes — skip intl routing
  // ---------------------------------------------------------------------------
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // Page routing + auth guards
  // ---------------------------------------------------------------------------
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = pathname.match(
    /^\/(en|el)\/(dashboard|meals|history|onboarding)/
  );

  if (pathname === "/") {
    return Response.redirect(new URL("/en", req.nextUrl));
  }

  if (!pathname.match(/^\/(en|el)/)) {
    return Response.redirect(new URL(`/en${pathname}`, req.nextUrl));
  }

  const isAuthRoute = pathname.match(/^\/(en|el)\/(login|signup)/);

  if (isProtectedRoute && !isLoggedIn) {
    const localeMatch = pathname.match(/^\/(en|el)/);
    const locale = localeMatch ? localeMatch[1] : "en";
    return Response.redirect(new URL(`/${locale}/login`, req.nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    const localeMatch = pathname.match(/^\/(en|el)/);
    const locale = localeMatch ? localeMatch[1] : "en";
    return Response.redirect(new URL(`/${locale}/dashboard`, req.nextUrl));
  }

  const response = intlMiddleware(req);
  response.headers.set("x-pathname", req.nextUrl.pathname);
  return response;
});

export const config = {
  matcher: ["/", "/api/:path*", "/(el|en)/:path*"],
};
