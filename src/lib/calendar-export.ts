import { createClient } from "./supabase/server";
import { loadCalendarSync } from "./settings";
import { createEvent, patchEvent, deleteEvent } from "./google-calendar";
import { contentHash, eventFromLedger, isExportable, mergeSlotHours, type SlotHours } from "./calendar-push";
import type { Ledger } from "./ledger";

/**
 * 장부 → 구글 반영. 거래를 저장·삭제할 때 그 자리에서 불린다.
 *
 * 구글이 잠깐 안 되더라도 **장부 저장은 성공해야 한다.** 그래서 여기서 난 오류는 삼키고
 * sync_log 에만 남긴다 — 장부가 원본이고 구글은 사본이기 때문.
 */

async function slotHours(): Promise<SlotHours> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "slot_hours").maybeSingle();
  return mergeSlotHours(data?.value);
}

type LogRow = {
  direction: "ledger_to_google";
  action: "created" | "updated" | "deleted" | "error";
  ledger_id: number;
  google_event_id?: string | null;
  message?: string | null;
};

async function log(row: LogRow) {
  const supabase = await createClient();
  await supabase.from("sync_log").insert(row);
}

/**
 * 거래를 지우기 **전에** 불러야 한다.
 * 거래를 먼저 지우면 calendar_links 가 cascade 로 함께 사라져, 구글 일정만 고아로 남는다.
 * 던지지 않는다 — 구글이 안 되더라도 거래 삭제는 진행돼야 한다.
 */
export async function removeFromGoogle(id: number): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: link } = await supabase.from("calendar_links").select("*").eq("ledger_id", id).maybeSingle();
    if (!link) return;
    await deleteEvent(link.calendar_id as string, link.google_event_id as string);
    await supabase.from("calendar_links").delete().eq("ledger_id", id);
    await log({ direction: "ledger_to_google", action: "deleted", ledger_id: id, google_event_id: link.google_event_id as string });
  } catch (e) {
    await log({
      direction: "ledger_to_google", action: "error", ledger_id: id,
      message: `삭제 반영 실패: ${e instanceof Error ? e.message : String(e)}`,
    }).catch(() => {});
  }
}

/**
 * 거래 한 줄을 구글에 반영 (없으면 만들고, 있으면 고치고, 대상이 아니면 지운다).
 * 던지지 않는다. 실패는 sync_log 에 남기고 조용히 돌아간다.
 */
export async function pushLedgerRow(id: number): Promise<void> {
  try {
    const cfg = await loadCalendarSync();
    if (!cfg || !cfg.startedAt) return; // 연동을 켜기 전에는 아무것도 하지 않는다

    const supabase = await createClient();
    const { data: row } = await supabase.from("ledger").select("*").eq("id", id).maybeSingle();
    const { data: link } = await supabase.from("calendar_links").select("*").eq("ledger_id", id).maybeSingle();

    // 거래가 지워졌거나 더 이상 예약이 아니면(매입으로 바뀜 등) 구글에서도 치운다
    if (!row || !isExportable(row as Ledger)) {
      if (link) {
        await deleteEvent(link.calendar_id as string, link.google_event_id as string);
        await supabase.from("calendar_links").delete().eq("ledger_id", id);
        await log({ direction: "ledger_to_google", action: "deleted", ledger_id: id, google_event_id: link.google_event_id as string });
      }
      return;
    }

    const ledger = row as Ledger;
    const hash = contentHash(ledger);
    if (link && link.content_hash === hash) return; // 보이는 내용이 그대로면 구글을 건드리지 않는다 (메아리 방지)

    const body = eventFromLedger(ledger, await slotHours());

    if (link) {
      await patchEvent(link.calendar_id as string, link.google_event_id as string, body);
      await supabase.from("calendar_links")
        .update({ content_hash: hash, synced_at: new Date().toISOString(), deleted_in_google: false })
        .eq("ledger_id", id);
      await log({ direction: "ledger_to_google", action: "updated", ledger_id: id, google_event_id: link.google_event_id as string });
      return;
    }

    const eventId = await createEvent(cfg.writeCalendarId, body);
    await supabase.from("calendar_links").insert({
      ledger_id: id,
      google_event_id: eventId,
      calendar_id: cfg.writeCalendarId,
      content_hash: hash,
    });
    await log({ direction: "ledger_to_google", action: "created", ledger_id: id, google_event_id: eventId });
  } catch (e) {
    // 장부 저장을 막지 않는다. 무엇이 실패했는지는 기록에 남긴다
    await log({
      direction: "ledger_to_google",
      action: "error",
      ledger_id: id,
      message: e instanceof Error ? e.message : String(e),
    }).catch(() => {});
  }
}
