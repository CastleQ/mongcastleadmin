import assert from "node:assert/strict";
import { test } from "node:test";
import { suggestAmount } from "./pricing.ts";

test("suggestAmount: 요일·패키지·채널·보증금", () => {
  // 2026-09-16 수요일(평일), 09-18 금, 09-19 토
  assert.equal(suggestAmount("2026-09-16", "낮", "네이버플레이스")?.total, 50_000 + 50_000);
  assert.equal(suggestAmount("2026-09-16", "낮", "스페이스클라우드")?.total, 40_000 + 50_000);
  assert.equal(suggestAmount("2026-09-18", "밤", "별도컨택")?.total, 110_000 + 50_000);
  assert.equal(suggestAmount("2026-09-19", "밤+밤샘", "네이버플레이스")?.total, 170_000 + 30_000 + 50_000);
  assert.equal(suggestAmount("2026-09-19", "전일", "지인")?.total, 260_000); // 지인은 보증금 없음
  assert.equal(suggestAmount("2026-09-16", "기타", "지인"), null);
  assert.equal(suggestAmount("", "밤", "지인"), null);
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
  assert.equal(fillPrices("낮 {{평일 낮}}원, 밤샘 +{{밤샘}}, 모름 {{없음}}", DEFAULT_PRICES), "낮 50,000원, 밤샘 +30,000, 모름 {{없음}}");
  const custom = mergePrices({ 기본: { 낮: [55_000, 55_000, 110_000] }, 보증금: 60_000 });
  assert.equal(custom.기본.밤[0], 70_000); // 빠진 건 기본값
  assert.equal(suggestAmount("2026-09-16", "낮", "네이버플레이스", custom)?.total, 55_000 + 60_000);
});
