import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Ledger } from "@/lib/ledger";
import { fmtDate, type Template } from "@/lib/templates";
import { TemplateList } from "./template-list";
import { loadPrices } from "@/lib/settings";
import { fillPrices } from "@/lib/prices";
import { customerKey, type Customer } from "@/lib/customers";
import { CustomerWarning } from "@/app/(site)/customer-warning";

export default async function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  const { ledger } = await searchParams;
  const supabase = await createClient();

  // 예약에서 왔으면 그 예약 정보로 칸을 미리 채움
  let r: Ledger | null = null;
  if (typeof ledger === "string" && /^\d+$/.test(ledger)) {
    const { data: l } = await supabase.from("ledger").select("*").eq("id", Number(ledger)).maybeSingle();
    r = l;
  }
  let warn: Customer | null = null;
  if (r) {
    const key = customerKey(r);
    if (key) { const { data: c } = await supabase.from("customers").select("*").eq("key", key).maybeSingle(); warn = c; }
  }
  const { data } = await supabase.from("templates").select("*").order("sort_order").order("id");
  // 본문의 {{평일 낮}} 같은 가격 자리표를 현재 요금표로 채움 (편집 화면은 원문 유지)
  const prices = await loadPrices();
  const rows: Template[] = (data ?? []).map((t: Template) => ({ ...t, body: fillPrices(t.body, prices) }));

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">고객 응대 템플릿</h2>
        <Link href="/templates/new" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700">+ 추가</Link>
      </div>
      {r && (
        <p className="mb-4 rounded bg-zinc-50 px-3 py-2 text-sm">
          <Link href={`/ledger/${r.id}`} className="font-medium hover:underline">{fmtDate(r.date)} {r.package ?? ""} · {r.customer_name ?? "이름 없음"}</Link>
          <span className="text-zinc-500"> 예약에 보낼 문구를 고르세요. 날짜·패키지·금액은 자동으로 채워져요.</span>
        </p>
      )}
      {r && <div className="mb-4"><CustomerWarning c={warn} /></div>}

      {rows.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">문구가 없어요. <Link href="/templates/new" className="underline">첫 문구를 추가</Link>하세요.</p>
      ) : (
        <TemplateList rows={rows} ledger={r} warn={warn} prices={prices} />
      )}
      <p className="mt-3 text-xs text-zinc-500">문구를 누르면 채우기·복사 창이 열려요. 템플릿 안의 <code className="rounded bg-zinc-100 px-1">[대괄호]</code>는 보낼 때마다 채우는 칸, <code className="rounded bg-zinc-100 px-1">[칸=기본값]</code>은 미리 채워지는 칸.</p>
    </>
  );
}
