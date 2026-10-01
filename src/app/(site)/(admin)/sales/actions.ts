"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** 월 순이익 목표 · 고정비 · 회수 대상 투자금 저장 (시나리오 없이 목표 하나) */
export async function saveTargets(formData: FormData) {
  const supabase = await createClient();
  const num = (k: string) => Number(String(formData.get(k) ?? "").replace(/[^0-9]/g, "")) || 0;
  const now = new Date().toISOString();
  const { error } = await supabase.from("settings").upsert([
    { key: "monthly_targets", value: num("monthly_target"), updated_at: now },
    { key: "investment", value: num("investment"), updated_at: now },
    { key: "fixed_costs", value: num("fixed_costs"), updated_at: now },
  ]);
  if (error) throw new Error(error.message);
  revalidatePath("/sales");
}
