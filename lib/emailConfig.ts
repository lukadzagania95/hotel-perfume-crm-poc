import type { EmailTemplateType } from "@prisma/client";

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  PLACEMENT_INQUIRY: "Placement Inquiry Email",
  SAMPLE_USAGE_PURCHASE_INQUIRY: "Sample Usage / Purchase Inquiry Email",
  PURCHASE_FOLLOW_UP: "Purchase Follow-up Email",
};

export const DEFAULT_EMAIL_CONFIGS: Array<{
  type: EmailTemplateType;
  label: string;
  subject: string;
  body: string;
  frequencyDays: number;
}> = [
  {
    type: "PLACEMENT_INQUIRY",
    label: EMAIL_TEMPLATE_LABELS.PLACEMENT_INQUIRY,
    subject: "Have any perfume samples been placed?",
    body:
      "Hello {{hotelName}},\n\nCould you let us know whether any perfume samples have been placed in guest rooms?\n\nThank you.",
    frequencyDays: 7,
  },
  {
    type: "SAMPLE_USAGE_PURCHASE_INQUIRY",
    label: EMAIL_TEMPLATE_LABELS.SAMPLE_USAGE_PURCHASE_INQUIRY,
    subject: "Any sample usage or purchase interest?",
    body:
      "Hello {{hotelName}},\n\nHave guests used the samples placed in rooms, or asked about purchasing the full-size perfume at reception?\n\nThank you.",
    frequencyDays: 3,
  },
  {
    type: "PURCHASE_FOLLOW_UP",
    label: EMAIL_TEMPLATE_LABELS.PURCHASE_FOLLOW_UP,
    subject: "Did the guest ask to purchase the perfume?",
    body:
      "Hello {{hotelName}},\n\nFollowing up on the guest who used a sample: did they ask to purchase the full-size perfume?\n\nThank you.",
    frequencyDays: 2,
  },
];
