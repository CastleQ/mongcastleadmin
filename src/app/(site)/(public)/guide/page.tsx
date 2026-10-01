import Link from "next/link";
import { loadPublishedGuide } from "@/lib/guide";
import { loadPublicSettings } from "@/lib/settings";
import { renderMd } from "@/lib/markdown";
import { fillPrices } from "@/lib/prices";
import { GuidePrices } from "./prices-table";

/**
 * 공개 이용 가이드. 내용은 guide_sections 표(관리자 › 이용 가이드 편집)에서 오고,
 * 공개 스위치가 켜진 섹션만 보인다. 본문의 {{평일 낮}} 같은 자리표는 현재 요금으로 채워진다.
 */
export default async function GuidePage() {
  const [sections, { prices, contact }] = await Promise.all([loadPublishedGuide(), loadPublicSettings()]);

  return (
    <>
      <h2 className="mb-1 text-xl font-bold">몽캐슬 파티룸 이용 가이드</h2>
      <p className="mb-4 text-sm text-zinc-500">이용 요금과 예약 방법을 한 곳에 모았어요.</p>

      {sections.length > 0 && (
        <nav className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-500">
          <a href="#prices" className="hover:text-zinc-900 hover:underline">이용 요금</a>
          {sections.map((s) => (
            <a key={s.id} href={`#g${s.id}`} className="hover:text-zinc-900 hover:underline">{s.title}</a>
          ))}
          <a href="#contact" className="hover:text-zinc-900 hover:underline">예약 문의</a>
        </nav>
      )}

      <div className="space-y-4">
        <GuidePrices prices={prices} />

        {sections.map((s) => (
          <section key={s.id} id={`g${s.id}`} className="rounded-lg border border-zinc-200">
            <h3 className="border-b border-zinc-100 px-4 py-2.5 font-bold">{s.title}</h3>
            <div className="md px-4 py-3" dangerouslySetInnerHTML={{ __html: renderMd(fillPrices(s.body, prices)) }} />
          </section>
        ))}

        <section id="contact" className="rounded-lg border border-zinc-200">
          <h3 className="border-b border-zinc-100 px-4 py-2.5 font-bold">예약 문의</h3>
          <div className="px-4 py-3 text-sm">
            <p className="text-zinc-600">
              <Link href="/reservations" className="underline hover:text-zinc-900">예약현황 달력</Link>
              에서 빈자리를 확인하고 연락 주시면 바로 안내해드려요.
            </p>
            {contact ? (
              <ul className="mt-3 space-y-1.5">
                <li>전화 · 문자: <a href={`tel:${contact.phone}`} className="underline">{contact.phone}</a></li>
                <li>카카오톡: <a href={contact.kakao} target="_blank" rel="noopener noreferrer" className="underline">{contact.kakao}</a></li>
              </ul>
            ) : (
              <p className="mt-3 text-zinc-500">연락처 준비 중이에요.</p>
            )}
            <p className="mt-3 text-zinc-600">
              준비된 보드게임은 <Link href="/games" className="underline hover:text-zinc-900">보유 게임 목록</Link>에서 미리 보실 수 있어요.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
