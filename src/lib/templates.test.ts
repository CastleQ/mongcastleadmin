import assert from "node:assert/strict";
import { test } from "node:test";
import type { Ledger } from "./ledger.ts";
import { autoFill, fill, fmtDate, placeholders, render, setDefault, shortDate } from "./templates.ts";

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

test("render: 비운 옵션·기타·플랫폼 칸은 흔적 없이 사라진다", () => {
  const body = "안녕하세요 [고객명] 님\n[플랫폼] 예약 확인되어 보증금 입금 안내드립니다\n[패키지]\n[옵션1]\n[옵션2]\n[기타(할인 등)]\n총액 [총액]";
  // 플랫폼·옵션2·기타를 비우면: 줄째로 사라지고, 글 중간 칸은 띄어쓰기까지 정리
  assert.equal(
    render(body, { 고객명: "홍길동", 패키지: "밤 패키지(18:00~23:00) 110,000원", 옵션1: "청소보증금 +50,000원", 총액: "160,000원" }),
    "안녕하세요 홍길동 님\n예약 확인되어 보증금 입금 안내드립니다\n밤 패키지(18:00~23:00) 110,000원\n청소보증금 +50,000원\n총액 160,000원",
  );
  // 플랫폼을 고르면 그대로 들어간다
  assert.match(render(body, { 플랫폼: "네이버플레이스" }), /^안녕하세요 \[고객명\] 님\n네이버플레이스 예약 확인되어/);
  // 안 채운 보통 칸은 [칸] 으로 남아 '아직 안 채운 칸'으로 보인다
  assert.match(render(body, {}), /총액 \[총액\]$/);
  // 원래 있던 빈 줄은 유지
  assert.equal(render("첫 줄\n\n[옵션1]\n끝 줄", {}), "첫 줄\n\n끝 줄");
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
  // 플랫폼·채널 칸은 예약 채널로. '플랫폼이름'처럼 '이름'이 들어가도 고객명으로 새지 않아야 한다
  const p = autoFill(placeholders("[플랫폼] [채널] [플랫폼이름] [고객명]"), { ...r, channel: "네이버플레이스" });
  assert.deepEqual([p["플랫폼"], p["채널"], p["플랫폼이름"], p["고객명"]], ["네이버플레이스", "네이버플레이스", "네이버플레이스", "홍길동"]);

  // 밤+밤샘 · 지인 → 패키지 밤, 옵션 밤샘·지인할인 (지인은 보증금 없음)
  const w = autoFill(placeholders("[패키지] [옵션1] [옵션2] [옵션3]"), { ...r, package: "밤+밤샘", channel: "지인" });
  assert.deepEqual([w["패키지"], w["옵션1"], w["옵션2"], w["옵션3"]], ["밤", "밤샘", "지인할인", ""]);
});
