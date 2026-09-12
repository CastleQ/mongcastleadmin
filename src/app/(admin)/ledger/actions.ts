"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseLedgerForm } from "@/lib/ledger";

export async function saveLedger(id: number | null, formData: FormData) {
  const row = parseLedgerForm(formData);
  if (!row.date) throw new Error("날짜를 입력하세요");
  const supabase = await createClient();
  const q = id === null
    ? supabase.from("ledger").insert(row)
    : supabase.from("ledger").update(row).eq("id", id);
  const { error } = await q;
  if (error) throw new Error(error.message);
  redirect(`/?m=${row.date.slice(0, 7)}`);
}

export async function deleteLedger(id: number, date: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect(`/?m=${date.slice(0, 7)}`);
}

export async function setSettled(id: number, settled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").update({ settled }).eq("id", id);
  if (error) throw new Error(error.message);
}
