import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customerKey, GRADE_STYLE, type Customer } from "@/lib/customers";
import type { Ledger } from "@/lib/ledger";
import { LedgerTable } from "../../ledger/ledger-table";

const won = (n: number) => n.toLocaleString("ko-KR");

export default async function CustomerPage({ params }: PageProps<"/customers/[key]">) {
  const key = decodeURIComponent((await params).key);
  const supabase = await createClient();
  const [{ data: ledger }, { data: saved }] = await Promise.all([
    supabase.from("ledger").select("*").eq("kind", "매출").order("date", { ascending: false }),
    supabase.from("customers").select("*").eq("key", key).maybeSingle(),
  ]);
  const rows = ((ledger ?? []) as Ledger[]).filter((r) => customerKey(r) === key);
  if (rows.length === 0) notFound();
  const c: Customer | null = saved;
  const name = c?.name ?? rows.find((r) => r.customer_name)?.customer_name ?? "이름 없음";
  const phone = c?.phone ?? rows.find((r) => r.customer_phone)?.customer_phone ?? null;
  const grade = c?.grade ?? "일반";
  const total = rows.reduce((s, r) => s + r.net, 0);

  return (
    <>
      <div className="mb-1 text-sm text-zinc-500"><Link href="/customers" className="hover:underline">고객관리</Link> ›</div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">{name}</h2>
        {phone && <span className="text-zinc-500 tabular-nums">{phone}</span>}
        {grade !== "일반" && <span className={`rounded px-2 py-0.5 text-xs ${GRADE_STYLE[grade]}`}>{grade}</span>}
        <span className="text-sm text-zinc-500">방문 {rows.length}회 · 누적 실수령 {won(total)}원</span>
      </div>
      {c?.memo && <p className="mb-4 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">메모: {c.memo}</p>}
      <LedgerTable rows={rows} />
      <p className="mt-3 text-xs text-zinc-500">등급·메모는 <Link href="/customers" className="underline">고객관리 목록</Link>에서 바꿀 수 있어요.</p>
    </>
  );
}
