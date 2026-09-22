import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { loadPublicSettings } from "@/lib/settings";
import { todayKST, type Reservation } from "@/lib/calendar";
import type { Customer } from "@/lib/customers";
import { Calendar } from "./calendar";
import { SearchBox } from "./search-box";
import { LedgerTable } from "@/app/(site)/(admin)/ledger/ledger-table";
import { searchLedger } from "@/lib/search";
import type { Ledger } from "@/lib/ledger";

/**
 * 누구나 보는 달력. 관리자는 고객명·미정산·수정 링크까지, 그 외는 낮·밤·전일 빈자리 + 문의 창.
 * 전 기간 데이터를 한 번에 내려주고 달 이동은 브라우저에서 → 달을 넘겨도 서버 왕복이 없음.
 * ponytail: 한 건 ≈ 150바이트(지금 8KB) — 5,000건 넘으면 앞뒤 1년만 내려줄 것
 */
export default async function CalendarPage({ searchParams }: PageProps<"/reservations">) {
  const { m, q, hl } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const highlightId = typeof hl === "string" && /^\d+$/.test(hl) ? Number(hl) : null; // 검색 결과에서 넘어온 칩
  const today = todayKST();
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const { isAdmin } = await getSession();
  const supabase = await createClient();

  if (query && isAdmin) {
    const { data } = await supabase.from("ledger").select("*").order("date", { ascending: false });
    const hits = searchLedger((data ?? []) as Ledger[], query);
    return (
      <>
        <h2 className="mb-4 text-lg font-bold sm:text-xl">예약 검색</h2>
        <SearchBox initial={query} />
        <p className="mb-2 text-sm text-zinc-500">&quot;{query}&quot; 검색 결과 {hits.length}건 · 행을 누르면 그 달 달력에서 강조해 보여줘요</p>
        {hits.length === 0
          ? <p className="py-10 text-center text-zinc-500">맞는 거래가 없어요.</p>
          : <LedgerTable rows={hits} rowLink="calendar" />}
      </>
    );
  }

  if (!isAdmin) {
    const [{ data }, { prices, contact }] = await Promise.all([
      supabase.from("public_reservations").select("date,package").order("date"),
      loadPublicSettings(),
    ]);
    // 손님 화면은 날짜·패키지만 쓰므로 나머지 칸은 빈 값으로 채워 같은 달력 부품에 넘김
    const rows: Reservation[] = ((data ?? []) as Pick<Reservation, "date" | "package">[]).map((r, i) => ({
      ...r, id: -(i + 1), kind: "매출", category: "대여", channel: null,
      customer_name: null, customer_phone: null, content: null, headcount: null, amount: 0, note: null, settled: true,
    }));
    return <Calendar month={month} today={today} isAdmin={false} rows={rows} prices={prices} contact={contact} />;
  }

  const [{ data }, { data: fl }] = await Promise.all([
    supabase
      .from("ledger")
      .select("id,date,kind,category,package,channel,customer_name,customer_phone,content,headcount,amount,note,settled")
      .or("kind.eq.매입,and(kind.eq.매출,category.eq.대여)") // 대여 매출 + 매입(월세·집기 등, 주황 칩)
      .order("date"),
    supabase.from("customers").select("*").neq("grade", "일반"),
  ]);

  return (
    <Calendar month={month} today={today} isAdmin toolbar={<SearchBox />}
      rows={(data ?? []) as Reservation[]} flagged={(fl ?? []) as Customer[]} highlightId={highlightId} />
  );
}
