# Future Build Plan

## Current Phase

This repository currently defines product context and implementation-ready documentation. It should be reviewed before any application code is created.

## Recommended POC Stack

A practical future POC stack could be:

- Next.js for the web application.
- TypeScript for typed product logic.
- SQLite for local/simple POC data storage, or PostgreSQL if deployment needs are clearer.
- Prisma for database schema and migrations.
- A simple email integration for sending automated emails and receiving replies.
- A small admin UI for templates, schedules, hotel records, and manual review.

## Suggested Build Phases

### Phase 1: Data Model and Manual CRM

- Implement Hotel records.
- Implement opportunity rows.
- Implement status transitions.
- Implement stock deduction logic.
- Add list/detail views for hotels.
- Add manual status and stock override.

### Phase 2: Email Templates and Logs

- Implement editable email templates.
- Implement configurable send frequency.
- Log outbound emails.
- Add basic email preview before sending.

### Phase 3: Automation Rules

- Add scheduled follow-up selection logic.
- Stop follow-ups when only terminal rows remain.
- Add safeguards for no-stock hotels.

### Phase 4: Incoming Email Interpretation

- Capture incoming email messages.
- Add rules-based classification for simple messages.
- Add manual review queue.
- Consider AI/NLP classification once real reply samples exist.

### Phase 5: Dashboard and Reporting

- Add stock indicators.
- Add active opportunity dashboard.
- Add closed outcome reporting.
- Add hotel-level health/status views.

## Implementation Notes

- Do not implement the app until documentation is approved.
- Keep the first build simple and inspectable.
- Use manual review where automated email interpretation is uncertain.
- Avoid adding enterprise CRM complexity before the POC proves the workflow.
