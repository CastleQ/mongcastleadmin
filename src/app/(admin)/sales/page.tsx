import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { monthInfo, todayKST } from "@/lib/calendar";
import type { Ledger } from "@/lib/ledger";
import { DEFAULT_INVESTMENT, DEFAULT_TARGETS, SCENARIOS, byChannel, byContent, byDayType, byPackage, dailyCumulative, monthStats, recovery, type Bucket, type Scenario, type Targets } from "@/lib/sales";
import { DailyChart } from "./daily-chart";
import { saveTargets } from "./actions";

const won = (n: number) => n.toLocaleString("ko-KR");
const signed = (n: number) => (n > 0 ? "+" : "") + won(n);

export default async function SalesPage({ searchParams }: PageProps<"/sales">) {
  const { m, s } = await searchParams;
  const today = todayKST();
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const scenario: Scenario = SCENARIOS.includes(s as Scenario) ? (s as Scenario) : "기본";
  const info = monthInfo(month);

  const supabase = await createClient();
  const [{ data: ledger }, { data: setting }, { data: inv }] = await Promise.all([
    supabase.from("ledger").select("*").order("date"),
    supabase.from("settings").select("value").eq("key", "monthly_targets").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "investment").maybeSingle(),
  ]);
  const rows: Ledger[] = ledger ?? [];
  const targets: Targets = { ...DEFAULT_TARGETS, ...((setting?.value as Partial<Targets>) ?? {}) };
  const st = monthStats(rows, month, targets[scenario], today);
  const investment = typeof inv?.value === "number" ? inv.value : DEFAULT_INVESTMENT;
  const rec = recovery(rows, investment, today);
  const daily = dailyCumulative(rows, month);
  const good = st.net >= st.todayTarget;

  const btn = "rounded border border-zinc-300 px-3 py-1 text-sm whitespace-nowrap hover:bg-zinc-50";
  const q = (mm: string, ss: Scenario) => `/sales?m=${mm}&s=${ss}`;

  // 진행 막대: 낙관 목표를 100%로
  const scaleMax = Math.max(targets.낙관, st.net, 1);
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / scaleMax) * 100))}%`;


  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold whitespace-nowrap"><span className="hidden sm:inline">매출현황 · </span>{info.year}년 {info.month}월</h2>
        <div className="flex flex-wrap gap-1">
          <Link href={q(info.prev, scenario)} className={btn}>‹<span className="hidden sm:inline"> 이전달</span></Link>
          <Link href={q(today.slice(0, 7), scenario)} className={btn}>이번달</Link>
          <Link href={q(info.next, scenario)} className={btn}><span className="hidden sm:inline">다음달 </span>›</Link>
          <a href="/api/export" download className={btn} title="거래 전체를 CSV(엑셀)로 내려받기 — 백업용">CSV 백업</a>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-zinc-500">시나리오</span>
        <div className="inline-flex overflow-hidden rounded border border-zinc-900">
          {SCENARIOS.map((sc) => (
            <Link key={sc} href={q(month, sc)} className={`px-3 py-1 ${sc === scenario ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`}>{sc}</Link>
          ))}
        </div>
        <span className="text-zinc-400">월 목표 {won(targets[scenario])}원</span>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-zinc-200 bg-zinc-200 sm:grid-cols-5">
        <Tile label="목표 순이익" value={`${won(st.target)}원`} />
        <Tile label="현재 순이익 (정산 기준)" value={`${won(st.net)}원`} strong />
        <Tile label="달성도" value={`${st.achievement}%`} tone={st.achievement >= 100 ? "good" : st.achievement >= 50 ? "" : "bad"} />
        <Tile label="목표 대비 격차" value={`${signed(st.gap)}원`} sub={`${signed(st.gapPct)}%`} tone={st.gap >= 0 ? "good" : "bad"} />
        <Tile label={st.elapsed < st.days ? `오늘자 목표 (${st.elapsed}/${st.days}일)` : "오늘자 목표 (마감)"} value={`${won(st.todayTarget)}원`} sub={good ? "▲ 페이스 앞섬" : "▼ 페이스 뒤짐"} tone={good ? "good" : "bad"} />
      </dl>

      {/* 진행 막대: 보수/기본/낙관 눈금 */}
      <div className="mb-6">
        <div className="relative h-5 rounded bg-zinc-100">
          <div className={`h-5 rounded ${st.net >= 0 ? "bg-zinc-900" : "bg-red-300"}`} style={{ width: pct(st.net) }} />
          {SCENARIOS.map((sc) => (
            <div key={sc} className="absolute top-0 h-5 border-l border-zinc-400" style={{ left: pct(targets[sc]) }}>
              <span className={`absolute -top-5 -translate-x-1/2 whitespace-nowrap text-[11px] ${sc === scenario ? "font-bold text-zinc-900" : "text-zinc-400"}`}>{sc}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-zinc-500">{won(st.net)}원 / 낙관 {won(targets.낙관)}원 기준 {Math.round((st.net / scaleMax) * 100)}%</p>
      </div>

      {/* 이달 일별 누적 */}
      <section className="mb-6 rounded border border-zinc-200 p-3">
        <h3 className="mb-2 text-sm font-medium">이달 누적 순이익 (일 단위, 정산 기준)</h3>
        <DailyChart points={daily} days={st.days} elapsed={st.elapsed} target={st.target} scenario={scenario} />
      </section>

      {/* 투자금 회수 */}
      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded border border-zinc-200 bg-zinc-200 sm:grid-cols-4">
        <Tile label="회수 대상 투자금" value={`${won(rec.investment)}원`} />
        <Tile label={`누적 순이익 (${rec.months}개월)`} value={`${won(rec.total)}원`} strong />
        <Tile label="회수율" value={`${rec.rate}%`} sub={`남은 금액 ${won(rec.remaining)}원`} tone={rec.rate >= 100 ? "good" : ""} />
        <Tile label="예상 회수까지" value={rec.monthsLeft === 0 ? "회수 완료" : rec.monthsLeft === null ? "—" : `약 ${rec.monthsLeft}개월`} sub={rec.monthsLeft === null ? "월평균 순이익이 0 이하" : `월평균 ${won(Math.round(rec.total / rec.months))}원 기준`} />
      </dl>

      {/* 누적 분석 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown title="요일별 평균 매출 (누적, 정산 기준)" rows={byDayType(rows)} showAvg />
        <Breakdown title="콘텐츠별 누적 매출" rows={byContent(rows)} />
        <Breakdown title="채널별 누적 매출" rows={byChannel(rows)} />
        <Breakdown title="패키지별 누적 매출" rows={byPackage(rows)} />
      </div>

      <details className="mt-6 max-w-xl rounded border border-zinc-200">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm text-zinc-600">목표 수정 (월 순이익 · 투자금)</summary>
        <form action={saveTargets} className="flex flex-wrap items-end gap-3 border-t border-zinc-200 p-3">
          {SCENARIOS.map((sc) => (
            <label key={sc} className="text-sm">
              <span className="mb-1 block text-zinc-600">{sc}</span>
              <input name={sc} type="text" inputMode="numeric" defaultValue={targets[sc]} className="w-32 rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none" />
            </label>
          ))}
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">회수 대상 투자금</span>
            <input name="investment" type="text" inputMode="numeric" defaultValue={investment} className="w-32 rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none" />
          </label>
          <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700">목표 저장</button>
        </form>
      </details>
    </>
  );
}

function Tile({ label, value, sub, strong, tone = "" }: { label: string; value: string; sub?: string; strong?: boolean; tone?: "good" | "bad" | "" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-600" : "";
  return (
    <div className="bg-white p-3">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className={`mt-0.5 text-lg font-bold tabular-nums ${strong ? "" : color}`}>{value}</dd>
      {sub && <dd className={`text-xs ${color}`}>{sub}</dd>}
    </div>
  );
}

function Breakdown({ title, rows, showAvg }: { title: string; rows: Bucket[]; showAvg?: boolean }) {
  const max = Math.max(...rows.map((r) => (showAvg ? r.avg : r.total)), 1);
  return (
    <section className="rounded border border-zinc-200 p-3">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400">정산된 매출이 아직 없어요.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => {
              const v = showAvg ? r.avg : r.total;
              return (
                <tr key={r.label}>
                  <td className="w-24 py-1.5 pr-2 whitespace-nowrap">{r.label}</td>
                  <td className="py-1.5"><div className="h-3 rounded bg-zinc-800" style={{ width: `${(v / max) * 100}%` }} title={`${won(v)}원`} /></td>
                  <td className="w-28 py-1.5 pl-2 text-right tabular-nums whitespace-nowrap">{won(v)}원</td>
                  <td className="w-12 py-1.5 pl-2 text-right text-xs text-zinc-400 whitespace-nowrap">{r.count}건</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
