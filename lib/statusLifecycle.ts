import type { OpportunityStatus } from "@prisma/client";

export const ACTIVE_STATUSES: OpportunityStatus[] = ["OPPORTUNITY", "INTEREST"];
export const CLOSED_STATUSES: OpportunityStatus[] = ["SALE", "FAIL"];

const allowedTransitions: Record<OpportunityStatus, OpportunityStatus[]> = {
  OPPORTUNITY: ["INTEREST", "SALE", "FAIL"],
  INTEREST: ["SALE", "FAIL"],
  SALE: [],
  FAIL: [],
};

export function canTransitionStatus(
  currentStatus: OpportunityStatus,
  nextStatus: OpportunityStatus,
) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function getNextStatuses(currentStatus: OpportunityStatus) {
  return allowedTransitions[currentStatus];
}

export function formatStatus(status: OpportunityStatus) {
  const labels: Record<OpportunityStatus, string> = {
    OPPORTUNITY: "Opportunity",
    INTEREST: "Interest",
    SALE: "Sale",
    FAIL: "Fail",
  };

  return labels[status];
}
