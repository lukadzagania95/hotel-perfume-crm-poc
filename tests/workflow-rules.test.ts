import assert from "node:assert/strict";
import test from "node:test";
import { getSuggestedTemplateType } from "../lib/emailRules";
import { canTransitionStatus } from "../lib/statusLifecycle";

test("interest receives the purchase follow-up", () => {
  assert.equal(getSuggestedTemplateType(["OPPORTUNITY", "INTEREST"]), "PURCHASE_FOLLOW_UP");
});

test("automation stops when all rows are terminal", () => {
  assert.equal(getSuggestedTemplateType(["SALE", "FAIL"]), null);
});

test("terminal opportunity statuses cannot be reopened", () => {
  assert.equal(canTransitionStatus("SALE", "INTEREST"), false);
  assert.equal(canTransitionStatus("FAIL", "OPPORTUNITY"), false);
});
