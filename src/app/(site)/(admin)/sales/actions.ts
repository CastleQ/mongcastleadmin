"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SCENARIOS, type Targets } from "@/lib/sales";

/** 보수/기본/낙관 월 목표 순이익 저장 */
export async function saveTargets(formData: FormData) {
  const value = Object.fromEntries(
    SCENARIOS.map((s) => [s, Number(String(formData.get(s) ?? "").replace(/[^\d]/g, "")) || 0]),
  ) as Targets;
  const supabase = await createClient();
  const num = (k: string) => Number(String(formData.get(k) ?? "").replace(/[^0-9]/g, "")) || 0;
  const investment = num("investment"), fixedCosts = num("fixed_costs");
  const now = new Date().toISOString();
  const { error } = await supabase.from("settings").upsert([
    { key: "monthly_targets", value, updated_at: now },
    { key: "investment", value: investment, updated_at: now },
    { key: "fixed_costs", value: fixedCosts, updated_at: now },
  ]);
  if (error) throw new Error(error.message);
  revalidatePath("/sales");
}
