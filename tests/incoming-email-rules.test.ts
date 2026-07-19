import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyIncomingEmail,
  extractReplyText,
  extractRoomLabels,
} from "../lib/incomingEmailRules";

test("quoted outbound copy is excluded before classification", () => {
  const reply = extractReplyText(
    "Room 777 bought the perfume.\n\nOn Monday HOC wrote:\n> Have any samples been placed?",
  );
  assert.equal(classifyIncomingEmail(reply), "PRODUCT_PURCHASED");
  assert.doesNotMatch(reply, /samples been placed/);
});

test("negative purchase language wins over purchase keywords", () => {
  assert.equal(
    classifyIncomingEmail("Room 204 checked out without purchasing the perfume."),
    "GUEST_CHECKED_OUT",
  );
});

test("multiple rooms are detected for manual review", () => {
  assert.deepEqual(extractRoomLabels("Samples were placed in rooms 101 and 204."), [
    "Room 101",
    "Room 204",
  ]);
});

test("single room labels are normalized", () => {
  assert.deepEqual(extractRoomLabels("The guest in suite a-12 used the sample."), ["Room A-12"]);
});
