"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Ledger } from "@/lib/ledger";
import type { Customer } from "@/lib/customers";
import { CustomerWarning } from "../customer-warning";
import { autoFill, fill, placeholders, type Template } from "@/lib/templates";
import { moveTemplate } from "./actions";
import { UseTemplate } from "./use-template";
import { Modal } from "../modal";

/** 문구 목록 + 클릭하면 모달로 채우기/복사. 이름 옆 복사, 오른쪽 ▲▼로 순서 변경 */
export function TemplateList({ rows, ledger, warn }: { rows: Template[]; ledger: Ledger | null; warn?: Customer | null }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [moving, start] = useTransition();
  const current = rows.find((t) => t.id === openId) ?? null;

  // 목록에서 바로 복사: 기본값은 채우고, 나머지 [칸]은 그대로
  const quickCopy = async (t: Template) => {
    await navigator.clipboard.writeText(fill(t.body, {}));
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 1500);
  };
  const move = (id: number, dir: "up" | "down") => start(async () => { await moveTemplate(id, dir); router.refresh(); });

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const arrow = "flex h-10 w-10 items-center justify-center rounded border border-zinc-200 text-base text-zinc-500 hover:border-zinc-900 hover:bg-white hover:text-zinc-900 disabled:opacity-20 disabled:hover:border-zinc-200";

  return (
    <>
      <ol className="divide-y divide-zinc-100 border-y border-zinc-200">
        {rows.map((t, i) => {
          const slots = placeholders(t.body);
          return (
            <li key={t.id} role="button" tabIndex={0}
              onClick={() => setOpenId(t.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenId(t.id); } }}
              className="flex cursor-pointer items-center gap-3 px-2 py-3 hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none">
              <span className="w-5 shrink-0 text-sm text-zinc-400 tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  <button type="button" onClick={(e) => { stop(e); quickCopy(t); }} title="대괄호 포함 전문 복사"
                    className="rounded border border-zinc-300 px-2 py-0.5 text-xs whitespace-nowrap hover:border-zinc-900 hover:bg-white">
                    {copiedId === t.id ? "복사됨 ✓" : "복사"}
                  </button>
                  <span className="hidden text-xs text-zinc-400 sm:inline">{slots.length ? `채울 칸 ${slots.length}개` : ""}</span>
                </span>
                {t.when_to && <span className="block text-sm text-zinc-500">언제: {t.when_to}</span>}
                {t.note && <span className="block text-sm text-amber-700">※ {t.note}</span>}
              </span>
              <span className="flex shrink-0 gap-1" onClick={stop}>
                <button type="button" aria-label="위로" disabled={moving || i === 0} onClick={() => move(t.id, "up")} className={arrow}>▲</button>
                <button type="button" aria-label="아래로" disabled={moving || i === rows.length - 1} onClick={() => move(t.id, "down")} className={arrow}>▼</button>
              </span>
            </li>
          );
        })}
      </ol>

      <Modal open={!!current} onClose={() => setOpenId(null)}>
        {current && (
          <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{current.name}</h3>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {current.when_to && <>언제: {current.when_to}</>}
                  {current.note && <span className="ml-3 text-amber-700">※ {current.note}</span>}
                </p>
              </div>
              <button type="button" onClick={() => setOpenId(null)} aria-label="닫기" className="shrink-0 rounded px-2 text-xl leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900">×</button>
            </div>

            <div className="mb-4 empty:hidden"><CustomerWarning c={warn} /></div>

            <UseTemplate
              key={`${current.id}-${ledger?.id ?? ""}`}
              templateId={current.id}
              body={current.body}
              phone={ledger?.customer_phone}
              initial={ledger ? autoFill(placeholders(current.body), ledger) : undefined}
            />

            <div className="mt-5 flex justify-between border-t border-zinc-100 pt-3 text-sm">
              <Link href={`/templates/${current.id}`} className="text-zinc-500 hover:text-zinc-900 hover:underline">문구 수정 →</Link>
              <button type="button" onClick={() => setOpenId(null)} className="text-zinc-500 hover:text-zinc-900">닫기</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
