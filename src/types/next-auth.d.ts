import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: "admin" | "client";
      clientId: string | null;
    };
  }

  interface User {
    role?: "admin" | "client";
    clientId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "client";
    clientId?: string | null;
  }
}
