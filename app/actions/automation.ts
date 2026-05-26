"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSuggestedTemplateType, renderEmailBody } from "@/lib/emailRules";

export async function simulateEmailAutomation() {
  const hotels = await prisma.hotel.findMany({
    include: {
      opportunities: {
        select: { status: true },
      },
    },
    orderBy: { hotelName: "asc" },
  });

  const templates = await prisma.emailTemplate.findMany();
  const templateByType = new Map(templates.map((template) => [template.type, template]));
  let createdCount = 0;

  for (const hotel of hotels) {
    const suggestedType = getSuggestedTemplateType(
      hotel.opportunities.map((opportunity) => opportunity.status),
    );

    if (!suggestedType) {
      continue;
    }

    const template = templateByType.get(suggestedType);

    if (!template) {
      continue;
    }

    await prisma.emailLog.create({
      data: {
        hotelId: hotel.id,
        templateType: template.type,
        templateLabel: template.label,
        recipientEmail: hotel.contactEmail,
        subject: renderEmailBody(template.subject, hotel.hotelName),
        body: renderEmailBody(template.body, hotel.hotelName),
        status: "SIMULATED",
      },
    });

    createdCount += 1;
  }

  revalidatePath("/emails/logs");
  redirect(`/emails/logs?created=${createdCount}`);
}
