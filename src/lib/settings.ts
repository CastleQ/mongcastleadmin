import { createClient } from "./supabase/server";
import { mergePrices, type Prices } from "./prices";

/** settings 표의 요금표. 없으면 기본값 */
export async function loadPrices(): Promise<Prices> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "prices").maybeSingle();
  return mergePrices(data?.value);
}
