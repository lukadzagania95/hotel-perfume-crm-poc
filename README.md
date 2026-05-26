# HOC Hotel Perfume CRM POC

This repository is the source-of-truth project context for the HOC Hotel Perfume CRM POC.

The first phase is documentation and product context setup only. It defines the business workflow, domain model, status lifecycle, email automation rules, stock logic, POC scope, open questions, and future build plan so future Codex sessions can work from shared assumptions.

Application implementation will come later after this documentation is reviewed and approved. No frontend, backend, database schema, package installation, or production integration is included in this phase.

## Business Context

HOC runs a hotel sampling stream for perfume products. Hotels receive sample stock for selected rooms and full-size product stock that reception can sell to guests who ask to purchase after trying or discovering a sample.

The future CRM should help track:

- Hotels and hotel contact emails
- Product stock sent to each hotel
- Sample stock sent to each hotel
- Sample placement and guest opportunity activity per hotel
- Guest/sample opportunity statuses
- Email-based status updates from receptionists
- Automated follow-up emails
- Stock-level indicators

## Repository Structure

- `docs/01_product_overview.md` - business problem, POC goal, and operating flow
- `docs/02_domain_model.md` - core objects, fields, and relationships
- `docs/03_status_lifecycle.md` - statuses, transitions, terminal states, and stock impact
- `docs/04_email_automation_rules.md` - outbound and inbound email behavior
- `docs/05_stock_logic.md` - original/current stock, deductions, and stock colors
- `docs/06_poc_scope.md` - practical POC boundaries
- `docs/07_open_questions.md` - assumptions and unresolved product questions
- `docs/08_future_build_plan.md` - future technical plan, without implementation
- `docs/09_technical_mvp_plan.md` - technical MVP implementation plan, without app code
- `backlog/epics_and_user_stories.md` - implementation-ready epics and user stories

## Key Assumptions

- This is an internal POC, not a full enterprise CRM.
- Hotel receptionist email is the main communication channel.
- Email responses may be unstructured and need interpretation.
- Manual override should be available for correcting statuses and stock.
- Original stock values must remain visible even when current stock decreases.
- Terminal rows are `Sale` and `Fail`.
- `Pending` rows exist conceptually but should not display in the active rows table.
- This first phase should avoid over-engineering.
