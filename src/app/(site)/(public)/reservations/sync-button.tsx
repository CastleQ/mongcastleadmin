"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncNow } from "@/app/(site)/(admin)/calendar-sync/actions";

/**
 * 예약현황에서 구글캘린더를 바로 당겨오는 단추 (관리자만).
 * 몇 초 걸리므로 진행 상태와 결과를 보여준다 — 눌렀는데 아무 반응이 없으면 또 누르게 된다.
 */
export function SyncButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const run = () =>
    start(async () => {
      setResult(null);
      try {
        const r = await syncNow();
        const bits = [
          r.created ? `새 예약 ${r.created}건` : "",
          r.updated ? `수정 ${r.updated}건` : "",
          r.markedDeleted ? `구글에서 삭제됨 ${r.markedDeleted}건` : "",
        ].filter(Boolean);
        setResult(bits.length ? bits.join(" · ") : "바뀐 것 없음");
        router.refresh();
      } catch (e) {
        setResult(`실패: ${e instanceof Error ? e.message : String(e)}`);
      }
    });

  return (
    // 달 이동 단추 묶음 바로 아래에 오므로 아래 여백을 두지 않는다. 결과 글자는 단추 왼쪽에 붙인다
    <div className="flex flex-wrap items-center justify-end gap-2">
      {result && <span className="text-xs text-zinc-500">{result}</span>}
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded border border-zinc-300 px-3 py-1 text-sm whitespace-nowrap hover:border-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
      >
        {pending ? "동기화 중…" : "구글캘린더 동기화 🔄"}
      </button>
    </div>
  );
}
