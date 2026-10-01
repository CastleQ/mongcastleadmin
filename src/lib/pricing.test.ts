import assert from "node:assert/strict";
import { test } from "node:test";
import { suggestAmount } from "./pricing.ts";

test("suggestAmount: 요일·패키지·채널·보증금", () => {
  // 2026-09-16 수요일(평일), 09-18 금, 09-19 토
  assert.equal(suggestAmount("2026-09-16", "낮", "네이버플레이스")?.total, 40_000 + 50_000);
  assert.equal(suggestAmount("2026-09-16", "낮", "스페이스클라우드")?.total, 40_000 + 50_000);
  assert.equal(suggestAmount("2026-09-16", "밤", "별도컨택", undefined, 13)?.total, 70_000 + 30_000 + 50_000); // 11~13인 3명 추가
  assert.equal(suggestAmount("2026-09-19", "전일", "지인", undefined, 20)?.total, 208_000); // 전일은 인원 추가 무료 + 지인 20% 할인
  assert.equal(suggestAmount("2026-09-18", "밤", "별도컨택")?.total, 110_000 + 50_000);
  assert.equal(suggestAmount("2026-09-19", "밤+밤샘", "네이버플레이스")?.total, 170_000 + 30_000 + 50_000);
  assert.equal(suggestAmount("2026-09-16", "기타", "지인"), null);
  assert.equal(suggestAmount("", "밤", "지인"), null);
});

test("suggestAmount: 지인은 총 금액에서 20% 할인 (보증금 없음)", () => {
  const sg = suggestAmount("2026-09-19", "전일", "지인"); // 주말 전일 260,000
  assert.equal(sg?.deposit, 0);                           // 지인은 청소보증금 없음
  assert.equal(sg?.total, 208_000);                       // 260,000 × 0.8
  assert.match(sg?.label ?? "", /지인할인 20%/);
  // 밤 + 밤샘 + 인원 추가도 모두 할인 대상
  assert.equal(suggestAmount("2026-09-19", "밤+밤샘", "지인", undefined, 12)?.total, Math.round((170_000 + 30_000 + 20_000) * 0.8));
  // 지인이 아니면 할인 없음
  assert.equal(suggestAmount("2026-09-19", "전일", "별도컨택")?.total, 260_000 + 50_000);
});

test("suggestAmount: 공휴일·공휴일 전날·기타 채널", async () => {
  const { dayType } = await import("./holidays.ts");
  assert.equal(dayType("2026-10-09"), "주말");   // 한글날(금) → 주말 요금
  assert.equal(dayType("2026-10-08"), "금요일"); // 한글날 전날(목) → 금요일 요금
  assert.equal(dayType("2026-09-23"), "금요일"); // 추석 연휴 전날(수)
  assert.equal(dayType("2026-09-22"), "평일");
  assert.equal(suggestAmount("2026-10-08", "밤", "네이버플레이스")?.total, 110_000 + 50_000);
  assert.equal(suggestAmount("2026-10-09", "낮", "네이버플레이스")?.total, 100_000 + 50_000);
  assert.equal(suggestAmount("2026-09-16", "낮", "인스타")?.deposit, 0); // 기타 채널은 보증금 없음
  assert.equal(suggestAmount("2026-09-16", "낮", null)?.deposit, 0);
});

test("prices: 자리표 치환·설정값 반영", async () => {
  const { fillPrices, mergePrices, DEFAULT_PRICES } = await import("./prices.ts");
  assert.equal(fillPrices("낮 {{평일 낮}}원, 밤샘 +{{밤샘}}, 모름 {{없음}}", DEFAULT_PRICES), "낮 40,000원, 밤샘 +30,000, 모름 {{없음}}");
  const custom = mergePrices({ 낮: [55_000, 55_000, 110_000], 보증금: 60_000 });
  assert.equal(custom.밤[0], 70_000); // 빠진 건 기본값
  assert.deepEqual(mergePrices({ 기본: { 낮: [50_000, 50_000, 100_000] }, 플랫폼: { 낮: [40_000, 40_000, 110_000] } }).낮, [40_000, 40_000, 100_000]); // 옛 2단 형식 → 저가
  assert.equal(suggestAmount("2026-09-16", "낮", "네이버플레이스", custom)?.total, 55_000 + 60_000);
});
