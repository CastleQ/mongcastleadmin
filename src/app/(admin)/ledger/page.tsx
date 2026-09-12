import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { monthInfo, todayKST } from "@/lib/calendar";
import type { Ledger } from "@/lib/ledger";
import { SettledToggle } from "./settled-toggle";

const won = (n: number) => n.toLocaleString("ko-KR");
const HEAD = ["no.", "예약일", "구분", "항목", "고객명", "고객연락처", "패키지", "이용시간", "결제방식", "입금액", "수수료", "기타지출", "실수령", "정산여부"];
const NUM_COLS = new Set(["입금액", "수수료", "기타지출", "실수령"]);

export default async function LedgerListPage({ searchParams }: PageProps<"/ledger">) {
  const { m } = await searchParams;
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : todayKST().slice(0, 7);
  const info = monthInfo(month);

  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger").select("*")
    .gte("date", info.start).lte("date", info.end)
    .order("date", { ascending: false }).order("id", { ascending: false });
  const rows: Ledger[] = data ?? [];

  // 정산 완료된 것만 합계에 포함. 미정산은 '예정'으로 따로 표시
  const done = rows.filter((r) => r.settled);
  const sales = done.filter((r) => r.kind === "매출").reduce((s, r) => s + r.net, 0);
  const buys = done.filter((r) => r.kind === "매입").reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => !r.settled);
  const pendingNet = pending.reduce((s, r) => s + r.net, 0);
  const btn = "rounded border border-zinc-300 px-3 py-1 text-sm whitespace-nowrap hover:bg-zinc-50";
  const td = "px-2 py-2 whitespace-nowrap";

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold whitespace-nowrap"><span className="hidden sm:inline">거래 · </span>{info.year}년 {info.month}월</h2>
        <div className="flex gap-1">
          <Link href={`/ledger?m=${info.prev}`} className={btn}>‹<span className="hidden sm:inline"> 이전달</span></Link>
          <Link href="/ledger" className={btn}>이번달</Link>
          <Link href={`/ledger?m=${info.next}`} className={btn}><span className="hidden sm:inline">다음달 </span>›</Link>
          <Link href="/ledger/new" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white whitespace-nowrap hover:bg-zinc-700">+ 추가</Link>
        </div>
      </div>

      <dl className="mb-4 grid grid-cols-3 divide-x divide-zinc-200 rounded border border-zinc-200 text-center">
        <div className="p-3"><dt className="text-xs text-zinc-500">매출 실수령</dt><dd className="text-lg font-bold">{won(sales)}</dd></div>
        <div className="p-3"><dt className="text-xs text-zinc-500">매입</dt><dd className="text-lg font-bold text-red-600">−{won(buys)}</dd></div>
        <div className="p-3 bg-zinc-50"><dt className="text-xs text-zinc-500">순수익</dt><dd className={`text-lg font-bold ${sales - buys < 0 ? "text-red-600" : ""}`}>{won(sales - buys)}</dd></div>
      </dl>
      {pending.length > 0 && (
        <p className="mb-4 -mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          미정산 {pending.length}건은 합계에서 뺐어요 (정산되면 {pendingNet >= 0 ? "+" : ""}{won(pendingNet)}원 반영 예정)
        </p>
      )}

      {rows.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">이 달엔 거래가 없어요. <Link href="/ledger/new" className="underline">첫 거래를 추가</Link>하세요.</p>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-y border-zinc-200">
            <thead>
              <tr className="bg-zinc-50 text-xs text-zinc-500">
                {HEAD.map((h) => <th key={h} className={`${td} font-medium ${NUM_COLS.has(h) ? "text-right" : "text-left"}`}>{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((r, i) => {
                const sale = r.kind === "매출";
                const dim = r.settled ? "" : "text-zinc-400";
                const edit = `/ledger/${r.id}`;
                return (
                  <tr key={r.id} className={r.settled ? "hover:bg-zinc-50" : "bg-amber-50 hover:bg-amber-100"}>
                    <td className={`${td} text-zinc-400`}>{rows.length - i}</td>
                    <td className={td}><Link href={edit} className="underline decoration-zinc-300 hover:decoration-zinc-900">{r.date.slice(5).replace("-", "/")}</Link></td>
                    <td className={td}><span className={`rounded px-1.5 py-0.5 text-xs ${sale ? "bg-zinc-900 text-white" : "bg-red-50 text-red-700"}`}>{r.kind}</span></td>
                    <td className={td}>{r.category}</td>
                    <td className={td}><Link href={edit} className="font-medium hover:underline">{r.customer_name ?? "—"}</Link></td>
                    <td className={`${td} text-zinc-500`}>{r.customer_phone ?? ""}</td>
                    <td className={td}>{r.package ?? ""}</td>
                    <td className={td}>{r.hours ? `${r.hours}h` : ""}</td>
                    <td className={`${td} text-zinc-500`}>{r.payment_method ?? ""}</td>
                    <td className={`${td} text-right tabular-nums ${dim}`}>{won(r.amount)}</td>
                    <td className={`${td} text-right tabular-nums text-zinc-500`}>{r.fee ? won(r.fee) : ""}</td>
                    <td className={`${td} text-right tabular-nums text-zinc-500`}>{r.other_expense ? won(r.other_expense) : ""}</td>
                    <td className={`${td} text-right tabular-nums ${r.settled ? (sale ? "font-medium" : "text-red-600") : "text-zinc-400"}`}>{won(r.net)}</td>
                    <td className={td}><SettledToggle id={r.id} settled={r.settled} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-zinc-500">{rows.length}건 · 정산 {done.length}건 · 미정산 {pending.length}건 · 예약일이나 고객명을 누르면 수정</p>
    </>
  );
}
