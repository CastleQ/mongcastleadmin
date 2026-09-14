import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/games";
import { GameList } from "./game-list";

/** 공개: 로그인 없이 누구나 (RLS games_public_read) */
export default async function GamesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").order("kind").order("name");
  const games: Game[] = data ?? [];

  return (
    <>
      <h2 className="mb-1 text-xl font-bold">보유 게임</h2>
      <p className="mb-4 text-sm text-zinc-500">몽캐슬에 있는 보드게임·머더미스터리예요. 원하는 게임이 있으면 예약할 때 미리 말씀해주세요.</p>
      <GameList games={games} />
    </>
  );
}
