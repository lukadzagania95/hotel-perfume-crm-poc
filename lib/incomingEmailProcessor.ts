import { createHash } from "node:crypto";
import type { IncomingEmailIntent, OpportunityStatus, Prisma } from "@prisma/client";
import type { ParsedMail } from "mailparser";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/db";
import { createImapClient, getEmailSettings } from "@/lib/emailTransport";
import {
  classifyIncomingEmail,
  extractHotelIdFromSubject,
  extractReplyText,
  extractRoomLabels,
  intentLabel,
} from "@/lib/incomingEmailRules";
import { ACTIVE_STATUSES } from "@/lib/statusLifecycle";
import { transitionOpportunityStatusInTransaction } from "@/lib/opportunityWorkflow";

type ProcessResult = {
  scanned: number;
  contextual: number;
  applied: number;
  needsReview: number;
  errors: number;
};

type ParsedInboxEmail = {
  providerMessageId: string;
  fromEmail: string;
  subject: string;
  body: string;
  receivedAt: Date;
};

const intentToStatus: Partial<Record<IncomingEmailIntent, OpportunityStatus>> = {
  SAMPLE_USED: "INTEREST",
  PRODUCT_PURCHASED: "SALE",
  GUEST_CHECKED_OUT: "FAIL",
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function fallbackMessageId(email: Omit<ParsedInboxEmail, "providerMessageId">) {
  return `sha256:${createHash("sha256")
    .update(`${email.fromEmail}\n${email.subject}\n${email.receivedAt.toISOString()}\n${email.body}`)
    .digest("hex")}`;
}

async function findContextHotel(subject: string, fromEmail: string) {
  const hotelId = extractHotelIdFromSubject(subject);
  if (hotelId) return prisma.hotel.findUnique({ where: { id: hotelId } });

  return prisma.hotel.findFirst({
    where: { contactEmail: { equals: normalizeEmail(fromEmail) } },
    orderBy: { hotelName: "asc" },
  });
}

function isAuthorizedSender(contactEmail: string, fromEmail: string) {
  const settings = getEmailSettings();
  const sender = normalizeEmail(fromEmail);

  if (settings.mode === "test") {
    return sender === normalizeEmail(settings.testRecipient);
  }

  return sender === normalizeEmail(contactEmail);
}

async function findMatchingActiveOpportunity(
  tx: Prisma.TransactionClient,
  hotelId: string,
  roomLabel: string | null,
) {
  return tx.opportunity.findFirst({
    where: {
      hotelId,
      status: { in: ACTIVE_STATUSES },
      ...(roomLabel ? { roomLabel: { equals: roomLabel } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

function incomingData({
  email,
  hotelId,
  opportunityId,
  intent,
  status,
  actionSummary,
  errorMessage,
  roomLabel,
}: {
  email: ParsedInboxEmail;
  hotelId: string;
  opportunityId?: string | null;
  intent: IncomingEmailIntent;
  status: "APPLIED" | "NEEDS_REVIEW" | "ERROR";
  actionSummary: string;
  errorMessage?: string | null;
  roomLabel?: string | null;
}): Prisma.IncomingEmailUncheckedCreateInput {
  return {
    hotelId,
    opportunityId: opportunityId || null,
    providerMessageId: email.providerMessageId,
    fromEmail: normalizeEmail(email.fromEmail),
    subject: email.subject.slice(0, 998),
    body: email.body.slice(0, 50_000),
    roomLabel: roomLabel || null,
    intent,
    status,
    actionSummary,
    errorMessage: errorMessage?.slice(0, 2000) || null,
    receivedAt: email.receivedAt,
  };
}

async function logReview(
  email: ParsedInboxEmail,
  hotelId: string,
  intent: IncomingEmailIntent,
  actionSummary: string,
  roomLabel: string | null,
) {
  await prisma.incomingEmail.create({
    data: incomingData({
      email,
      hotelId,
      intent,
      status: "NEEDS_REVIEW",
      actionSummary,
      roomLabel,
    }),
  });
  return { contextual: true, handled: true, status: "needsReview" as const };
}

export async function processContextualIncomingEmail(email: ParsedInboxEmail) {
  const [existing, outbound] = await Promise.all([
    prisma.incomingEmail.findUnique({ where: { providerMessageId: email.providerMessageId } }),
    prisma.emailLog.findFirst({ where: { providerMessageId: email.providerMessageId } }),
  ]);

  if (existing) return { contextual: true, handled: true, status: "duplicate" as const };
  if (outbound) return { contextual: false, handled: true, status: "outbound" as const };

  const hotel = await findContextHotel(email.subject, email.fromEmail);
  if (!hotel) return { contextual: false, handled: false, status: "ignored" as const };

  const replyBody = extractReplyText(email.body);
  const intent = classifyIncomingEmail(replyBody);
  const roomLabels = extractRoomLabels(replyBody);
  const roomLabel = roomLabels[0] || null;

  if (!isAuthorizedSender(hotel.contactEmail, email.fromEmail)) {
    return logReview(
      email,
      hotel.id,
      intent,
      "Sender did not match the authorized address for the current delivery mode.",
      roomLabel,
    );
  }

  if (roomLabels.length > 1) {
    return logReview(
      email,
      hotel.id,
      intent,
      "The reply refers to multiple rooms and requires a manual split.",
      null,
    );
  }

  if (intent === "UNKNOWN") {
    return logReview(
      email,
      hotel.id,
      intent,
      "Matched hotel context, but no supported status intent was detected.",
      roomLabel,
    );
  }

  try {
    if (intent === "SAMPLE_PLACED") {
      const outcome = await prisma.$transaction(async (tx) => {
        const existingOpportunity = await findMatchingActiveOpportunity(tx, hotel.id, roomLabel);
        if (existingOpportunity) return { duplicate: existingOpportunity };

        const opportunity = await tx.opportunity.create({
          data: {
            hotelId: hotel.id,
            status: "OPPORTUNITY",
            roomLabel,
            notes: `Created from incoming email: ${intentLabel(intent)}.`,
          },
        });
        await tx.incomingEmail.create({
          data: incomingData({
            email,
            hotelId: hotel.id,
            opportunityId: opportunity.id,
            intent,
            status: "APPLIED",
            actionSummary: `Created Opportunity row${roomLabel ? ` for ${roomLabel}` : ""}.`,
            roomLabel,
          }),
        });
        return { opportunity };
      });

      if ("duplicate" in outcome) {
        return logReview(
          email,
          hotel.id,
          intent,
          `Possible duplicate placement for ${roomLabel || "an active room"}.`,
          roomLabel,
        );
      }

      return { contextual: true, handled: true, status: "applied" as const };
    }

    const nextStatus = intentToStatus[intent];
    if (!nextStatus) {
      return logReview(email, hotel.id, intent, "No supported transition was found.", roomLabel);
    }

    const transitionResult = await prisma.$transaction(async (tx) => {
      const opportunity = await findMatchingActiveOpportunity(tx, hotel.id, roomLabel);
      if (!opportunity) return null;

      const updated = await transitionOpportunityStatusInTransaction(tx, {
        hotelId: hotel.id,
        opportunityId: opportunity.id,
        nextStatus,
        reason: `Incoming email detected: ${intentLabel(intent)}.`,
      });
      await tx.incomingEmail.create({
        data: incomingData({
          email,
          hotelId: hotel.id,
          opportunityId: updated.id,
          intent,
          status: "APPLIED",
          actionSummary: `Moved ${roomLabel || "matching opportunity"} to ${updated.status}.`,
          roomLabel,
        }),
      });
      return updated;
    });

    if (!transitionResult) {
      return logReview(
        email,
        hotel.id,
        intent,
        `No matching active opportunity was found for ${roomLabel || "this reply"}.`,
        roomLabel,
      );
    }

    return { contextual: true, handled: true, status: "applied" as const };
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes("Unique constraint")) {
      return { contextual: true, handled: true, status: "duplicate" as const };
    }

    const message = caught instanceof Error ? caught.message : "Incoming email processing failed.";
    await prisma.incomingEmail.create({
      data: incomingData({
        email,
        hotelId: hotel.id,
        intent,
        status: "ERROR",
        actionSummary: "Could not apply the detected incoming email action.",
        errorMessage: message,
        roomLabel,
      }),
    });
    return { contextual: true, handled: true, status: "error" as const };
  }
}

export async function checkInboxForContextualReplies(): Promise<ProcessResult> {
  const settings = getEmailSettings();
  const client = createImapClient();
  const result: ProcessResult = { scanned: 0, contextual: 0, applied: 0, needsReview: 0, errors: 0 };

  await client.connect();
  const lock = await client.getMailboxLock(settings.imap.mailbox);

  try {
    const unseenUids = (await client.search({ seen: false }, { uid: true })) || [];
    const recentUids = unseenUids.slice(-50);
    if (recentUids.length === 0) return result;

    for await (const message of client.fetch(
      recentUids,
      { uid: true, source: true },
      { uid: true },
    )) {
      result.scanned += 1;
      if (!message.source) continue;

      const parsed = (await simpleParser(message.source)) as ParsedMail;
      const fromEmail = parsed.from?.value[0]?.address || "";
      const subject = parsed.subject || "";
      const body = parsed.text || "";
      if (!fromEmail || !body) continue;

      const baseEmail = {
        fromEmail,
        subject,
        body,
        receivedAt: parsed.date || new Date(),
      };
      const processed = await processContextualIncomingEmail({
        ...baseEmail,
        providerMessageId: parsed.messageId || fallbackMessageId(baseEmail),
      });

      if (processed.handled && message.uid) {
        await client.messageFlagsAdd(message.uid, ["\\Seen"], { uid: true });
      }
      if (!processed.contextual) continue;

      result.contextual += 1;
      if (processed.status === "applied") result.applied += 1;
      else if (processed.status === "needsReview") result.needsReview += 1;
      else if (processed.status === "error") result.errors += 1;
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return result;
}
