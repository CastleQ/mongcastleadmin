import assert from "node:assert/strict";
import { test } from "node:test";
import { isMissingColumn, TIME_COLUMNS, withoutKeys } from "./missing-column.ts";

test("missing-column: '그런 칸 없다'(42703)만 골라낸다", () => {
  // 운영 DB 에서 실제로 받은 응답 (2026-10-24, supabase/ledger-times.sql 실행 전)
  assert.equal(isMissingColumn({ code: "42703" }), true);
  assert.equal(isMissingColumn({ code: "23505" }), false); // 중복 키 — 이건 숨기면 안 되는 오류
  assert.equal(isMissingColumn({ code: "42501" }), false); // 권한 없음
  assert.equal(isMissingColumn(null), false);
  assert.equal(isMissingColumn(undefined), false);
});

test("missing-column: 저장값에서 시간 칸만 뺀다", () => {
  const row = { date: "2026-11-07", package: "밤", amount: 110_000, start_time: "18:00", end_time: "23:00" };
  assert.deepEqual(withoutKeys(row, TIME_COLUMNS), { date: "2026-11-07", package: "밤", amount: 110_000 });
  // 뺄 칸이 없으면 그대로
  assert.deepEqual(withoutKeys({ a: 1 }, TIME_COLUMNS), { a: 1 });
  // 원본은 건드리지 않는다
  assert.equal(row.start_time, "18:00");
});
