import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PRICES } from "./prices.ts";
import { optionText, packageQuote, quoteTotal } from "./quote.ts";

test("quote: 패키지 줄 · 옵션 줄 · 총액(지인할인은 마지막에 ×0.8)", () => {
  const p = DEFAULT_PRICES;
  assert.deepEqual(packageQuote("2026-09-18", "밤", p), { text: "밤 패키지 (금요일 요금) 110,000원", base: 110_000 });
  assert.deepEqual(packageQuote("2026-10-08", "낮", p), { text: "낮 패키지 (공휴일 전날 요금) 40,000원", base: 40_000 });
  assert.deepEqual(packageQuote("", "밤", p), { text: "밤", base: null });
  assert.deepEqual(packageQuote("2026-09-18", "시간대여 3시간", p), { text: "시간대여 3시간", base: null });
  assert.equal(optionText("밤샘", p), "밤샘 +30,000원");
  assert.equal(optionText("지인할인", p), "지인할인 -20%");
  assert.equal(optionText("직접 쓴 옵션", p), "직접 쓴 옵션");
  assert.equal(quoteTotal(110_000, ["밤샘", "청소보증금"], p), 190_000);
  assert.equal(quoteTotal(110_000, ["밤샘", "청소보증금", "지인할인"], p), 152_000); // (110+30+50)×0.8
  assert.equal(quoteTotal(70_000, ["", "모르는 옵션"], p), 70_000);
});
