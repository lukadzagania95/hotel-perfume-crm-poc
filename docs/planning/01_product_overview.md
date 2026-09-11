# Product Overview

## Business Problem

HOC provides perfume samples to hotels so guests can discover products during their stay. Hotels also hold full-size perfume stock at reception, allowing a guest to purchase immediately if they ask about the product.

Today, this creates an operational tracking problem. HOC needs to know which hotels received stock, whether samples were placed in rooms, whether guests used samples, whether any guest asked to purchase, and when hotel stock needs attention.

## POC Goal

The POC CRM should provide a simple internal workflow for tracking hotel sampling activity and follow-up. It should make receptionist email updates usable as operational signals, while keeping stock and opportunity status visible for the HOC team.

The goal is not to build a full enterprise CRM. The goal is a focused workflow that proves whether hotel sampling can be tracked reliably with structured records, automated follow-ups, and status updates from hotel email replies.

## Operational Flow

1. HOC creates a Hotel record with contact email and initial stock values.
2. HOC sends full-size product stock and sample stock to the hotel.
3. Hotel reception or operations staff place samples in selected rooms.
4. A receptionist replies by email when a sample is placed, used, sold, or when the guest checks out without purchase.
5. The CRM creates or updates a child sample/room opportunity row under the Hotel.
6. Stock is reduced when a sample is used or a full-size product is sold.
7. Automated emails continue while active opportunities exist, then stop when only closed rows remain.

## Main Actors

- HOC admin/user: manages hotels, stock, templates, and manual corrections.
- Hotel receptionist: provides updates by email and may sell products to guests.
- Guest: receives or discovers the sample and may purchase a full-size product.
- Hotel: parent account that holds sample stock, product stock, and child opportunity activity.

## Practical Outcome

The POC should help HOC answer:

- Which hotels have active sample opportunities?
- Which guests or rooms may need follow-up through reception?
- Which hotels are low on sample or product stock?
- Which emails should be sent next?
- Which receptionist replies changed opportunity or stock status?
