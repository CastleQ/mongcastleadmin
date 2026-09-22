import assert from "node:assert/strict";
import { test } from "node:test";
import type { Ledger } from "./ledger.ts";
import { autoFill, fill, fmtDate, placeholders, setDefault, shortDate } from "./templates.ts";

test("placeholders: 순서대로, 중복 제거, 기본값 인식", () => {
  assert.deepEqual(placeholders("[날짜]\n[출입 비밀번호=1234*]\n[날짜]"), [
    { key: "날짜", def: "" }, { key: "출입 비밀번호", def: "1234*" },
  ]);
  assert.deepEqual(placeholders("대괄호 없음"), []);
});

test("fill: 채운 값 > 기본값 > [칸]", () => {
  assert.equal(fill("[날짜] / [비밀번호=1234*] / [총액]", { 날짜: "9/20(토)", 비밀번호: "" }), "9/20(토) / 1234* / [총액]");
  assert.equal(fill("[비밀번호=1234*]", { 비밀번호: "1234*" }), "1234*");
});

test("setDefault: 기본값 추가/교체, 여러 곳 동시에, 지우기, 대괄호 방지", () => {
  assert.equal(setDefault("[비밀번호] 와 [비밀번호=old]", "비밀번호", "9999*"), "[비밀번호=9999*] 와 [비밀번호=9999*]");
  assert.equal(setDefault("[출입 비밀번호=1234*]", "출입 비밀번호", "1111*"), "[출입 비밀번호=1111*]");
  // 빈 값 → 기본값 지우기
  assert.equal(setDefault("[출입 비밀번호=1234*]", "출입 비밀번호", ""), "[출입 비밀번호]");
  // 값에 대괄호가 있어도 중첩되지 않음
  assert.equal(setDefault("[패키지+금액(생략)]", "패키지+금액(생략)", "[패키지+금액]"), "[패키지+금액(생략)=패키지+금액]");
});

test("autoFill: 예약 정보로 칸 채우기", () => {
  const r: Ledger = {
    id: 1, date: "2026-09-20", kind: "매출", category: "대여", channel: "별도컨택", inquiry_date: null,
    customer_name: "홍길동", customer_phone: "01012345678", content: null, headcount: 12, package: "밤", hours: null,
    settled: false, amount: 120000, fee: 0, other_expense: 0, net: 70000, payment_method: "계좌이체", note: null,
  };
  assert.equal(fmtDate("2026-09-20"), "9월 20일(일)");
  assert.equal(shortDate("2026-09-20"), "26/09/20(일)");
  const v = autoFill(placeholders("[날짜] [패키지] [옵션1] [옵션2] [옵션3] [총액] [고객명] [인원] [기타]"), r);
  assert.equal(v["날짜"], "2026-09-20"); // 달력 입력용 ISO
  assert.equal(v["패키지"], "밤");
  assert.equal(v["옵션1"], "청소보증금");
  assert.equal(v["옵션2"], "");
  assert.equal(v["총액"], "120,000원");
  assert.equal(v["고객명"], "홍길동");
  assert.equal(v["인원"], "12명");
  assert.equal(v["기타"], undefined);
  // 밤+밤샘 · 지인 → 패키지 밤, 옵션 밤샘·지인할인 (지인은 보증금 없음)
  const w = autoFill(placeholders("[패키지] [옵션1] [옵션2] [옵션3]"), { ...r, package: "밤+밤샘", channel: "지인" });
  assert.deepEqual([w["패키지"], w["옵션1"], w["옵션2"], w["옵션3"]], ["밤", "밤샘", "지인할인", ""]);
});
