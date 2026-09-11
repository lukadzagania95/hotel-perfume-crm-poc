import assert from "node:assert/strict";
import test from "node:test";
import {
  assertOutboundEmailConfigured,
  getEmailSettings,
  resolveRecipient,
} from "../lib/emailTransport";

function baseEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    EMAIL_DELIVERY_MODE: "test",
    EMAIL_LIVE_SEND_ENABLED: "false",
    EMAIL_TEST_RECIPIENT: "owner@example.com",
    EMAIL_FROM_ADDRESS: "sender@example.com",
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "sender@example.com",
    SMTP_PASSWORD: "secret",
    ...overrides,
  };
}

test("test mode always redirects delivery to the test recipient", () => {
  const resolved = resolveRecipient("client@example.com", baseEnv());
  assert.equal(resolved.actualRecipient, "owner@example.com");
  assert.equal(resolved.intendedRecipient, "client@example.com");
  assert.equal(resolved.settings.mode, "test");
});

test("live mode remains locked without the explicit live switch", () => {
  assert.throws(
    () =>
      assertOutboundEmailConfigured(
        baseEnv({ EMAIL_DELIVERY_MODE: "live", EMAIL_LIVE_SEND_ENABLED: "false" }),
      ),
    /Live email delivery is locked/,
  );
});

test("unlocked live mode delivers to the hotel's contact address", () => {
  const resolved = resolveRecipient(
    "client@example.com",
    baseEnv({ EMAIL_DELIVERY_MODE: "live", EMAIL_LIVE_SEND_ENABLED: "true" }),
  );
  assert.equal(resolved.actualRecipient, "client@example.com");
});

test("invalid ports fail configuration validation", () => {
  assert.throws(() => getEmailSettings(baseEnv({ SMTP_PORT: "70000" })), /SMTP_PORT/);
});
