import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/games";
import { GameList } from "./game-list";

export const metadata: Metadata = {
  title: "몽캐슬 파티룸 - 보유 게임",
  description: "몽캐슬에 준비된 보드게임·닌텐도 스위치·머더미스터리 목록이에요.",
};

/** 공개: 로그인 없이 누구나 (RLS games_public_read). 머더미스터리만 이미지가 있는 것으로 제한 */
export default async function GamesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").or("kind.eq.보드게임,kind.eq.스위치게임,image_url.not.is.null").order("name");
  const games: Game[] = data ?? [];

  return (
    <>
      <h2 className="mb-1 text-xl font-bold">보유 게임</h2>
      <p className="mb-4 text-sm text-zinc-500">몽캐슬에 구비된 게임 목록이에요. 목록에 없는 게임도 말씀 주시면 최대한 준비해 드릴게요.</p>
      <GameList games={games} />
    </>
  );
}
