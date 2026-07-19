import type { OpportunityStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canTransitionStatus } from "@/lib/statusLifecycle";

type TransactionClient = Prisma.TransactionClient;

export async function createOpportunityRow({
  hotelId,
  roomLabel,
  notes,
}: {
  hotelId: string;
  roomLabel?: string | null;
  notes?: string | null;
}) {
  return prisma.opportunity.create({
    data: {
      hotelId,
      status: "OPPORTUNITY",
      roomLabel: roomLabel || null,
      notes: notes || null,
    },
  });
}

export async function transitionOpportunityStatus({
  hotelId,
  opportunityId,
  nextStatus,
  reason,
}: {
  hotelId: string;
  opportunityId: string;
  nextStatus: OpportunityStatus;
  reason?: string;
}) {
  return prisma.$transaction((tx) =>
    transitionOpportunityStatusInTransaction(tx, {
      hotelId,
      opportunityId,
      nextStatus,
      reason,
    }),
  );
}

export async function transitionOpportunityStatusInTransaction(
  tx: TransactionClient,
  {
    hotelId,
    opportunityId,
    nextStatus,
    reason,
  }: {
    hotelId: string;
    opportunityId: string;
    nextStatus: OpportunityStatus;
    reason?: string;
  },
) {
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
        reason: reason || "Opportunity moved to Interest.",
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
        reason: reason || "Opportunity moved to Sale.",
      },
    });

    opportunityUpdate.productStockDeducted = true;
    opportunityUpdate.productSoldAt = new Date();
  }

  if (nextStatus === "FAIL") {
    opportunityUpdate.failedAt = new Date();
  }

  return tx.opportunity.update({
    where: { id: opportunityId },
    data: opportunityUpdate,
  });
}
