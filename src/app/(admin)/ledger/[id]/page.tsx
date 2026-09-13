import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Ledger } from "@/lib/ledger";
import { LedgerForm } from "../form";

export default async function EditLedgerPage({ params, searchParams }: PageProps<"/ledger/[id]">) {
  const { id } = await params;
  const { from } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("ledger").select("*").eq("id", Number(id)).maybeSingle();
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
      <LedgerForm row={row} from={typeof from === "string" ? from : undefined} />
    </>
  );
}
