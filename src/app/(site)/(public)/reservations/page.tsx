import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { loadPublicSettings } from "@/lib/settings";
import { monthGrid, monthInfo, packageKind, todayKST, type PackageKind, type Reservation } from "@/lib/calendar";
import { customerKey, type Customer } from "@/lib/customers";
import { HOLIDAYS } from "@/lib/holidays";
import { SLOTS, slotStates } from "@/lib/availability";
import { PublicCells } from "./public-cells";

const COLOR: Record<PackageKind, string> = {
  낮: "bg-amber-100 text-amber-900",
  밤: "bg-indigo-100 text-indigo-900",
  전일: "bg-emerald-100 text-emerald-900",
  기타: "bg-zinc-200 text-zinc-800",
};
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
/** 슬롯 타일: 폰=세로 3열(세로쓰기), PC=가로 3행 */
const SLOT = "flex h-12 flex-1 items-center justify-center rounded text-[10px] leading-tight [writing-mode:vertical-rl] sm:block sm:h-auto sm:truncate sm:px-1 sm:py-0.5 sm:text-xs sm:[writing-mode:horizontal-tb]";

/** 누구나 보는 달력. 관리자는 고객명·미정산·수정 링크까지, 그 외는 낮·밤·전일 빈자리 + 문의 창 */
export default async function CalendarPage({ searchParams }: PageProps<"/reservations">) {
  const { m } = await searchParams;
  const today = todayKST();
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const info = monthInfo(month);
  const { isAdmin } = await getSession();
  const supabase = await createClient();
  const cells = monthGrid(info.year, info.month);
  const btn = "rounded border border-zinc-300 px-3 py-1 text-sm whitespace-nowrap hover:bg-zinc-50";

  const header = (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg sm:text-xl font-bold whitespace-nowrap"><span className="hidden sm:inline">예약 현황 · </span>{info.year}년 {info.month}월</h2>
      <div className="flex gap-1">
        <Link href={`/reservations?m=${info.prev}`} className={btn}>‹<span className="hidden sm:inline"> 이전달</span></Link>
        <Link href="/reservations" className={btn}>오늘</Link>
        <Link href={`/reservations?m=${info.next}`} className={btn}><span className="hidden sm:inline">다음달 </span>›</Link>
        {isAdmin && <Link href="/ledger/new" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white whitespace-nowrap hover:bg-zinc-700">+ 추가</Link>}
      </div>
    </div>
  );
  const dowRow = DOW.map((d, i) => (
    <div key={d} className={`border-r border-b border-zinc-200 bg-zinc-50 py-2 text-center font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}`}>{d}</div>
  ));

  if (!isAdmin) {
    const [{ data }, { prices, contact }] = await Promise.all([
      supabase.from("public_reservations").select("date,package").gte("date", info.start).lte("date", info.end),
      loadPublicSettings(),
    ]);
    const byDate: Record<string, (string | null)[]> = {};
    for (const r of (data ?? []) as Pick<Reservation, "date" | "package">[]) (byDate[r.date] ??= []).push(r.package);
    return (
      <>
        {header}
        <div className="grid grid-cols-7 border-l border-t border-zinc-200 text-xs sm:text-sm">
          {dowRow}
          <PublicCells cells={cells} byDate={byDate} today={today} prices={prices} contact={contact} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-100" />가능 (눌러서 문의)</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-rose-100" />예약됨</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-zinc-100" />불가</span>
          <span className="text-zinc-400">전일은 낮·밤이 모두 비어 있을 때만 가능해요.</span>
        </div>
      </>
    );
  }

  const { data } = await supabase
    .from("ledger")
    .select("id,date,package,channel,customer_name,customer_phone,content,headcount,settled")
    .eq("kind", "매출")
    .eq("category", "대여")
    .gte("date", info.start)
    .lte("date", info.end)
    .order("date");
  const rows: Reservation[] = data ?? [];
  const { data: fl } = await supabase.from("customers").select("*").neq("grade", "일반");
  const flagged = new Map<string, Customer>(((fl ?? []) as Customer[]).map((c) => [c.key, c]));
  const byDate = new Map<string, Reservation[]>();
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);

  return (
    <>
      {header}
      <div className="grid grid-cols-7 border-l border-t border-zinc-200 text-xs sm:text-sm">
        {dowRow}
        {cells.map((date, i) => {
          const dow = i % 7;
          const isToday = date === today;
          const holiday = date ? HOLIDAYS[date] : undefined;
          return (
            <div key={i} className={`min-h-16 sm:min-h-24 border-r border-b border-zinc-200 p-1 ${date ? "" : "bg-zinc-50"} ${isToday ? "bg-yellow-50" : ""}`}>
              {date && (
                <Link href={`/ledger/new?date=${date}`} title="이 날짜에 추가" className={`mb-1 flex items-baseline justify-between gap-1 hover:underline ${dow === 0 || holiday ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-zinc-500"} ${isToday ? "font-bold" : ""}`}>
                  <span className="hidden truncate text-[10px] font-normal sm:inline">{holiday ?? ""}</span>
                  <span>{Number(date.slice(8))}</span>
                </Link>
              )}
              {date && (() => {
                const dayRows = byDate.get(date) ?? [];
                const states = slotStates(dayRows.map((r) => r.package));
                const chip = (r: Reservation) => {
                  const kind = packageKind(r.package);
                  const who = r.customer_name || r.content || "";
                  const warn = flagged.get(customerKey(r) ?? "");
                  return (
                    <Link key={r.id} href={`/ledger/${r.id}`} className={`${SLOT} hover:opacity-80 ${COLOR[kind]}`} title={`${r.package ?? ""} ${who} ${r.channel ?? ""}${r.settled ? "" : " (미정산)"}${warn ? ` ⚠ ${warn.grade} 고객` : ""}`}>
                      {warn && <span className={warn.grade === "블랙" ? "text-red-600" : "text-zinc-700"}>⚠ </span>}
                      {!r.settled && <span className="text-red-600">● </span>}
                      <span className="font-semibold">{kind}</span>
                      <span className="hidden sm:inline"> {who}</span>
                      {r.channel && <span className="hidden lg:inline text-[10px] opacity-70"> · {r.channel.split(",")[0]}</span>}
                    </Link>
                  );
                };
                return (
                  <>
                    <div className="flex flex-row gap-0.5 sm:flex-col">
                      {SLOTS.map((s) => {
                        const booked = dayRows.filter((r) => packageKind(r.package) === s);
                        if (booked.length) return <div key={s} className="flex flex-1 flex-col gap-0.5">{booked.map(chip)}</div>;
                        if (states[s] === "가능") return <Link key={s} href={`/ledger/new?date=${date}`} title={`${s} 예약 추가`} className={`${SLOT} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}><span className="font-semibold">{s}</span><span className="hidden sm:inline"> 가능</span></Link>;
                        return <div key={s} className={`${SLOT} bg-zinc-100 text-zinc-400`}><span className="font-semibold">{s}</span><span className="hidden sm:inline"> {states[s]}</span></div>;
                      })}
                    </div>
                    {dayRows.filter((r) => packageKind(r.package) === "기타").map(chip)}
                  </>
                );
              })()}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
        {(Object.keys(COLOR) as PackageKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1"><span className={`inline-block h-3 w-3 rounded ${COLOR[k]}`} />{k}</span>
        ))}
        <span><span className="text-red-600">●</span> 미정산</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-emerald-200 bg-emerald-50" />가능 (눌러서 추가)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-zinc-100" />불가</span>
        <span className="text-zinc-400">{rows.length ? `이번 달 예약 ${rows.length}건` : "이 달엔 예약이 없어요. 날짜를 눌러 추가하세요."}</span>
      </div>
    </>
  );
}
