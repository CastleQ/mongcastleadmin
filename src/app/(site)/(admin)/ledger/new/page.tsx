import { todayKST } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { LedgerForm } from "../form";
import type { Customer } from "@/lib/customers";

export default async function NewLedgerPage({ searchParams }: PageProps<"/ledger/new">) {
  const { date, from } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("*").neq("grade", "일반");
  const flagged: Customer[] = data ?? [];
  const d = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKST();
  return (
    <>
      <h2 className="mb-5 text-xl font-bold">거래 추가</h2>
      <LedgerForm defaultDate={d} from={typeof from === "string" ? from : undefined} flagged={flagged} />
    </>
  );
}
