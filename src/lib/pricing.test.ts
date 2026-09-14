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
