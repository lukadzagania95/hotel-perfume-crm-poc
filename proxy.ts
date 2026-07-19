import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, safeEqual } from "@/lib/adminAuth";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/api/health" || path.startsWith("/api/cron/")) return NextResponse.next();
  if (path === "/login" || path === "/api/auth/login") return NextResponse.next();

  const username = process.env.ADMIN_USERNAME || "";
  const password = process.env.ADMIN_PASSWORD || "";

  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Admin authentication is not configured", { status: 503 });
    }
    return NextResponse.next();
  }

  const suppliedToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";
  const expectedToken = await createAdminSessionToken(password);
  if (safeEqual(suppliedToken, expectedToken)) return NextResponse.next();

  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const loginParams = new URLSearchParams({ next: `${path}${request.nextUrl.search}` });
  return new NextResponse(null, {
    status: 307,
    headers: { Location: `/login?${loginParams.toString()}` },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
