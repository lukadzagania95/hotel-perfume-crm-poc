"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runEmailAutomation } from "@/lib/emailAutomation";
import { getEmailSettings } from "@/lib/emailTransport";

export async function sendSuggestedEmails() {
  try {
    const mode = getEmailSettings().mode;
    const result = await runEmailAutomation({
      // Manual test runs are intentionally convenient. Live runs always respect frequency.
      force: mode === "test",
      source: "manual",
    });

    revalidatePath("/emails/logs");
    redirect(
      `/emails/logs?eligible=${result.eligible}&due=${result.due}&skipped=${result.skipped}&sent=${result.sent}&failed=${result.failed}&mode=${result.mode}`,
    );
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Email automation failed.";
    redirect(`/emails/logs?error=${encodeURIComponent(message)}`);
  }
}
