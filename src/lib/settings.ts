import { createClient } from "./supabase/server";
import { mergePrices, type Prices } from "./prices";

/** settings 표의 요금표. 없으면 기본값 */
export async function loadPrices(): Promise<Prices> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "prices").maybeSingle();
  return mergePrices(data?.value);
}

export type Contact = { phone: string; kakao: string };

/** 공개 달력용: public_settings 창(요금표 + 문의 연락처). 로그인 없이 읽힘 */
export async function loadPublicSettings(): Promise<{ prices: Prices; contact: Contact | null }> {
  const supabase = await createClient();
  const { data } = await supabase.from("public_settings").select("key,value");
  const rows = (data ?? []) as { key: string; value: Partial<Contact> }[];
  const c = rows.find((r) => r.key === "contact")?.value;
  const contact = c && typeof c.phone === "string" && typeof c.kakao === "string" ? { phone: c.phone, kakao: c.kakao } : null;
  return { prices: mergePrices(rows.find((r) => r.key === "prices")?.value), contact };
}
