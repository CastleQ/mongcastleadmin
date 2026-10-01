import Link from "next/link";
import { createGuideSection } from "../actions";

const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";

export default function NewGuideSectionPage() {
  return (
    <>
      <div className="mb-1 text-sm text-zinc-500"><Link href="/guide/manage" className="hover:underline">이용 가이드 편집</Link> ›</div>
      <h2 className="mb-5 text-xl font-bold">섹션 추가</h2>
      <form action={createGuideSection} className="max-w-2xl space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600" htmlFor="title">제목 <b className="text-red-500">*</b></label>
          <input id="title" name="title" required placeholder="예: 오시는 길" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600" htmlFor="body">내용</label>
          <textarea
            id="body"
            name="body"
            rows={14}
            placeholder={"- 항목\n- **굵게**\n\n| 표 | 칸 |\n|---|---|\n| a | b |\n\n요금은 {{평일 낮}} 처럼 쓰면 현재 가격이 자동으로 들어가요."}
            className={input + " font-mono text-sm leading-relaxed"}
          />
        </div>
        <p className="text-xs text-zinc-500">저장하면 <b>비공개</b> 상태로 들어가요. 목록에서 공개 단추를 눌러야 손님에게 보입니다.</p>
        <button type="submit" className="rounded bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700">섹션 저장</button>
      </form>
    </>
  );
}
