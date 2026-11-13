"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { customerKey, normalizePhone, GRADES, type Customer, type Grade } from "@/lib/customers";
import { pushLedgerRow } from "@/lib/calendar-export";

/** 등급·메모 저장 (없으면 새로 만듦) */
export async function saveCustomer(key: string, patch: { name?: string | null; phone?: string | null; grade?: Grade; memo?: string | null }) {
  if (patch.grade && !GRADES.includes(patch.grade)) throw new Error("알 수 없는 등급");
  const supabase = await createClient();
  const { error } = await supabase.from("customers").upsert({ key, ...patch, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

/**
 * 연락처 없이 이름으로만 묶인 고객에게 연락처를 채운다.
 * 그 고객의 거래 중 연락처 칸이 '비어 있는' 건에만 넣는다 (적혀 있던 값은 건드리지 않는다).
 * 고객은 이제 연락처로 묶이므로, 등급·메모를 새 키로 옮겨 적는다 (옛 이름 키 기록은 지우지 않고 둔다).
 */
export async function fillCustomerPhone(key: string, phone: string): Promise<string | null> {
  // 오류는 던지지 않고 글로 돌려준다 — 배포판에선 던진 오류 문구가 가려져 사장님께 안 보인다
  const p = phone.trim();
  const norm = normalizePhone(p);
  if (!norm) return "연락처는 숫자 9자리 이상이어야 해요";
  if (!key.startsWith("name:")) return "이미 연락처가 있는 고객이에요";
  const supabase = await createClient();

  const { data, error } = await supabase.from("ledger").select("id, customer_name, customer_phone").eq("kind", "매출");
  if (error) return error.message;
  const ids = (data ?? []).filter((r) => customerKey(r) === key && !r.customer_phone?.trim()).map((r) => r.id as number);
  if (ids.length === 0) return "연락처가 빈 거래가 없어요";
  const up = await supabase.from("ledger").update({ customer_phone: p }).in("id", ids);
  if (up.error) return up.error.message;

  const { data: saved } = await supabase.from("customers").select("*").in("key", [key, norm]);
  const old = (saved as Customer[] | null)?.find((c) => c.key === key);
  const exists = saved?.some((c) => c.key === norm);
  if (old && !exists) await saveCustomer(norm, { name: old.name, phone: p, grade: old.grade, memo: old.memo });

  after(async () => { for (const id of ids) await pushLedgerRow(id); }); // 구글 일정 설명의 연락처도 맞춘다 — 화면을 막지 않게
  return null;
}
