"use server";

import type { OpportunityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { canTransitionStatus } from "@/lib/statusLifecycle";

function errorRedirect(hotelId: string, message: string) {
  redirect(`/hotels/${hotelId}?error=${encodeURIComponent(message)}`);
}

export async function createOpportunity(formData: FormData) {
  const hotelId = String(formData.get("hotelId") ?? "");
  const roomLabel = String(formData.get("roomLabel") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!hotelId) {
    redirect("/hotels");
  }

  await prisma.opportunity.create({
    data: {
      hotelId,
      status: "OPPORTUNITY",
      roomLabel: roomLabel || null,
      notes: notes || null,
    },
  });

  revalidatePath(`/hotels/${hotelId}`);
  redirect(`/hotels/${hotelId}`);
}

export async function transitionOpportunity(formData: FormData) {
  const hotelId = String(formData.get("hotelId") ?? "");
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "") as OpportunityStatus;
  let error: string | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({
        where: { id: opportunityId },
        include: { hotel: true },
      });

      if (!opportunity || opportunity.hotelId !== hotelId) {
        throw new Error("Opportunity row was not found.");
      }

      if (!canTransitionStatus(opportunity.status, nextStatus)) {
        throw new Error("That status change is not allowed.");
      }

      const opportunityUpdate: {
        status: OpportunityStatus;
        sampleUsedAt?: Date;
        productSoldAt?: Date;
        failedAt?: Date;
        sampleStockDeducted?: boolean;
        productStockDeducted?: boolean;
      } = {
        status: nextStatus,
      };

      if (nextStatus === "INTEREST" && !opportunity.sampleStockDeducted) {
        if (opportunity.hotel.currentSampleStock <= 0) {
          throw new Error("Current sample stock is already zero.");
        }

        await tx.hotel.update({
          where: { id: hotelId },
          data: { currentSampleStock: { decrement: 1 } },
        });

        await tx.stockEvent.create({
          data: {
            hotelId,
            opportunityId,
            eventType: "SAMPLE_USED",
            quantity: -1,
            reason: "Opportunity moved to Interest.",
          },
        });

        opportunityUpdate.sampleStockDeducted = true;
        opportunityUpdate.sampleUsedAt = new Date();
      }

      if (nextStatus === "SALE" && !opportunity.productStockDeducted) {
        if (opportunity.hotel.currentProductStock <= 0) {
          throw new Error("Current product stock is already zero.");
        }

        await tx.hotel.update({
          where: { id: hotelId },
          data: { currentProductStock: { decrement: 1 } },
        });

        await tx.stockEvent.create({
          data: {
            hotelId,
            opportunityId,
            eventType: "PRODUCT_SOLD",
            quantity: -1,
            reason: "Opportunity moved to Sale.",
          },
        });

        opportunityUpdate.productStockDeducted = true;
        opportunityUpdate.productSoldAt = new Date();
      }

      if (nextStatus === "FAIL") {
        opportunityUpdate.failedAt = new Date();
      }

      await tx.opportunity.update({
        where: { id: opportunityId },
        data: opportunityUpdate,
      });
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Status update failed.";
  }

  revalidatePath(`/hotels/${hotelId}`);

  if (error) {
    errorRedirect(hotelId, error);
  }

  redirect(`/hotels/${hotelId}`);
}
