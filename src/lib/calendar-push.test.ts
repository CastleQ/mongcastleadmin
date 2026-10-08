import assert from "node:assert/strict";
import { test } from "node:test";
import type { Ledger } from "./ledger.ts";
import { titleOf, eventFromLedger, contentHash, isExportable, mergeSlotHours, DEFAULT_SLOT_HOURS } from "./calendar-push.ts";
import { isOurs, parseEvent, eventTime } from "./calendar-parse.ts";

const row: Ledger = {
  id: 42, date: "2026-11-21", kind: "매출", category: "대여", channel: "네이버플레이스",
  inquiry_date: null, customer_name: "정우진", customer_phone: "010-1234-5678", content: "홀덤",
  headcount: 8, package: "전일", hours: null, settled: false, amount: 260_000, fee: 0,
  other_expense: 0, net: 260_000, payment_method: "계좌이체", note: null,
};

test("titleOf: 합의한 형식 그대로 — 빈 칸은 뺀다", () => {
  assert.equal(titleOf(row), "전일 / 정우진 / 네이버플레이스 / 홀덤");
  assert.equal(titleOf({ package: "밤", customer_name: null, channel: null, content: null }), "밤");
  assert.equal(titleOf({ package: null, customer_name: "김민수", channel: null, content: null }), "기타 / 김민수");
});

test("eventFromLedger: 패키지별 시각 (전일은 익일 09시에 끝남)", () => {
  const e = eventFromLedger(row);
  assert.deepEqual(e.start, { dateTime: "2026-11-21T10:00:00", timeZone: "Asia/Seoul" });
  assert.deepEqual(e.end, { dateTime: "2026-11-22T09:00:00", timeZone: "Asia/Seoul" });
  assert.equal(e.extendedProperties.private.ledger_id, "42");

  const night = eventFromLedger({ ...row, package: "밤" });
  assert.deepEqual(night.start, { dateTime: "2026-11-21T18:00:00", timeZone: "Asia/Seoul" });
  assert.deepEqual(night.end, { dateTime: "2026-11-21T23:00:00", timeZone: "Asia/Seoul" });

  const over = eventFromLedger({ ...row, package: "밤+밤샘" });
  assert.deepEqual(over.end, { dateTime: "2026-11-22T09:00:00", timeZone: "Asia/Seoul" });
});

test("eventFromLedger: 패키지를 모르면 종일 일정 (하루를 막는 쪽이 안전)", () => {
  const e = eventFromLedger({ ...row, package: "기타" });
  assert.deepEqual(e.start, { date: "2026-11-21" });
  assert.deepEqual(e.end, { date: "2026-11-22" }); // 구글 종일 일정의 끝은 다음날
});

test("contentHash: 보이는 내용이 바뀌면 달라지고, 안 바뀌면 같다", () => {
  assert.equal(contentHash(row), contentHash({ ...row }));
  assert.notEqual(contentHash(row), contentHash({ ...row, customer_name: "박영희" }));
  assert.notEqual(contentHash(row), contentHash({ ...row, amount: 300_000 }));
  assert.notEqual(contentHash(row), contentHash({ ...row, settled: true }));
  // 캘린더에 안 보이는 칸은 지문에 영향이 없다
  assert.equal(contentHash(row), contentHash({ ...row, fee: 9999, inquiry_date: "2026-11-01" }));
});

test("isExportable: 대여 매출만 내보낸다", () => {
  assert.ok(isExportable(row));
  assert.ok(!isExportable({ ...row, kind: "매입" }));          // 월세·집기는 캘린더에 안 올림
  assert.ok(!isExportable({ ...row, category: "집기구매" }));
  assert.ok(!isExportable({ ...row, date: "" }));
});

test("mergeSlotHours: 설정이 비거나 깨져도 기본값으로 메운다", () => {
  assert.deepEqual(mergeSlotHours(null), DEFAULT_SLOT_HOURS);
  assert.equal(mergeSlotHours({ 낮: { start: "11:00", end: "16:00", endNextDay: false } }).낮.start, "11:00");
  assert.equal(mergeSlotHours({ 낮: { start: "11:00", end: "16:00", endNextDay: false } }).밤.start, "18:00"); // 나머지는 기본값
});

test("왕복: 우리가 쓴 일정을 되읽어도 뜻이 그대로다", () => {
  for (const pkg of ["낮", "밤", "밤+밤샘", "전일"]) {
    const e = eventFromLedger({ ...row, package: pkg });
    assert.ok(isOurs(e.summary), pkg); // 우리가 쓴 제목은 당연히 가져오기 대상
    const t = eventTime({
      start: "dateTime" in e.start ? { dateTime: `${e.start.dateTime}+09:00` } : { date: e.start.date },
      end: "dateTime" in e.end ? { dateTime: `${e.end.dateTime}+09:00` } : { date: e.end.date },
    });
    assert.ok(t, pkg);
    const back = parseEvent(e.summary, "", t.time);
    assert.equal(back.package, pkg, pkg);
    assert.equal(back.customer_name, "정우진", pkg);
    assert.equal(back.channel, "네이버플레이스", pkg);
    assert.equal(back.content, "홀덤", pkg);
  }
});
