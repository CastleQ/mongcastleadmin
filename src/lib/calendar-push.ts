import { createHash } from "node:crypto";
import type { Ledger } from "./ledger.ts";

/**
 * 장부 한 줄 → 구글 일정. 순수 함수만 둔다 (구글 접속은 google-calendar.ts).
 *
 * 제목은 우리가 정한 형식 `패키지 / 이름 / 채널 / 콘텐츠` 그대로 쓴다.
 * 그래야 이 일정을 다시 읽어도 같은 뜻으로 해석된다 (왕복해도 깎이지 않음).
 */

export type SlotHours = Record<string, { start: string; end: string; endNextDay: boolean }>;

/** settings.slot_hours 가 없거나 깨졌을 때 쓰는 기본값 (supabase/done/calendar-sync.sql 과 같은 값) */
export const DEFAULT_SLOT_HOURS: SlotHours = {
  낮: { start: "10:00", end: "17:00", endNextDay: false },
  밤: { start: "18:00", end: "23:00", endNextDay: false },
  "밤+밤샘": { start: "18:00", end: "09:00", endNextDay: true },
  전일: { start: "10:00", end: "09:00", endNextDay: true },
};

export function mergeSlotHours(v: unknown): SlotHours {
  const out: SlotHours = { ...DEFAULT_SLOT_HOURS };
  if (v && typeof v === "object") {
    for (const [pkg, raw] of Object.entries(v as Record<string, unknown>)) {
      const s = raw as Partial<SlotHours[string]>;
      if (typeof s?.start === "string" && typeof s?.end === "string") {
        out[pkg] = { start: s.start, end: s.end, endNextDay: s.endNextDay === true };
      }
    }
  }
  return out;
}

/**
 * 날짜에 하루 더하기.
 * `new Date("...+09:00")` 로 만든 뒤 getDate/toISOString 을 섞으면 서버 시간대(UTC)에서 하루가 어긋난다.
 * 시간대를 아예 끌어들이지 않는 달력 계산으로 한다.
 */
export const addDays = (date: string, days: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
const nextDay = (date: string) => addDays(date, 1);

/** 예약 한 줄의 제목. 비어 있는 칸은 빼고 ' / ' 로 잇는다 */
export function titleOf(row: Pick<Ledger, "package" | "customer_name" | "channel" | "content">): string {
  return [row.package ?? "기타", row.customer_name, row.channel, row.content].filter(Boolean).join(" / ");
}

/** 사람이 읽을 설명. 되읽을 때는 숨은 칸을 쓰므로 이건 순전히 눈으로 보기 위한 것 */
export function descriptionOf(row: Ledger): string {
  const lines = [
    row.customer_phone ? `연락처: ${row.customer_phone}` : "",
    row.headcount ? `인원: ${row.headcount}` : "",
    row.amount ? `금액: ${row.amount.toLocaleString("ko-KR")}원` : "",
    row.settled ? "정산: 완료" : "정산: 미정산",
    row.note ? `메모: ${row.note}` : "",
    "",
    "— 몽캐슬 admin에서 자동으로 만든 일정입니다. 고칠 때는 admin에서 고쳐 주세요. 여기서 고치면 다음 동기화 때 admin 내용으로 되돌아갑니다.",
  ];
  return lines.filter((l) => l !== "").join("\n");
}

/** 구글 일정 색 (1~11). 사장님이 이름을 바꿔 쓰시면 구글 화면엔 그 이름으로 보인다 */
export const EVENT_COLORS: { id: string; name: string; hex: string }[] = [
  { id: "1", name: "라벤더", hex: "#7986cb" },
  { id: "2", name: "세이지(연초록)", hex: "#33b679" },
  { id: "3", name: "포도", hex: "#8e24aa" },
  { id: "4", name: "플라밍고", hex: "#e67c73" },
  { id: "5", name: "바나나", hex: "#f6bf26" },
  { id: "6", name: "귤", hex: "#f4511e" },
  { id: "7", name: "공작(하늘)", hex: "#039be5" },
  { id: "8", name: "그래파이트(회색)", hex: "#616161" },
  { id: "9", name: "블루베리(남색)", hex: "#3f51b5" },
  { id: "10", name: "바질(진초록)", hex: "#0b8043" },
  { id: "11", name: "토마토(빨강)", hex: "#d50000" },
];

export type GoogleEventBody = {
  summary: string;
  description: string;
  start: { date: string } | { dateTime: string; timeZone: string };
  end: { date: string } | { dateTime: string; timeZone: string };
  extendedProperties: { private: { ledger_id: string; content_hash: string } };
  colorId?: string;
};

/**
 * 장부 한 줄 → 구글에 보낼 일정 내용.
 * 숨은 칸(extendedProperties.private)에 거래 번호와 지문을 넣는다 —
 * 되읽을 때 "내가 쓴 것이 돌아온 것"임을 알아보는 바코드다.
 */
export function eventFromLedger(row: Ledger, hours: SlotHours = DEFAULT_SLOT_HOURS, colorId: string | null = null): GoogleEventBody {
  const slot = hours[row.package ?? ""] ?? null;
  const tz = "Asia/Seoul";
  // 장부에 적힌 예약 시간이 기준, 비어 있으면 패키지 기본 시간 (사장님 결정 2026-11-23). DB 는 '10:00:00' 꼴이라 앞 5자만 쓴다
  const startAt = row.start_time?.slice(0, 5) || slot?.start;
  const endAt = row.end_time?.slice(0, 5) || slot?.end;
  const timed = !!startAt && !!endAt;
  // 끝이 시작보다 이르거나 같으면 다음날 끝난다 (전일 10:00~09:00, 밤샘 18:00~09:00)
  const endNextDay = timed && endAt <= startAt;
  const start = timed
    ? { dateTime: `${row.date}T${startAt}:00`, timeZone: tz }
    : { date: row.date }; // 패키지도 시간도 모르면(기타) 종일 일정으로 — 하루를 막는 쪽이 안전
  const end = timed
    ? { dateTime: `${endNextDay ? nextDay(row.date) : row.date}T${endAt}:00`, timeZone: tz }
    : { date: nextDay(row.date) }; // 구글 종일 일정의 끝은 '다음날'이다

  return {
    summary: titleOf(row),
    description: descriptionOf(row),
    start,
    end,
    extendedProperties: { private: { ledger_id: String(row.id), content_hash: contentHash(row) } },
    ...(colorId ? { colorId } : {}),
  };
}

/**
 * 내용 지문. 구글에 보이는 것이 달라지는 칸만 넣는다.
 * 지문이 같으면 구글에 다시 쓰지 않고, 돌아온 변경도 무시한다 (메아리 방지).
 */
export function contentHash(row: Ledger): string {
  const parts = [
    "v2", // 설명 문구를 바꾸면 올린다 — 이미 올라간 일정도 다음 동기화 때 새 문구로 고쳐진다
    row.date, row.package ?? "", row.customer_name ?? "", row.channel ?? "", row.content ?? "",
    row.customer_phone ?? "", String(row.headcount ?? ""), String(row.amount), String(row.settled), row.note ?? "",
    row.start_time ?? "", row.end_time ?? "", // 예약 시간을 바꾸면 구글 일정 시각도 따라 바뀐다
  ];
  return createHash("sha1").update(parts.join("\u0001")).digest("hex").slice(0, 16);
}

/**
 * 고치기(PATCH)용 본문. 구글은 start/end 안을 **합치기** 때문에, 종일 일정을 시각 일정으로 고치면
 * 옛 date 와 새 dateTime 이 함께 남아 "Invalid start time" 으로 거절된다 (반대도 같다).
 * 쓰지 않는 쪽을 null 로 보내 지운다.
 */
export function forPatch(body: GoogleEventBody) {
  const clear = (t: GoogleEventBody["start"]) => ("dateTime" in t ? { date: null, ...t } : { dateTime: null, timeZone: null, ...t });
  return { ...body, start: clear(body.start), end: clear(body.end) };
}

/**
 * 구글 일정이 마지막 동기화 뒤에 고쳐졌나.
 * 글자로 비교하면 안 된다: 구글은 '...Z', DB 는 '...+00:00' 으로 돌려줘 같은 시각도 늘 '고쳐짐'으로 보였다
 * (2026-11 까지 동기화 때마다 30여 건을 구글 내용으로 덮어쓴 원인).
 */
export function changedSince(googleUpdated: string | null | undefined, lastSynced: string | null | undefined): boolean {
  if (!googleUpdated) return false;
  if (!lastSynced) return true;
  return Date.parse(googleUpdated) > Date.parse(lastSynced);
}

/** 구글에 내보낼 예약인가 — 대여 매출만. 매입(월세·집기)·취소된 예약은 캘린더에 올리지 않는다 */
export function isExportable(row: Pick<Ledger, "kind" | "category" | "date" | "cancelled">): boolean {
  return row.kind === "매출" && row.category === "대여" && !!row.date && !row.cancelled;
}
