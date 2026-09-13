"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { lineDiff } from "@/lib/diff";
import type { InfoSection, InfoVersion } from "@/lib/markdown";
import { fmtDateTime } from "@/lib/markdown";
import { deleteSection, moveSection, restoreVersion, saveSection } from "./actions";

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
              <table className="w-full border-t border-zinc-200 text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-xs text-zinc-500">
                    <th className="w-10 px-2 py-1.5 text-center font-medium">no</th>
                    <th className="w-32 px-2 py-1.5 text-left font-medium">수정날짜</th>
                    <th className="px-2 py-1.5 text-left font-medium">수정된 내용</th>
                    <th className="w-24 px-2 py-1.5 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {versions.map((v, i) => {
                    const prev = versions[i + 1]; // 목록은 최신순 → 다음 항목이 직전 버전
                    const d = prev ? lineDiff(prev.body, v.body) : null;
                    const titleChanged = prev && prev.title !== v.title;
                    return (
                      <tr key={v.id} className={i === 0 ? "bg-zinc-50/60" : ""}>
                        <td className="px-2 py-2 text-center text-zinc-400 tabular-nums">{versions.length - i}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-zinc-600">{fmtDateTime(v.saved_at)}{i === 0 && <span className="ml-1 text-[10px] text-zinc-400">현재</span>}</td>
                        <td className="px-2 py-2">
                          {!prev ? (
                            <span className="text-zinc-500">처음 저장</span>
                          ) : (
                            <div className="space-y-0.5 text-xs">
                              {titleChanged && <div>제목: {prev.title} → <b>{v.title}</b></div>}
                              {d!.added.slice(0, 3).map((l, k) => <div key={`a${k}`} className="truncate text-emerald-700">+ {l}</div>)}
                              {d!.removed.slice(0, 3).map((l, k) => <div key={`r${k}`} className="truncate text-red-600">− {l}</div>)}
                              {d!.added.length + d!.removed.length > 6 && <div className="text-zinc-400">…외 {d!.added.length + d!.removed.length - 6}줄</div>}
                              {!titleChanged && d!.added.length === 0 && d!.removed.length === 0 && <span className="text-zinc-400">(줄 단위 변화 없음 — 띄어쓰기·순서만)</span>}
                            </div>
                          )}
                          <details className="mt-1 text-xs">
                            <summary className="cursor-pointer text-zinc-400 hover:text-zinc-700">전체 보기</summary>
                            <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-2 font-sans text-xs">{v.body}</pre>
                          </details>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {i > 0 && <button type="button" disabled={pending} onClick={() => restore(v)} className={btn}>되돌리기</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </section>
  );
}
