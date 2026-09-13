"use client";

import { lineDiff } from "@/lib/diff";
import { fmtDateTime } from "@/lib/markdown";

export type HistoryItem = { id: number; saved_at: string; title: string; body: string };

type Props = { versions: HistoryItem[]; onRestore: (v: HistoryItem) => void; pending?: boolean };

/** 수정 기록 표: no / 날짜 / 바뀐 줄(+ −) / 되돌리기. 최신순 배열을 받음 */
export function HistoryTable({ versions, onRestore, pending }: Props) {
  const btn = "rounded border border-zinc-300 px-2.5 py-1 text-xs hover:border-zinc-900 hover:bg-white disabled:opacity-30";
  return (
    <table className="w-full text-sm">
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
          const prev = versions[i + 1]; // 최신순 → 다음 항목이 직전 버전
          const d = prev ? lineDiff(prev.body, v.body) : null;
          const titleChanged = prev && prev.title !== v.title;
          const more = d ? d.added.length + d.removed.length - 6 : 0;
          return (
            <tr key={v.id} className={i === 0 ? "bg-zinc-50/60" : ""}>
              <td className="px-2 py-2 text-center text-zinc-400 tabular-nums">{versions.length - i}</td>
              <td className="px-2 py-2 whitespace-nowrap text-zinc-600">
                {fmtDateTime(v.saved_at)}{i === 0 && <span className="ml-1 text-[10px] text-zinc-400">현재</span>}
              </td>
              <td className="px-2 py-2">
                {!d ? (
                  <span className="text-zinc-500">처음 저장</span>
                ) : (
                  <div className="space-y-0.5 text-xs">
                    {titleChanged && <div>제목: {prev.title} → <b>{v.title}</b></div>}
                    {d.added.slice(0, 3).map((l, k) => <div key={`a${k}`} className="truncate text-emerald-700">+ {l}</div>)}
                    {d.removed.slice(0, 3).map((l, k) => <div key={`r${k}`} className="truncate text-red-600">− {l}</div>)}
                    {more > 0 && <div className="text-zinc-400">…외 {more}줄</div>}
                    {!titleChanged && d.added.length === 0 && d.removed.length === 0 && <span className="text-zinc-400">(줄 단위 변화 없음 — 띄어쓰기·순서만)</span>}
                  </div>
                )}
                <details className="mt-1 text-xs">
                  <summary className="cursor-pointer text-zinc-400 hover:text-zinc-700">전체 보기</summary>
                  <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-2 font-sans text-xs">{v.body}</pre>
                </details>
              </td>
              <td className="px-2 py-2 text-center">
                {i > 0 && <button type="button" disabled={pending} onClick={() => onRestore(v)} className={btn}>되돌리기</button>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
