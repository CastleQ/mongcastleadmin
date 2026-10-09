import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/games";
import { GameList } from "@/app/(site)/(public)/games/game-list";

/** 공개 페이지와 같은 묶음·카드/목록 보기. 게임을 누르면 편집 화면으로. 이미지 없는 머더미스터리도 여기선 보임 */
export default async function ManageGamesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").order("name");
  const all: Game[] = data ?? [];
  const noImage = all.filter((g) => !g.image_url).length;

  return (
    <>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">게임 관리</h2>
        <Link href="/games/manage/new" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700">+ 추가</Link>
      </div>
      <p className="mb-4 text-sm text-zinc-500">
        게임을 누르면 편집 화면이 열려요{noImage > 0 && ` · 이미지 없음 ${noImage}개 (머더미스터리는 이미지가 있어야 공개)`} ·{" "}
        <Link href="/games" className="underline hover:text-zinc-900">공개 페이지 보기 →</Link>
      </p>
      <GameList games={all} editBase="/games/manage/" />
    </>
  );
}
