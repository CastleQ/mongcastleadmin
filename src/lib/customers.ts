import type { Ledger } from "./ledger.ts";

export const GRADES = ["일반", "단골", "그레이", "블랙"] as const;
export type Grade = (typeof GRADES)[number];
/** 경고를 띄우는 등급 (단골은 표시만, 경고 없음) */
export const WARN_GRADES = ["그레이", "블랙"] as const satisfies readonly Grade[];
export const isWarnGrade = (g: Grade | null | undefined) => (WARN_GRADES as readonly string[]).includes(g ?? "");

/** 등급 배지 색 */
export const GRADE_STYLE: Record<Grade, string> = {
  일반: "",
  단골: "bg-yellow-100 text-yellow-800",
  그레이: "bg-zinc-200 text-zinc-700",
  블랙: "bg-zinc-900 text-white",
};

/** 창고의 customers 표 (연락처 기준, 없으면 이름 기준) */
export type Customer = {
  key: string; // 정규화된 연락처 또는 "name:이름"
  name: string | null;
  phone: string | null;
  grade: Grade;
  memo: string | null;
};

/** 거래를 고객으로 묶은 결과 */
export type CustomerSummary = Customer & {
  visits: number;
  last_date: string;
  total_net: number;
  channels: string[];
  ledger_ids: number[];
};

/** 연락처 정규화: 숫자만. 010-1234-5678 → 01012345678 */
export function normalizePhone(p: string | null | undefined): string | null {
  const d = (p ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d : null;
}

/** 거래 한 건이 어느 고객 키에 속하는지. 연락처 > 이름 > 없음 */
export function customerKey(r: Pick<Ledger, "customer_phone" | "customer_name">): string | null {
  const phone = normalizePhone(r.customer_phone);
  if (phone) return phone;
  const name = r.customer_name?.trim();
  return name ? `name:${name}` : null;
}

/** 매출 거래들을 고객별로 묶고, 저장된 등급/메모를 붙임 */
export function summarize(rows: Ledger[], saved: Customer[]): CustomerSummary[] {
  const byKey = new Map<string, Customer>(saved.map((c) => [c.key, c]));
  const out = new Map<string, CustomerSummary>();
  for (const r of rows) {
    if (r.kind !== "매출") continue;
    const key = customerKey(r);
    if (!key) continue;
    const s = out.get(key);
    const counts = !r.cancelled; // 취소된 예약: 고객은 남기되 방문·금액·최근방문엔 안 셈
    if (s) {
      if (counts) {
        s.visits++;
        s.total_net += r.net;
        if (r.date > s.last_date || s.visits === 1) s.last_date = r.date;
      }
      s.ledger_ids.push(r.id);
      if (r.channel && !s.channels.includes(r.channel)) s.channels.push(r.channel);
      if (!s.name && r.customer_name) s.name = r.customer_name;
    } else {
      const c = byKey.get(key);
      out.set(key, {
        key,
        name: c?.name ?? r.customer_name ?? null,
        phone: normalizePhone(r.customer_phone),
        grade: c?.grade ?? "일반",
        memo: c?.memo ?? null,
        visits: counts ? 1 : 0,
        last_date: r.date, // 취소만 있는 고객은 그 날짜가 기준 (다음 방문이 생기면 덮어씀)
        total_net: counts ? r.net : 0,
        channels: r.channel ? [r.channel] : [],
        ledger_ids: [r.id],
      });
    }
  }
  return [...out.values()].sort((a, b) => b.last_date.localeCompare(a.last_date));
}
