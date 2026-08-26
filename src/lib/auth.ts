import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins, clients } from "@/db/schema";
import { verifyClientPassword, consumeInviteForSignIn } from "@/lib/portal/auth";
import { getViewAsPayload } from "@/lib/portal/view-as";
import { z } from "zod";

const credentialsSchema = z
  .object({
    email: z.string().email(),
    password: z.string().optional(),
    magicToken: z.string().optional(),
  })
  .refine((data) => Boolean(data.password?.length || data.magicToken?.length), {
    message: "Password or magic token required",
  });

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        magicToken: { label: "Magic Token", type: "text" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, magicToken } = parsed.data;
        const normalized = email.toLowerCase();

        if (magicToken) {
          const account = await consumeInviteForSignIn(magicToken, normalized);
          if (!account) return null;
          return {
            id: account.id,
            email: account.email,
            name: "Client",
            role: "client" as const,
            clientId: account.clientId,
          };
        }

        if (!password) return null;

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

export type PortalActor = {
  clientId: string;
  email: string;
  impersonating: boolean;
  impersonatorAdminId: string | null;
  sessionUserId: string;
};

/** Real client session, or admin viewing as client via cookie. */
export async function requirePortalActor(): Promise<PortalActor> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (session.user.role === "client" && session.user.clientId) {
    return {
      clientId: session.user.clientId,
      email: session.user.email,
      impersonating: false,
      impersonatorAdminId: null,
      sessionUserId: session.user.id,
    };
  }

  if (session.user.role === "admin") {
    const viewAs = await getViewAsPayload();
    if (viewAs) {
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, viewAs.clientId))
        .limit(1);
      if (!client) throw new Error("Unauthorized");
      return {
        clientId: viewAs.clientId,
        email: client.email,
        impersonating: true,
        impersonatorAdminId: viewAs.adminId,
        sessionUserId: session.user.id,
      };
    }
  }

  throw new Error("Unauthorized");
}

export async function requireClient() {
  const actor = await requirePortalActor();
  return {
    user: {
      id: actor.sessionUserId,
      email: actor.email,
      role: "client" as const,
      clientId: actor.clientId,
    },
    impersonating: actor.impersonating,
    impersonatorAdminId: actor.impersonatorAdminId,
  };
}
