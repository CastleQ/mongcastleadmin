import type { Ledger } from "./ledger.ts";

/** 검색에 필요한 칸만 (목록 API·즉시 검색용). Ledger 전체도 그대로 들어감 */
export type SearchRow = Pick<Ledger, "id" | "date" | "kind" | "category" | "package" | "channel" | "customer_name" | "customer_phone" | "content" | "note" | "amount" | "settled">;

const norm = (s: string) => s.toLowerCase().replace(/[\s-]/g, ""); // 대소문자·공백·하이픈 무시 (전화번호 010-1234 = 0101234)

/** 거래 검색: 고객명·연락처·콘텐츠·채널·비고·패키지·항목에 검색어가 들어 있으면. 최신순 */
export function searchLedger<T extends SearchRow>(rows: T[], q: string): T[] {
  const needle = norm(q);
  if (!needle) return [];
  const fields = (r: SearchRow) => [r.customer_name, r.customer_phone, r.content, r.channel, r.note, r.package, r.category];
  return rows
    .filter((r) => fields(r).some((f) => f && norm(f).includes(needle)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}
