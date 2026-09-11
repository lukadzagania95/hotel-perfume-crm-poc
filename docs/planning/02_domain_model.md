# Domain Model

## Entity Summary

The Hotel record is the parent object. Sample/room opportunity rows are child records under a Hotel and represent the lifecycle of one sample or guest opportunity, unless clarified later.

## Hotel

Represents a hotel participating in the sampling stream.

Suggested fields:

- `id`
- `hotel_name`
- `contact_email`
- `original_product_stock`
- `current_product_stock`
- `original_sample_stock`
- `current_sample_stock`
- `stock_status`
- `created_at`
- `updated_at`

Notes:

- Original stock values are manually entered and must remain visible.
- Current stock values decrease as samples are used or products are sold.
- Hotel records own many sample/room opportunity rows.

## Sample/Room Opportunity Row

Represents one sample/guest opportunity lifecycle unless later clarified.

Suggested fields:

- `id`
- `hotel_id`
- `status`
- `room_number` optional, pending clarification
- `guest_reference` optional internal note, not required for POC
- `sample_placed_at`
- `sample_used_at`
- `product_sold_at`
- `failed_at`
- `source_email_id`
- `notes`
- `created_at`
- `updated_at`

Allowed statuses:

- `Pending`
- `Opportunity`
- `Interest`
- `Sale`
- `Fail`

Relationship:

- Belongs to one Hotel.
- May be created or updated from an incoming email.

## Email Template

Represents editable base copy for automated outreach.

Suggested fields:

- `id`
- `template_type`
- `subject`
- `body`
- `is_active`
- `created_at`
- `updated_at`

Suggested template types:

- `Placement Inquiry Email`
- `Sample Usage / Purchase Inquiry Email`
- `Purchase Follow-up Email`

## Email Automation Schedule

Represents configurable send frequency per email type.

Suggested fields:

- `id`
- `template_type`
- `frequency_days`
- `enabled`
- `last_run_at`
- `created_at`
- `updated_at`

Notes:

- Admin users must be able to configure frequency for each email type.
- The POC can keep scheduling simple and avoid complex campaign tooling.

## Email Log

Records outbound automated emails.

Suggested fields:

- `id`
- `hotel_id`
- `template_type`
- `recipient_email`
- `subject`
- `body_snapshot`
- `sent_at`
- `delivery_status`

Relationship:

- Belongs to one Hotel.
- May link to one or more related opportunity rows if known.

## Incoming Email Message

Records receptionist replies that may create or update opportunity rows.

Suggested fields:

- `id`
- `hotel_id`
- `sender_email`
- `subject`
- `body`
- `received_at`
- `classification_status`
- `classification_confidence`
- `interpreted_action`
- `related_opportunity_row_id`
- `requires_manual_review`

Notes:

- Incoming email interpretation may use AI/NLP classification or simpler rules in the POC.
- Vague or contradictory replies should be flagged for manual review.

## Relationships

- One Hotel has many Sample/Room Opportunity Rows.
- One Hotel has many Email Logs.
- One Hotel has many Incoming Email Messages.
- Email Templates are global admin-managed configuration.
- Email Automation Schedules are global or per-template configuration.
- Incoming Email Messages may create or update Sample/Room Opportunity Rows.
