import assert from "node:assert/strict";
import { test } from "node:test";
import { infoTokens, setInfoToken } from "./markdown.ts";
import { DEFAULT_PRICES, fillPrices } from "./prices.ts";

// 진짜 번호는 쓰지 않는다 — 공개 저장소에 올라간다 (CLAUDE.md 규칙 6)
const 핵심정보 = `자주 찾는 정보. 바뀌면 여기와 응대 템플릿을 같이 고치기.

| 항목 | 내용 |
|---|---|
| 주소 | 서울 성북구 동소문로26다길 15, 지하 1층 · [네이버 지도](https://naver.me/x) |
| 출입 비밀번호 | 1111* |
| 화장실 | 1층 단독 화장실 / 2222* |
| 청소보증금 | 50,000원 (퇴실 확인 후 전액 환급, 지인은 없음) |
| 주차 1순위 | 동선동 주민센터 · 상시무료 |`;

test("infoTokens: 핵심 정보 표를 자리표로 읽는다", () => {
  const t = infoTokens(핵심정보);
  assert.equal(t["출입 비밀번호"], "1111*");
  assert.equal(t["화장실"], "1층 단독 화장실 / 2222*");
  assert.equal(t["주차 1순위"], "동선동 주민센터 · 상시무료");
  assert.equal(t["항목"], undefined); // 머리줄은 자리표가 아니다
  assert.equal(t["---"], undefined);  // 구분줄도
  // 칸이 둘이 아닌 줄(링크가 든 주소 줄은 칸이 둘이라 읽힌다)은 그대로
  assert.match(t["주소"], /네이버 지도/);
  assert.deepEqual(infoTokens(""), {});
  assert.deepEqual(infoTokens("표가 없는 글"), {});
});

test("setInfoToken: 응대 템플릿에서 고친 값을 핵심 정보 표에 되돌려 적는다", () => {
  const next = setInfoToken(핵심정보, "출입 비밀번호", "3333*");
  assert.ok(next);
  assert.equal(infoTokens(next)["출입 비밀번호"], "3333*");
  // 다른 줄은 그대로
  assert.equal(infoTokens(next)["화장실"], "1층 단독 화장실 / 2222*");
  assert.equal(infoTokens(next)["주소"], infoTokens(핵심정보)["주소"]);
  // 표가 깨지지 않게 줄 수는 그대로
  assert.equal(next.split("\n").length, 핵심정보.split("\n").length);
  // 없는 항목이면 null (그래야 다른 섹션을 더 찾아보거나 템플릿에 적는다)
  assert.equal(setInfoToken(핵심정보, "없는 항목", "x"), null);
  // 값에 | 가 들어와도 표가 안 깨진다
  assert.equal(infoTokens(setInfoToken(핵심정보, "화장실", "1층 | 2층")!)["화장실"], "1층  2층");
});

test("fillPrices: 핵심 정보 자리표도 채운다 (같은 이름이면 요금표가 이긴다)", () => {
  const t = infoTokens(핵심정보);
  assert.equal(fillPrices("출입 비밀번호 {{출입 비밀번호}}", DEFAULT_PRICES, t), "출입 비밀번호 1111*");
  // 기본값 자리에 넣어도 동작한다 — [칸={{자리표}}] → [칸=1111*]
  assert.equal(fillPrices("[출입 비밀번호={{출입 비밀번호}}]", DEFAULT_PRICES, t), "[출입 비밀번호=1111*]");
  // 요금표에 있는 이름은 요금표 값
  assert.equal(fillPrices("{{보증금}}", DEFAULT_PRICES, { 보증금: "엉뚱한 값" }), "50,000");
  // 모르는 자리표는 그대로 둔다
  assert.equal(fillPrices("{{없는 칸}}", DEFAULT_PRICES, t), "{{없는 칸}}");
});
