import type { NextAuthConfig } from "next-auth";
import type { CurrencyCode } from "@/lib/types";

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);
      const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

      // Logged-in users should not see public pages.
      if (isLoggedIn && (isAuthPage || pathname === "/")) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      // Public pages: landing + auth pages.
      if (pathname === "/" || isAuthPage) {
        return true;
      }

      // Everything else requires authentication.
      if (!isLoggedIn) {
        const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
        return Response.redirect(
          new URL(`/login?callbackUrl=${callbackUrl}`, request.nextUrl),
        );
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.currency = ((user as { currency?: string }).currency ?? "INR") as CurrencyCode;
        token.image = user.image ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.currency = (token.currency as CurrencyCode | undefined) ?? "INR";
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
