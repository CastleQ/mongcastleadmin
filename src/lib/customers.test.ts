import assert from "node:assert/strict";
import { test } from "node:test";
import { customerKey, isWarnGrade, normalizePhone, summarize } from "./customers.ts";
import type { Ledger } from "./ledger.ts";

const base: Ledger = {
  id: 0, date: "2026-09-01", kind: "매출", category: "대여", channel: "지인", inquiry_date: null,
  customer_name: null, customer_phone: null, content: null, headcount: null, package: "밤", hours: null,
  settled: true, amount: 100000, fee: 0, other_expense: 0, net: 100000, payment_method: "계좌이체", note: null,
};

test("normalizePhone / customerKey: 연락처 우선, 없으면 이름", () => {
  assert.equal(normalizePhone("010-1234-5678"), "01012345678");
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

test("summarize: 취소된 예약은 고객은 남기고 방문·금액·최근방문엔 안 셈", () => {
  const rows: Ledger[] = [
    { ...base, id: 1, customer_name: "김취소", date: "2026-09-20", net: 50000, cancelled: true },
    { ...base, id: 2, customer_name: "박", date: "2026-08-01", net: 70000 },
    { ...base, id: 3, customer_name: "박", date: "2026-09-30", net: 80000, cancelled: true },
  ];
  const s = summarize(rows, []);
  const kim = s.find((c) => c.key === "name:김취소")!;
  assert.deepEqual([kim.visits, kim.total_net, kim.ledger_ids], [0, 0, [1]]);
  const park = s.find((c) => c.key === "name:박")!;
  assert.deepEqual([park.visits, park.total_net, park.last_date, park.ledger_ids], [1, 70000, "2026-08-01", [2, 3]]);
  // 취소가 먼저 와도, 나중 실제 방문 날짜로 덮인다
  const s2 = summarize([{ ...rows[2], date: "2026-07-01" }, rows[1]], []);
  assert.equal(s2[0].last_date, "2026-08-01");
});

test("경고 등급: 그레이·블랙만, 단골·일반은 경고 없음", () => {
  assert.deepEqual(["일반", "단골", "그레이", "블랙"].map((g) => isWarnGrade(g as never)), [false, false, true, true]);
});
