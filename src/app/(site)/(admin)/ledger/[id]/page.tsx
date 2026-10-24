import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Ledger } from "@/lib/ledger";
import { LedgerForm } from "../form";
import type { Customer } from "@/lib/customers";
import { loadPrices } from "@/lib/settings";
import { parsePrefill } from "@/lib/prefill";

export default async function EditLedgerPage({ params, searchParams }: PageProps<"/ledger/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { from } = sp;
  // 문자 만들기에서 '예약현황에 반영' 으로 돌아오면 문구에서 고른 값이 주소에 담겨 온다.
  // 폼에 미리 채워 보여주기만 하고, 저장은 사장님이 '변경 저장'을 눌러야 된다
  const prefill = parsePrefill(sp);
  const supabase = await createClient();
  const [{ data }, { data: fl }] = await Promise.all([
    supabase.from("ledger").select("*").eq("id", Number(id)).maybeSingle(),
    supabase.from("customers").select("*").neq("grade", "일반"),
  ]);
  const flagged: Customer[] = fl ?? [];
  const prices = await loadPrices();
  const row: Ledger | null = data;
  if (!row) notFound();
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {row.kind === "매출" ? "예약" : "거래"} 수정
          <span className="ml-2 text-sm font-normal text-zinc-500">{row.date}</span>
        </h2>
        {row.kind === "매출" && (
          <Link href={`/templates?ledger=${row.id}`} className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">✉ 문자 만들기</Link>
        )}
      </div>
      <LedgerForm row={row} from={typeof from === "string" ? from : undefined} flagged={flagged} prices={prices} prefill={prefill} />
    </>
  );
}
