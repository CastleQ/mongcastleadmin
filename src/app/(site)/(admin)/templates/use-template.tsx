"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";
import { fmtDate, isDateKey, isDropKey, isOptionKey, isPackageKey, isPlatformKey, isTotalKey, placeholders, PLATFORMS, render } from "@/lib/templates";
import { HEADCOUNT_OPTION, optionText, packageQuote, QUOTE_PACKAGES, quoteOptions, quoteTotal } from "@/lib/quote";
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
  /** 그 예약에 적혀 있던 인원 — 인원추가 옵션을 고르면 이 값이 미리 들어가 있다 */
  defaultHeadcount?: number | null;
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
export function UseTemplate({ templateId, templateName, body, phone, initial = {}, prices, ledgerId = null, defaultHeadcount = null }: Props) {
  const router = useRouter();
  const slots = placeholders(body);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(slots.map((s) => [s.key, initial[s.key] ?? (isDateKey(s.key) && s.def === "오늘" ? todayKST() : s.def)])),
  );
  const [headcount, setHeadcount] = useState(defaultHeadcount ? String(defaultHeadcount) : ""); // 인원추가 옵션을 골랐을 때만 쓰는 칸
  const [edited, setEdited] = useState<string | null>(null); // 미리보기를 직접 고친 내용
  const [copied, setCopied] = useState(false);
  const [ask, setAsk] = useState(false); // 복사 뒤 "예약현황에 추가할까요?" 모달
  const [saving, start] = useTransition();

  const dateKey = slots.find((s) => isDateKey(s.key))?.key;
  const pkgKey = slots.find((s) => isPackageKey(s.key))?.key;
  const platformKey = slots.find((s) => isPlatformKey(s.key))?.key;
  const nameKey = slots.find((s) => s.key.includes("고객"))?.key;
  const optionKeys = slots.filter((s) => isOptionKey(s.key)).map((s) => s.key);
  const lastOptionKey = optionKeys[optionKeys.length - 1];
  const pkg = pkgKey ? values[pkgKey] ?? "" : ""; // 고른 패키지 — 전일이면 밤샘이 무료라 옵션 금액이 달라짐
  const chosen = optionKeys.map((k) => values[k] ?? "");
  // 인원수 칸은 옵션 1~3 중 **한 곳에서라도** '인원추가'를 골랐을 때만 열린다 (여러 곳에서 골라도 한 번만 센다)
  const peopleOn = chosen.includes(HEADCOUNT_OPTION);
  const people = peopleOn ? Number(headcount.replace(/[^\d]/g, "")) || null : null;
  const quote = pkgKey ? packageQuote(dateKey ? values[dateKey] ?? "" : "", pkg, prices) : null;
  const autoTotal = quote?.base != null ? won(quoteTotal(quote.base, chosen, prices, pkg, people)) : "";

  // 화면 입력값 → 문구에 들어갈 글자
  const shown: Record<string, string> = {};
  for (const { key } of slots) {
    const v = values[key] ?? "";
    shown[key] = isDateKey(key) ? (/^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v)
      : isPackageKey(key) && quote ? quote.text
      : isOptionKey(key) ? (v ? optionText(v, prices, pkg, people) : "")
      : isTotalKey(key) ? (v || autoTotal)
      : v;
  }
  const generated = render(body, shown);
  const text = edited ?? generated;
  // 비우면 사라지는 칸(옵션·기타·플랫폼)은 '안 채운 칸'으로 세지 않는다
  const missing = slots.filter((s) => !isDropKey(s.key) && !shown[s.key]?.trim());

  const set = (key: string, v: string) => { setValues((cur) => ({ ...cur, [key]: v })); setEdited(null); };
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setAsk(true);
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
    const platformMode = templateName.includes("플랫폼") || !!platformKey;
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
      customer_name: nameKey ? (values[nameKey] ?? "").trim() || undefined : undefined,
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
        {slots.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">채울 칸 {slots.length}개</p>
            {slots.map((s) => {
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

                  {/* 인원수 칸: 마지막 옵션 바로 아래(=기타 칸 위). 옵션에서 '인원추가'를 고르기 전까지는 못 쓰게 둔다 */}
                  {s.key === lastOptionKey && (
                    <label className="block">
                      <span className="mb-1 block text-sm text-zinc-600">
                        이용인원
                        {!peopleOn && <span className="ml-1 text-xs text-zinc-400">옵션에서 ‘{HEADCOUNT_OPTION}’를 고르면 쓸 수 있어요</span>}
                      </span>
                      <input type="number" inputMode="numeric" min={1} value={headcount} disabled={!peopleOn}
                        onChange={(e) => { setHeadcount(e.target.value); setEdited(null); }}
                        placeholder={`${prices.기준인원}인 초과 1인당 ${won(prices.인원추가)}`}
                        className={input + (peopleOn ? "" : " bg-zinc-100 text-zinc-400")} />
                    </label>
                  )}
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
