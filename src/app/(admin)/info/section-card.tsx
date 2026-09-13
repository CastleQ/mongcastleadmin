"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { InfoSection, InfoVersion } from "@/lib/markdown";
import { fmtDateTime } from "@/lib/markdown";
import { deleteSection, moveSection, restoreVersion, saveSection } from "./actions";
import { HistoryTable } from "../history-table";

type Props = { s: InfoSection; html: string; versions: InfoVersion[]; first: boolean; last: boolean };

/** 섹션 한 장: 보기 ↔ 편집 전환, 편집 화면 아래에 수정 기록·되돌리기, 순서 이동 */
export function SectionCard({ s, html, versions, first, last }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(s.title);
  const [body, setBody] = useState(s.body);
  const [pending, start] = useTransition();

  const save = () => start(async () => { await saveSection(s.id, title, body); setEditing(false); router.refresh(); });
  const cancel = () => { setTitle(s.title); setBody(s.body); setEditing(false); };
  const move = (dir: "up" | "down") => start(async () => { await moveSection(s.id, dir); router.refresh(); });
  const remove = () => { if (confirm(`"${s.title}" 섹션을 삭제할까요? 기록도 함께 지워져요.`)) start(() => deleteSection(s.id)); };
  const restore = (v: InfoVersion) => {
    if (!confirm(`${fmtDateTime(v.saved_at)} 버전으로 되돌릴까요? (지금 내용도 기록에 남아요)`)) return;
    start(async () => { await restoreVersion(s.id, v.id); setEditing(false); router.refresh(); });
  };

  const btn = "rounded border border-zinc-300 px-2.5 py-1 text-xs hover:border-zinc-900 hover:bg-white disabled:opacity-30";
  const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";

  return (
    <section id={`s${s.id}`} className="rounded-lg border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-2.5">
        {editing ? (
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={input + " flex-1 font-bold"} />
        ) : (
          <h3 className="flex-1 font-bold">{s.title}</h3>
        )}
        <span className="hidden text-xs text-zinc-400 sm:inline">수정 {fmtDateTime(s.updated_at)}</span>
        {editing ? (
          <>
            <button type="button" onClick={cancel} disabled={pending} className={btn}>취소</button>
            <button type="button" onClick={save} disabled={pending} className="rounded bg-zinc-900 px-3 py-1 text-xs text-white hover:bg-zinc-700 disabled:opacity-50">{pending ? "저장 중…" : "저장"}</button>
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
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={Math.min(30, Math.max(8, body.split("\n").length + 2))}
              className={input + " font-mono text-sm leading-relaxed"} />
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
              <span>형식: <code>## 제목</code> · <code>- 항목</code> · <code>**굵게**</code> · <code>| 표 | 칸 |</code></span>
              <button type="button" onClick={remove} className="text-red-600 hover:underline">이 섹션 삭제</button>
            </div>

            <details className="mt-4 rounded border border-zinc-200">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm text-zinc-600">이전 수정 기록 보기 <span className="text-zinc-400">({versions.length}회)</span></summary>
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
