"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CHANNELS, CONTENTS, EXPENSE_CATEGORIES, OTHER, PACKAGES, PAYMENTS, SALE_CATEGORIES, SHOPS, calcMoney, expenseSettledDefault, kindLabel, type Ledger } from "@/lib/ledger";
import { saveLedger } from "./actions";
import { DeleteButton } from "./delete-button";
import { CancelButton } from "./cancel-button";
import { Switch } from "./controls";
import { customerKey, type Customer } from "@/lib/customers";
import { CustomerWarning } from "@/app/(site)/customer-warning";
import { suggestAmount } from "@/lib/pricing";
import { DEFAULT_PRICES, type Prices } from "@/lib/prices";
import { hhmm, packageTime } from "@/lib/hours";
import type { Prefill } from "@/lib/prefill";

type Props = { row?: Ledger; defaultDate?: string; defaultPackage?: string; from?: string; flagged?: Customer[]; prices?: Prices; prefill?: Prefill };

const input = "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
const label = "block text-sm text-zinc-600 mb-1";
const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/**
 * 저장 버튼. 누르면 '저장 중…' 으로 바뀌고 못 누르게 된다 — 응답이 없어 여러 번 눌러
 * 거래가 여러 건 생기던 것을 막는다 (서버 쪽에도 같은 내용 재전송 차단이 있다).
 * useFormStatus 는 form 안쪽 부품에서만 동작해서 따로 뺐다.
 */
function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending}
      className="rounded border border-transparent bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:bg-zinc-400">
      {pending ? "저장 중…" : children}
    </button>
  );
}

/** 라디오를 버튼처럼 (드롭다운 대신 선택지를 펼쳐 보여줌) */
function Choice({ name, options, value, onChange, required }: {
  name: string; options: readonly string[]; value: string | null; onChange?: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o} className="relative cursor-pointer">
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
function Toggle({ name, options, value, onChange, label = (o) => o }: { name: string; options: readonly [string, string]; value: string; onChange: (v: string) => void; label?: (o: string) => string }) {
  return (
    <div className="inline-flex rounded border border-zinc-900 overflow-hidden">
      {options.map((o) => (
        <label key={o} className="relative cursor-pointer">
          <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} className="peer sr-only" />
          <span className="block px-4 py-1.5 text-sm peer-checked:bg-zinc-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-400">{label(o)}</span>
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

export function LedgerForm({ row, defaultDate, defaultPackage, from, flagged = [], prices = DEFAULT_PRICES, prefill }: Props) {
  // 달력 빈 슬롯에서 들어오면 패키지·항목(대여)·입금액까지 미리 채움
  const initial = !row && defaultDate && defaultPackage ? suggestAmount(defaultDate, defaultPackage, null, prices) : null;
  // 응대 템플릿에서 넘어온 값(prefill)이 가장 세다 — 사장님이 문구에서 이미 고른 값이라서.
  // 그 다음이 저장된 예약(row), 마지막이 달력에서 추정한 값
  const v = { ...(row ?? {}), ...(prefill ?? {}) } as Partial<Ledger>;
  const [kind, setKind] = useState<Ledger["kind"]>(v.kind ?? "매출");
  const [category, setCategory] = useState<string | null>(v.category ?? (initial ? "대여" : null));
  const [channel, setChannel] = useState<string | null>(v.channel ?? null);
  const [pkg, setPkg] = useState<string | null>(v.package ?? (initial ? defaultPackage ?? null : null));
  const [settled, setSettled] = useState(v.settled ?? (v.kind === "매입" ? expenseSettledDefault(v.category ?? null) : false));
  const [payment, setPayment] = useState<string | null>(v.payment_method ?? "계좌이체");
  const [date, setDate] = useState(v.date ?? defaultDate ?? "");
  const [amount, setAmount] = useState(v.amount ? String(v.amount) : initial ? String(initial.total) : "");
  const [suggested, setSuggested] = useState<number | null>(initial?.total ?? null); // 마지막으로 자동 기입한 금액
  const [headcount, setHeadcount] = useState(v.headcount ? String(v.headcount) : "");
  const [other, setOther] = useState(v.other_expense ? String(v.other_expense) : "");
  const [name, setName] = useState(v.customer_name ?? "");
  const [phone, setPhone] = useState(v.customer_phone ?? "");
  // 예약 시간. 패키지를 고르면 기본값이 들어오고, 손으로 고친 값은 덮어쓰지 않는다(입금액과 같은 방식)
  const firstTimes = v.start_time || v.end_time
    ? { start: hhmm(v.start_time), end: hhmm(v.end_time) }
    : packageTime(v.package ?? (initial ? defaultPackage : null)) ?? { start: "", end: "" };
  const [times, setTimes] = useState(firstTimes);
  const [autoTimes, setAutoTimes] = useState<string>(`${firstTimes.start}-${firstTimes.end}`); // 마지막으로 자동 기입한 시간
  const sale = kind === "매출";
  const key = customerKey({ customer_name: name, customer_phone: phone });
  const warn = sale ? flagged.find((c) => c.key === key) : undefined;
  const toNum = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;
  const money = calcMoney(kind, toNum(amount), channel === OTHER ? null : channel, payment, toNum(other), prices.보증금);
  const suggestion = sale ? suggestAmount(date, pkg, channel === OTHER ? null : channel, prices, toNum(headcount) || null) : null;

  // 패키지·예약일·채널이 바뀌면 입금액 제안. 손으로 고친 값은 덮어쓰지 않음 (빈칸이거나 직전 제안값 그대로일 때만)
  const applySuggestion = (next: { date?: string; pkg?: string | null; channel?: string | null; headcount?: string }) => {
    const ch = next.channel ?? channel;
    const sg = suggestAmount(next.date ?? date, next.pkg ?? pkg, ch === OTHER ? null : ch, prices, toNum(next.headcount ?? headcount) || null);
    if (!sg) return;
    if (amount === "" || toNum(amount) === suggested) { setAmount(String(sg.total)); setSuggested(sg.total); }
  };

  // 패키지를 고르면 그 패키지의 기본 시간을 넣는다. 손으로 고쳐 둔 시간은 그대로 둔다
  // ('기타'는 정해진 시간이 없어 비운다 — 사장님 지시)
  const applyTimes = (nextPkg: string) => {
    const t = packageTime(nextPkg) ?? { start: "", end: "" };
    const untouched = (!times.start && !times.end) || `${times.start}-${times.end}` === autoTimes;
    if (!untouched) return;
    setTimes(t);
    setAutoTimes(`${t.start}-${t.end}`);
  };
  // 새 거래만: 구분을 바꾸면 항목·채널을 비우고 정산 기본값을 맞춘다. 지출은 남는 물건(집기·보드게임)만 미정산
  // (저장된 거래를 고칠 때는 사장님이 정해 둔 값을 건드리지 않는다)
  const changeKind = (k: Ledger["kind"]) => {
    setKind(k);
    if (row) return;
    setCategory(null); setChannel(null);
    setSettled(k === "매입" ? expenseSettledDefault(null) : false);
  };
  const changeCategory = (c: string) => {
    setCategory(c);
    if (!row && !sale) setSettled(expenseSettledDefault(c));
  };
  const setTime = (which: "start" | "end", value: string) => setTimes((t) => ({ ...t, [which]: value }));
  const rental = sale && (category ?? "대여") === "대여"; // 시간 칸은 대여 매출만

  return (
    <form action={saveLedger.bind(null, row?.id ?? null)} className="max-w-xl space-y-5">
      {from && <input type="hidden" name="from" value={from} />}
      <datalist id="contents">{CONTENTS.map((c) => <option key={c} value={c} />)}</datalist>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>구분 <b className="text-red-500">*</b></span>
          <Toggle name="kind" options={["매출", "매입"]} label={kindLabel} value={kind} onChange={(v) => changeKind(v as Ledger["kind"])} />
        </div>
        <div>
          <label className={label} htmlFor="date">{sale ? "예약일" : "날짜"} <b className="text-red-500">*</b></label>
          <input id="date" name="date" type="date" required value={date} onChange={(e) => { setDate(e.target.value); applySuggestion({ date: e.target.value }); }} className={input} />
        </div>
      </div>

      <div>
        <span className={label}>항목</span>
        <SelectOther name="category" options={sale ? SALE_CATEGORIES : EXPENSE_CATEGORIES} value={category ?? (sale ? "대여" : null)} onChange={changeCategory} />
      </div>

      {sale && (
        <div>
          <span className={label}>패키지 <b className="text-red-500">*</b></span>
          <Choice name="package" options={PACKAGES} value={pkg} onChange={(x) => { setPkg(x); applySuggestion({ pkg: x }); applyTimes(x); }} required />
        </div>
      )}

      {/* 예약 시간 — 대여만. 패키지를 고르면 기본 시간이 들어오고 손으로 고칠 수 있다 */}
      {rental && (
        <div>
          <span className={label}>예약 시간</span>
          <div className="flex items-center gap-2">
            <input name="start_time" type="time" step={300} value={times.start} onChange={(e) => setTime("start", e.target.value)} aria-label="시작 시간" className={input + " w-32"} />
            <span className="text-zinc-500">~</span>
            <input name="end_time" type="time" step={300} value={times.end} onChange={(e) => setTime("end", e.target.value)} aria-label="종료 시간" className={input + " w-32"} />
          </div>
        </div>
      )}

      <div>
        <span className={label}>{sale ? "인입 채널" : "구매처"}</span>
        <SelectOther name="channel" options={sale ? CHANNELS : SHOPS} value={channel} onChange={(v) => { setChannel(v); applySuggestion({ channel: v }); }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="customer_name">{sale ? "고객명" : "물품명"}</label>
          <input id="customer_name" name="customer_name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="amount">입금액(원) <b className="text-red-500">*</b></label>
          <input id="amount" name="amount" type="text" inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150000" className={input} />
          {suggestion && (
            <p className="mt-1 text-xs text-zinc-500">
              제안 {suggestion.total.toLocaleString("ko-KR")}원 <span className="text-zinc-400">({suggestion.label})</span>
              {toNum(amount) !== suggestion.total && (
                <button type="button" onClick={() => { setAmount(String(suggestion.total)); setSuggested(suggestion.total); }} className="ml-2 underline hover:text-zinc-900">적용</button>
              )}
            </p>
          )}
        </div>
      </div>

      <CustomerWarning c={warn} />

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

      <Switch name="settled" checked={settled} onChange={setSettled}>정산 완료</Switch>

      <details className="rounded border border-zinc-200" open={!!row}>
        <summary className="cursor-pointer px-3 py-2 text-sm text-zinc-600 select-none">자세한 항목</summary>
        <div className="space-y-4 border-t border-zinc-200 p-3">
          {sale && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="inquiry_date">인입일 (연락 온 날)</label>
                <input id="inquiry_date" name="inquiry_date" type="date" defaultValue={v.inquiry_date ?? ""} className={input} />
              </div>
              <div>
                <label className={label} htmlFor="customer_phone">연락처</label>
                <input id="customer_phone" name="customer_phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
              </div>
              <div>
                <label className={label} htmlFor="content">콘텐츠</label>
                <input id="content" name="content" list="contents" defaultValue={row?.content ?? ""} className={input} />
              </div>
              <div>
                <label className={label} htmlFor="headcount">인원</label>
                <input id="headcount" name="headcount" type="number" inputMode="numeric" value={headcount} onChange={(e) => { setHeadcount(e.target.value); applySuggestion({ headcount: e.target.value }); }} className={input} />
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
        <div className="flex items-center gap-2">
          <SubmitButton>{row ? "변경 저장" : "저장"}</SubmitButton>
          {row?.kind === "매출" && <CancelButton id={row.id} cancelled={!!row.cancelled} />}
        </div>
        {row && <DeleteButton id={row.id} date={row.date} from={from} />}
      </div>
    </form>
  );
}
