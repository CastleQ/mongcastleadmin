import { BUY_CATEGORIES, CHANNELS, CONTENTS, PACKAGES, PAYMENTS, type Ledger } from "@/lib/ledger";
import { saveLedger } from "./actions";
import { DeleteButton } from "./delete-button";

type Props = { row?: Ledger; defaultDate?: string };

const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
const label = "block text-sm text-zinc-600 mb-1";

/** 라디오를 버튼처럼: 드롭다운 대신 선택지를 펼쳐 보여줌 */
function Choice({ name, options, value }: { name: string; options: readonly string[]; value: string | null | undefined }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o} className="cursor-pointer">
          <input type="radio" name={name} value={o} defaultChecked={value === o} className="peer sr-only" />
          <span className="block rounded border border-zinc-300 px-3 py-1.5 text-sm peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-400">
            {o}
          </span>
        </label>
      ))}
    </div>
  );
}

export function LedgerForm({ row, defaultDate }: Props) {
  const sale = (row?.kind ?? "매출") === "매출";
  return (
    <form
      action={saveLedger.bind(null, row?.id ?? null)}
      className="max-w-xl space-y-5 [&:has(input[name=kind][value=매입]:checked)_.sale-only]:hidden [&:has(input[name=kind][value=매출]:checked)_.buy-only]:hidden"
    >
      <datalist id="channels">{CHANNELS.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="contents">{CONTENTS.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="buy-categories">{BUY_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>

      <div>
        <span className={label}>구분</span>
        <Choice name="kind" options={["매출", "매입"]} value={row?.kind ?? "매출"} />
      </div>

      <div>
        <label className={label} htmlFor="date">날짜</label>
        <input id="date" name="date" type="date" required defaultValue={row?.date ?? defaultDate} className={input} />
      </div>

      <div className="sale-only">
        <span className={label}>패키지</span>
        <Choice name="package" options={PACKAGES} value={row?.package ?? (sale ? "밤" : null)} />
      </div>

      <div className="buy-only">
        <label className={label} htmlFor="category">항목</label>
        <input id="category" name="category" list="buy-categories" defaultValue={sale ? "" : row?.category} placeholder="집기구매, 월세+기타, 광고비…" className={input} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="customer_name"><span className="sale-only">고객명</span><span className="buy-only">거래처</span></label>
          <input id="customer_name" name="customer_name" defaultValue={row?.customer_name ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="amount">금액(원)</label>
          <input id="amount" name="amount" type="text" inputMode="numeric" defaultValue={row?.amount ?? ""} placeholder="150000" className={input} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="settled" defaultChecked={row?.settled ?? false} className="h-4 w-4" />
        정산 완료 (입금·지출 확인됨)
      </label>

      <details className="rounded border border-zinc-200" open={!!row}>
        <summary className="cursor-pointer px-3 py-2 text-sm text-zinc-600 select-none">자세한 항목</summary>
        <div className="space-y-4 border-t border-zinc-200 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="channel">인입 채널</label>
              <input id="channel" name="channel" list="channels" defaultValue={row?.channel ?? ""} className={input} />
            </div>
            <div className="sale-only">
              <label className={label} htmlFor="inquiry_date">인입일</label>
              <input id="inquiry_date" name="inquiry_date" type="date" defaultValue={row?.inquiry_date ?? ""} className={input} />
            </div>
          </div>
          <div className="sale-only grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="customer_phone">연락처</label>
              <input id="customer_phone" name="customer_phone" type="tel" defaultValue={row?.customer_phone ?? ""} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="content">콘텐츠</label>
              <input id="content" name="content" list="contents" defaultValue={row?.content ?? ""} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="headcount">인원</label>
              <input id="headcount" name="headcount" type="number" inputMode="numeric" defaultValue={row?.headcount ?? ""} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="hours">이용시간(h)</label>
              <input id="hours" name="hours" type="number" step="0.5" inputMode="decimal" defaultValue={row?.hours ?? ""} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label} htmlFor="fee">수수료</label>
              <input id="fee" name="fee" type="text" inputMode="numeric" defaultValue={row?.fee || ""} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="other_expense">기타지출</label>
              <input id="other_expense" name="other_expense" type="text" inputMode="numeric" defaultValue={row?.other_expense || ""} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="net">실수령</label>
              <input id="net" name="net" type="text" inputMode="numeric" defaultValue={row?.net ?? ""} placeholder="비우면 자동" className={input} />
            </div>
          </div>
          <div>
            <span className={label}>결제수단</span>
            <Choice name="payment_method" options={PAYMENTS} value={row?.payment_method ?? "계좌이체"} />
          </div>
          <div>
            <label className={label} htmlFor="note">비고</label>
            <textarea id="note" name="note" rows={2} defaultValue={row?.note ?? ""} className={input} />
          </div>
        </div>
      </details>

      <div className="flex items-center justify-between pt-2">
        <button type="submit" className="rounded bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400">
          {row ? "변경 저장" : "저장"}
        </button>
        {row && <DeleteButton id={row.id} date={row.date} />}
      </div>
    </form>
  );
}
