"use client";

import { useState } from "react";
import { CATEGORIES, CHANNELS, CONTENTS, OTHER, PACKAGES, PAYMENTS, calcMoney, type Ledger } from "@/lib/ledger";
import { saveLedger } from "./actions";
import { DeleteButton } from "./delete-button";
import { Switch } from "./controls";

type Props = { row?: Ledger; defaultDate?: string };

const input = "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
const label = "block text-sm text-zinc-600 mb-1";
const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/** 라디오를 버튼처럼 (드롭다운 대신 선택지를 펼쳐 보여줌) */
function Choice({ name, options, value, onChange, required }: {
  name: string; options: readonly string[]; value: string | null; onChange?: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o} className="cursor-pointer">
          <input type="radio" name={name} value={o} checked={value === o} required={required}
            onChange={() => onChange?.(o)} className="peer sr-only" />
          <span className="block rounded border border-zinc-300 px-3 py-1.5 text-sm peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-400">
            {o}
          </span>
        </label>
      ))}
    </div>
  );
}

/** 좌우 토글: 두 선택지가 한 덩어리로 붙어 있고 선택된 쪽만 검정 */
function Toggle({ name, options, value, onChange }: { name: string; options: readonly [string, string]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded border border-zinc-900 overflow-hidden">
      {options.map((o) => (
        <label key={o} className="cursor-pointer">
          <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} className="peer sr-only" />
          <span className="block px-4 py-1.5 text-sm peer-checked:bg-zinc-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-400">{o}</span>
        </label>
      ))}
    </div>
  );
}

/** 드롭다운 + '기타' 선택 시 직접 입력칸 */
function SelectOther({ name, options, value, onChange }: { name: string; options: string[]; value: string | null; onChange: (v: string) => void }) {
  const isOther = value !== null && value !== "" && !options.includes(value);
  const selected = isOther ? OTHER : (value ?? "");
  return (
    <div className="flex gap-2">
      <select name={name} value={selected} onChange={(e) => onChange(e.target.value === OTHER ? OTHER : e.target.value)} className={input + " flex-1"}>
        <option value="">선택</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER}>기타(직접입력)</option>
      </select>
      {(selected === OTHER) && (
        <input name={`${name}_other`} defaultValue={isOther ? value ?? "" : ""} placeholder="직접 입력" autoFocus className={input + " flex-1"} />
      )}
    </div>
  );
}

export function LedgerForm({ row, defaultDate }: Props) {
  const [kind, setKind] = useState<Ledger["kind"]>(row?.kind ?? "매출");
  const [category, setCategory] = useState<string | null>(row?.category ?? null);
  const [channel, setChannel] = useState<string | null>(row?.channel ?? null);
  const [pkg, setPkg] = useState<string | null>(row?.package ?? null);
  const [payment, setPayment] = useState<string | null>(row?.payment_method ?? "계좌이체");
  const [amount, setAmount] = useState(row?.amount ? String(row.amount) : "");
  const [other, setOther] = useState(row?.other_expense ? String(row.other_expense) : "");
  const sale = kind === "매출";
  const toNum = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;
  const money = calcMoney(kind, toNum(amount), channel === OTHER ? null : channel, payment, toNum(other));

  return (
    <form action={saveLedger.bind(null, row?.id ?? null)} className="max-w-xl space-y-5">
      <datalist id="contents">{CONTENTS.map((c) => <option key={c} value={c} />)}</datalist>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>구분 <b className="text-red-500">*</b></span>
          <Toggle name="kind" options={["매출", "매입"]} value={kind} onChange={(v) => setKind(v as Ledger["kind"])} />
        </div>
        <div>
          <label className={label} htmlFor="date">{sale ? "예약일" : "날짜"} <b className="text-red-500">*</b></label>
          <input id="date" name="date" type="date" required defaultValue={row?.date ?? defaultDate} className={input} />
        </div>
      </div>

      <div>
        <span className={label}>항목</span>
        <SelectOther name="category" options={CATEGORIES} value={category ?? (sale ? "대여" : null)} onChange={setCategory} />
      </div>

      {sale && (
        <div>
          <span className={label}>패키지 <b className="text-red-500">*</b></span>
          <Choice name="package" options={PACKAGES} value={pkg} onChange={setPkg} required />
        </div>
      )}

      <div>
        <span className={label}>인입 채널</span>
        <SelectOther name="channel" options={CHANNELS} value={channel} onChange={setChannel} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="customer_name">{sale ? "고객명" : "거래처"}</label>
          <input id="customer_name" name="customer_name" defaultValue={row?.customer_name ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="amount">입금액(원) <b className="text-red-500">*</b></label>
          <input id="amount" name="amount" type="text" inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150000" className={input} />
        </div>
      </div>

      <div>
        <span className={label}>결제방식 <b className="text-red-500">*</b></span>
        <Choice name="payment_method" options={PAYMENTS} value={payment} onChange={setPayment} required />
      </div>

      {sale && (
        <dl className="grid grid-cols-3 gap-2 rounded bg-zinc-50 p-3 text-sm">
          <div><dt className="text-zinc-500">보증금</dt><dd>{won(money.deposit)}</dd></div>
          <div><dt className="text-zinc-500">수수료</dt><dd>{won(money.fee)}</dd></div>
          <div><dt className="text-zinc-500">실수령</dt><dd className="font-bold">{won(money.net)}</dd></div>
        </dl>
      )}

      <Switch name="settled" defaultChecked={row?.settled ?? false}>정산 완료 (입금·지출 확인됨)</Switch>

      <details className="rounded border border-zinc-200" open={!!row}>
        <summary className="cursor-pointer px-3 py-2 text-sm text-zinc-600 select-none">자세한 항목</summary>
        <div className="space-y-4 border-t border-zinc-200 p-3">
          {sale && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="inquiry_date">인입일 (연락 온 날)</label>
                <input id="inquiry_date" name="inquiry_date" type="date" defaultValue={row?.inquiry_date ?? ""} className={input} />
              </div>
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
              <div>
                <label className={label} htmlFor="other_expense">기타지출(원)</label>
                <input id="other_expense" name="other_expense" type="text" inputMode="numeric" value={other} onChange={(e) => setOther(e.target.value)} className={input} />
              </div>
            </div>
          )}
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
