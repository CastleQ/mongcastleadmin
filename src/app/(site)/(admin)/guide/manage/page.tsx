import Link from "next/link";
import { loadGuideForAdmin } from "@/lib/guide";
import { loadPrices } from "@/lib/settings";
import { renderMd } from "@/lib/markdown";
import { fillPrices } from "@/lib/prices";
import { GuideCard } from "./guide-card";

/** 관리자: 손님용 이용 가이드(/guide)에 실릴 섹션을 쓰고 공개 여부를 정하는 화면 */
export default async function GuideManagePage() {
  const [{ sections, versions }, prices] = await Promise.all([loadGuideForAdmin(), loadPrices()]);
  const publishedCount = sections.filter((s) => s.published).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">이용 가이드 편집</h2>
        <div className="flex items-center gap-2">
          <Link href="/guide" className="rounded border border-zinc-300 px-3 py-1 text-sm hover:border-zinc-900">손님 화면 보기</Link>
          <Link href="/guide/manage/new" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700">+ 섹션 추가</Link>
        </div>
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        여기 쓴 글이 <Link href="/guide" className="underline hover:text-zinc-900">이용 가이드</Link> 페이지에 그대로 올라가요.
        새 섹션은 <b>비공개</b>로 시작하니, 다 쓴 뒤 <b>○ 비공개</b> 단추를 눌러 공개로 바꿔주세요.
        요금표와 예약 문의처는 가이드 페이지에 자동으로 붙으니 따로 쓰지 않아도 돼요.
      </p>

      {sections.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">
          아직 섹션이 없어요. <Link href="/guide/manage/new" className="underline">첫 섹션을 추가</Link>하세요.
          <br />
          <span className="text-sm">예: 오시는 길 · 주차 안내 · 예약 방법 · 이용 수칙</span>
        </p>
      ) : (
        <div className="space-y-4">
          {sections.map((s, i) => (
            <GuideCard
              key={s.id}
              s={s}
              html={renderMd(fillPrices(s.body, prices))}
              versions={versions.get(s.id) ?? []}
              first={i === 0}
              last={i === sections.length - 1}
            />
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        공개 중인 섹션 {publishedCount}개 / 전체 {sections.length}개 · 저장할 때마다 이전 내용이 자동으로 기록돼요(‘수정’ 안에서 되돌리기 가능).
      </p>
    </>
  );
}
