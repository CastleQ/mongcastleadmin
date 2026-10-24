import assert from "node:assert/strict";
import { test } from "node:test";
import { crossesMidnight, hhmm, hourlyRate, packageTime, timeRange } from "./hours.ts";

test("hours: 패키지별 기본 시간", () => {
  assert.deepEqual(packageTime("낮"), { start: "10:00", end: "17:00" });
  assert.deepEqual(packageTime("밤"), { start: "18:00", end: "23:00" });
  assert.deepEqual(packageTime("밤+밤샘"), { start: "18:00", end: "09:00" });
  assert.deepEqual(packageTime("전일"), { start: "10:00", end: "09:00" });
  assert.equal(packageTime("기타"), null); // 기타는 공란
  assert.equal(packageTime(null), null);
});

test("hours: 자정을 넘으면 '익일'", () => {
  assert.equal(timeRange("10:00", "17:00"), "10:00~17:00");
  assert.equal(timeRange("18:00", "23:00"), "18:00~23:00");
  assert.equal(timeRange("18:00", "09:00"), "18:00~익일09:00");
  assert.equal(timeRange("10:00", "09:00"), "10:00~익일09:00");
  assert.equal(crossesMidnight("18:00", "18:00"), true); // 같으면 24시간 = 다음 날
  assert.equal(timeRange("10:00", null), ""); // 한쪽만 있으면 안 보여줌
  assert.equal(timeRange(null, null), "");
  assert.equal(timeRange("10:00:00", "17:00:00"), "10:00~17:00"); // DB time 칸은 초까지 온다
  assert.equal(hhmm("23:30:00"), "23:30");
  assert.equal(hhmm(null), "");
});

test("hours: 시간당 단가는 천원 단위 올림 — 사장님이 적어주신 표와 같아야 한다", () => {
  // 운영 요금표(2026-10-24): 낮 [40,000 / 40,000 / 110,000], 밤 [80,000 / 110,000 / 170,000]
  assert.equal(hourlyRate(40_000, 7), 6_000);    // 월~목 낮 (5,714 → 올림)
  assert.equal(hourlyRate(40_000, 7), 6_000);    // 금요일 낮
  assert.equal(hourlyRate(110_000, 7), 16_000);  // 토·일·공휴일 낮 (15,714 → 올림)
  assert.equal(hourlyRate(80_000, 5), 16_000);   // 월~목 밤 (딱 나눠짐)
  assert.equal(hourlyRate(110_000, 5), 22_000);  // 금요일 밤
  assert.equal(hourlyRate(170_000, 5), 34_000);  // 토·일·공휴일 밤
  assert.equal(hourlyRate(10_000, 0), 0);        // 시간이 0이면 0 (0으로 나누지 않음)
});
