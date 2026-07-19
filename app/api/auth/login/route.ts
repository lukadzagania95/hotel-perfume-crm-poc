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
    const loginParams = new URLSearchParams({ error: "invalid", next: nextPath });
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `/login?${loginParams.toString()}` },
    });
  }

  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: nextPath },
  });
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
