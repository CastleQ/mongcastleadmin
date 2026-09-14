import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { renderMd, type InfoSection, type InfoVersion } from "@/lib/markdown";
import { SectionCard } from "./section-card";
import { PriceCard } from "./price-card";
import { loadPrices } from "@/lib/settings";

export default async function InfoPage() {
  const supabase = await createClient();
  const [{ data }, { data: vc }] = await Promise.all([
    supabase.from("info_sections").select("*").order("sort_order").order("id"),
    // ponytail: 기록을 전부 불러옴. 수백 개 넘어가면 섹션별 최근 N개로 제한
    supabase.from("info_versions").select("*").order("saved_at", { ascending: false }),
  ]);
  const sections: InfoSection[] = data ?? [];
  const prices = await loadPrices();
  const byId = new Map<number, InfoVersion[]>();
  for (const v of (vc ?? []) as InfoVersion[]) byId.set(v.section_id, [...(byId.get(v.section_id) ?? []), v]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">몽캐슬파티룸 정보</h2>
        <Link href="/info/new" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700">+ 섹션 추가</Link>
      </div>

      {sections.length > 1 && (
        <nav className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-500">
          {sections.map((s, i) => (
            <span key={s.id} className="contents">
              <a href={`#s${s.id}`} className="hover:text-zinc-900 hover:underline">{s.title}</a>
              {i === 0 && <a href="#prices" className="hover:text-zinc-900 hover:underline">📌 가격 정보</a>}
            </span>
          ))}
        </nav>
      )}

      {sections.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">아직 내용이 없어요. <Link href="/info/new" className="underline">첫 섹션을 추가</Link>하세요.</p>
      ) : (
        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={s.id} className="contents">
              <SectionCard s={s} html={renderMd(s.body)} versions={byId.get(s.id) ?? []} first={i === 0} last={i === sections.length - 1} />
              {i === 0 && <PriceCard prices={prices} />}
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-zinc-500">저장할 때마다 이전 내용이 자동으로 기록돼요. ‘수정’을 누르면 아래에서 기록을 보고 되돌릴 수 있어요.</p>
    </>
  );
}
