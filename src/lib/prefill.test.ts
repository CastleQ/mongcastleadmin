import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePrefill, prefillParams } from "./prefill.ts";

test("prefill: 주소에 담고 다시 꺼내도 그대로", () => {
  const p = {
    date: "2026-11-07", category: "대여", package: "밤+밤샘", channel: "네이버플레이스",
    payment_method: "플랫폼결제", settled: true, amount: 210_000, headcount: 13,
    customer_name: "홍길동", inquiry_date: "2026-10-24", start_time: "18:00", end_time: "09:00",
  };
  assert.deepEqual(parsePrefill(Object.fromEntries(prefillParams(p))), p);
  // 정산 미완료도 구분돼야 한다 ('0' 과 '빈 값'은 다른 뜻)
  assert.equal(parsePrefill({ settled: "0" }).settled, false);
  assert.equal(parsePrefill({}).settled, undefined);
});

test("prefill: 형식이 틀리거나 모르는 값은 버린다", () => {
  // 쓸 수 있는 값이 하나도 없으면 빈 객체 — 키가 남아 있으면 예약 수정에서 기존 값을 지운다
  assert.deepEqual(parsePrefill({ date: "2026-13-99", package: "없는패키지", category: "없는항목", payment_method: "비트코인" }), {});
  assert.equal(parsePrefill({ amount: "150,000원" }).amount, 150_000); // 쉼표·'원'이 섞여도 숫자만
  assert.equal(parsePrefill({ amount: "0" }).amount, undefined);
  assert.equal(parsePrefill({ start_time: "25:00" }).start_time, undefined);
  assert.equal(parsePrefill({ start_time: "18:00" }).start_time, "18:00");
  // 직접 입력한 플랫폼 이름은 목록에 없어도 살린다
  assert.equal(parsePrefill({ channel: "땡큐캠핑" }).channel, "땡큐캠핑");
  assert.equal(parsePrefill({ date: ["2026-11-07", "x"] }).date, "2026-11-07"); // 같은 칸이 두 번 와도 첫 값
});

test("prefill: 빈 값은 주소에 넣지 않는다", () => {
  assert.equal(prefillParams({ date: "2026-11-07", customer_name: "", amount: undefined }).toString(), "date=2026-11-07");
  assert.equal(prefillParams({ settled: false }).toString(), "settled=0");
});
