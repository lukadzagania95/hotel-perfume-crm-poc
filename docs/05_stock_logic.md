# Stock Logic

## Original Stock vs Current Stock

Hotel records must track both original and current stock values:

- `Original Product Stock`: number of full-size perfumes initially sent to the hotel.
- `Current Product Stock`: current remaining full-size perfume stock.
- `Original Sample Stock`: number of samples initially sent to the hotel.
- `Current Sample Stock`: current remaining sample stock.

Original stock values must remain visible even when current stock decreases.

## Sample Stock Deduction

When a row reaches `Interest`, subtract `1` from `Current Sample Stock`.

Rules:

- Deduct sample stock only once per opportunity row.
- Do not deduct sample stock again if an `Interest` row later becomes `Sale`.
- Prevent `Current Sample Stock` from going below `0`.
- Flag impossible deductions for manual review.

## Product Stock Deduction

When a row reaches `Sale`, subtract `1` from `Current Product Stock`.

Rules:

- Deduct product stock only once per opportunity row.
- Prevent `Current Product Stock` from going below `0`.
- Flag impossible deductions for manual review.

## Fail Stock Impact

`Fail` means the guest checked out without buying the perfume.

Known rule:

- Do not deduct product stock.

Open question:

- Should `Fail` deduct sample stock if the sample was placed but usage was not explicitly reported?

## Hotel-Level Stock Color Status

Suggested statuses:

- `Full Stock`: current stock equals original manually entered stock.
- `Part Stock`: more than 50% of stock remains.
- `Low Stock`: less than 50% of stock remains.
- `No Stock`: both `Current Product Stock` and `Current Sample Stock` have reached `0`.

Important ambiguity:

- It is not yet decided whether stock status should be calculated separately for sample stock and product stock, or as one combined hotel-level stock percentage.

## Edge Cases

- Original stock is `0`.
- Current stock is manually corrected.
- Email interpretation would deduct stock below `0`.
- A sale is reported without a matching active row.
- A sample is reported used more than once for the same row.
- Product and sample stock reach different low-stock thresholds.
- A hotel reaches `No Stock` while active rows still exist.

## Recommended POC Safeguards

- Store stock deduction events or flags so deductions are not applied twice.
- Allow manual override with an audit note.
- Show original and current stock together.
- Prefer clear warnings over hidden automatic corrections.
