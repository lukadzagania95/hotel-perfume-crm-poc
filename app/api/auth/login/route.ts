import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  safeRedirectPath,
  verifyAdminCredentials,
} from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const suppliedUsername = String(form.get("username") || "");
  const suppliedPassword = String(form.get("password") || "");
  const username = process.env.ADMIN_USERNAME || "";
  const password = process.env.ADMIN_PASSWORD || "";
  const nextPath = safeRedirectPath(form.get("next"));

  if (
    !username ||
    !password ||
    !verifyAdminCredentials(suppliedUsername, suppliedPassword, username, password)
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: await createAdminSessionToken(password),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
