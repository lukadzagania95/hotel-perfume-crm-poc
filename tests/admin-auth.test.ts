import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSessionToken,
  safeRedirectPath,
  verifyAdminCredentials,
} from "../lib/adminAuth";

test("administrator credentials require exact username and password matches", () => {
  assert.equal(verifyAdminCredentials("admin", "secret", "admin", "secret"), true);
  assert.equal(verifyAdminCredentials("Admin", "secret", "admin", "secret"), false);
  assert.equal(verifyAdminCredentials("admin", "wrong", "admin", "secret"), false);
});

test("session token is deterministic and changes when the password rotates", async () => {
  const first = await createAdminSessionToken("secret-one");
  assert.equal(first, await createAdminSessionToken("secret-one"));
  assert.notEqual(first, await createAdminSessionToken("secret-two"));
});

test("post-login redirects remain on the application origin", () => {
  assert.equal(safeRedirectPath("/hotels?view=active"), "/hotels?view=active");
  assert.equal(safeRedirectPath("https://example.com"), "/");
  assert.equal(safeRedirectPath("//example.com"), "/");
  assert.equal(safeRedirectPath(null), "/");
});
