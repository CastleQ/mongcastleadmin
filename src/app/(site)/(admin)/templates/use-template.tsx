"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";
import { fmtDate, isDateKey, isDropKey, isOptionKey, isPackageKey, isPlatformKey, isTotalKey, placeholders, PLATFORMS, render } from "@/lib/templates";
import { extraPeopleFee, optionText, packageQuote, QUOTE_PACKAGES, quoteOptions, quoteTotal, templateDeposit } from "@/lib/quote";
import { todayKST } from "@/lib/calendar";
import { packageTime } from "@/lib/hours";
import { prefillParams, type Prefill } from "@/lib/prefill";
import type { Prices } from "@/lib/prices";
import { Modal } from "@/app/(site)/modal";
import { saveSlotDefault } from "./actions";

type Props = {
  templateId: number;
  templateName: string;
  body: string;
  phone?: string | null;
  initial?: Record<string, string>;
  prices: Prices;
  /** 예약에서 '문자 만들기'로 들어왔으면 그 예약 번호. 복사 뒤 그 예약 수정으로 돌아간다 */
  ledgerId?: number | null;
  /** 그 예약에 적혀 있던 인원 — 이용인원 칸에 미리 들어가 있다 */
  defaultHeadcount?: number | null;
  /** 그 예약의 고객명 — 문구에 [고객명] 칸이 없을 때도 예약자 이름 칸에 들어가 있다 */
  defaultName?: string | null;
};

const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
const OTHER = "__other__";
const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/** 드롭다운 + 직접 입력. 목록에 없는 값이 들어오면 직접 입력 칸을 보여줌 */
function Pick({ options, value, onChange, allowEmpty, emptyLabel = "(없음)" }: {
  options: readonly string[]; value: string; onChange: (v: string) => void; allowEmpty?: boolean; emptyLabel?: string;
}) {
  const [other, setOther] = useState(value !== "" && !options.includes(value));
  const selected = other ? OTHER : value;
  return (
    <div className="flex gap-2">
      <select value={selected} onChange={(e) => { const v = e.target.value; if (v === OTHER) { setOther(true); onChange(""); } else { setOther(false); onChange(v); } }} className={input + " flex-1"}>
        <option value="">{allowEmpty ? emptyLabel : "선택"}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER}>직접 입력</option>
      </select>
      {other && <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="직접 입력" autoFocus className={input + " flex-1"} />}
    </div>
  );
}

/**
 * [대괄호] 채우기 → 미리보기(직접 수정 가능) → 복사 / 문자앱. 값은 기본값(=)으로 저장 가능.
 * 칸 이름별 입력: 날짜=달력, 패키지=드롭다운(요금 자동), 옵션N=드롭다운(빈 옵션 줄은 사라짐),
 * 플랫폼=드롭다운(기본 '없음'), 총액=자동 계산(손으로 고칠 수 있음).
 * 옵션에서 '인원추가'를 고르면 인원수 칸이 열리고, 기준인원을 넘는 만큼 총액에 더해진다.
 * 복사한 뒤에는 "예약현황에 바로 추가할까요?"를 물어 거래 추가(또는 그 예약 수정)로 값까지 들고 넘어간다.
 */
export function UseTemplate({ templateId, templateName, body, phone, initial = {}, prices, ledgerId = null, defaultHeadcount = null, defaultName = null }: Props) {
  const router = useRouter();
  const slots = placeholders(body);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(slots.map((s) => [s.key, initial[s.key] ?? (isDateKey(s.key) && s.def === "오늘" ? todayKST() : s.def)])),
  );
  const [headcount, setHeadcount] = useState(defaultHeadcount ? String(defaultHeadcount) : "");
  const [typedName, setTypedName] = useState(defaultName ?? ""); // 문구에 [고객명] 칸이 없을 때 쓰는 이름
  const [edited, setEdited] = useState<string | null>(null); // 미리보기를 직접 고친 내용
  const [copied, setCopied] = useState(false);
  const [ask, setAsk] = useState(false); // 복사 뒤 "예약현황에 추가할까요?" 모달
  const [saving, start] = useTransition();

  const dateKey = slots.find((s) => isDateKey(s.key))?.key;
  const pkgKey = slots.find((s) => isPackageKey(s.key))?.key;
  const platformKey = slots.find((s) => isPlatformKey(s.key))?.key;
  // 이름 칸: '고객명' 도 '예약자 이름' 도 받는다. '플랫폼이름' 처럼 플랫폼 칸은 빼고 본다
  const nameKey = slots.find((s) => !isPlatformKey(s.key) && (s.key.includes("고객") || s.key.includes("이름")))?.key;
  const feeKey = slots.find((s) => s.key.includes("이용료"))?.key; // 있으면 패키지 줄에서 금액을 뺀다
  const optionKeys = slots.filter((s) => isOptionKey(s.key)).map((s) => s.key);
  const pkg = pkgKey ? values[pkgKey] ?? "" : ""; // 고른 패키지 — 전일이면 밤샘이 무료라 옵션 금액이 달라짐
  const chosen = optionKeys.map((k) => values[k] ?? "");
  // 예약자 이름·이용인원은 **입금안내 문구에서 늘 적을 수 있는 칸**이다 (2026-10-31 사장님 요청).
  // 적어 둔 인원은 문구(인원추가 옵션을 고른 경우)와 총액, 그리고 거래 추가로 넘어갈 때 함께 간다
  const people = Number(headcount.replace(/[^\d]/g, "")) || null;
  const guestName = nameKey ? values[nameKey] ?? "" : typedName;
  // 이 문구에서 '예약현황에 추가'를 물어볼지 — 입금안내 문구만 해당된다.
  // 예약확정 문자처럼 이미 잡힌 예약에 보내는 문구는 거래를 새로 만들 일이 없다 (2026-10-31 사장님 지시)
  const canAddLedger = templateName.includes("입금안내");
  // 플랫폼에서 이미 결제하고 오는 건인지 — 채널·결제방식·보증금 처리가 갈린다
  const platformMode = templateName.includes("플랫폼") || !!platformKey;
  const deposit = canAddLedger ? templateDeposit(prices, platformMode, chosen) : 0;
  const quote = pkgKey ? packageQuote(dateKey ? values[dateKey] ?? "" : "", pkg, prices, !feeKey) : null;
  // 보증금은 할인 대상이 아니라 마지막에 더한다 (quoteTotal 안에서 더하면 지인할인이 보증금까지 깎는다)
  const autoTotal = quote?.base != null ? won(quoteTotal(quote.base, chosen, prices, pkg, people) + deposit) : "";
  // [이용료] = 패키지 값 + 기준인원 초과 가산금. 보증금·할인 같은 옵션은 빼고 '쓴 값'만 보여준다
  // (플랫폼 문구가 '이용료 N원 결제완료' 로 쓰는 금액 — 인원이 늘면 플랫폼에서 더 결제하고 온다)
  const usageFee = quote?.base != null ? won(quote.base + extraPeopleFee(people, prices, pkg)) : "";

  // 화면 입력값 → 문구에 들어갈 글자
  const shown: Record<string, string> = {};
  for (const { key } of slots) {
    const v = values[key] ?? "";
    shown[key] = isDateKey(key) ? (/^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v)
      : isPackageKey(key) && quote ? quote.text
      : isOptionKey(key) ? (v ? optionText(v, prices, pkg, people) : "")
      : key === feeKey ? (usageFee || v)
      : isTotalKey(key) ? (v || autoTotal)
      : v;
  }
  const generated = render(body, shown);
  const text = edited ?? generated;
  // 비우면 사라지는 칸(옵션·기타·플랫폼)은 '안 채운 칸'으로 세지 않는다
  const missing = slots.filter((s) => !isDropKey(s.key) && !shown[s.key]?.trim());

  const set = (key: string, v: string) => { setValues((cur) => ({ ...cur, [key]: v })); setEdited(null); };
  // 이름 칸은 문구에 [고객명] 이 있으면 그 칸을 쓰고, 없으면 따로 들고 있다가 거래로 넘길 때만 쓴다
  const setGuestName = (v: string) => { if (nameKey) set(nameKey, v); else { setTypedName(v); setEdited(null); } };
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    // 기본값이 있는 칸(출입 비밀번호 같은 것)을 고쳐서 복사했으면 그 값을 기본값으로 기억한다.
    // 날짜는 뺀다 — '오늘'이 특정 날짜로 굳어 버린다
    for (const s of slots) {
      const v = (values[s.key] ?? "").trim();
      // 비밀번호 칸은 복사만으로 기억하지 않는다 — 한 손님에게만 알려준 번호가 기본값으로 굳으면
      // '자주 바꾸니 연락주세요' 같은 안내 문구가 사라지고 다음 손님에게 옛 번호가 나간다.
      // 정말 바꾸실 때는 칸 옆의 '이 값을 기본값으로 저장'을 누르시면 된다
      if (s.def && !isDateKey(s.key) && !s.key.includes("비밀번호") && v && v !== s.def) {
        start(() => saveSlotDefault(templateId, s.key, v));
      }
    }
    if (canAddLedger) setAsk(true);
  };
  const remember = (key: string, value: string) => start(async () => {
    await saveSlotDefault(templateId, key, value);
    if (!value) setValues((v) => ({ ...v, [key]: "" }));
    router.refresh();
  });

  /**
   * 거래 추가(또는 그 예약 수정)로 넘길 값.
   * 플랫폼 결제 안내인지(이름에 '플랫폼'이 있거나 플랫폼 칸이 있는 문구) 아닌지로 채널·결제방식·정산을 가른다:
   *   · 예약 확인 후 입금안내 → 별도컨택 · 계좌이체 · 정산 미완료(아직 안 들어옴)
   *   · 플랫폼결제 확인 후 보증금 입금안내 → 고른 플랫폼 · 플랫폼결제 · 정산 완료(이미 결제됨)
   */
  const toPrefill = (): Prefill => {
    const platform = platformKey ? (values[platformKey] ?? "").trim() : "";
    const date = dateKey ? values[dateKey] ?? "" : "";
    const amount = Number((shown[slots.find((s) => isTotalKey(s.key))?.key ?? ""] ?? autoTotal).replace(/[^\d]/g, "")) || undefined;
    // 밤 + 밤샘 옵션이면 거래의 패키지는 '밤+밤샘'
    const ledgerPkg = pkg === "밤" && chosen.includes("밤샘") ? "밤+밤샘" : pkg;
    const t = packageTime(ledgerPkg);
    return {
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
      category: "대여",
      package: ledgerPkg || undefined,
      channel: platformMode ? platform || undefined : "별도컨택",
      payment_method: platformMode ? "플랫폼결제" : "계좌이체",
      settled: platformMode,
      amount,
      headcount: people ?? undefined,
      customer_name: guestName.trim() || undefined,
      inquiry_date: todayKST(), // 문구를 복사한 날 = 연락이 온 날
      start_time: t?.start,
      end_time: t?.end,
    };
  };
  const goLedger = () => {
    const q = prefillParams(toPrefill());
    setAsk(false);
    router.push(ledgerId ? `/ledger/${ledgerId}?${q}` : `/ledger/new?${q}`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        {/* 예약자 이름·이용인원 — 문구의 대괄호 칸과 상관없이 늘 적을 수 있는 칸.
            적어 두면 '예약현황에 추가'로 넘어갈 때 거래에 그대로 채워진다 (2026-10-31 사장님 요청) */}
        {canAddLedger && (
          <div className="grid grid-cols-2 gap-3 rounded border border-zinc-200 bg-zinc-50 p-3">
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600">고객명</span>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="홍길동" className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600">이용인원</span>
              <input type="number" inputMode="numeric" min={1} value={headcount}
                onChange={(e) => { setHeadcount(e.target.value); setEdited(null); }}
                placeholder={`${prices.기준인원}인까지 기본`} className={input} />
            </label>
          </div>
        )}

        {slots.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">채울 칸 {slots.length}개</p>
            {slots.filter((s) => !(canAddLedger && s.key === nameKey)).map((s) => {
              const v = values[s.key] ?? "";
              const date = isDateKey(s.key), total = isTotalKey(s.key);
              const changed = !date && !total && v.trim() !== "" && v.trim() !== s.def;
              return (
                <Fragment key={s.key}>
                  <label className="block">
                    <span className="mb-1 flex items-baseline justify-between gap-2 text-sm text-zinc-600">
                      <span>{s.key}{s.def && <span className="ml-1 text-xs text-zinc-400">기본값 {s.def}</span>}</span>
                      <span className="flex gap-3 text-xs">
                        {changed && (
                          <button type="button" disabled={saving} onClick={() => remember(s.key, v)} className="text-zinc-500 underline hover:text-zinc-900">
                            이 값을 기본값으로 저장
                          </button>
                        )}
                        {s.def && !date && (
                          <button type="button" disabled={saving} onClick={() => remember(s.key, "")} title="기본값을 없애고 매번 채우는 칸으로" className="text-zinc-400 underline hover:text-red-600">
                            기본값 지우기
                          </button>
                        )}
                        {total && v && autoTotal && (
                          <button type="button" onClick={() => set(s.key, "")} className="text-zinc-500 underline hover:text-zinc-900">자동 계산으로</button>
                        )}
                      </span>
                    </span>
                    {date ? <input type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ""} onChange={(e) => set(s.key, e.target.value)} className={input} />
                      : isPackageKey(s.key) ? <Pick options={QUOTE_PACKAGES} value={v} onChange={(x) => set(s.key, x)} />
                      : isPlatformKey(s.key) ? <Pick options={PLATFORMS} value={v} onChange={(x) => set(s.key, x)} allowEmpty emptyLabel="없음" />
                      : isOptionKey(s.key) ? <Pick options={quoteOptions(prices, pkg).map((o) => o.label)} value={v} onChange={(x) => set(s.key, x)} allowEmpty />
                      : total ? <input value={v || autoTotal} onChange={(e) => set(s.key, e.target.value)} placeholder={pkgKey ? "날짜·패키지를 고르면 자동 계산" : ""} className={input + (v ? "" : " text-zinc-500")} />
                      : <input value={v} onChange={(e) => set(s.key, e.target.value)} className={input} />}
                  </label>

                </Fragment>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={copy} className="rounded bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700">
            {copied ? "복사됨 ✓" : "문구 복사"}
          </button>
          <a href={`sms:${phone ?? ""}?body=${encodeURIComponent(text)}`} className="rounded border border-zinc-300 px-4 py-2.5 text-sm hover:bg-zinc-50">
            문자앱으로 열기{phone ? ` (${phone})` : ""}
          </a>
          {missing.length > 0 && <span className="text-sm text-amber-700">아직 안 채운 칸 {missing.length}개</span>}
        </div>
      </div>

      <div>
        <textarea value={text} onChange={(e) => setEdited(e.target.value)} rows={Math.max(8, text.split("\n").length + 1)}
          className="w-full resize-y rounded border border-zinc-200 bg-zinc-50 p-4 font-sans text-sm leading-relaxed focus:border-zinc-900 focus:bg-white focus:outline-none" />
        <p className="mt-1 flex justify-between text-xs text-zinc-400">
          <span>미리보기를 바로 고칠 수 있어요. 왼쪽 칸을 바꾸면 다시 만들어져요.</span>
          {edited !== null && <button type="button" onClick={() => setEdited(null)} className="underline hover:text-zinc-900">직접 고친 내용 되돌리기</button>}
        </p>
      </div>

      <Modal open={ask} onClose={() => setAsk(false)} className="max-w-sm">
        <div className="p-5">
          <p className="font-medium">문구를 복사했어요. {ledgerId ? "이 예약에 반영할까요?" : "예약현황에 바로 추가할까요?"}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {ledgerId
              ? "문구에서 고른 날짜·패키지·금액·시간을 예약 수정 화면에 채워 드려요. ‘변경 저장’을 눌러야 저장돼요."
              : "문구에서 고른 날짜·패키지·금액·시간이 채워진 거래 추가 화면으로 넘어가요. ‘저장’을 눌러야 저장돼요."}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setAsk(false)} className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">아니오</button>
            <button type="button" onClick={goLedger} className="rounded bg-zinc-900 px-5 py-2 text-sm text-white hover:bg-zinc-700">네</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
