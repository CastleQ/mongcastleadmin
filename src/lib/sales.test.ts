import assert from "node:assert/strict";
import { test } from "node:test";
import type { Ledger } from "./ledger.ts";
import { byContent, byDayType, dayType, monthNet, monthStats, monthlySeries } from "./sales.ts";

const base: Ledger = {
  id: 0, date: "2026-09-01", kind: "매출", category: "대여", channel: "지인", inquiry_date: null,
  customer_name: null, customer_phone: null, content: "홀덤", headcount: null, package: "밤", hours: null,
  settled: true, amount: 100000, fee: 0, other_expense: 0, net: 100000, payment_method: "계좌이체", note: null,
};
const rows: Ledger[] = [
  { ...base, id: 1, date: "2026-09-04", net: 100000 },                 // 금
  { ...base, id: 2, date: "2026-09-05", net: 200000, content: "시계피" }, // 토
  { ...base, id: 3, date: "2026-09-08", net: 50000 },                  // 화
  { ...base, id: 4, date: "2026-09-10", net: 999999, settled: false }, // 미정산 → 제외
  { ...base, id: 5, date: "2026-09-01", kind: "매입", category: "월세기타", amount: 300000, net: -300000 },
  { ...base, id: 6, date: "2026-08-20", net: 150000 },
];

test("monthNet: 정산분만, 매입은 음수로", () => {
  assert.equal(monthNet(rows, "2026-09"), 50000);
  assert.equal(monthNet(rows, "2026-08"), 150000);
});

test("monthStats: 달성도·격차·오늘자 목표", () => {
  const s = monthStats(50000, "2026-09", 100000, "2026-09-15");
  assert.equal(s.achievement, 50);
  assert.equal(s.gap, -50000);
  assert.equal(s.gapPct, -50);
  assert.equal(s.todayTarget, 50000); // 15/30일
  assert.equal(monthStats(0, "2026-08", 100000, "2026-09-15").todayTarget, 100000); // 지난달은 전체
});

test("monthlySeries: 오래된 순 n개월", () => {
  const s = monthlySeries(rows, "2026-09", 3);
  assert.deepEqual(s.map((x) => x.month), ["2026-07", "2026-08", "2026-09"]);
  assert.equal(s[2].net, 50000);
});

test("dayType / byDayType / byContent", () => {
  assert.equal(dayType("2026-09-04"), "금요일");
  assert.equal(dayType("2026-09-05"), "주말");
  assert.equal(dayType("2026-09-08"), "평일");
  const d = byDayType(rows.filter((r) => r.date.startsWith("2026-09")));
  assert.deepEqual(d.map((b) => [b.label, b.count, b.avg]), [["평일", 1, 50000], ["금요일", 1, 100000], ["주말", 1, 200000]]);
  const c = byContent(rows);
  assert.equal(c[0].label, "홀덤"); // 누적 큰 순
  assert.equal(c[0].total, 300000);
});

test("dailyCumulative / recovery", async () => {
  const { dailyCumulative, recovery, monthSales, extraBuys } = await import("./sales.ts");
  assert.equal(monthSales(rows, "2026-09"), 350000);
  assert.equal(extraBuys(rows, "2026-09"), 0); // 월세기타는 고정비라 제외
  assert.equal(extraBuys([...rows, { ...base, id: 9, kind: "매입", category: "집기구매", amount: 40000 }], "2026-09"), 40000);
  const d = dailyCumulative(rows, "2026-09");
  assert.deepEqual(d, [{ day: 4, cum: 100000 }, { day: 5, cum: 300000 }, { day: 8, cum: 350000 }]); // 매출만, 매입 제외
  const r = recovery(rows, 1_000_000, "2026-09-15");
  assert.equal(r.total, 200000); // 8월 150000 + 9월 50000
  assert.equal(r.rate, 20);
  assert.equal(r.months, 2);
  assert.equal(r.monthsLeft, 8); // 남은 80만 / 월평균 10만
});

test("assumeReserved: 오늘 이후 미정산 매출만 정산된 것으로, 지난 미정산·매입은 그대로", async () => {
  const { assumeReserved, monthSales } = await import("./sales.ts");
  const withPast: Ledger[] = [...rows, { ...base, id: 7, date: "2026-09-02", net: 77777, settled: false }, { ...base, id: 8, date: "2026-09-20", kind: "매입", category: "집기구매", amount: 1, net: -1, settled: false }];
  assert.equal(monthSales(assumeReserved(withPast, "2026-09-09"), "2026-09"), 350000 + 999999); // 9/10 예약만 포함, 9/2 미정산 제외
  assert.equal(monthSales(assumeReserved(withPast, "2026-09-10"), "2026-09"), 350000 + 999999); // 오늘 포함
  assert.equal(monthSales(assumeReserved(withPast, "2026-09-11"), "2026-09"), 350000);
  assert.equal(assumeReserved(withPast, "2026-09-01").find((r) => r.id === 8)?.settled, false); // 매입은 건드리지 않음
});
