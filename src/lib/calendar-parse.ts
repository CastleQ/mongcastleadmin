import { CHANNELS, CONTENTS } from "./ledger.ts";

/**
 * 구글 일정 → 예약 한 줄로 읽어내기. 순수 함수만 둔다 (구글 접속은 google-calendar.ts).
 *
 * 설계 근거는 docs/google-calendar-sync-plan.md.
 * 실제 캘린더를 보니 예약 일정이 대부분 '종일 일정'이라 시간으로 슬롯을 판정할 수 없다.
 * 그래서 제목 맨 앞의 패키지 한 단어가 사실상 유일한 판정 근거다.
 */

/** 가져올 일정인지 거르는 기준: 제목이 이 중 하나로 시작해야 한다 (개인 일정 보호) */
export const TITLE_PREFIXES = ["몽캐슬", "낮타임", "밤타임", "하루종일", "밤+밤샘", "밤샘", "전일", "낮", "밤"] as const;

/** 제목에서 찾는 패키지 말. 긴 것부터 봐야 '밤샘'이 '밤'으로 먼저 잡히지 않는다 */
const PACKAGE_WORDS: { word: string; pkg: string }[] = [
  { word: "밤+밤샘", pkg: "밤+밤샘" },
  { word: "밤샘", pkg: "밤+밤샘" },
  { word: "하루종일", pkg: "전일" },
  { word: "전일", pkg: "전일" },
  { word: "밤타임", pkg: "밤" },
  { word: "낮타임", pkg: "낮" },
  { word: "밤", pkg: "밤" },
  { word: "낮", pkg: "낮" },
];

const strip = (s: string) => s.replace(/\s+/g, " ").trim();

/** 제목이 가져올 대상인지. 앞뒤 공백은 무시한다 (실제 일정에 앞 공백이 붙은 것이 있었다) */
export function isOurs(title: string): boolean {
  const t = strip(title);
  return TITLE_PREFIXES.some((p) => t.startsWith(p));
}

/** 제목 어디에 있든 패키지 말을 찾는다. 없으면 null */
export function packageFromTitle(title: string): string | null {
  const t = strip(title);
  return PACKAGE_WORDS.find(({ word }) => t.includes(word))?.pkg ?? null;
}

export type EventTime = {
  /** 종일 일정이면 true (구글이 시각을 주지 않음) */
  allDay: boolean;
  /** 'HH:MM' 로컬 시각. 종일이면 null */
  start: string | null;
  end: string | null;
  /** 종료가 다음날이면 true */
  endsNextDay: boolean;
};

/**
 * 시각으로 슬롯 판정 (제목에 패키지 말이 없을 때의 차선책).
 * 종일 일정은 '전일'로 보지 않고 null을 돌려준다 —
 * 실제로는 낮·밤·전일을 모두 종일로 적고 계셔서, 전일로 단정하면 2/3가 틀리고 금액까지 틀어진다.
 */
export function packageFromTime(t: EventTime): string | null {
  if (t.allDay || !t.start || !t.end) return null;
  const h = (hm: string) => Number(hm.slice(0, 2));
  const s = h(t.start), e = h(t.end);
  // 낮은 종료가 16~17시일 때만. 18시 종료는 밤 시작(18시)과 겹쳐 애매하므로 판정하지 않는다 —
  // 애매하면 기타로 보내 하루를 막는 쪽이 중복예약 방지(1순위)에 맞다.
  if (s <= 12 && !t.endsNextDay && e >= 16 && e <= 17) return "낮";
  if (s >= 17 && s <= 20 && !t.endsNextDay) return "밤";
  if (s >= 17 && s <= 20 && t.endsNextDay) return "밤+밤샘";
  if (s <= 12 && t.endsNextDay) return "전일";
  return null;
}

/** 구글 일정의 시각 칸 (종일이면 date, 시각이 있으면 dateTime) */
export type GoogleTimes = { start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string } };

/**
 * 구글 일정 → 예약일 + 슬롯 판정용 시각.
 * dateTime 은 캘린더 시간대(Asia/Seoul)로 받아오므로 글자를 그대로 잘라 쓴다.
 * 날짜·시각이 아예 없으면 null (가져올 수 없는 일정).
 */
export function eventTime(e: GoogleTimes): { date: string; time: EventTime } | null {
  const sDate = e.start?.date, sTime = e.start?.dateTime;
  if (sDate) {
    return { date: sDate.slice(0, 10), time: { allDay: true, start: null, end: null, endsNextDay: false } };
  }
  if (!sTime) return null;
  const date = sTime.slice(0, 10);
  const eTime = e.end?.dateTime;
  return {
    date,
    time: {
      allDay: false,
      start: sTime.slice(11, 16),
      end: eTime ? eTime.slice(11, 16) : null,
      endsNextDay: !!eTime && eTime.slice(0, 10) !== date,
    },
  };
}

const CHANNEL_WORDS: { word: string; channel: string }[] = [
  { word: "네이버", channel: "네이버플레이스" },
  { word: "스페이스", channel: "스페이스클라우드" },
  { word: "아워", channel: "아워플레이스" },
  { word: "별도", channel: "별도컨택" },
  { word: "지인", channel: "지인" },
];

/** 설명란의 `키: 값` 한 줄들. 제목보다 우선한다 */
function fromDescription(desc: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of desc.split("\n")) {
    const m = line.match(/^\s*(이름|인원|채널|금액|연락처|메모|패키지)\s*[:：]\s*(.+?)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const digits = (s: string) => s.replace(/[^0-9]/g, "");

/** '150,000원' '15만' '150000' → 150000. 못 읽으면 null */
export function amountFromText(text: string): number | null {
  const man = text.match(/(\d{1,4})\s*만\s*원?/);
  if (man) return Number(man[1]) * 10_000;
  const won = text.match(/(\d{1,3}(?:,\d{3})+|\d{4,7})\s*원/);
  if (won) return Number(digits(won[1]));
  return null;
}

export type ParsedEvent = {
  package: string;        // 못 읽으면 '기타'
  packageSource: "제목" | "시간" | "설명" | "없음";
  customer_name: string | null;
  customer_phone: string | null;
  channel: string | null;
  headcount: number | null;
  content: string | null;
  amount: number | null;  // 제목·설명에 적힌 금액. 없으면 null → 날짜·패키지로 추정
  warnings: string[];     // 화면에 띄울 경고 (패키지 확인 필요 등)
};

/**
 * 제목 + 설명 + 시각 → 예약 한 줄.
 * 형식에 안 맞아도 읽을 수 있는 것은 최대한 건진다. 못 읽은 칸은 null로 두고 경고를 남긴다.
 */
export function parseEvent(title: string, description: string, time: EventTime): ParsedEvent {
  const d = fromDescription(description ?? "");
  const t = strip(title);
  const warnings: string[] = [];

  // 패키지: 설명 > 제목 > 시각
  let pkg = d["패키지"] ? packageFromTitle(d["패키지"]) : null;
  let packageSource: ParsedEvent["packageSource"] = pkg ? "설명" : "없음";
  if (!pkg) { pkg = packageFromTitle(t); if (pkg) packageSource = "제목"; }
  if (!pkg) { pkg = packageFromTime(time); if (pkg) packageSource = "시간"; }
  if (!pkg) {
    pkg = "기타";
    warnings.push("패키지 확인 필요 — 하루 전체가 막힙니다");
  } else if (packageSource === "제목" && !time.allDay) {
    const byTime = packageFromTime(time);
    if (byTime && byTime !== pkg) warnings.push(`시간 불일치 — 제목은 ${pkg}, 시각은 ${byTime}`);
  }

  const phone = d["연락처"] ?? t.match(/01[016-9][-\s]?\d{3,4}[-\s]?\d{4}/)?.[0] ?? null;
  const headText = d["인원"] ?? t.match(/(\d{1,3})\s*[명인](?![가-힣])/)?.[1] ?? null;
  const headcount = headText ? Number(digits(headText)) || null : null;

  const channelText = d["채널"] ?? t;
  const channel = CHANNELS.includes(channelText)
    ? channelText
    : CHANNEL_WORDS.find(({ word }) => channelText.includes(word))?.channel ?? null;

  const content = CONTENTS.find((c) => t.includes(c)) ?? (t.includes("머더") ? "머더미스터리" : null);
  const amount = d["금액"] ? (amountFromText(d["금액"]) ?? (Number(digits(d["금액"])) || null)) : amountFromText(t);

  // 이름: 설명에 있으면 그대로. 없으면 제목에서 알아본 말들을 지우고 남은 토막
  let name: string | null = d["이름"] ?? null;
  if (!name) {
    let rest = t;
    for (const p of TITLE_PREFIXES) rest = rest.replace(new RegExp(p, "g"), " ");
    for (const { word } of PACKAGE_WORDS) rest = rest.replace(new RegExp(word.replace("+", "\\+"), "g"), " ");
    for (const { word } of CHANNEL_WORDS) rest = rest.replace(new RegExp(word, "g"), " ");
    for (const c of CONTENTS) rest = rest.replace(new RegExp(c, "g"), " ");
    rest = rest
      .replace(/01[016-9][-\s]?\d{3,4}[-\s]?\d{4}/g, " ")
      .replace(/\d{1,3}\s*[명인]/g, " ")
      .replace(/\d[\d,]*\s*(만\s*)?원?/g, " ")
      // 모임을 뜻하는 말(벙·벙개)과 거드는 말은 이름이 아니다 — '홀덤벙'이 고객 '벙'으로 읽히던 문제
      .replace(/벙개|벙|예약|파티룸|문의|참|부/g, " ")
      .replace(/[/·,|\-–—]+/g, " "); // 구분자는 이름이 아니다
    name = strip(rest) || null;
  }

  return { package: pkg, packageSource, customer_name: name, customer_phone: phone, channel, headcount, content, amount, warnings };
}
