import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { decodeViewAsCookie, VIEW_AS_COOKIE } from "@/lib/portal/view-as";

function useSecureCookies(req: NextRequest) {
  if (process.env.AUTH_URL?.startsWith("https://")) return true;
  if (process.env.NEXTAUTH_URL?.startsWith("https://")) return true;
  return req.nextUrl.protocol === "https:";
}

async function readToken(req: NextRequest) {
  return getToken({
    req,
    secret: process.env.AUTH_SECRET,
    // Required on HTTPS (Vercel): session cookie is `__Secure-authjs.session-token`
    secureCookie: useSecureCookies(req),
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/portal/login") ||
    pathname.startsWith("/portal/invite/")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = await readToken(req);

    // Missing token, or explicitly a client session → bounce to admin login.
    // Treat missing role as admin for older JWTs.
    const isAdmin = Boolean(token) && token?.role !== "client";
    if (!isAdmin) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/portal")) {
    const token = await readToken(req);

    const viewAs = decodeViewAsCookie(req.cookies.get(VIEW_AS_COOKIE)?.value);
    const asClient = token?.role === "client";
    const asAdminViewing =
      Boolean(token) && token?.role !== "client" && Boolean(viewAs);

    if (!token || (!asClient && !asAdminViewing)) {
      const loginUrl = new URL("/portal/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
