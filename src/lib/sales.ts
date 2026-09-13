import type { Ledger } from "./ledger.ts";

export const SCENARIOS = ["보수", "기본", "낙관"] as const;
export type Scenario = (typeof SCENARIOS)[number];
export type Targets = Record<Scenario, number>;
/** 시트 '사업계획서' 3. 월 손익분석의 월순이익 (settings 표에 없을 때 기본값) */
export const DEFAULT_TARGETS: Targets = { 보수: 419008, 기본: 685408, 낙관: 1340608 };

const monthOf = (d: string) => d.slice(0, 7);
const daysIn = (m: string) => { const [y, mo] = m.split("-").map(Number); return new Date(y, mo, 0).getDate(); };

/** 정산 완료 기준 한 달 순이익 = 매출 실수령 − 매입 */
export function monthNet(rows: Ledger[], month: string): number {
  return rows.filter((r) => r.settled && monthOf(r.date) === month).reduce((s, r) => s + r.net, 0);
}

export type MonthStats = {
  net: number; target: number; todayTarget: number;
  achievement: number; // 달성도 % (목표 대비)
  gap: number; gapPct: number; // 목표 대비 격차 (원, %)
  elapsed: number; days: number;
};

/** today: YYYY-MM-DD. 지난달이면 전체 목표, 이번달이면 오늘까지 비례 목표 */
export function monthStats(rows: Ledger[], month: string, target: number, today: string): MonthStats {
  const net = monthNet(rows, month);
  const days = daysIn(month);
  const elapsed = monthOf(today) === month ? Number(today.slice(8)) : monthOf(today) > month ? days : 0;
  const todayTarget = Math.round((target * elapsed) / days);
  const pct = (n: number) => (target ? Math.round((n / target) * 1000) / 10 : 0);
  return { net, target, todayTarget, achievement: pct(net), gap: net - target, gapPct: pct(net - target), elapsed, days };
}

/** 최근 n개월 (선택 달 포함, 오래된 순) 순이익 */
export function monthlySeries(rows: Ledger[], month: string, n = 6): { month: string; net: number }[] {
  const [y, mo] = month.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, mo - 1 - (n - 1 - i), 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { month: m, net: monthNet(rows, m) };
  });
}

export type Bucket = { label: string; count: number; total: number; avg: number };

function bucketize(rows: Ledger[], keyOf: (r: Ledger) => string | null, order?: string[]): Bucket[] {
  const map = new Map<string, { count: number; total: number }>();
  for (const r of rows) {
    if (r.kind !== "매출" || !r.settled) continue;
    const k = keyOf(r);
    if (!k) continue;
    const b = map.get(k) ?? { count: 0, total: 0 };
    b.count++; b.total += r.net;
    map.set(k, b);
  }
  const out = [...map].map(([label, b]) => ({ label, ...b, avg: Math.round(b.total / b.count) }));
  return order
    ? order.filter((o) => map.has(o)).map((o) => out.find((b) => b.label === o)!)
    : out.sort((a, b) => b.total - a.total);
}

export const DAY_TYPES = ["평일", "금요일", "주말"];
/** 월~목 평일 / 금 / 토·일 주말 (예약일 기준) */
export function dayType(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 5 ? "금요일" : dow === 0 || dow === 6 ? "주말" : "평일";
}

export const byDayType = (rows: Ledger[]) => bucketize(rows, (r) => dayType(r.date), DAY_TYPES);
export const byContent = (rows: Ledger[]) => bucketize(rows, (r) => r.content?.trim() || "기타");
export const byChannel = (rows: Ledger[]) => bucketize(rows, (r) => r.channel?.trim() || "기타");
export const byPackage = (rows: Ledger[]) => bucketize(rows, (r) => r.package?.trim() || "기타");
