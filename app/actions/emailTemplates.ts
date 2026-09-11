"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { serializeTriggerStatuses } from "@/lib/emailConfig";
import { positiveInteger, requiredText } from "@/lib/validation";

function readTemplate(formData: FormData) {
  return {
    label: requiredText(formData.get("label"), "Template name", 200),
    subject: requiredText(formData.get("subject"), "Subject", 998),
    body: requiredText(formData.get("body"), "Body", 50_000),
    frequencyDays: positiveInteger(formData.get("frequencyDays"), "Frequency"),
    triggerStatuses: serializeTriggerStatuses(
      formData.getAll("triggerStatuses").map((status) => String(status)),
    ),
    isActive: formData.get("isActive") === "on",
  };
}

function templateError(caught: unknown): never {
  const message = caught instanceof Error ? caught.message : "Template details are invalid.";
  redirect(`/emails/templates?error=${encodeURIComponent(message)}`);
}

export async function updateEmailTemplate(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "").trim();
  if (!templateId) redirect("/emails/templates?error=Template%20ID%20is%20required");

  let data: ReturnType<typeof readTemplate>;
  try {
    data = readTemplate(formData);
  } catch (caught) {
    templateError(caught);
  }

  await prisma.emailTemplate.update({ where: { id: templateId }, data });
  revalidatePath("/emails/templates");
  redirect("/emails/templates");
}

export async function createEmailTemplate(formData: FormData) {
  let data: ReturnType<typeof readTemplate>;
  try {
    data = readTemplate(formData);
    if (!data.triggerStatuses) throw new Error("Choose at least one opportunity status.");
  } catch (caught) {
    templateError(caught);
  }

  await prisma.emailTemplate.create({
    data: { ...data, isDefault: false },
  });
  revalidatePath("/emails/templates");
  redirect("/emails/templates");
}
