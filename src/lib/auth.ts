import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { verifyClientPassword } from "@/lib/portal/auth";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalized = email.toLowerCase();

        const [admin] = await db
          .select()
          .from(admins)
          .where(eq(admins.email, normalized))
          .limit(1);

        if (admin) {
          const valid = await compare(password, admin.passwordHash);
          if (!valid) return null;
          return {
            id: admin.id,
            email: admin.email,
            name: "Admin",
            role: "admin" as const,
            clientId: null,
          };
        }

        const account = await verifyClientPassword(normalized, password);
        if (!account) return null;

        return {
          id: account.id,
          email: account.email,
          name: "Client",
          role: "client" as const,
          clientId: account.clientId,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        const role = (user as { role?: "admin" | "client" }).role || "admin";
        token.role = role;
        token.clientId = (user as { clientId?: string | null }).clientId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.email = (token.email as string) || "";
        session.user.role = token.role === "client" ? "client" : "admin";
        session.user.clientId = (token.clientId as string | null) ?? null;
      }
      return session;
    },
  },
  trustHost: true,
});

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireClient() {
  const session = await auth();
  if (!session?.user || session.user.role !== "client" || !session.user.clientId) {
    throw new Error("Unauthorized");
  }
  return session;
}
