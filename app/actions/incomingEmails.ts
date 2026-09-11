"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkInboxForContextualReplies } from "@/lib/incomingEmailProcessor";

export async function checkIncomingInbox() {
  let result: Awaited<ReturnType<typeof checkInboxForContextualReplies>>;

  try {
    result = await checkInboxForContextualReplies();
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Could not check the incoming email inbox.";

    redirect(`/emails/incoming?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/");
  revalidatePath("/hotels");
  revalidatePath("/emails/incoming");
  redirect(
    `/emails/incoming?scanned=${result.scanned}&contextual=${result.contextual}&applied=${result.applied}&review=${result.needsReview}&errors=${result.errors}`,
  );
}
