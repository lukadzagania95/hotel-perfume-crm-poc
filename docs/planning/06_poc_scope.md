# POC Scope

## In Scope

- Create and edit Hotel records.
- Store hotel contact email.
- Track original and current product stock.
- Track original and current sample stock.
- Create and update sample/room opportunity rows under each Hotel.
- Support statuses: `Pending`, `Opportunity`, `Interest`, `Sale`, and `Fail`.
- Hide `Pending` rows from the main active rows table.
- Show active rows for `Opportunity` and `Interest`.
- Show closed rows for `Sale` and `Fail`.
- Deduct stock for sample usage and product sale.
- Show hotel-level stock status indicators.
- Manage editable email templates.
- Configure email frequency per template type.
- Log outbound automated emails.
- Capture incoming receptionist replies.
- Provide manual review and override for ambiguous email interpretation.

## Out of Scope

- Full enterprise CRM features.
- Complex permissions and role hierarchy.
- Multi-brand or multi-company support.
- Production-grade campaign automation.
- Advanced inventory reconciliation.
- Payment processing.
- Guest personal data management beyond minimal operational notes.
- Hotel portal or receptionist login.
- Native mobile app.
- Full AI automation without human review.
- App implementation during this documentation phase.

## POC Principles

- Keep the workflow practical and easy to inspect.
- Prefer manual override where automation may be wrong.
- Preserve original stock values.
- Treat email as the primary receptionist communication channel.
- Avoid over-engineering until real hotel reply patterns are known.

## Success Criteria

- HOC can see which hotels have active opportunities.
- HOC can see current vs original stock for each hotel.
- HOC can understand which follow-up email should be sent.
- HOC can update statuses based on receptionist replies.
- HOC can identify unclear product decisions before building the app.
