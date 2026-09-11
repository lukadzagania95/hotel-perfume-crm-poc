# Open Questions

## Row Meaning

- Does one row equal one room, one sample, one guest stay, or one sample-placement event?
- Do we need room numbers?
- Should room number be required, optional, or replaced by another reference?
- Can one email report multiple rooms or statuses at once?

## Status and Stock Behavior

- Should sample usage always subtract stock only once?
- Should `Sale` also imply `Interest` if sample usage was not explicitly reported?
- Should `Fail` subtract sample stock if the sample was placed but not used?
- What happens if a receptionist reports a sale without any prior opportunity row?
- Can a terminal `Sale` or `Fail` row ever be reopened?
- Should manual override be available for statuses and stock?

## Stock Color Calculation

- Should stock color be calculated as one combined hotel-level stock percentage?
- Should sample stock and product stock have separate color statuses?
- How should status work if sample stock is low but product stock is full?
- What should happen when hotel stock reaches zero?

## Email Interpretation

- What confidence threshold is needed for automatic email interpretation?
- What happens if the receptionist gives vague or contradictory information?
- Should low-confidence replies always require manual review?
- Should the system accept replies only from the Hotel contact email?
- How should forwarded emails or replies from other hotel staff be handled?

## Email Automation

- How often should each email type be sent by default?
- Should email frequency be global, per hotel, or per template type?
- Should automated emails pause when a hotel has no stock?
- Should automated emails include room-specific context?
- Should terminal rows be included in follow-up context or hidden?

## Assumptions To Validate

- This is an internal POC, not a full enterprise CRM.
- Hotel receptionist email is the main communication channel.
- Email responses may be unstructured and need interpretation.
- Manual override should be available for correcting statuses and stock.
- Original stock values must remain visible even when current stock decreases.
- Terminal rows are `Sale` and `Fail`.
- `Pending` rows exist conceptually but should not display in the active rows table.
- Avoid over-engineering in this first phase.
