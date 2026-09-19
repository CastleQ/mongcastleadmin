import assert from "node:assert/strict";
import { test } from "node:test";
import type { Ledger } from "./ledger.ts";
import { searchLedger } from "./search.ts";

const base: Ledger = {
  id: 0, date: "2026-09-01", kind: "매출", category: "대여", channel: "지인", inquiry_date: null,
  customer_name: null, customer_phone: null, content: null, headcount: null, package: "밤", hours: null,
  settled: true, amount: 0, fee: 0, other_expense: 0, net: 0, payment_method: null, note: null,
};
const rows: Ledger[] = [
  { ...base, id: 1, date: "2026-09-04", customer_name: "홍길동", customer_phone: "010-1234-5678" },
  { ...base, id: 2, date: "2026-10-05", customer_name: "성규", content: "시계피", note: "파티룸비 앤빵" },
  { ...base, id: 3, date: "2026-10-01", kind: "매입", category: "월세기타", channel: null },
];

test("searchLedger: 이름·번호(하이픈 무시)·콘텐츠·비고·항목, 최신순, 빈 검색어는 없음", () => {
  assert.deepEqual(searchLedger(rows, "홍길").map((r) => r.id), [1]);
  assert.deepEqual(searchLedger(rows, "12345678").map((r) => r.id), [1]);
  assert.deepEqual(searchLedger(rows, "1234-5678").map((r) => r.id), [1]);
  assert.deepEqual(searchLedger(rows, "시계피").map((r) => r.id), [2]);
  assert.deepEqual(searchLedger(rows, "앤빵").map((r) => r.id), [2]);
  assert.deepEqual(searchLedger(rows, "월세").map((r) => r.id), [3]);
  assert.deepEqual(searchLedger(rows, "지인").map((r) => r.id), [2, 1]); // 최신순
  assert.deepEqual(searchLedger(rows, "  "), []);
});
