"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseLedgerForm } from "@/lib/ledger";
import { loadPrices } from "@/lib/settings";
import { pushLedgerRow, removeFromGoogle } from "@/lib/calendar-export";

/** 저장/삭제 후 돌아갈 화면. 허용된 곳만 (ledger → 거래 탭, 그 외 → 달력) */
const backTo = (from: string | null, date: string) => `${from === "ledger" ? "/ledger" : "/reservations"}?m=${date.slice(0, 7)}`;

export async function saveLedger(id: number | null, formData: FormData) {
  const row = parseLedgerForm(formData, (await loadPrices()).보증금);
  if (!row.date) throw new Error("날짜를 입력하세요");
  const supabase = await createClient();
  const q = id === null
    ? supabase.from("ledger").insert(row).select("id").single()
    : supabase.from("ledger").update(row).eq("id", id).select("id").single();
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  // 구글에 바로 반영. 구글이 안 되더라도 저장은 이미 끝났고, 실패는 sync_log 에 남는다
  await pushLedgerRow(data.id as number);
  redirect(backTo(formData.get("from") as string | null, row.date));
}

export async function deleteLedger(id: number, date: string, from: string | null) {
  // 순서 중요: 거래를 먼저 지우면 짝 정보가 cascade 로 사라져 구글 일정이 고아로 남는다
  await removeFromGoogle(id);
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect(backTo(from, date));
}

export async function setSettled(id: number, settled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").update({ settled }).eq("id", id);
  if (error) throw new Error(error.message);
  await pushLedgerRow(id); // 설명란의 '정산: 완료' 표시가 바뀐다
}
