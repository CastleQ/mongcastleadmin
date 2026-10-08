import { createClient } from "./supabase/server";
import { loadCalendarSync, loadPrices } from "./settings";
import { listEvents } from "./google-calendar";
import { eventTime, isOurs, parseEvent } from "./calendar-parse";
import { addDays, contentHash } from "./calendar-push";
import { suggestAmount } from "./pricing";
import { calcMoney, type Ledger, type LedgerInput } from "./ledger";
import { todayKST } from "./calendar";

/**
 * 구글 → 장부 가져오기.
 *
 * - 새 일정: 장부에 예약 한 줄로 넣는다 (금액은 추정, 미정산, amount_estimated=true)
 * - 구글에서 고친 일정: 장부도 따라 고친다 (구글 쪽이 더 나중이면)
 * - 구글에서 지워진 일정: **장부는 지우지 않고 표시만** (합의된 결정 ③)
 *
 * ponytail: 매번 기간 전체를 읽는다. 일정이 수천 개로 늘면 syncToken 증분 읽기로 바꿀 것.
 */

const DAYS_BACK = 30;
const DAYS_AHEAD = 365;

export type ImportResult = {
  created: number;
  updated: number;
  markedDeleted: number;
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

export async function importFromGoogle(): Promise<ImportResult> {
  const out: ImportResult = { created: 0, updated: 0, markedDeleted: 0, errors: [] };

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

  for (const calendarId of cfg.readCalendarIds) {
    let events;
    try {
      events = await listEvents(calendarId, `${from}T00:00:00+09:00`, `${to}T00:00:00+09:00`);
    } catch (e) {
      out.errors.push(`${calendarId}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    for (const ev of events) {
      if (ev.status === "cancelled") continue;
      const title = ev.summary ?? "";
      if (!isOurs(title)) continue;
      if (cfg.startedAt && ev.created && ev.created < cfg.startedAt) continue;

      const t = eventTime(ev);
      if (!t) continue;
      seen.add(ev.id);

      const parsed = parseEvent(title, ev.description ?? "", t.time);
      const suggested = suggestAmount(t.date, parsed.package, parsed.channel, prices, parsed.headcount);
      const amount = parsed.amount ?? suggested?.total ?? 0;
      const link = links.get(ev.id);

      try {
        if (!link) {
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
          continue;
        }

        // 이미 짝이 있는 일정 — 구글 쪽이 그 뒤에 바뀌었을 때만 장부를 고친다
        const changedInGoogle = !!ev.updated && (!link.google_updated || ev.updated > (link.google_updated as string));
        if (!changedInGoogle) continue;

        const { data: before } = await supabase.from("ledger").select("*").eq("id", link.ledger_id).maybeSingle();
        if (!before) continue;

        const input = toLedgerInput(t.date, parsed, amount, prices);
        const { data: after, error } = await supabase
          .from("ledger")
          .update({ ...input, settled: (before as Ledger).settled }) // 정산 여부는 장부가 주인이다
          .eq("id", link.ledger_id)
          .select("*")
          .single();
        if (error) throw new Error(error.message);

        await supabase.from("calendar_links")
          .update({ content_hash: contentHash(after as Ledger), google_updated: ev.updated, synced_at: new Date().toISOString(), deleted_in_google: false })
          .eq("ledger_id", link.ledger_id);
        await supabase.from("sync_log").insert({
          direction: "google_to_ledger", action: "updated",
          ledger_id: link.ledger_id, google_event_id: ev.id, before_json: before, after_json: after,
        });
        out.updated++;
      } catch (e) {
        out.errors.push(`${title}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // 구글에서 사라진 일정 — 기간 안에 있는데 안 보이면 지워진 것. 장부는 그대로 두고 표시만 한다
  for (const link of linkRows ?? []) {
    const eventId = link.google_event_id as string;
    if (seen.has(eventId) || link.deleted_in_google) continue;
    const { data: row } = await supabase.from("ledger").select("date").eq("id", link.ledger_id).maybeSingle();
    if (!row || (row.date as string) < from || (row.date as string) > to) continue; // 기간 밖은 판단하지 않는다
    await supabase.from("calendar_links").update({ deleted_in_google: true }).eq("ledger_id", link.ledger_id);
    await supabase.from("sync_log").insert({
      direction: "google_to_ledger", action: "deleted", ledger_id: link.ledger_id, google_event_id: eventId,
      message: "구글에서 일정이 사라졌습니다. 거래는 지우지 않고 표시만 했습니다.",
    });
    out.markedDeleted++;
  }

  return out;
}
