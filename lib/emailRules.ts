import type { EmailTemplateType, OpportunityStatus } from "@prisma/client";

export function getSuggestedTemplateType(
  statuses: OpportunityStatus[],
): EmailTemplateType | null {
  const hasInterest = statuses.includes("INTEREST");
  const hasOpportunity = statuses.includes("OPPORTUNITY");
  const hasAnyRows = statuses.length > 0;
  const hasOnlyClosedRows =
    hasAnyRows && statuses.every((status) => status === "SALE" || status === "FAIL");

  if (hasOnlyClosedRows) {
    return null;
  }

  if (hasInterest) {
    return "PURCHASE_FOLLOW_UP";
  }

  if (hasOpportunity) {
    return "SAMPLE_USAGE_PURCHASE_INQUIRY";
  }

  return "PLACEMENT_INQUIRY";
}

export function renderEmailBody(template: string, hotelName: string) {
  return template.replaceAll("{{hotelName}}", hotelName);
}
