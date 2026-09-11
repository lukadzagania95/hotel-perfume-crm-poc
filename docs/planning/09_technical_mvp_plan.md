# Technical MVP Plan

## Documentation Review Summary

The current repository documentation is consistent and implementation-ready for a simple internal POC. The product assumptions are clear:

- Hotel is the parent record.
- Sample/room opportunity rows are child records.
- `Pending` is conceptual and hidden from the main active table.
- `Opportunity` and `Interest` are active statuses.
- `Sale` and `Fail` are terminal statuses.
- Original stock values remain visible while current stock values decrease.
- Manual override is expected because email replies may be vague or contradictory.
- Email automation should start simple and become more automated only after real hotel reply patterns are understood.

This MVP plan keeps the build small, inspectable, and documentation-aligned.

## 1. Recommended Stack

Recommended MVP stack:

- Next.js App Router for the web app.
- TypeScript for typed business logic.
- Prisma for schema, migrations, and database access.
- SQLite for local/internal POC development.
- PostgreSQL later if deployment or shared access requires it.
- Tailwind CSS for simple CRM-style layouts.
- Server Actions for form submissions and mutations.
- Route Handlers only where an HTTP endpoint is useful, such as simulated automation runs.

Authentication can be deferred or kept very simple for the first local/internal POC. If needed, use a single admin login later rather than a full role system.

## 2. App Architecture

Suggested structure:

```text
app/
  hotels/
    page.tsx
    new/page.tsx
    [hotelId]/page.tsx
  opportunities/
    page.tsx
  emails/
    templates/page.tsx
    logs/page.tsx
    incoming/page.tsx
  admin/
    settings/page.tsx
  actions/
    hotels.ts
    opportunities.ts
    emailTemplates.ts
    automation.ts
lib/
  db.ts
  statusLifecycle.ts
  stock.ts
  emailRules.ts
  incomingEmailInterpreter.ts
prisma/
  schema.prisma
```

Architecture principles:

- Keep business rules in `lib/` rather than inside UI components.
- Use Server Actions for create/update workflows.
- Keep the UI mostly CRUD and table/detail driven.
- Avoid background workers in the first implementation.
- Use simulated automation runs triggered from the admin UI before real scheduled jobs.

## 3. Database Schema

Suggested Prisma-style schema concepts:

```prisma
enum OpportunityStatus {
  PENDING
  OPPORTUNITY
  INTEREST
  SALE
  FAIL
}

enum EmailTemplateType {
  PLACEMENT_INQUIRY
  SAMPLE_USAGE_PURCHASE_INQUIRY
  PURCHASE_FOLLOW_UP
}

enum EmailLogStatus {
  DRAFT
  SIMULATED_SENT
  SENT
  FAILED
}

enum IncomingEmailReviewStatus {
  UNREVIEWED
  SUGGESTED
  APPLIED
  NEEDS_REVIEW
  IGNORED
}

model Hotel {
  id                   String   @id @default(cuid())
  hotelName            String
  contactEmail         String
  originalProductStock Int
  currentProductStock  Int
  originalSampleStock  Int
  currentSampleStock   Int
  notes                String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  opportunities        Opportunity[]
  emailLogs            EmailLog[]
  incomingEmails       IncomingEmail[]
  stockEvents          StockEvent[]
}

model Opportunity {
  id                   String            @id @default(cuid())
  hotelId              String
  status               OpportunityStatus @default(PENDING)
  roomNumber           String?
  guestReference       String?
  notes                String?
  samplePlacedAt       DateTime?
  sampleUsedAt         DateTime?
  productSoldAt        DateTime?
  failedAt             DateTime?
  sampleStockDeducted  Boolean           @default(false)
  productStockDeducted Boolean           @default(false)
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt

  hotel                Hotel             @relation(fields: [hotelId], references: [id])
  stockEvents          StockEvent[]
}

model StockEvent {
  id            String   @id @default(cuid())
  hotelId       String
  opportunityId String?
  eventType     String
  quantity      Int
  reason        String
  createdAt     DateTime @default(now())

  hotel         Hotel    @relation(fields: [hotelId], references: [id])
  opportunity   Opportunity? @relation(fields: [opportunityId], references: [id])
}

model EmailTemplate {
  id           String            @id @default(cuid())
  type         EmailTemplateType @unique
  subject      String
  body         String
  isActive     Boolean           @default(true)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
}

model EmailSchedule {
  id            String            @id @default(cuid())
  templateType  EmailTemplateType @unique
  frequencyDays Int
  enabled       Boolean           @default(true)
  lastRunAt     DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

model EmailLog {
  id             String         @id @default(cuid())
  hotelId        String
  templateType   EmailTemplateType
  recipientEmail String
  subject        String
  bodySnapshot   String
  status         EmailLogStatus @default(DRAFT)
  simulated      Boolean        @default(true)
  sentAt         DateTime?
  createdAt      DateTime       @default(now())

  hotel          Hotel          @relation(fields: [hotelId], references: [id])
}

model IncomingEmail {
  id                  String                    @id @default(cuid())
  hotelId             String?
  senderEmail         String
  subject             String
  body                String
  receivedAt          DateTime                  @default(now())
  reviewStatus        IncomingEmailReviewStatus @default(UNREVIEWED)
  suggestedAction     String?
  confidence          Float?
  relatedOpportunityId String?
  notes               String?

  hotel               Hotel?                    @relation(fields: [hotelId], references: [id])
}
```

MVP simplification:

- Store stock status as a computed UI value instead of a database column at first.
- Keep room number optional.
- Use `StockEvent` for auditability and idempotency, but keep it simple.

## 4. Main Pages and Screens

Core screens:

- Hotels list: hotel name, contact email, current/original stock, stock color, active row count.
- New/Edit Hotel: basic hotel details and stock fields.
- Hotel detail: stock summary, active opportunities, closed opportunities, email history, incoming replies.
- Opportunity editor: create row, update status, room/reference, notes.
- Email templates: edit the three MVP templates.
- Email frequency settings: configure frequency per template type.
- Simulated automation screen: preview which hotels would receive which email and create simulated logs.
- Incoming email review: paste/import receptionist replies, view suggested interpretation, apply or ignore.
- Dashboard: simple counts for active opportunities, low-stock hotels, emails needing review.

## 5. API Routes or Server Actions

Prefer Server Actions for MVP mutations:

- `createHotel`
- `updateHotel`
- `createOpportunity`
- `transitionOpportunityStatus`
- `manualAdjustStock`
- `updateEmailTemplate`
- `updateEmailSchedule`
- `simulateAutomationRun`
- `createIncomingEmail`
- `suggestIncomingEmailAction`
- `applyIncomingEmailAction`
- `ignoreIncomingEmail`

Optional Route Handlers:

- `POST /api/automation/simulate` for simulated automation runs.
- `POST /api/incoming-email/simulate` for testing pasted email payloads.

Avoid public webhooks and real email providers in the first MVP.

## 6. Status Transition Logic

Implement one central transition function:

```text
transitionOpportunityStatus(opportunityId, nextStatus, options)
```

Rules:

- `PENDING` can move to `OPPORTUNITY`.
- `OPPORTUNITY` can move to `INTEREST`, `SALE`, or `FAIL`.
- `INTEREST` can move to `SALE` or `FAIL`.
- `SALE` and `FAIL` are terminal.
- Reopening terminal rows requires explicit manual override.
- Invalid transitions should return a clear validation error.
- Transition side effects should call stock logic in the same transaction.

Timestamp behavior:

- Set `samplePlacedAt` when moving to `OPPORTUNITY`.
- Set `sampleUsedAt` when moving to `INTEREST`.
- Set `productSoldAt` when moving to `SALE`.
- Set `failedAt` when moving to `FAIL`.

## 7. Stock Deduction Logic

Implement stock deduction in one service:

```text
applyStockEffectsForTransition(opportunity, previousStatus, nextStatus)
```

Rules:

- Moving to `INTEREST` deducts `1` from `currentSampleStock`.
- Moving to `SALE` deducts `1` from `currentProductStock`.
- Do not deduct sample stock twice for the same row.
- Do not deduct product stock twice for the same row.
- Prevent negative stock.
- Create a `StockEvent` for each deduction.
- Keep original stock unchanged.

For the MVP, `SALE` should deduct product stock only. Whether it should imply sample usage remains an open product question, so the system should not silently deduct sample stock unless the row already reached `INTEREST` or the user explicitly confirms an override.

Stock color recommendation for MVP:

- Show separate sample and product stock percentages if possible.
- Also show a combined simple label only if needed for list sorting.
- Keep the open question visible until product confirms the preferred calculation.

## 8. Email Template and Frequency Configuration

Create three default templates:

- Placement Inquiry Email
- Sample Usage / Purchase Inquiry Email
- Purchase Follow-up Email

Configuration approach:

- Store subject/body in `EmailTemplate`.
- Store `frequencyDays` and `enabled` in `EmailSchedule`.
- Provide admin screens for editing templates and schedules.
- Seed sensible defaults during app setup.
- Preserve `bodySnapshot` in `EmailLog` when a simulated email is generated.

Suggested default frequencies for MVP testing:

- Placement Inquiry Email: every 7 days.
- Sample Usage / Purchase Inquiry Email: every 3 days.
- Purchase Follow-up Email: every 2 days.

These defaults should be easy to change in the admin UI.

## 9. Email Automation Approach for the MVP

Start with simulated automation, not real email sending.

MVP automation flow:

1. Admin opens the simulated automation screen.
2. System evaluates hotels and active rows.
3. System recommends the email type for each hotel.
4. Admin previews the subject/body.
5. Admin clicks "Create simulated email logs."
6. System records `EmailLog` rows with `SIMULATED_SENT`.

Selection rules:

- If no `OPPORTUNITY` or `INTEREST` rows exist, recommend Placement Inquiry Email.
- If at least one `OPPORTUNITY` row exists, recommend Sample Usage / Purchase Inquiry Email.
- If at least one `INTEREST` row exists, recommend Purchase Follow-up Email.
- If only `SALE` or `FAIL` rows remain, do not recommend follow-up.
- If hotel has no sample and no product stock, flag for manual review before emailing.

Later real automation:

- Add a real email provider.
- Add scheduled execution.
- Add unsubscribe/suppression controls if needed.
- Add delivery status handling.

## 10. Incoming Email Interpretation Approach for the MVP

Start with manual paste/import and suggested classification.

MVP flow:

1. Admin creates an Incoming Email record by pasting sender, subject, and body.
2. System links the email to a hotel by sender email or manual selection.
3. System runs simple keyword/rules-based suggestions.
4. Admin reviews the suggested action.
5. Admin applies the action, edits it, or ignores it.

Simple rule examples:

- Mentions "placed", "put", "left", or "room" -> suggest creating `OPPORTUNITY`.
- Mentions "used", "tried", or "opened" -> suggest `INTEREST`.
- Mentions "bought", "sold", "purchase", or "paid" -> suggest `SALE`.
- Mentions "checked out", "no purchase", or "did not buy" -> suggest `FAIL`.

MVP guardrails:

- Never auto-apply suggestions without admin confirmation.
- Flag multiple room numbers for manual review.
- Flag contradictory language for manual review.
- Store confidence as a rough heuristic, not a trusted AI score.
- Keep raw incoming email text visible.

Later automation:

- Add AI/NLP classification after collecting real examples.
- Add confidence thresholds.
- Add automatic application only for high-confidence low-risk cases.
- Add real inbound email webhooks.

## 11. Manual First vs Automated Later

Manual first:

- Hotel creation and editing.
- Opportunity creation and status changes.
- Stock corrections and overrides.
- Email template editing.
- Email frequency editing.
- Simulated automation run approval.
- Incoming email review and action approval.

Automated later:

- Scheduled outbound emails.
- Real email delivery.
- Real inbound email capture.
- AI/NLP email interpretation.
- Automatic row creation from high-confidence replies.
- Automatic status updates from high-confidence replies.
- Advanced stock alerts and replenishment workflows.

## 12. Suggested Implementation Phases

### Phase 1: Project Scaffold and Database

- Scaffold Next.js, TypeScript, Prisma, and SQLite.
- Add basic layout and navigation.
- Add Prisma schema and migrations.
- Seed default email templates and schedules.

### Phase 2: Manual CRM Core

- Build Hotel list, create, edit, and detail screens.
- Build opportunity rows under Hotel detail.
- Implement status transition service.
- Implement stock deduction service.
- Add active/closed row display rules.

### Phase 3: Stock and Dashboard Visibility

- Add stock color indicators.
- Add low-stock and no-stock warnings.
- Add simple dashboard counts.
- Add manual stock adjustment with reason notes.

### Phase 4: Email Templates and Simulated Automation

- Build template editor.
- Build frequency settings.
- Build automation preview.
- Create simulated email logs.
- Show logs on Hotel detail.

### Phase 5: Incoming Email Review

- Build incoming email paste/import form.
- Add hotel matching by sender email.
- Add rules-based suggestions.
- Add review/apply/ignore workflow.
- Connect applied actions to row creation or status transitions.

### Phase 6: Real Email Integration Later

- Add real outbound email provider.
- Add scheduled job runner.
- Add inbound email webhook.
- Add improved classification after real examples exist.

## MVP Non-Goals

- No full enterprise CRM.
- No complex role system.
- No hotel-facing portal.
- No payment processing.
- No production email automation in the first build.
- No automatic AI decisions without manual review.
- No complex inventory reconciliation.
