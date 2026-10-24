import { todayKST } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { LedgerForm } from "../form";
import type { Customer } from "@/lib/customers";
import { loadPrices } from "@/lib/settings";
import { PACKAGES } from "@/lib/ledger";
import { parsePrefill } from "@/lib/prefill";

export default async function NewLedgerPage({ searchParams }: PageProps<"/ledger/new">) {
  const sp = await searchParams;
  const { date, from, package: pkg } = sp;
  // 응대 템플릿에서 '예약현황에 바로 추가' 로 넘어오면 날짜·패키지·금액·채널 등이 주소에 담겨 온다
  const prefill = parsePrefill(sp);
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("*").neq("grade", "일반");
  const flagged: Customer[] = data ?? [];
  const prices = await loadPrices();
  const d = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKST();
  return (
    <>
      <h2 className="mb-5 text-xl font-bold">거래 추가</h2>
      <LedgerForm defaultDate={d} defaultPackage={typeof pkg === "string" && (PACKAGES as readonly string[]).includes(pkg) ? pkg : undefined} from={typeof from === "string" ? from : undefined} flagged={flagged} prices={prices} prefill={prefill} />
    </>
  );
}
