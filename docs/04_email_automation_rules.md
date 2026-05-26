# Email Automation Rules

## Purpose

Email automation keeps hotel receptionists engaged without requiring HOC users to manually chase every hotel. The hotel contact email is the main communication channel for the POC.

Admin users must be able to edit base email templates and configure sending frequency for each email type.

## Suggested Template Types

- `Placement Inquiry Email`
- `Sample Usage / Purchase Inquiry Email`
- `Purchase Follow-up Email`

## Outbound Email Rules

### A. No Opportunity Row Exists

Send regular inquiry emails asking whether any samples were placed in rooms.

Use:

- `Placement Inquiry Email`

### B. At Least One Opportunity Row Exists

Send regular emails asking whether samples were used in the rooms and whether the guest asked to purchase the product.

Use:

- `Sample Usage / Purchase Inquiry Email`

### C. At Least One Interest Row Exists

Send regular emails asking whether the guest asked to purchase the product.

Use:

- `Purchase Follow-up Email`

### D. Only Sale or Fail Rows Remain

Stop sending automated follow-up emails.

## Incoming Email Response Handling

Receptionist replies should eventually determine:

- Creation of new opportunity rows.
- Status updates on existing rows.
- Stock deductions where applicable.
- Whether a reply requires manual review.

Example interpretations:

- "We placed samples in rooms 101 and 204" -> create two `Opportunity` rows if room-level tracking is enabled.
- "The guest in 101 used the sample" -> update matching row to `Interest` and deduct one sample.
- "Room 101 bought a bottle" -> update matching row to `Sale` and deduct one product.
- "Room 204 checked out and did not buy" -> update matching row to `Fail`.

## Classification Approach

The POC will likely need either:

- AI/NLP classification for unstructured receptionist replies, or
- rules-based classification for constrained phrases and simple email formats.

A practical POC can begin with manual review plus simple classification rules, then add AI/NLP once examples of real receptionist replies are available.

## Assumptions

- Emails may be vague, partial, or contradictory.
- One email may refer to multiple rooms or opportunities.
- If confidence is low, the system should flag the message for manual review.
- Manual override should be available for correcting statuses, row links, and stock.
- Email logs should preserve outbound body snapshots and incoming raw message text.

## Edge Cases

- Receptionist reports a sale without prior sample usage.
- Receptionist reports sample usage but no room number.
- Receptionist reports several rooms in one email.
- Receptionist replies from a different email address than the configured hotel contact.
- A reply contradicts a terminal row.
- A reply would cause negative stock.
- All active rows close and automated follow-ups should stop.
