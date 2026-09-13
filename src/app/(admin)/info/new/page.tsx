import Link from "next/link";
import { createSection } from "../actions";

const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";

export default function NewSectionPage() {
  return (
    <>
      <div className="mb-1 text-sm text-zinc-500"><Link href="/info" className="hover:underline">몽캐슬파티룸 정보</Link> ›</div>
      <h2 className="mb-5 text-xl font-bold">섹션 추가</h2>
      <form action={createSection} className="max-w-2xl space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600" htmlFor="title">제목 <b className="text-red-500">*</b></label>
          <input id="title" name="title" required placeholder="예: 9. 청소 체크리스트" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600" htmlFor="body">내용</label>
          <textarea id="body" name="body" rows={14} placeholder={"- 항목\n- **굵게**\n\n| 표 | 칸 |\n|---|---|\n| a | b |"} className={input + " font-mono text-sm leading-relaxed"} />
        </div>
        <button type="submit" className="rounded bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700">섹션 저장</button>
      </form>
    </>
  );
}
