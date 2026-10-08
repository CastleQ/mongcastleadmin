import assert from "node:assert/strict";
import { test } from "node:test";
import { isOurs, packageFromTitle, packageFromTime, amountFromText, parseEvent, eventTime, type EventTime } from "./calendar-parse.ts";

const allDay: EventTime = { allDay: true, start: null, end: null, endsNextDay: false };
const at = (start: string, end: string, endsNextDay = false): EventTime => ({ allDay: false, start, end, endsNextDay });

// 2026-10-08에 사장님 캘린더에서 실제로 읽은 제목들. 추측이 아니라 진짜 데이터다.
test("isOurs: 제목이 패키지명 또는 '몽캐슬'로 시작하는 것만 가져온다", () => {
  // 가져올 것
  assert.ok(isOurs("몽캐슬 밤타임 예약"));
  assert.ok(isOurs("몽캐슬 파티룸 전일예약 스페이드"));
  assert.ok(isOurs("몽캐슬 반지계피"));
  assert.ok(isOurs(" 몽캐슬 파티룸 전일예약 스페이드")); // 앞 공백이 붙은 실제 일정이 있었다
  assert.ok(isOurs("전일 / 김민수 / 네이버 / 홀덤"));
  assert.ok(isOurs("밤+밤샘 / 박영희"));

  // 거를 것 — 개인 일정과, '몽캐슬'이 앞에 없는 일정
  assert.ok(!isOurs("포계피 몽캐슬 전일"));
  assert.ok(!isOurs("시계피 몽캐슬 뉴비벙"));
  assert.ok(!isOurs("홀덤 몽캐슬 평일저녁"));
  assert.ok(!isOurs("할로윈밤샘시계피1부"));
  assert.ok(!isOurs("월세 775,000 이체"));
  assert.ok(!isOurs("수연이 생일"));
  assert.ok(!isOurs("화란피디 결혼식"));
  assert.ok(!isOurs("청소 - 몽캐슬")); // 운영 일정은 뒤에 붙이면 안 들어온다
});

test("packageFromTitle: 긴 말을 먼저 본다 (밤샘이 밤으로 잡히면 안 됨)", () => {
  assert.equal(packageFromTitle("몽캐슬 밤타임 예약"), "밤");
  assert.equal(packageFromTitle("몽캐슬 파티룸 전일예약 스페이드"), "전일");
  assert.equal(packageFromTitle("밤+밤샘 / 박영희"), "밤+밤샘");
  assert.equal(packageFromTitle("몽캐슬 밤샘 홀덤"), "밤+밤샘");
  assert.equal(packageFromTitle("하루종일 대관"), "전일");
  assert.equal(packageFromTitle("낮 / 이철수"), "낮");
  assert.equal(packageFromTitle("몽캐슬 반지계피"), null); // 패키지 말이 없다
  assert.equal(packageFromTitle("몽캐슬 광복절 시계피"), null);
});

test("packageFromTime: 종일 일정은 판정하지 않는다 (전일로 단정하면 2/3가 틀림)", () => {
  assert.equal(packageFromTime(allDay), null);
  assert.equal(packageFromTime(at("10:00", "17:00")), "낮");
  assert.equal(packageFromTime(at("18:00", "23:00")), "밤");
  assert.equal(packageFromTime(at("18:00", "09:00", true)), "밤+밤샘");
  assert.equal(packageFromTime(at("10:00", "09:00", true)), "전일");
  // 실제 일정들 — 어느 슬롯에도 안 맞아 기타로 간다
  assert.equal(packageFromTime(at("13:00", "22:00")), null);
  assert.equal(packageFromTime(at("12:00", "20:00")), null);
  assert.equal(packageFromTime(at("19:00", "20:00")), "밤"); // 1시간짜리 알림용도 밤으로는 잡힌다
});

test("amountFromText: 150,000원 / 15만 / 150000원", () => {
  assert.equal(amountFromText("총 150,000원 입금"), 150_000);
  assert.equal(amountFromText("15만원"), 150_000);
  assert.equal(amountFromText("26만"), 260_000);
  assert.equal(amountFromText("170000원"), 170_000);
  assert.equal(amountFromText("인원 6명"), null);
});

test("parseEvent: 권장 형식이면 전부 읽는다", () => {
  const p = parseEvent("전일 / 김민수 / 네이버 / 홀덤 6명 010-1234-5678", "", allDay);
  assert.equal(p.package, "전일");
  assert.equal(p.packageSource, "제목");
  assert.equal(p.channel, "네이버플레이스");
  assert.equal(p.content, "홀덤");
  assert.equal(p.headcount, 6);
  assert.equal(p.customer_phone, "010-1234-5678");
  assert.equal(p.customer_name, "김민수");
  assert.deepEqual(p.warnings, []);
});

test("parseEvent: 설명란의 '키: 값'이 제목보다 우선", () => {
  const p = parseEvent("몽캐슬 예약", "이름: 박영희\n인원: 12\n채널: 지인\n금액: 208000\n연락처: 010-9999-8888", allDay);
  assert.equal(p.customer_name, "박영희");
  assert.equal(p.headcount, 12);
  assert.equal(p.channel, "지인");
  assert.equal(p.amount, 208_000);
  assert.equal(p.customer_phone, "010-9999-8888");
});

test("parseEvent: '벙'은 고객 이름이 아니다 (실제 일정 '몽캐슬 홀덤벙')", () => {
  const p = parseEvent("몽캐슬 홀덤벙", "", at("19:00", "20:00"));
  assert.equal(p.package, "밤");
  assert.equal(p.content, "홀덤");
  assert.equal(p.customer_name, null); // 전엔 '벙'으로 읽혔다
});

test("parseEvent: 패키지를 못 읽으면 기타 + 경고 (실제 일정들)", () => {
  for (const title of ["몽캐슬 반지계피", "몽캐슬 광복절 시계피", "몽캐슬 예약"]) {
    const p = parseEvent(title, "", allDay);
    assert.equal(p.package, "기타", title);
    assert.equal(p.packageSource, "없음", title);
    assert.ok(p.warnings.some((w) => w.includes("패키지 확인 필요")), title);
  }
});

test("parseEvent: 제목과 시각이 어긋나면 제목을 따르되 경고", () => {
  const p = parseEvent("전일 / 김민수", "", at("18:00", "23:00"));
  assert.equal(p.package, "전일");
  assert.ok(p.warnings.some((w) => w.includes("시간 불일치")));
});

test("eventTime: 종일 일정과 시각 일정 (실제 구글 응답 모양)", () => {
  // 종일: end.date 는 '다음날'로 오는 것이 구글 규칙이다
  assert.deepEqual(eventTime({ start: { date: "2026-09-02" }, end: { date: "2026-09-03" } }), {
    date: "2026-09-02",
    time: { allDay: true, start: null, end: null, endsNextDay: false },
  });
  // 시각: 2026-09-18 19:00~20:00 (실제 '몽캐슬 홀덤벙')
  assert.deepEqual(eventTime({ start: { dateTime: "2026-09-18T19:00:00+09:00" }, end: { dateTime: "2026-09-18T20:00:00+09:00" } }), {
    date: "2026-09-18",
    time: { allDay: false, start: "19:00", end: "20:00", endsNextDay: false },
  });
  // 밤샘: 다음날 아침에 끝남
  assert.deepEqual(eventTime({ start: { dateTime: "2026-10-30T18:00:00+09:00" }, end: { dateTime: "2026-10-31T09:00:00+09:00" } }), {
    date: "2026-10-30",
    time: { allDay: false, start: "18:00", end: "09:00", endsNextDay: true },
  });
  assert.equal(eventTime({}), null);
});

test("parseEvent: 실제 일정 9건을 돌려본다", () => {
  const real: [string, EventTime, string][] = [
    ["몽캐슬 밤타임 예약", allDay, "밤"],
    ["몽캐슬 파티룸 전일예약 스페이드", allDay, "전일"],
    [" 몽캐슬 파티룸 전일예약 스페이드", allDay, "전일"],
    ["몽캐슬 광복절 시계피", allDay, "기타"],
    ["몽캐슬 반지계피", allDay, "기타"],
    ["몽캐슬 예약", at("13:00", "22:00"), "기타"],
    ["몽캐슬 12시 점소이 시계피 참", at("12:00", "20:00"), "기타"],
    ["몽캐슬 홀덤벙", at("19:00", "20:00"), "밤"],
    ["몽캐슬 예약", at("10:00", "18:00"), "기타"],
  ];
  for (const [title, time, expected] of real) {
    assert.equal(parseEvent(title, "", time).package, expected, title);
  }
});
