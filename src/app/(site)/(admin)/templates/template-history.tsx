"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { fmtDateTime } from "@/lib/markdown";
import { HistoryTable, type HistoryItem } from "@/app/(site)/history-table";
import { restoreTemplateVersion } from "./actions";

/** 템플릿 편집 페이지 아래: 이전 수정 기록 + 되돌리기 */
export function TemplateHistory({ templateId, versions }: { templateId: number; versions: HistoryItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const restore = (v: HistoryItem) => {
    if (!confirm(`${fmtDateTime(v.saved_at)} 버전으로 되돌릴까요? (지금 내용도 기록에 남아요)`)) return;
    start(async () => { await restoreTemplateVersion(templateId, v.id); router.refresh(); });
  };
  return (
    <details className="mt-6 max-w-2xl rounded border border-zinc-200">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm text-zinc-600">이전 수정 기록 보기 <span className="text-zinc-400">({versions.length}회)</span></summary>
      <div className="border-t border-zinc-200">
        <HistoryTable versions={versions} pending={pending} onRestore={restore} />
      </div>
    </details>
  );
}
