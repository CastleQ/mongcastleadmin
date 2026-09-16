import assert from "node:assert/strict";
import { test } from "node:test";
import { slotStates } from "./availability.ts";

test("slotStates: 낮·밤 독립, 전일은 둘 다 비어야 가능", () => {
  assert.deepEqual(slotStates([]), { 낮: "가능", 밤: "가능", 전일: "가능" });
  assert.deepEqual(slotStates(["낮"]), { 낮: "예약", 밤: "가능", 전일: "불가" });
  assert.deepEqual(slotStates(["밤+밤샘"]), { 낮: "가능", 밤: "예약", 전일: "불가" });
  assert.deepEqual(slotStates(["낮", "밤"]), { 낮: "예약", 밤: "예약", 전일: "불가" });
  assert.deepEqual(slotStates(["전일"]), { 낮: "예약", 밤: "예약", 전일: "예약" });
  assert.deepEqual(slotStates(["시간대여"]), { 낮: "예약", 밤: "예약", 전일: "예약" }); // 모르는 패키지는 하루 전체 막음
});
