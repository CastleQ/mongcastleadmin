import assert from "node:assert/strict";
import { test } from "node:test";
import { groupBuys, monthGrid, monthInfo, packageKind, type Reservation } from "./calendar.ts";

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

test("groupBuys: 항목별로 묶고 소계, 처음 나온 순서", () => {
  const r = (id: number, category: string, amount: number) =>
    ({ id, date: "2026-10-01", kind: "매입", category, package: null, channel: null, customer_name: null, customer_phone: null, content: null, headcount: null, amount, note: null, settled: false }) as Reservation;
  const g = groupBuys([r(1, "집기구매", 45000), r(2, "기타", 12000), r(3, "집기구매", 40000)]);
  assert.deepEqual(g.map((x) => [x.category, x.total, x.rows.map((y) => y.id)]), [["집기구매", 85000, [1, 3]], ["기타", 12000, [2]]]);
});
