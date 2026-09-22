import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SearchRow } from "@/lib/search";

/**
 * 검색창이 처음 열릴 때 한 번 받아가는 거래 목록 (검색에 필요한 칸만).
 * 한 건 ≈ 150바이트 — 2년치 1,200건이면 180KB 정도라 브라우저에서 거르는 게 서버 왕복보다 빠름.
 * ponytail: 건수가 5,000을 넘으면(수년 뒤) 여기서 q를 받아 DB에서 검색하도록 바꿀 것
 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger")
    .select("id,date,kind,category,package,channel,customer_name,customer_phone,content,note,amount,settled")
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: (data ?? []) as SearchRow[] });
}
