import assert from "node:assert/strict";
import { test } from "node:test";
import { customerKey, normalizePhone, summarize } from "./customers.ts";
import type { Ledger } from "./ledger.ts";

const base: Ledger = {
  id: 0, date: "2026-09-01", kind: "매출", category: "대여", channel: "지인", inquiry_date: null,
  customer_name: null, customer_phone: null, content: null, headcount: null, package: "밤", hours: null,
  settled: true, amount: 100000, fee: 0, other_expense: 0, net: 100000, payment_method: "계좌이체", note: null,
};

test("normalizePhone / customerKey: 연락처 우선, 없으면 이름", () => {
  assert.equal(normalizePhone("010-8481-7062"), "01084817062");
  assert.equal(normalizePhone("없음"), null);
  assert.equal(customerKey({ customer_phone: "010 1234 5678", customer_name: "홍" }), "01012345678");
  assert.equal(customerKey({ customer_phone: null, customer_name: " 성규 " }), "name:성규");
  assert.equal(customerKey({ customer_phone: null, customer_name: null }), null);
});

test("summarize: 같은 연락처는 한 고객, 매입/익명은 제외, 저장된 등급 반영", () => {
  const rows: Ledger[] = [
    { ...base, id: 1, customer_name: "홍길동", customer_phone: "01012345678", date: "2026-08-01", net: 70000, channel: "네이버플레이스" },
    { ...base, id: 2, customer_name: null, customer_phone: "010-1234-5678", date: "2026-09-10", net: 90000, channel: "별도컨택" },
    { ...base, id: 3, customer_name: "성규", date: "2026-09-12" },
    { ...base, id: 4, kind: "매입", customer_name: "쿠팡" },
    { ...base, id: 5 },
  ];
  const s = summarize(rows, [{ key: "01012345678", name: null, phone: "01012345678", grade: "블랙", memo: "의자 파손" }]);
  assert.equal(s.length, 2);
  const hong = s.find((c) => c.key === "01012345678")!;
  assert.equal(hong.name, "홍길동");
  assert.equal(hong.visits, 2);
  assert.equal(hong.total_net, 160000);
  assert.equal(hong.last_date, "2026-09-10");
  assert.deepEqual(hong.channels, ["네이버플레이스", "별도컨택"]);
  assert.equal(hong.grade, "블랙");
  assert.equal(s[0].key, "name:성규"); // 최근 방문순
});
