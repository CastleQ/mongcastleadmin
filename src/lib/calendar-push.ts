import { createHash } from "node:crypto";
import type { Ledger } from "./ledger.ts";

/**
 * 장부 한 줄 → 구글 일정. 순수 함수만 둔다 (구글 접속은 google-calendar.ts).
 *
 * 제목은 우리가 정한 형식 `패키지 / 이름 / 채널 / 콘텐츠` 그대로 쓴다.
 * 그래야 이 일정을 다시 읽어도 같은 뜻으로 해석된다 (왕복해도 깎이지 않음).
 */

export type SlotHours = Record<string, { start: string; end: string; endNextDay: boolean }>;

/** settings.slot_hours 가 없거나 깨졌을 때 쓰는 기본값 (supabase/calendar-sync.sql 과 같은 값) */
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
    "— 몽캐슬 admin에서 자동으로 만든 일정입니다. 여기서 고치면 admin에도 반영됩니다.",
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
  const start = slot
    ? { dateTime: `${row.date}T${slot.start}:00`, timeZone: tz }
    : { date: row.date }; // 패키지를 모르면(기타) 종일 일정으로 — 하루를 막는 쪽이 안전
  const end = slot
    ? { dateTime: `${slot.endNextDay ? nextDay(row.date) : row.date}T${slot.end}:00`, timeZone: tz }
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
    row.date, row.package ?? "", row.customer_name ?? "", row.channel ?? "", row.content ?? "",
    row.customer_phone ?? "", String(row.headcount ?? ""), String(row.amount), String(row.settled), row.note ?? "",
  ];
  return createHash("sha1").update(parts.join("\u0001")).digest("hex").slice(0, 16);
}

/** 구글에 내보낼 예약인가 — 대여 매출만. 매입(월세·집기)은 캘린더에 올리지 않는다 */
export function isExportable(row: Pick<Ledger, "kind" | "category" | "date">): boolean {
  return row.kind === "매출" && row.category === "대여" && !!row.date;
}
