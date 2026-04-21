import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import authConfig from "@/auth.config";
import {routing} from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const {auth} = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const isProtectedRoute = pathname.match(/^\/(en|el)\/(dashboard|meals|history|onboarding)/);

  if (pathname === "/") {
    return Response.redirect(new URL("/en", req.nextUrl));
  }

  if (!pathname.match(/^\/(en|el)/)) {
    return Response.redirect(new URL(`/en${pathname}`, req.nextUrl));
  }

  const isAuthRoute = pathname.match(
    /^\/(en|el)\/(login|signup)/
  );

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

  // inject pathname header
  response.headers.set("x-pathname", req.nextUrl.pathname);

  return response;
});

export const config = {
  matcher: [
    "/",
    "/(el|en)/:path*"
  ]
};