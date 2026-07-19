import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseTriggerStatuses } from "@/lib/emailConfig";
import {
  createEmailTransporter,
  formatFromAddress,
  getEmailSettings,
  resolveRecipient,
} from "@/lib/emailTransport";
import { getSuggestedTemplateType, renderEmailBody } from "@/lib/emailRules";
import { appendHotelToken } from "@/lib/incomingEmailRules";

const DAY_MS = 24 * 60 * 60 * 1000;

export type EmailAutomationResult = {
  mode: "test" | "live";
  eligible: number;
  due: number;
  skipped: number;
  sent: number;
  failed: number;
};

function isDue(lastSentAt: Date | undefined, frequencyDays: number, now: Date) {
  return !lastSentAt || now.getTime() - lastSentAt.getTime() >= frequencyDays * DAY_MS;
}

function scheduledDedupeKey({
  hotelId,
  templateId,
  mode,
  frequencyDays,
  now,
}: {
  hotelId: string;
  templateId: string;
  mode: string;
  frequencyDays: number;
  now: Date;
}) {
  const period = Math.floor(now.getTime() / (Math.max(1, frequencyDays) * DAY_MS));
  return `${mode}:${hotelId}:${templateId}:${period}`;
}

async function claimEmailLog({
  dedupeKey,
  data,
}: {
  dedupeKey: string;
  data: Prisma.EmailLogUncheckedCreateInput;
}) {
  try {
    return await prisma.emailLog.create({ data: { ...data, dedupeKey, attemptCount: 1 } });
  } catch (caught) {
    if (!(caught instanceof Prisma.PrismaClientKnownRequestError) || caught.code !== "P2002") {
      throw caught;
    }

    const existing = await prisma.emailLog.findUnique({ where: { dedupeKey } });

    if (!existing || existing.status !== "FAILED") {
      return null;
    }

    const claimed = await prisma.emailLog.updateMany({
      where: { id: existing.id, status: "FAILED" },
      data: {
        status: "DRAFT",
        errorMessage: null,
        attemptCount: { increment: 1 },
      },
    });

    return claimed.count === 1 ? prisma.emailLog.findUnique({ where: { id: existing.id } }) : null;
  }
}

export async function runEmailAutomation({
  force = false,
  source = "scheduled",
  now = new Date(),
}: {
  force?: boolean;
  source?: "manual" | "scheduled";
  now?: Date;
} = {}): Promise<EmailAutomationResult> {
  const settings = getEmailSettings();

  if (force && settings.mode !== "test") {
    throw new Error("Forced sends are only allowed in test mode.");
  }

  // Configuration is validated before any log is claimed.
  resolveRecipient("validation@example.com");
  const transporter = createEmailTransporter();
  const deliveryMode = settings.mode.toUpperCase();
  const result: EmailAutomationResult = {
    mode: settings.mode,
    eligible: 0,
    due: 0,
    skipped: 0,
    sent: 0,
    failed: 0,
  };

  const [hotels, templates, sentLogs] = await Promise.all([
    prisma.hotel.findMany({
      include: { opportunities: { select: { status: true } } },
      orderBy: { hotelName: "asc" },
    }),
    prisma.emailTemplate.findMany({ where: { isActive: true } }),
    prisma.emailLog.findMany({
      where: { status: "SENT", deliveryMode, emailTemplateId: { not: null } },
      select: { hotelId: true, emailTemplateId: true, sentAt: true },
      orderBy: { sentAt: "desc" },
    }),
  ]);

  const latestSentAt = new Map<string, Date>();
  for (const log of sentLogs) {
    if (!log.emailTemplateId || !log.sentAt) continue;
    const key = `${log.hotelId}:${log.emailTemplateId}`;
    if (!latestSentAt.has(key)) latestSentAt.set(key, log.sentAt);
  }

  const templateByType = new Map(
    templates.flatMap((template) => (template.type ? [[template.type, template] as const] : [])),
  );
  const customTemplates = templates.filter((template) => !template.isDefault);

  try {
    for (const hotel of hotels) {
      const statuses = hotel.opportunities.map((opportunity) => opportunity.status);
      const suggestedType = getSuggestedTemplateType(statuses);
      const selected = new Map<string, (typeof templates)[number]>();

      if (suggestedType) {
        const template = templateByType.get(suggestedType);
        if (template) selected.set(template.id, template);
      }

      for (const template of customTemplates) {
        const triggers = parseTriggerStatuses(template.triggerStatuses);
        if (triggers.some((status) => statuses.includes(status))) selected.set(template.id, template);
      }

      for (const template of selected.values()) {
        result.eligible += 1;
        const lastSent = latestSentAt.get(`${hotel.id}:${template.id}`);

        if (!force && !isDue(lastSent, template.frequencyDays, now)) {
          result.skipped += 1;
          continue;
        }

        result.due += 1;
        const { actualRecipient, intendedRecipient } = resolveRecipient(hotel.contactEmail);
        const subject = appendHotelToken(renderEmailBody(template.subject, hotel.hotelName), hotel.id);
        const body = renderEmailBody(template.body, hotel.hotelName);
        const dedupeKey = force
          ? `test:${hotel.id}:${template.id}:${randomUUID()}`
          : scheduledDedupeKey({
              hotelId: hotel.id,
              templateId: template.id,
              mode: deliveryMode,
              frequencyDays: template.frequencyDays,
              now,
            });
        const log = await claimEmailLog({
          dedupeKey,
          data: {
            hotelId: hotel.id,
            emailTemplateId: template.id,
            templateType: template.type,
            templateLabel: template.label,
            intendedRecipientEmail: intendedRecipient,
            recipientEmail: actualRecipient,
            fromEmail: settings.emailAddress,
            deliveryMode,
            subject,
            body,
            status: "DRAFT",
          },
        });

        if (!log) {
          result.skipped += 1;
          continue;
        }

        try {
          const info = await transporter.sendMail({
            from: formatFromAddress(settings),
            to: actualRecipient,
            replyTo: settings.emailAddress,
            subject,
            text: body,
            headers: {
              "X-HOC-Hotel-ID": hotel.id,
              "X-HOC-Delivery-Mode": deliveryMode,
              "X-HOC-Automation-Source": source,
            },
          });

          await prisma.emailLog.update({
            where: { id: log.id },
            data: {
              status: "SENT",
              providerMessageId: info.messageId,
              sentAt: new Date(),
              errorMessage: null,
            },
          });
          result.sent += 1;
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : "Email send failed.";
          await prisma.emailLog.update({
            where: { id: log.id },
            data: { status: "FAILED", errorMessage: message.slice(0, 2000) },
          });
          result.failed += 1;
        }
      }
    }
  } finally {
    transporter.close();
  }

  return result;
}
