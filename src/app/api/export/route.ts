import { createClient } from "@/lib/supabase/server";

const COLS = ["id", "date", "kind", "category", "channel", "inquiry_date", "customer_name", "customer_phone", "content", "headcount", "package", "hours", "settled", "amount", "fee", "other_expense", "net", "payment_method", "note"] as const;
const HEAD = ["번호", "예약일", "구분", "항목", "채널", "인입일", "고객명", "연락처", "콘텐츠", "인원", "패키지", "이용시간", "정산", "입금액", "수수료", "기타지출", "실수령", "결제방식", "비고"];

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : typeof v === "boolean" ? (v ? "Y" : "N") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** 거래 전체를 CSV로. 로그인 쿠키 + RLS로 본인만 받을 수 있음 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ledger").select(COLS.join(",")).order("date").order("id");
  if (error) return new Response(error.message, { status: 500 });
  const rows = (data ?? []) as unknown as Record<(typeof COLS)[number], unknown>[];
  const lines = [HEAD.join(","), ...rows.map((r) => COLS.map((c) => cell(r[c])).join(","))];
  const csv = "﻿" + lines.join("\r\n"); // BOM: 엑셀에서 한글 깨짐 방지
  const date = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mongcastle-ledger-${date}.csv"`,
    },
  });
}
