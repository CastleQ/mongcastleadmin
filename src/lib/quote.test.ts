import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PRICES } from "./prices.ts";
import { extraPeopleFee, HEADCOUNT_OPTION, optionText, packageQuote, quoteTotal } from "./quote.ts";

test("quote: 패키지 줄은 요일 대신 이용 시간을 보여준다", () => {
  const p = DEFAULT_PRICES;
  assert.deepEqual(packageQuote("2026-09-18", "밤", p), { text: "밤 패키지(18:00~23:00) 110,000원", base: 110_000 });
  assert.deepEqual(packageQuote("2026-10-08", "낮", p), { text: "낮 패키지(10:00~17:00) 40,000원", base: 40_000 });
  // 전일은 '하루종일', 종료가 다음 날이라 '익일'
  assert.deepEqual(packageQuote("2026-09-18", "전일", p), { text: "하루종일(10:00~익일09:00) 180,000원", base: 180_000 });
  assert.deepEqual(packageQuote("", "밤", p), { text: "밤", base: null });
  assert.deepEqual(packageQuote("2026-09-18", "시간대여 3시간", p), { text: "시간대여 3시간", base: null });
});

test("quote: 옵션 줄 · 총액(지인할인은 마지막에 ×0.8)", () => {
  const p = DEFAULT_PRICES;
  assert.equal(optionText("밤샘", p), "밤샘 +30,000원");
  assert.equal(optionText("지인할인", p), "지인할인 -20%");
  assert.equal(optionText("직접 쓴 옵션", p), "직접 쓴 옵션");
  assert.equal(quoteTotal(110_000, ["밤샘", "청소보증금"], p), 190_000);
  assert.equal(quoteTotal(110_000, ["밤샘", "청소보증금", "지인할인"], p), 152_000); // (110+30+50)×0.8
  assert.equal(quoteTotal(70_000, ["", "모르는 옵션"], p), 70_000);
});

test("quote: 전일 대관은 밤샘 무료", () => {
  const p = DEFAULT_PRICES;
  assert.equal(optionText("밤샘", p, "전일"), "밤샘 포함 (무료)");
  assert.equal(optionText("밤샘", p, "밤"), "밤샘 +30,000원");
  assert.equal(quoteTotal(260_000, ["밤샘"], p, "전일"), 260_000);
  assert.equal(quoteTotal(170_000, ["밤샘"], p, "밤"), 170_000 + 30_000);
  assert.equal(quoteTotal(260_000, ["밤샘", "지인할인"], p, "전일"), 208_000);
});

test("quote: 인원추가 — 기준 10인까지 무료, 넘으면 1인당 10,000원", () => {
  const p = DEFAULT_PRICES; // 기준인원 10, 인원추가 10,000
  assert.equal(extraPeopleFee(8, p, "밤"), 0);
  assert.equal(extraPeopleFee(10, p, "밤"), 0);
  assert.equal(extraPeopleFee(13, p, "밤"), 30_000);
  assert.equal(extraPeopleFee(13, p, "전일"), 0); // 전일은 인원 추가 무료
  assert.equal(extraPeopleFee(null, p, "밤"), 0);

  assert.equal(optionText(HEADCOUNT_OPTION, p, "밤", 8), "이용인원 8인");
  assert.equal(optionText(HEADCOUNT_OPTION, p, "밤", 13), "이용인원 13인 (3인 추가 +30,000원)");
  assert.equal(optionText(HEADCOUNT_OPTION, p, "전일", 13), "이용인원 13인"); // 전일은 가산금 없음
  assert.equal(optionText(HEADCOUNT_OPTION, p, "밤", null), ""); // 인원수를 안 적으면 줄이 안 생긴다

  assert.equal(quoteTotal(170_000, [HEADCOUNT_OPTION], p, "밤", 13), 200_000);
  // 옵션 여러 칸에서 같은 '인원추가'를 골라도 한 번만 센다
  assert.equal(quoteTotal(170_000, [HEADCOUNT_OPTION, HEADCOUNT_OPTION], p, "밤", 13), 200_000);
  assert.equal(quoteTotal(170_000, [HEADCOUNT_OPTION, "청소보증금"], p, "밤", 13), 250_000);
  assert.equal(quoteTotal(170_000, [HEADCOUNT_OPTION], p, "밤", 10), 170_000);
  // 인원수만 적어도 가산금이 들어간다 (옵션은 '이용인원 N인' 줄을 문구에 넣을지일 뿐)
  assert.equal(quoteTotal(170_000, [], p, "밤", 13), 200_000);
  assert.equal(quoteTotal(170_000, ["청소보증금"], p, "밤", 13), 250_000);
  assert.equal(quoteTotal(260_000, [], p, "전일", 13), 260_000); // 하루종일은 그래도 무료
  assert.equal(quoteTotal(170_000, [], p, "밤", null), 170_000);
  assert.equal(quoteTotal(170_000, ["지인할인"], p, "밤", 13), 160_000); // (170+30)×0.8
});
