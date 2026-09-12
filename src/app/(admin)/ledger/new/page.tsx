import { todayKST } from "@/lib/calendar";
import { LedgerForm } from "../form";

export default async function NewLedgerPage({ searchParams }: PageProps<"/ledger/new">) {
  const { date } = await searchParams;
  const d = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKST();
  return (
    <>
      <h2 className="mb-5 text-xl font-bold">거래 추가</h2>
      <LedgerForm defaultDate={d} />
    </>
  );
}
