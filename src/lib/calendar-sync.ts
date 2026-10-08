import { createClient } from "./supabase/server";
import { loadCalendarSync, loadPrices } from "./settings";
import { listEvents, type GoogleEvent } from "./google-calendar";
import { eventTime, isOurs, parseEvent, type ParsedEvent } from "./calendar-parse";
import { suggestAmount } from "./pricing";
import { todayKST } from "./calendar";
import { addDays } from "./calendar-push";

/** 미리보기 한 줄: 구글 일정 하나가 예약현황에 어떻게 들어올지 */
export type PreviewRow = {
  eventId: string;
  calendarId: string;
  title: string;
  /** 사람이 읽는 시각 표기 ('종일' 또는 '19:00~20:00') */
  when: string;
  date: string;
  parsed: ParsedEvent;
  /** 장부에 넣을 입금액 */
  amount: number;
  /** 금액을 날짜·패키지로 추정했는지 (제목·설명에 적혀 있으면 false) */
  amountEstimated: boolean;
  /** 이미 짝이 맞춰진 일정이면 true — 다시 넣지 않는다 */
  alreadyLinked: boolean;
};

export type Preview = {
  rows: PreviewRow[];
  /** 가져오지 않은 일정 수 (제목이 조건에 안 맞거나 연동 시작 전에 만들어진 것) */
  skipped: { notOurs: number; beforeStart: number; cancelled: number };
  /** 읽지 못해 건너뛴 캘린더 (공유가 안 된 경우 등). 나머지 캘린더는 그대로 보여준다 */
  unread: { calendarId: string; why: string }[];
  from: string;
  to: string;
  startedAt: string | null;
};

/** 앞뒤로 볼 기간. 과거는 짧게(이미 장부에 있음), 앞으로는 길게(중복예약 방지가 목적) */
const DAYS_BACK = 30;
const DAYS_AHEAD = 365;

// 날짜 더하기는 calendar-push 의 것을 쓴다 (시간대 때문에 하루 어긋나던 계산을 한 곳으로 모음)

/**
 * 구글 → 예약현황 미리보기. **아무것도 저장하지 않는다.**
 * 실제 반영은 사장님이 미리보기를 보고 승낙한 뒤에 한다 (작업 규칙 2·7).
 */
export async function buildPreview(): Promise<Preview> {
  const cfg = await loadCalendarSync();
  if (!cfg) throw new Error("연동 설정(settings.calendar_sync)이 없습니다 — supabase/calendar-sync.sql 을 실행하세요");

  const today = todayKST();
  const from = addDays(today, -DAYS_BACK);
  const to = addDays(today, DAYS_AHEAD);
  const timeMin = `${from}T00:00:00+09:00`;
  const timeMax = `${to}T00:00:00+09:00`;

  const prices = await loadPrices();
  const supabase = await createClient();
  const { data: links } = await supabase.from("calendar_links").select("google_event_id");
  const linked = new Set((links ?? []).map((r) => r.google_event_id as string));

  const skipped = { notOurs: 0, beforeStart: 0, cancelled: 0 };
  const unread: { calendarId: string; why: string }[] = [];
  const rows: PreviewRow[] = [];

  for (const calendarId of cfg.readCalendarIds) {
    let events: GoogleEvent[];
    try {
      events = await listEvents(calendarId, timeMin, timeMax);
    } catch (e) {
      // 캘린더 하나가 안 열려도 나머지는 그대로 보여준다.
      // 공유하지 않은 캘린더(쓰지 않기로 한 것)가 전체를 멈추게 해서는 안 된다.
      unread.push({ calendarId, why: e instanceof Error ? e.message : String(e) });
      continue;
    }

    for (const ev of events) {
      if (ev.status === "cancelled") { skipped.cancelled++; continue; }

      const title = ev.summary ?? "";
      if (!isOurs(title)) { skipped.notOurs++; continue; }

      // 연동을 켜기 전에 만들어진 일정은 손대지 않는다 (사장님 결정)
      if (cfg.startedAt && ev.created && ev.created < cfg.startedAt) { skipped.beforeStart++; continue; }

      const t = eventTime(ev);
      if (!t) continue;

      const parsed = parseEvent(title, ev.description ?? "", t.time);
      const suggested = suggestAmount(t.date, parsed.package, parsed.channel, prices, parsed.headcount);
      const amount = parsed.amount ?? suggested?.total ?? 0;

      rows.push({
        eventId: ev.id,
        calendarId,
        title,
        when: t.time.allDay ? "종일" : `${t.time.start ?? ""}~${t.time.end ?? ""}${t.time.endsNextDay ? " (익일)" : ""}`,
        date: t.date,
        parsed,
        amount,
        amountEstimated: parsed.amount === null,
        alreadyLinked: linked.has(ev.id),
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  return { rows, skipped, unread, from, to, startedAt: cfg.startedAt };
}
