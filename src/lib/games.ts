export type Game = {
  id: number;
  kind: "보드게임" | "머더미스터리";
  name: string;
  name_original: string | null;
  category: string | null;
  expansion: string | null;
  qty: number;
  language: string | null;
  players: string | null;
  play_minutes: number | null;
  gm_required: boolean;
  translated: boolean;
  price: number | null;
  link: string | null;
  synopsis: string | null;
  note: string | null;
  image_url: string | null;
  bgg_id: number | null;
};

export const GAME_KINDS = ["보드게임", "머더미스터리"] as const;

/** 이름·원제·확장·장르에 검색어가 들어간 것만 (대소문자·공백 무시) */
export function filterGames(games: Game[], kind: string | null, q: string): Game[] {
  const needle = q.replace(/\s+/g, "").toLowerCase();
  return games.filter((g) => {
    if (kind && g.kind !== kind) return false;
    if (!needle) return true;
    const hay = [g.name, g.name_original, g.expansion, g.category].filter(Boolean).join(" ").replace(/\s+/g, "").toLowerCase();
    return hay.includes(needle);
  });
}
