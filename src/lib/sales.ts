import type { Ledger } from "./ledger.ts";
import { dayType } from "./holidays.ts";
export { dayType };

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

/**
 * "예약 포함" 보기: 오늘 이후의 미정산 매출(예약은 됐는데 입금·정산 전)은 그대로 들어온다고 가정 → 정산된 것처럼 바꿔
 * 같은 계산식(monthSales·dailyCumulative·bucketize…)에 넣음. 지난 날짜의 미정산은 그대로 제외 (노쇼·미입금일 수 있음)
 */
export const isReserved = (r: Ledger, today: string) => !r.settled && r.kind === "매출" && r.date >= today;
export function assumeReserved(rows: Ledger[], today: string): Ledger[] {
  return rows.map((r) => (isReserved(r, today) ? { ...r, settled: true } : r));
}

export type MonthStats = {
  actual: number; target: number; todayTarget: number;
  achievement: number; // 달성도 % (목표 대비)
  gap: number; gapPct: number; // 목표 대비 격차 (원, %)
  elapsed: number; days: number;
};

/** actual: 이달 실적(매출). today: YYYY-MM-DD. 지난달이면 전체 목표, 이번달이면 오늘까지 비례 목표 */
export function monthStats(actual: number, month: string, target: number, today: string): MonthStats {
  const days = daysIn(month);
  const elapsed = monthOf(today) === month ? Number(today.slice(8)) : monthOf(today) > month ? days : 0;
  const todayTarget = Math.round((target * elapsed) / days);
  const pct = (n: number) => (target ? Math.round((n / target) * 1000) / 10 : 0);
  return { actual, target, todayTarget, achievement: pct(actual), gap: actual - target, gapPct: pct(actual - target), elapsed, days };
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

export const byDayType = (rows: Ledger[]) => bucketize(rows, (r) => dayType(r.date), DAY_TYPES);
export const byContent = (rows: Ledger[]) => bucketize(rows, (r) => r.content?.trim() || "기타");
export const byChannel = (rows: Ledger[]) => bucketize(rows, (r) => r.channel?.trim() || "기타");
export const byPackage = (rows: Ledger[]) => bucketize(rows, (r) => r.package?.trim() || "기타");

/** 회수 대상 투자금 (시트 '사업계획서' 1. 초기투자금: 총액 − 보증금). settings 표에 없을 때 기본값 */
export const DEFAULT_INVESTMENT = 7_000_000;

export type Recovery = { total: number; investment: number; rate: number; remaining: number; months: number; monthsLeft: number | null };

/** 전 기간 누적 순이익(정산 기준)으로 투자금 회수 현황. 이번 달까지만 — 다음 달 월세·선입금처럼 미리 적어둔 건은 그 달이 와야 합산 */
export function recovery(rows: Ledger[], investment: number, today: string): Recovery {
  const done = rows.filter((r) => r.settled && monthOf(r.date) <= monthOf(today));
  const total = done.reduce((s, r) => s + r.net, 0);
  const first = done.map((r) => r.date).sort()[0];
  const months = first ? Math.max(1, (Number(today.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(today.slice(5, 7)) - Number(first.slice(5, 7)) + 1) : 1;
  const pace = total / months; // 월평균 순이익
  const remaining = Math.max(0, investment - total);
  return {
    total, investment,
    rate: investment ? Math.round((total / investment) * 1000) / 10 : 0,
    remaining,
    months,
    monthsLeft: remaining === 0 ? 0 : pace > 0 ? Math.ceil(remaining / pace) : null,
  };
}

/** 그 달의 일 단위 누적 매출 실수령 (정산 기준, 매입 제외). 거래 있는 날만 (day = 1..말일) */
export function dailyCumulative(rows: Ledger[], month: string): { day: number; cum: number }[] {
  const byDay = new Map<number, number>();
  for (const r of rows) {
    if (!r.settled || r.kind !== "매출" || !r.date.startsWith(month)) continue;
    const d = Number(r.date.slice(8));
    byDay.set(d, (byDay.get(d) ?? 0) + r.net);
  }
  let cum = 0;
  return [...byDay].sort((a, b) => a[0] - b[0]).map(([day, v]) => ({ day, cum: (cum += v) }));
}

/** 시트 '사업계획서' 2. 월 고정비 합계 (월세·관리비·통신·CCTV·수도·소모품·대출이자). settings에 없을 때 기본값 */
export const DEFAULT_FIXED_COSTS = 879_392;
/** 고정비에 이미 포함된 매입 항목 — 거래탭에 적어도 목표에 다시 더하지 않음 */
export const FIXED_CATEGORIES = ["월세기타", "광고비"];

/** 그 달 매출 실수령 합계 (정산 기준) */
export function monthSales(rows: Ledger[], month: string): number {
  return rows.filter((r) => r.settled && r.kind === "매출" && r.date.startsWith(month)).reduce((s, r) => s + r.net, 0);
}

/** 그 달 추가 매입 (정산 기준, 고정비 항목 제외). 목표 매출 = 순이익 목표 + 고정비 + 이 값 */
export function extraBuys(rows: Ledger[], month: string): number {
  return rows.filter((r) => r.settled && r.kind === "매입" && r.date.startsWith(month) && !FIXED_CATEGORIES.includes(r.category)).reduce((s, r) => s + r.amount, 0);
}

export type DayEntry = { id: number; name: string; content: string; amount: number; net: number };
/** 그 달 날짜별 매출 거래 요약 (정산 기준) — 그래프 점 위 작은 창용 */
export function dailyEntries(rows: Ledger[], month: string): Record<number, DayEntry[]> {
  const out: Record<number, DayEntry[]> = {};
  for (const r of rows) {
    if (!r.settled || r.kind !== "매출" || !r.date.startsWith(month)) continue;
    const d = Number(r.date.slice(8));
    (out[d] ??= []).push({ id: r.id, name: r.customer_name || "이름 없음", content: r.content || r.package || "", amount: r.amount, net: r.net });
  }
  return out;
}
