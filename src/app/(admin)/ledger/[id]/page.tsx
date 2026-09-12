import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Ledger } from "@/lib/ledger";
import { LedgerForm } from "../form";

export default async function EditLedgerPage({ params }: PageProps<"/ledger/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("ledger").select("*").eq("id", Number(id)).maybeSingle();
  const row: Ledger | null = data;
  if (!row) notFound();
  return (
    <>
      <h2 className="mb-5 text-xl font-bold">
        {row.kind === "매출" ? "예약" : "거래"} 수정
        <span className="ml-2 text-sm font-normal text-zinc-500">{row.date}</span>
      </h2>
      <LedgerForm row={row} />
    </>
  );
}
