import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token || token.role !== "admin") {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/portal")) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token || token.role !== "client") {
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
