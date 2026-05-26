"use server";

import type { EmailTemplateType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EMAIL_TEMPLATE_LABELS } from "@/lib/emailConfig";
import { clampStockValue } from "@/lib/stock";

export async function updateEmailTemplate(formData: FormData) {
  const type = String(formData.get("type") ?? "") as EmailTemplateType;
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const frequencyDays = clampStockValue(Number(formData.get("frequencyDays") ?? 1));

  if (!type || !subject || !body) {
    redirect("/emails/templates?error=Template%20subject%20and%20body%20are%20required");
  }

  await prisma.emailTemplate.update({
    where: { type },
    data: {
      label: EMAIL_TEMPLATE_LABELS[type],
      subject,
      body,
    },
  });

  await prisma.emailSchedule.update({
    where: { templateType: type },
    data: {
      frequencyDays: Math.max(1, frequencyDays),
    },
  });

  revalidatePath("/emails/templates");
  redirect("/emails/templates");
}
