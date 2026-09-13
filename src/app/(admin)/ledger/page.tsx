import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { monthInfo, todayKST } from "@/lib/calendar";
import type { Ledger } from "@/lib/ledger";
import { LedgerTable } from "./ledger-table";

const won = (n: number) => n.toLocaleString("ko-KR");

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

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold whitespace-nowrap"><span className="hidden sm:inline">거래 · </span>{info.year}년 {info.month}월</h2>
        <div className="flex gap-1">
          <Link href={`/ledger?m=${info.prev}`} className={btn}>‹<span className="hidden sm:inline"> 이전달</span></Link>
          <Link href="/ledger" className={btn}>이번달</Link>
          <Link href={`/ledger?m=${info.next}`} className={btn}><span className="hidden sm:inline">다음달 </span>›</Link>
          <Link href="/ledger/new?from=ledger" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white whitespace-nowrap hover:bg-zinc-700">+ 추가</Link>
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
        <p className="py-10 text-center text-zinc-500">이 달엔 거래가 없어요. <Link href="/ledger/new?from=ledger" className="underline">첫 거래를 추가</Link>하세요.</p>
      ) : (
        <LedgerTable rows={rows} />
      )}
      <p className="mt-3 text-xs text-zinc-500">{rows.length}건 · 정산 {done.length}건 · 미정산 {pending.length}건 · 행을 누르면 수정, 헤더를 누르면 정렬</p>
    </>
  );
}
