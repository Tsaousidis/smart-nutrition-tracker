import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export default {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize() {
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/meals") ||
        pathname.startsWith("/history") ||
        pathname.startsWith("/onboarding");

      const isAuthRoute =
        pathname.startsWith("/login") || pathname.startsWith("/signup");

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;