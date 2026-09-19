import type { Ledger } from "./ledger.ts";

const norm = (s: string) => s.toLowerCase().replace(/[\s-]/g, ""); // 대소문자·공백·하이픈 무시 (전화번호 010-1234 = 0101234)

/** 거래 검색: 고객명·연락처·콘텐츠·채널·비고·패키지·항목에 검색어가 들어 있으면. 최신순 */
export function searchLedger(rows: Ledger[], q: string): Ledger[] {
  const needle = norm(q);
  if (!needle) return [];
  const fields = (r: Ledger) => [r.customer_name, r.customer_phone, r.content, r.channel, r.note, r.package, r.category];
  return rows
    .filter((r) => fields(r).some((f) => f && norm(f).includes(needle)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}
