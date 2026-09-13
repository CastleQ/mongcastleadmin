"use server";

import { createClient } from "@/lib/supabase/server";
import { GRADES, type Grade } from "@/lib/customers";

/** 등급·메모 저장 (없으면 새로 만듦) */
export async function saveCustomer(key: string, patch: { name?: string | null; phone?: string | null; grade?: Grade; memo?: string | null }) {
  if (patch.grade && !GRADES.includes(patch.grade)) throw new Error("알 수 없는 등급");
  const supabase = await createClient();
  const { error } = await supabase.from("customers").upsert({ key, ...patch, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}
