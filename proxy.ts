import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import authConfig from "@/auth.config";
import {routing} from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const {auth} = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/meals") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/en/dashboard") ||
    pathname.startsWith("/en/meals") ||
    pathname.startsWith("/en/history") ||
    pathname.startsWith("/en/onboarding") ||
    pathname.startsWith("/el/dashboard") ||
    pathname.startsWith("/el/meals") ||
    pathname.startsWith("/el/history") ||
    pathname.startsWith("/el/onboarding");

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/en/login" ||
    pathname === "/en/signup" ||
    pathname === "/el/login" ||
    pathname === "/el/signup";

  if (isProtectedRoute && !isLoggedIn) {
    const locale = pathname.startsWith("/el") ? "el" : "en";
    return Response.redirect(new URL(`/${locale}/login`, req.nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    const locale = pathname.startsWith("/el") ? "el" : "en";
    return Response.redirect(new URL(`/${locale}/dashboard`, req.nextUrl));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)"
};