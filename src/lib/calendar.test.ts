import assert from "node:assert/strict";
import { test } from "node:test";
import { monthGrid, monthInfo, packageKind } from "./calendar.ts";

test("monthGrid: 2026-09은 화요일 시작, 30일, 7의 배수", () => {
  const g = monthGrid(2026, 9);
  assert.equal(g[0], null);
  assert.equal(g[1], null);
  assert.equal(g[2], "2026-09-01");
  assert.equal(g.filter(Boolean).length, 30);
  assert.equal(g.length % 7, 0);
});

test("monthInfo: 연도 넘어가는 prev/next", () => {
  assert.deepEqual([monthInfo("2026-01").prev, monthInfo("2026-12").next], ["2025-12", "2027-01"]);
  assert.equal(monthInfo("2026-02").end, "2026-02-28");
});

test("packageKind: 밤+밤샘은 밤, 없으면 기타", () => {
  assert.equal(packageKind("밤+밤샘"), "밤");
  assert.equal(packageKind("전일"), "전일");
  assert.equal(packageKind(null), "기타");
});
