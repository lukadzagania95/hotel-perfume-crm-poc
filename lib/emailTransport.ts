import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";

export type EmailDeliveryMode = "test" | "live";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readPort(value: string | undefined, fallback: number, name: string) {
  const port = Number(value || fallback);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a valid TCP port.`);
  }

  return port;
}

function readMode(value: string | undefined): EmailDeliveryMode {
  const mode = (value || "test").toLowerCase();

  if (mode !== "test" && mode !== "live") {
    throw new Error('EMAIL_DELIVERY_MODE must be either "test" or "live".');
  }

  return mode;
}

function assertEmailAddress(value: string, name: string) {
  if (!EMAIL_PATTERN.test(value)) {
    throw new Error(`${name} must contain a valid email address.`);
  }
}

export function getEmailSettings(env: NodeJS.ProcessEnv = process.env) {
  const emailAddress = (env.EMAIL_FROM_ADDRESS || env.EMAIL_ADDRESS || "").trim();
  const smtpPassword = env.SMTP_PASSWORD || env.EMAIL_APP_PASSWORD || "";
  const imapPassword = env.IMAP_PASSWORD || env.EMAIL_APP_PASSWORD || smtpPassword;
  const mode = readMode(env.EMAIL_DELIVERY_MODE);
  const testRecipient = (env.EMAIL_TEST_RECIPIENT || env.EMAIL_DEMO_RECIPIENT || "").trim();

  return {
    mode,
    liveSendEnabled: env.EMAIL_LIVE_SEND_ENABLED === "true",
    emailAddress,
    fromName: (env.EMAIL_FROM_NAME || "HOC Hotel Perfume").trim(),
    testRecipient,
    smtp: {
      host: (env.SMTP_HOST || "smtp.gmail.com").trim(),
      port: readPort(env.SMTP_PORT, 587, "SMTP_PORT"),
      user: (env.SMTP_USER || emailAddress).trim(),
      password: smtpPassword,
      secure: env.SMTP_SECURE === "true",
    },
    imap: {
      host: (env.IMAP_HOST || "imap.gmail.com").trim(),
      port: readPort(env.IMAP_PORT, 993, "IMAP_PORT"),
      user: (env.IMAP_USER || emailAddress).trim(),
      password: imapPassword,
      secure: env.IMAP_SECURE !== "false",
      mailbox: (env.IMAP_MAILBOX || "INBOX").trim(),
    },
  };
}

export function assertOutboundEmailConfigured(env: NodeJS.ProcessEnv = process.env) {
  const settings = getEmailSettings(env);

  assertEmailAddress(settings.emailAddress, "EMAIL_FROM_ADDRESS");

  if (!settings.smtp.host || !settings.smtp.user || !settings.smtp.password) {
    throw new Error("SMTP is not configured. Set the SMTP host, user, and password.");
  }

  if (settings.mode === "test") {
    assertEmailAddress(settings.testRecipient, "EMAIL_TEST_RECIPIENT");
  } else if (!settings.liveSendEnabled) {
    throw new Error(
      "Live email delivery is locked. Set EMAIL_LIVE_SEND_ENABLED=true only after the test run passes.",
    );
  }

  return settings;
}

export function assertInboundEmailConfigured(env: NodeJS.ProcessEnv = process.env) {
  const settings = getEmailSettings(env);

  if (!settings.imap.host || !settings.imap.user || !settings.imap.password) {
    throw new Error("IMAP is not configured. Set the IMAP host, user, and password.");
  }

  return settings;
}

export function resolveRecipient(intendedRecipient: string, env: NodeJS.ProcessEnv = process.env) {
  const settings = assertOutboundEmailConfigured(env);
  assertEmailAddress(intendedRecipient, "Hotel contact email");

  return {
    intendedRecipient,
    actualRecipient: settings.mode === "test" ? settings.testRecipient : intendedRecipient,
    settings,
  };
}

export function createEmailTransporter(env: NodeJS.ProcessEnv = process.env) {
  const settings = assertOutboundEmailConfigured(env);

  return nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure,
    auth: {
      user: settings.smtp.user,
      pass: settings.smtp.password,
    },
    pool: true,
    maxConnections: 3,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
}

export function createImapClient(env: NodeJS.ProcessEnv = process.env) {
  const settings = assertInboundEmailConfigured(env);

  return new ImapFlow({
    host: settings.imap.host,
    port: settings.imap.port,
    secure: settings.imap.secure,
    auth: {
      user: settings.imap.user,
      pass: settings.imap.password,
    },
    logger: false,
    socketTimeout: 60_000,
  });
}

export function formatFromAddress(settings: ReturnType<typeof getEmailSettings>) {
  return settings.fromName
    ? `"${settings.fromName.replaceAll('"', "").trim()}" <${settings.emailAddress}>`
    : settings.emailAddress;
}
