import type { Template } from "@/lib/templates";
import { saveTemplate } from "./actions";
import { DeleteTemplateButton } from "./delete-button";

const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
const label = "block text-sm text-zinc-600 mb-1";

export function TemplateForm({ row, nextOrder }: { row?: Template; nextOrder?: number }) {
  return (
    <form action={saveTemplate.bind(null, row?.id ?? null)} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label className={label} htmlFor="name">상황 <b className="text-red-500">*</b></label>
          <input id="name" name="name" required defaultValue={row?.name ?? ""} placeholder="예: 예약 확정 문자" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="sort_order">순서</label>
          <input id="sort_order" name="sort_order" type="number" inputMode="numeric" defaultValue={row?.sort_order ?? nextOrder ?? 0} className={input + " w-20"} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="when_to">언제</label>
        <input id="when_to" name="when_to" defaultValue={row?.when_to ?? ""} placeholder="예: 예약 후 보증금 입금 확인 시" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="body">템플릿 <b className="text-red-500">*</b> <span className="text-zinc-400">— 매번 바꿀 부분은 [대괄호]로</span></label>
        <textarea id="body" name="body" required rows={14} defaultValue={row?.body ?? ""} className={input + " font-sans leading-relaxed"} />
      </div>
      <div>
        <label className={label} htmlFor="note">기타 (나한테만 보이는 메모)</label>
        <input id="note" name="note" defaultValue={row?.note ?? ""} placeholder="예: 블랙 고객은 먼저 보낼 필요 없음" className={input} />
      </div>
      <div className="flex items-center justify-between pt-2">
        <button type="submit" className="rounded bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700">{row ? "변경 저장" : "문구 저장"}</button>
        {row && <DeleteTemplateButton id={row.id} />}
      </div>
    </form>
  );
}
