import type { DefaultSession } from "next-auth";
import type { CurrencyCode } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      currency: CurrencyCode;
    } & DefaultSession["user"];
  }

  interface User {
    currency?: CurrencyCode;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    currency?: CurrencyCode;
    image?: string | null;
  }
}
