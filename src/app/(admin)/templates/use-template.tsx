"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fill, placeholders } from "@/lib/templates";
import { saveSlotDefault } from "./actions";

type Props = { templateId: number; body: string; phone?: string | null; initial?: Record<string, string> };

/** [대괄호] 채우기 → 미리보기 → 복사 / 문자앱. 값은 기본값(=)으로 저장 가능 */
export function UseTemplate({ templateId, body, phone, initial = {} }: Props) {
  const router = useRouter();
  const slots = placeholders(body);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(slots.map((s) => [s.key, initial[s.key] ?? s.def])),
  );
  const [copied, setCopied] = useState(false);
  const [saving, start] = useTransition();
  const text = fill(body, values);
  const missing = slots.filter((s) => !values[s.key]?.trim());

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
              const changed = v.trim() !== "" && v.trim() !== s.def;
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
                      {s.def && (
                        <button type="button" disabled={saving} onClick={() => remember(s.key, "")} title="기본값을 없애고 매번 채우는 칸으로" className="text-zinc-400 underline hover:text-red-600">
                          기본값 지우기
                        </button>
                      )}
                    </span>
                  </span>
                  <input value={v} onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                    className="w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none" />
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

      <pre className="whitespace-pre-wrap break-words rounded border border-zinc-200 bg-zinc-50 p-4 font-sans text-sm leading-relaxed">
        {text.split(/(\[[^\[\]]+\])/g).map((part, i) =>
          /^\[[^\[\]]+\]$/.test(part)
            ? <mark key={i} className="rounded bg-amber-200 px-0.5">{part}</mark>
            : part,
        )}
      </pre>
    </div>
  );
}
