import { createClient } from "./supabase/server";
import { loadCalendarSync } from "./settings";
import { listEvents } from "./google-calendar";
import { addDays, isExportable, titleOf } from "./calendar-push";
import { todayKST } from "./calendar";
import type { Ledger } from "./ledger";

/**
 * 1차 내보내기: 장부에 있는 예약을 구글에 처음 올리는 작업.
 *
 * 과거 건은 올리지 않는다 — 중복예약 방지에 쓸모가 없고, 사장님이 이미 적어두신 일정과 겹쳐 보인다.
 * 오늘 이후 건만, 그리고 **이미 비슷한 구글 일정이 있으면 경고**를 달아 보여준다 (사장님 확인 사항).
 */

const DAYS_AHEAD = 365;

export type SeedRow = {
  ledger: Ledger;
  title: string;
  /** 같은 날 구글에 이미 있는 일정 제목들 — 있으면 중복일 수 있다 */
  sameDayInGoogle: string[];
  /** 이미 짝이 맺어져 있으면 건너뛴다 */
  alreadyLinked: boolean;
};

export type Seed = {
  rows: SeedRow[];
  from: string;
  to: string;
  writeCalendarId: string;
  /** 연동이 켜져 있는지 — 꺼져 있으면 내보내기도 하지 않는다 */
  started: boolean;
};

export async function buildSeed(): Promise<Seed> {
  const cfg = await loadCalendarSync();
  if (!cfg) throw new Error("연동 설정이 없습니다 — supabase/calendar-sync.sql 을 실행하세요");

  const today = todayKST();
  const to = addDays(today, DAYS_AHEAD);
  const supabase = await createClient();

  const [{ data: rows }, { data: links }] = await Promise.all([
    supabase.from("ledger").select("*").gte("date", today).lte("date", to).order("date"),
    supabase.from("calendar_links").select("ledger_id"),
  ]);
  const linked = new Set((links ?? []).map((r) => r.ledger_id as number));

  // 같은 날 구글에 뭐가 있는지 — 중복 경고용. 한 번만 읽어 날짜별로 모아둔다
  const byDate = new Map<string, string[]>();
  for (const calendarId of cfg.readCalendarIds) {
    let events;
    try {
      events = await listEvents(calendarId, `${today}T00:00:00+09:00`, `${to}T00:00:00+09:00`);
    } catch {
      continue; // 못 읽는 캘린더는 건너뛴다 (공유 안 된 것 등)
    }
    for (const ev of events) {
      if (ev.status === "cancelled") continue;
      const date = ev.start?.date?.slice(0, 10) ?? ev.start?.dateTime?.slice(0, 10);
      if (!date || !ev.summary) continue;
      byDate.set(date, [...(byDate.get(date) ?? []), ev.summary]);
    }
  }

  const out: SeedRow[] = [];
  for (const r of (rows ?? []) as Ledger[]) {
    if (!isExportable(r)) continue;
    out.push({
      ledger: r,
      title: titleOf(r),
      sameDayInGoogle: byDate.get(r.date) ?? [],
      alreadyLinked: linked.has(r.id),
    });
  }

  return { rows: out, from: today, to, writeCalendarId: cfg.writeCalendarId, started: !!cfg.startedAt };
}
