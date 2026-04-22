import type { NextAuthConfig } from "next-auth";

export default {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/en/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      const isProtectedRoute = pathname.match(
        /^\/(en|el)\/(dashboard|meals|history|onboarding)/
      );

      const isAuthRoute = pathname.match(
        /^\/(en|el)\/(login|signup)/
      );

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      if (isAuthRoute && isLoggedIn) {
        const localeMatch = pathname.match(/^\/(en|el)/);
        const locale = localeMatch ? localeMatch[1] : "en";

        return Response.redirect(new URL(`/${locale}/dashboard`, request.nextUrl));
      }

      return true;
    },
  },
} satisfies Partial<NextAuthConfig>;