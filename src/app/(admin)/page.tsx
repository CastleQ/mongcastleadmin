import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { monthGrid, monthInfo, packageKind, todayKST, type PackageKind, type Reservation } from "@/lib/calendar";

const COLOR: Record<PackageKind, string> = {
  낮: "bg-amber-100 text-amber-900",
  밤: "bg-indigo-100 text-indigo-900",
  전일: "bg-emerald-100 text-emerald-900",
  기타: "bg-zinc-200 text-zinc-800",
};
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export default async function CalendarPage({ searchParams }: PageProps<"/">) {
  const { m } = await searchParams;
  const today = todayKST();
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const info = monthInfo(month);

  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger")
    .select("id,date,package,channel,customer_name,content,headcount,settled")
    .eq("kind", "매출")
    .eq("category", "공간대여")
    .gte("date", info.start)
    .lte("date", info.end)
    .order("date");
  const rows: Reservation[] = data ?? [];
  const byDate = new Map<string, Reservation[]>();
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);

  const btn = "rounded border border-zinc-300 px-3 py-1 text-sm whitespace-nowrap hover:bg-zinc-50";

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold whitespace-nowrap"><span className="hidden sm:inline">예약 현황 · </span>{info.year}년 {info.month}월</h2>
        <div className="flex gap-1">
          <Link href={`/?m=${info.prev}`} className={btn}>‹<span className="hidden sm:inline"> 이전달</span></Link>
          <Link href="/" className={btn}>오늘</Link>
          <Link href={`/?m=${info.next}`} className={btn}><span className="hidden sm:inline">다음달 </span>›</Link>
        </div>
      </div>

      <div className="grid grid-cols-7 border-l border-t border-zinc-200 text-xs sm:text-sm">
        {DOW.map((d, i) => (
          <div key={d} className={`border-r border-b border-zinc-200 bg-zinc-50 py-2 text-center font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}`}>
            {d}
          </div>
        ))}
        {monthGrid(info.year, info.month).map((date, i) => {
          const dow = i % 7;
          const isToday = date === today;
          return (
            <div key={i} className={`min-h-16 sm:min-h-24 border-r border-b border-zinc-200 p-1 ${date ? "" : "bg-zinc-50"} ${isToday ? "bg-yellow-50" : ""}`}>
              {date && (
                <div className={`mb-1 text-right ${dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-zinc-500"} ${isToday ? "font-bold" : ""}`}>
                  {Number(date.slice(8))}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {(date ? byDate.get(date) ?? [] : []).map((r) => {
                  const kind = packageKind(r.package);
                  const who = r.customer_name || r.content || "";
                  return (
                    <div key={r.id} className={`rounded px-1 py-0.5 leading-tight truncate ${COLOR[kind]}`} title={`${r.package ?? ""} ${who} ${r.channel ?? ""}${r.settled ? "" : " (미정산)"}`}>
                      {!r.settled && <span className="text-red-600">● </span>}
                      <span className="font-semibold">{kind}</span>
                      <span className="hidden sm:inline"> {who}</span>
                      {r.channel && <span className="hidden lg:inline text-[10px] opacity-70"> · {r.channel.split(",")[0]}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
        {(Object.keys(COLOR) as PackageKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1"><span className={`inline-block h-3 w-3 rounded ${COLOR[k]}`} />{k}</span>
        ))}
        <span><span className="text-red-600">●</span> 미정산</span>
        <span className="text-zinc-400">이번 달 예약 {rows.length}건</span>
      </div>
    </>
  );
}
