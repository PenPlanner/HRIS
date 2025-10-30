import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
const publicPaths = ["/login", "/manifest.json", "/sw.js", "/favicon.ico"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAsset = /\.(?:svg|png|jpg|jpeg|gif|webp)$/i.test(pathname);
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (!isPublicPath && !isAsset) {
    const authToken = request.cookies.get("auth-token");

    if (!authToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname === "/login" && authToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

