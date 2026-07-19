export const ADMIN_SESSION_COOKIE = "hoc_admin_session";

const SESSION_MESSAGE = "hoc-admin-session-v1";
const encoder = new TextEncoder();

export function safeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export async function createAdminSessionToken(password: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(SESSION_MESSAGE));

  return toBase64Url(new Uint8Array(signature));
}

export function verifyAdminCredentials(
  suppliedUsername: string,
  suppliedPassword: string,
  username: string,
  password: string,
) {
  return safeEqual(suppliedUsername, username) && safeEqual(suppliedPassword, password);
}

export function safeRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
