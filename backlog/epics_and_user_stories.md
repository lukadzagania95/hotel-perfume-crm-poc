# Epics and User Stories

## 1. Hotel Management

### Story: Create Hotel Record

As an HOC user, I want to create a Hotel record so that I can track sampling activity and stock for that hotel.

Acceptance criteria:

- User can enter Hotel Name.
- User can enter Contact Email.
- User can enter Original Product Stock.
- User can enter Current Product Stock.
- User can enter Original Sample Stock.
- User can enter Current Sample Stock.
- Original and current stock values remain visible on the Hotel record.

### Story: Edit Hotel Record

As an HOC user, I want to edit hotel details so that contact and stock information can be corrected.

Acceptance criteria:

- User can update Hotel Name and Contact Email.
- User can manually correct current stock.
- User can preserve original stock values unless intentionally edited.

## 2. Room/Sample Opportunity Tracking

### Story: Create Opportunity Row

As an HOC user, I want to create a child opportunity row under a Hotel so that sample placement activity can be tracked.

Acceptance criteria:

- Row belongs to one Hotel.
- Row can store status.
- Row can store optional room/reference information.
- New row can represent a sample/guest opportunity lifecycle.

### Story: Hide Pending Rows From Active View

As an HOC user, I want Pending rows hidden from the main active table so that the active view stays focused.

Acceptance criteria:

- Pending is available as a conceptual/default status.
- Pending rows do not display in the main active rows table.
- Opportunity and Interest rows display as active.

## 3. Status Lifecycle

### Story: Update Opportunity Status

As an HOC user, I want to move rows through the status lifecycle so that hotel activity is accurately tracked.

Acceptance criteria:

- Supported statuses are Pending, Opportunity, Interest, Sale, and Fail.
- Pending can move to Opportunity.
- Opportunity can move to Interest, Sale, or Fail.
- Interest can move to Sale or Fail.
- Sale and Fail are terminal statuses.

### Story: Prevent Invalid Terminal Updates

As an HOC user, I want terminal rows protected from accidental changes so that closed outcomes remain reliable.

Acceptance criteria:

- Sale and Fail are treated as closed.
- Reopening terminal rows requires manual override.
- Override action should require a note in a future implementation.

## 4. Stock Management

### Story: Deduct Sample Stock

As an HOC user, I want sample stock deducted when a guest uses a sample so that current sample stock stays accurate.

Acceptance criteria:

- Moving a row to Interest deducts one Current Sample Stock.
- Original Sample Stock remains unchanged and visible.
- Sample stock cannot go below zero.
- The same row cannot deduct sample stock more than once.

### Story: Deduct Product Stock

As an HOC user, I want product stock deducted when a guest buys a perfume so that current product stock stays accurate.

Acceptance criteria:

- Moving a row to Sale deducts one Current Product Stock.
- Original Product Stock remains unchanged and visible.
- Product stock cannot go below zero.
- The same row cannot deduct product stock more than once.

### Story: Show Stock Color Status

As an HOC user, I want hotel stock color status so that low-stock hotels are easy to identify.

Acceptance criteria:

- Full Stock shows when current stock equals original stock.
- Part Stock shows when more than 50% remains.
- Low Stock shows when less than 50% remains.
- No Stock shows when both current product and sample stock are zero.
- Product team confirms whether calculation is combined or separate by stock type.

## 5. Email Templates

### Story: Manage Base Email Templates

As an admin user, I want to edit base email templates so that follow-up language can be changed without code.

Acceptance criteria:

- Admin can edit Placement Inquiry Email.
- Admin can edit Sample Usage / Purchase Inquiry Email.
- Admin can edit Purchase Follow-up Email.
- Template subject and body are configurable.

## 6. Email Automation

### Story: Send Placement Inquiry

As an HOC user, I want the system to email hotels with no Opportunity rows so that receptionists report whether samples were placed.

Acceptance criteria:

- Rule applies when no Opportunity row exists.
- Email is sent to Hotel Contact Email.
- Frequency is configurable.

### Story: Send Usage and Purchase Inquiry

As an HOC user, I want the system to email hotels with Opportunity rows so that receptionists report sample usage and purchase interest.

Acceptance criteria:

- Rule applies when at least one Opportunity row exists.
- Email asks whether samples were used and whether guests asked to purchase.
- Frequency is configurable.

### Story: Stop Follow-ups For Closed Rows

As an HOC user, I want follow-ups to stop when only Sale or Fail rows remain so that hotels are not chased unnecessarily.

Acceptance criteria:

- Sale and Fail are recognized as closed.
- Automated follow-up emails stop when no active rows remain.

## 7. Incoming Email Interpretation

### Story: Capture Receptionist Replies

As an HOC user, I want incoming receptionist replies captured so that they can update CRM records.

Acceptance criteria:

- Incoming email body is stored.
- Sender and received time are stored.
- Message is linked to a Hotel where possible.

### Story: Interpret Incoming Email

As an HOC user, I want incoming emails interpreted so that rows can be created or updated from receptionist responses.

Acceptance criteria:

- Email can create Opportunity rows when samples are reported placed.
- Email can update rows to Interest, Sale, or Fail.
- Low-confidence or contradictory emails are flagged for manual review.
- Manual override is available.

## 8. Dashboard/List Views

### Story: View Hotels

As an HOC user, I want a hotel list view so that I can quickly see stock and activity status.

Acceptance criteria:

- List shows hotel name and contact email.
- List shows current and original stock values.
- List shows stock color status.
- List shows active opportunity count.

### Story: View Hotel Detail

As an HOC user, I want a Hotel detail view so that I can inspect opportunities, stock, and email history.

Acceptance criteria:

- Detail view shows Hotel fields.
- Detail view shows active and closed opportunity rows.
- Detail view shows email logs or incoming messages when implemented.

## 9. Admin Configuration

### Story: Configure Email Frequency

As an admin user, I want to configure sending frequency for each email type so that automation can match operational cadence.

Acceptance criteria:

- Frequency is configurable per template type.
- Automation can be enabled or disabled.
- Defaults are documented before implementation.

### Story: Manual Override

As an admin user, I want manual override for statuses and stock so that the CRM can be corrected when email interpretation is wrong.

Acceptance criteria:

- Admin can correct opportunity status.
- Admin can correct current stock values.
- Override reason can be captured in a future implementation.
