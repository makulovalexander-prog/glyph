// Auth.js (NextAuth v5). Email magic-link in prod; a dev-only credentials shim so
// you can sign in without SMTP while building. Sessions are DB-backed (Session
// table) so revocation and "one card per collector" checks are server-authoritative.

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

const isProd = process.env.NODE_ENV === "production";

const providers: NextAuthConfig["providers"] = [];

if (process.env.EMAIL_SERVER) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  );
}

// Dev convenience: sign in by typing any email — NEVER enabled in production.
if (!isProd) {
  providers.push(
    Credentials({
      name: "Dev sign-in",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(creds) {
        const email = String(creds?.email || "").toLowerCase();
        if (!email) return null;
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split("@")[0] },
        });
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: isProd ? "database" : "jwt" },
  pages: { signIn: "/signin" },
  providers,
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = (user?.id ?? token?.sub) as string;
        (session.user as any).role = (user as any)?.role ?? "USER";
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/** Throw-if-missing helper for server actions / route handlers. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user as { id: string; email?: string | null; name?: string | null; role?: string };
}
