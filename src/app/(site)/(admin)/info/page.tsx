import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { renderMd, type InfoSection, type InfoVersion } from "@/lib/markdown";
import { SectionCard } from "./section-card";

export default async function InfoPage() {
  const supabase = await createClient();
  const [{ data }, { data: vc }] = await Promise.all([
    supabase.from("info_sections").select("*").order("sort_order").order("id"),
    // ponytail: 기록을 전부 불러옴. 수백 개 넘어가면 섹션별 최근 N개로 제한
    supabase.from("info_versions").select("*").order("saved_at", { ascending: false }),
  ]);
  const sections: InfoSection[] = data ?? [];
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
          {sections.map((s) => <a key={s.id} href={`#s${s.id}`} className="hover:text-zinc-900 hover:underline">{s.title}</a>)}
        </nav>
      )}

      {sections.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">아직 내용이 없어요. <Link href="/info/new" className="underline">첫 섹션을 추가</Link>하세요.</p>
      ) : (
        <div className="space-y-4">
          {sections.map((s, i) => (
            <SectionCard key={s.id} s={s} html={renderMd(s.body)} versions={byId.get(s.id) ?? []} first={i === 0} last={i === sections.length - 1} />
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-zinc-500">저장할 때마다 이전 내용이 자동으로 기록돼요. ‘수정’을 누르면 아래에서 기록을 보고 되돌릴 수 있어요.</p>
    </>
  );
}
