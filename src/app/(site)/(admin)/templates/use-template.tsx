"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fill, fmtDate, isDateKey, isOptionKey, isPackageKey, isTotalKey, placeholders } from "@/lib/templates";
import { optionText, packageQuote, QUOTE_PACKAGES, quoteOptions, quoteTotal } from "@/lib/quote";
import { todayKST } from "@/lib/calendar";
import type { Prices } from "@/lib/prices";
import { saveSlotDefault } from "./actions";

type Props = { templateId: number; body: string; phone?: string | null; initial?: Record<string, string>; prices: Prices };

const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
const OTHER = "__other__";
const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/** 드롭다운 + 직접 입력. 목록에 없는 값이 들어오면 직접 입력 칸을 보여줌 */
function Pick({ options, value, onChange, allowEmpty }: { options: string[]; value: string; onChange: (v: string) => void; allowEmpty?: boolean }) {
  const [other, setOther] = useState(value !== "" && !options.includes(value));
  const selected = other ? OTHER : value;
  return (
    <div className="flex gap-2">
      <select value={selected} onChange={(e) => { const v = e.target.value; if (v === OTHER) { setOther(true); onChange(""); } else { setOther(false); onChange(v); } }} className={input + " flex-1"}>
        <option value="">{allowEmpty ? "(없음)" : "선택"}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER}>직접 입력</option>
      </select>
      {other && <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="직접 입력" autoFocus className={input + " flex-1"} />}
    </div>
  );
}

/**
 * [대괄호] 채우기 → 미리보기(직접 수정 가능) → 복사 / 문자앱. 값은 기본값(=)으로 저장 가능.
 * 칸 이름별 입력: 날짜=달력, 패키지=드롭다운(요금 자동), 옵션N=드롭다운(빈 옵션 줄은 사라짐), 총액=자동 계산(손으로 고칠 수 있음)
 */
export function UseTemplate({ templateId, body, phone, initial = {}, prices }: Props) {
  const router = useRouter();
  const slots = placeholders(body);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(slots.map((s) => [s.key, initial[s.key] ?? (isDateKey(s.key) && s.def === "오늘" ? todayKST() : s.def)])),
  );
  const [edited, setEdited] = useState<string | null>(null); // 미리보기를 직접 고친 내용
  const [copied, setCopied] = useState(false);
  const [saving, start] = useTransition();

  const dateKey = slots.find((s) => isDateKey(s.key))?.key;
  const pkgKey = slots.find((s) => isPackageKey(s.key))?.key;
  const optionKeys = slots.filter((s) => isOptionKey(s.key)).map((s) => s.key);
  const quote = pkgKey ? packageQuote(dateKey ? values[dateKey] ?? "" : "", values[pkgKey] ?? "", prices) : null;
  const autoTotal = quote?.base != null ? won(quoteTotal(quote.base, optionKeys.map((k) => values[k] ?? ""), prices)) : "";

  // 화면 입력값 → 문구에 들어갈 글자
  const shown: Record<string, string> = {};
  for (const { key } of slots) {
    const v = values[key] ?? "";
    shown[key] = isDateKey(key) ? (/^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v)
      : isPackageKey(key) && quote ? quote.text
      : isOptionKey(key) ? (v ? optionText(v, prices) : "")
      : isTotalKey(key) ? (v || autoTotal)
      : v;
  }
  const generated = fill(body, shown).replace(/^\[옵션\s*\d*\]\n?/gm, ""); // 비운 옵션 줄은 지움
  const text = edited ?? generated;
  const missing = slots.filter((s) => !isOptionKey(s.key) && !shown[s.key]?.trim());

  const set = (key: string, v: string) => { setValues((cur) => ({ ...cur, [key]: v })); setEdited(null); };
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const remember = (key: string, value: string) => start(async () => {
    await saveSlotDefault(templateId, key, value);
    if (!value) setValues((v) => ({ ...v, [key]: "" }));
    router.refresh();
  });

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
                <label key={s.key} className="block">
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
                    : isPackageKey(s.key) ? <Pick options={[...QUOTE_PACKAGES]} value={v} onChange={(x) => set(s.key, x)} />
                    : isOptionKey(s.key) ? <Pick options={quoteOptions(prices).map((o) => o.label)} value={v} onChange={(x) => set(s.key, x)} allowEmpty />
                    : total ? <input value={v || autoTotal} onChange={(e) => set(s.key, e.target.value)} placeholder={pkgKey ? "날짜·패키지를 고르면 자동 계산" : ""} className={input + (v ? "" : " text-zinc-500")} />
                    : <input value={v} onChange={(e) => set(s.key, e.target.value)} className={input} />}
                </label>
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
    </div>
  );
}
