"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseLedgerForm } from "@/lib/ledger";
import { loadPrices } from "@/lib/settings";

/** 저장/삭제 후 돌아갈 화면. 허용된 곳만 (ledger → 거래 탭, 그 외 → 달력) */
const backTo = (from: string | null, date: string) => `${from === "ledger" ? "/ledger" : "/reservations"}?m=${date.slice(0, 7)}`;

export async function saveLedger(id: number | null, formData: FormData) {
  const row = parseLedgerForm(formData, (await loadPrices()).보증금);
  if (!row.date) throw new Error("날짜를 입력하세요");
  const supabase = await createClient();
  const q = id === null
    ? supabase.from("ledger").insert(row)
    : supabase.from("ledger").update(row).eq("id", id);
  const { error } = await q;
  if (error) throw new Error(error.message);
  redirect(backTo(formData.get("from") as string | null, row.date));
}

export async function deleteLedger(id: number, date: string, from: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect(backTo(from, date));
}

export async function setSettled(id: number, settled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").update({ settled }).eq("id", id);
  if (error) throw new Error(error.message);
}
