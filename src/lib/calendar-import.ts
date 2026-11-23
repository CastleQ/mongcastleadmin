import { createClient } from "./supabase/server";
import { loadCalendarSync, loadPrices } from "./settings";
import { listEvents } from "./google-calendar";
import { eventTime, isOurs, parseEvent } from "./calendar-parse";
import { addDays, changedSince, contentHash, isExportable } from "./calendar-push";
import { suggestAmount } from "./pricing";
import { calcMoney, type Ledger, type LedgerInput } from "./ledger";
import { todayKST } from "./calendar";
import { pushLedgerRow } from "./calendar-export";

/**
 * 구글 ↔ 장부 동기화 ("구글캘린더 동기화" 단추). **기준은 언제나 홈페이지(장부)다** (사장님 결정 2026-11-23).
 *
 * 1. 구글에만 있는 새 일정 → 장부에 예약 한 줄로 넣는다 (금액은 추정, 미정산, amount_estimated=true)
 * 2. 장부와 짝이 있는 일정은 **장부를 고치지 않는다.** 구글에서 손댔으면 장부 내용으로 되돌리고,
 *    구글에서 지웠으면 장부 내용으로 다시 만든다. (예전엔 구글 내용으로 장부를 덮어써
 *    인입일·결제방식·수수료·메모가 지워졌다)
 * 3. 장부에서 구글로 아직 안 간 것을 올린다 — 화면을 거치지 않고 DB 에 직접 넣은 예약,
 *    취소했는데 구글에 남은 일정, 저장 때 구글이 실패한 건까지 여기서 맞춰진다.
 *
 * shortcut: 매번 기간 전체를 읽는다. 일정이 수천 개로 늘면 syncToken 증분 읽기로 바꿀 것.
 */

const DAYS_BACK = 30;
const DAYS_AHEAD = 365;

export type ImportResult = {
  /** 구글 → 장부: 새로 들어온 예약 */
  created: number;
  /** 장부 → 구글: 새로 올린 / 장부대로 고친 / 지운(취소) 일정 */
  pushedCreated: number;
  pushedUpdated: number;
  pushedDeleted: number;
  /** 시간이 모자라 이번에 못 맞춘 예약 수 — 한 번 더 누르면 이어서 한다 */
  remaining: number;
  errors: string[];
};

/** 해석 결과 → 장부 한 줄 */
function toLedgerInput(date: string, parsed: ReturnType<typeof parseEvent>, amount: number, prices: { 보증금: number }): LedgerInput {
  // 인자 순서 주의: (종류, 입금액, 채널, 결제방식, 기타지출, 보증금). 보증금은 6번째다
  const money = calcMoney("매출", amount, parsed.channel, "계좌이체", 0, prices.보증금);
  return {
    date,
    kind: "매출",
    category: "대여",
    channel: parsed.channel,
    inquiry_date: null,
    customer_name: parsed.customer_name,
    customer_phone: parsed.customer_phone,
    content: parsed.content,
    headcount: parsed.headcount,
    package: parsed.package,
    hours: null,
    settled: false,
    amount,
    fee: money.fee,
    other_expense: 0,
    net: money.net,
    payment_method: "계좌이체",
    note: parsed.warnings.length ? parsed.warnings.join(" / ") : null,
    amount_estimated: true,
  };
}

/** 동시에 두 번 돌지 않게 거는 표시 (settings 표의 한 줄). 2026-11-23 두 번 겹쳐 돌아 구글에 같은 일정이 두 개씩 생겼다 */
const LOCK_KEY = "calendar_sync_running";
/** 이보다 오래된 표시는 중간에 죽은 동기화가 남긴 것으로 보고 치운다 */
const LOCK_STALE_MS = 5 * 60_000;
/** 구글 올리기는 이 시간 안에서만. 넘으면 멈추고 '한 번 더 눌러 주세요'로 — 응답 없이 기다리게 두지 않는다 */
const PUSH_BUDGET_MS = 40_000;

export async function importFromGoogle(): Promise<ImportResult> {
  const supabase = await createClient();
  const now = new Date();
  await supabase.from("settings").delete().eq("key", LOCK_KEY).lt("updated_at", new Date(now.getTime() - LOCK_STALE_MS).toISOString());
  const { error: busy } = await supabase.from("settings").insert({ key: LOCK_KEY, value: { at: now.toISOString() }, updated_at: now.toISOString() });
  if (busy) throw new Error("동기화가 이미 진행 중입니다. 1~2분 뒤 다시 눌러 주세요");
  try {
    return await syncOnce(Date.now());
  } finally {
    await supabase.from("settings").delete().eq("key", LOCK_KEY);
  }
}

async function syncOnce(startedMs: number): Promise<ImportResult> {
  const out: ImportResult = { created: 0, pushedCreated: 0, pushedUpdated: 0, pushedDeleted: 0, remaining: 0, errors: [] };

  const cfg = await loadCalendarSync();
  if (!cfg) throw new Error("연동 설정이 없습니다");
  if (!cfg.startedAt) throw new Error("연동이 꺼져 있습니다 — 먼저 '지금부터 연동 시작'을 눌러주세요");

  const today = todayKST();
  const from = addDays(today, -DAYS_BACK);
  const to = addDays(today, DAYS_AHEAD);
  const prices = await loadPrices();
  const supabase = await createClient();

  const { data: linkRows } = await supabase.from("calendar_links").select("*");
  const links = new Map((linkRows ?? []).map((l) => [l.google_event_id as string, l]));
  const seen = new Set<string>();
  /** 일정 목록을 다 읽은 캘린더. 못 읽은 캘린더의 일정을 '지워졌다'고 판단하면 안 된다 */
  const readOk = new Set<string>();
  /** 구글에서 손댄 일정의 거래 번호 — 장부 내용으로 되돌린다 */
  const touchedInGoogle = new Set<number>();

  // ── 1. 구글 읽기: 새 일정은 장부로, 짝 있는 일정은 손댔는지만 본다 ──
  for (const calendarId of cfg.readCalendarIds) {
    let events;
    try {
      events = await listEvents(calendarId, `${from}T00:00:00+09:00`, `${to}T00:00:00+09:00`);
    } catch (e) {
      out.errors.push(`${calendarId}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    readOk.add(calendarId);

    for (const ev of events) {
      if (ev.status === "cancelled") continue;

      // 짝이 있는 일정은 제목·만든 날짜와 상관없이 '있음'으로 친다 (옛 일정을 손으로 짝지은 것도 있다)
      const link = links.get(ev.id);
      if (link) {
        seen.add(ev.id);
        if (changedSince(ev.updated, link.google_updated as string | null)) touchedInGoogle.add(link.ledger_id as number);
        continue;
      }

      const title = ev.summary ?? "";
      if (!isOurs(title)) continue;
      if (cfg.startedAt && ev.created && ev.created < cfg.startedAt) continue;

      const t = eventTime(ev);
      if (!t) continue;

      const parsed = parseEvent(title, ev.description ?? "", t.time);
      const suggested = suggestAmount(t.date, parsed.package, parsed.channel, prices, parsed.headcount);
      const amount = parsed.amount ?? suggested?.total ?? 0;

      try {
        const input = toLedgerInput(t.date, parsed, amount, prices);
        const { data: inserted, error } = await supabase.from("ledger").insert(input).select("*").single();
        if (error) throw new Error(error.message);
        await supabase.from("calendar_links").insert({
          ledger_id: (inserted as Ledger).id,
          google_event_id: ev.id,
          calendar_id: calendarId,
          content_hash: contentHash(inserted as Ledger),
          google_updated: ev.updated ?? null,
        });
        await supabase.from("sync_log").insert({
          direction: "google_to_ledger", action: "created",
          ledger_id: (inserted as Ledger).id, google_event_id: ev.id, after_json: inserted,
        });
        out.created++;
      } catch (e) {
        out.errors.push(`${title}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // ── 2. 구글에서 사라진 일정: 짝을 풀어 두면 3번에서 장부 내용으로 다시 만든다 (취소된 거래면 그대로 둔다) ──
  const { data: rows } = await supabase.from("ledger").select("*").gte("date", from).lte("date", to);
  const inRange = new Map((rows ?? []).map((r) => [r.id as number, r as Ledger]));
  for (const link of linkRows ?? []) {
    const eventId = link.google_event_id as string;
    if (seen.has(eventId) || !readOk.has(link.calendar_id as string)) continue;
    if (!inRange.has(link.ledger_id as number)) continue; // 기간 밖은 판단하지 않는다
    await supabase.from("calendar_links").delete().eq("ledger_id", link.ledger_id);
    await supabase.from("sync_log").insert({
      direction: "google_to_ledger", action: "deleted", ledger_id: link.ledger_id, google_event_id: eventId,
      message: "구글에서 일정이 사라졌습니다. 홈페이지가 기준이라 장부 내용으로 다시 만듭니다.",
    });
    links.delete(eventId);
  }

  // ── 3. 장부 → 구글: 기간 안의 예약을 장부대로 맞춘다 (바뀐 게 없으면 pushLedgerRow 가 건드리지 않는다) ──
  const linkedIds = new Set([...links.values()].map((l) => l.ledger_id as number));
  const targets = [...inRange].filter(([id, row]) => isExportable(row) || linkedIds.has(id)); // 지출·취소이면서 구글에 없는 것은 볼 필요 없다
  for (const [i, [id, row]] of targets.entries()) {
    if (Date.now() - startedMs > PUSH_BUDGET_MS) { out.remaining = targets.length - i; break; }
    const did = await pushLedgerRow(id, { force: touchedInGoogle.has(id) });
    if (did === "created") out.pushedCreated++;
    else if (did === "updated") out.pushedUpdated++;
    else if (did === "deleted") out.pushedDeleted++;
    else if (did === "error") out.errors.push(`${row.date} ${row.customer_name ?? ""}: 구글 반영 실패 (sync_log 참고)`);
  }

  return out;
}
