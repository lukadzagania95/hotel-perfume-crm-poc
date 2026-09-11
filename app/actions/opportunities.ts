"use server";

import type { OpportunityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createOpportunityRow, transitionOpportunityStatus } from "@/lib/opportunityWorkflow";
import { optionalText, requiredText } from "@/lib/validation";

function getReturnPath(formData: FormData, hotelId: string) {
  const returnTo = String(formData.get("returnTo") ?? "").trim();

  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }

  return `/hotels/${hotelId}`;
}

function withError(path: string, message: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}error=${encodeURIComponent(message)}`;
}

function refreshHotelViews(hotelId: string) {
  revalidatePath("/");
  revalidatePath("/hotels");
  revalidatePath(`/hotels/${hotelId}`);
}

function errorRedirect(path: string, message: string) {
  redirect(withError(path, message));
}

export async function createOpportunity(formData: FormData) {
  const hotelId = String(formData.get("hotelId") ?? "").trim();

  if (!hotelId) {
    redirect("/hotels");
  }

  try {
    await createOpportunityRow({
      hotelId,
      roomLabel: optionalText(formData.get("roomLabel"), "Room / reference", 100),
      notes: optionalText(formData.get("notes"), "Notes", 2000),
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not create opportunity.";
    errorRedirect(`/hotels/${hotelId}`, message);
  }

  refreshHotelViews(hotelId);
  redirect(`/hotels/${hotelId}`);
}

export async function transitionOpportunity(formData: FormData) {
  const hotelId = String(formData.get("hotelId") ?? "").trim();
  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "") as OpportunityStatus;
  const returnPath = getReturnPath(formData, hotelId);
  let error: string | null = null;

  try {
    requiredText(formData.get("hotelId"), "Hotel ID", 100);
    requiredText(formData.get("opportunityId"), "Opportunity ID", 100);
    if (!["OPPORTUNITY", "INTEREST", "SALE", "FAIL"].includes(nextStatus)) {
      throw new Error("Requested status is invalid.");
    }
    await transitionOpportunityStatus({
      hotelId,
      opportunityId,
      nextStatus,
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Status update failed.";
  }

  refreshHotelViews(hotelId);

  if (error) {
    errorRedirect(returnPath, error);
  }

  redirect(returnPath);
}
