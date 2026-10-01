"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { GuideSection, GuideVersion } from "@/lib/guide";
import { fmtDateTime } from "@/lib/markdown";
import { HistoryTable } from "@/app/(site)/history-table";
import { deleteGuideSection, moveGuideSection, restoreGuideVersion, saveGuideSection, setGuidePublished } from "./actions";

type Props = { s: GuideSection; html: string; versions: GuideVersion[]; first: boolean; last: boolean };

/** 가이드 섹션 한 장: 보기 ↔ 편집, 공개 스위치, 순서 이동, 수정 기록·되돌리기 */
export function GuideCard({ s, html, versions, first, last }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(s.title);
  const [body, setBody] = useState(s.body);
  const [pending, start] = useTransition();

  const save = () => start(async () => { await saveGuideSection(s.id, title, body); setEditing(false); router.refresh(); });
  const cancel = () => { setTitle(s.title); setBody(s.body); setEditing(false); };
  const move = (dir: "up" | "down") => start(async () => { await moveGuideSection(s.id, dir); router.refresh(); });
  const togglePublished = () => start(async () => { await setGuidePublished(s.id, !s.published); router.refresh(); });
  const remove = () => {
    if (confirm(`"${s.title}" 섹션을 삭제할까요? 수정 기록도 함께 지워져요.`)) start(() => deleteGuideSection(s.id));
  };
  const restore = (v: GuideVersion) => {
    if (!confirm(`${fmtDateTime(v.saved_at)} 버전으로 되돌릴까요? (지금 내용도 기록에 남아요)`)) return;
    start(async () => { await restoreGuideVersion(s.id, v.id); setEditing(false); router.refresh(); });
  };

  const btn = "rounded border border-zinc-300 px-2.5 py-1 text-xs hover:border-zinc-900 hover:bg-white disabled:opacity-30";
  const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";

  return (
    <section id={`g${s.id}`} className={`rounded-lg border bg-white ${s.published ? "border-zinc-200" : "border-dashed border-zinc-300"}`}>
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-2.5">
        {editing ? (
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={input + " flex-1 font-bold"} />
        ) : (
          <h3 className={`flex-1 font-bold ${s.published ? "" : "text-zinc-400"}`}>{s.title}</h3>
        )}

        {/* 공개 스위치: 눌러서 바로 바뀜 (되돌리려면 한 번 더 누르면 됨) */}
        <button
          type="button"
          onClick={togglePublished}
          disabled={pending || editing}
          title={s.published ? "누르면 손님에게 숨겨요" : "누르면 손님에게 보여요"}
          className={`rounded px-2.5 py-1 text-xs disabled:opacity-40 ${
            s.published ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          }`}
        >
          {s.published ? "● 공개 중" : "○ 비공개"}
        </button>

        <span className="hidden text-xs text-zinc-400 sm:inline">수정 {fmtDateTime(s.updated_at)}</span>

        {editing ? (
          <>
            <button type="button" onClick={cancel} disabled={pending} className={btn}>취소</button>
            <button type="button" onClick={save} disabled={pending} className="rounded bg-zinc-900 px-3 py-1 text-xs text-white hover:bg-zinc-700 disabled:opacity-50">
              {pending ? "저장 중…" : "저장"}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className={btn}>수정</button>
            <span className="flex gap-1">
              <button type="button" aria-label="위로" disabled={pending || first} onClick={() => move("up")} className={btn}>▲</button>
              <button type="button" aria-label="아래로" disabled={pending || last} onClick={() => move("down")} className={btn}>▼</button>
            </span>
          </>
        )}
      </header>

      <div className="px-4 py-3">
        {editing ? (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={Math.min(30, Math.max(8, body.split("\n").length + 2))}
              className={input + " font-mono text-sm leading-relaxed"}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
              <span>형식: <code>## 제목</code> · <code>- 항목</code> · <code>**굵게**</code> · <code>| 표 | 칸 |</code> · 가격 자리표 <code>{"{{평일 낮}}"}</code></span>
              <button type="button" onClick={remove} className="text-red-600 hover:underline">이 섹션 삭제</button>
            </div>

            <details className="mt-4 rounded border border-zinc-200">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm text-zinc-600">
                이전 수정 기록 보기 <span className="text-zinc-400">({versions.length}회)</span>
              </summary>
              <div className="border-t border-zinc-200">
                <HistoryTable versions={versions} pending={pending} onRestore={(v) => restore(versions.find((x) => x.id === v.id)!)} />
              </div>
            </details>
          </>
        ) : (
          <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </section>
  );
}
