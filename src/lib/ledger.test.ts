import assert from "node:assert/strict";
import { test } from "node:test";
import { calcNet, parseLedgerForm } from "./ledger.ts";

test("calcNet: 매출은 차감, 매입은 음수", () => {
  assert.equal(calcNet("매출", 150000, 10000, 5000), 135000);
  assert.equal(calcNet("매입", 24000, 0, 0), -24000);
});

test("parseLedgerForm: 매출, 실수령 비우면 자동 / 매입은 예약 항목 null", () => {
  const f = new FormData();
  f.set("date", "2026-09-14"); f.set("kind", "매출"); f.set("package", "밤");
  f.set("customer_name", " 홍길동 "); f.set("amount", "120,000"); f.set("fee", ""); f.set("settled", "on");
  const r = parseLedgerForm(f);
  assert.equal(r.customer_name, "홍길동");
  assert.equal(r.amount, 120000);
  assert.equal(r.net, 120000);
  assert.equal(r.category, "공간대여");
  assert.equal(r.settled, true);

  const b = new FormData();
  b.set("date", "2026-09-01"); b.set("kind", "매입"); b.set("category", "월세+기타"); b.set("amount", "775000"); b.set("package", "밤");
  const m = parseLedgerForm(b);
  assert.equal(m.net, -775000);
  assert.equal(m.package, null);
  assert.equal(m.settled, false);
});
