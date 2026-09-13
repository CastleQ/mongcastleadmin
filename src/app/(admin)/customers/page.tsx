import { createClient } from "@/lib/supabase/server";
import { summarize, type Customer } from "@/lib/customers";
import type { Ledger } from "@/lib/ledger";
import { CustomerTable } from "./customer-table";

export default async function CustomersPage() {
  const supabase = await createClient();
  const [{ data: ledger }, { data: saved }] = await Promise.all([
    supabase.from("ledger").select("*").eq("kind", "매출").order("date"),
    supabase.from("customers").select("*"),
  ]);
  const rows = summarize((ledger ?? []) as Ledger[], (saved ?? []) as Customer[]);
  const flagged = rows.filter((c) => c.grade !== "일반").length;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">고객관리</h2>
        <span className="text-sm text-zinc-500">{rows.length}명{flagged > 0 && ` · 주의 ${flagged}명`}</span>
      </div>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">아직 고객이 없어요. 거래에 고객명이나 연락처를 적으면 여기에 자동으로 모입니다.</p>
      ) : (
        <CustomerTable rows={rows} />
      )}
      <p className="mt-3 text-xs text-zinc-500">거래의 연락처(없으면 이름)가 같으면 한 고객으로 묶여요. 등급을 그레이·블랙으로 바꾸면 거래 입력·문자 화면에 경고가 떠요. 행을 누르면 이용 이력.</p>
    </>
  );
}
