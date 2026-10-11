export type Game = {
  id: number;
  kind: "보드게임" | "머더미스터리" | "스위치게임";
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

export const GAME_KINDS = ["보드게임", "머더미스터리", "스위치게임"] as const;

/** 공개 페이지 묶음 순서: 파티 → 전략 → 그 외(마피아·테마 등) → 머더미스터리 → 닌텐도 스위치. 빈 묶음은 뺌 */
export const GAME_GROUPS = ["파티게임", "전략게임", "그 외", "머더미스터리", "닌텐도 스위치"] as const;
export type GameGroup = (typeof GAME_GROUPS)[number];

/** 묶음 제목 아래 한 줄 안내. 없는 묶음은 아무것도 안 보인다 */
export const GROUP_NOTES: Partial<Record<GameGroup, string>> = {
  "닌텐도 스위치": "인원은 본체 1대·TV 1대로 함께 할 수 있는 사람 수예요. 조이콘이 더 필요한 게임은 소개에 적어뒀어요.",
};

export function gameGroup(g: Pick<Game, "kind" | "category">): GameGroup {
  // 종류를 먼저 본다 — 스위치 게임에도 장르가 '파티'인 것이 있어서(슈퍼 마리오 파티) 장르부터 보면 보드게임 묶음으로 샌다
  if (g.kind === "스위치게임") return "닌텐도 스위치";
  if (g.kind === "머더미스터리") return "머더미스터리";
  if (g.category === "파티") return "파티게임";
  if (g.category === "전략") return "전략게임";
  return "그 외";
}

export function groupGames(games: Game[]): { group: GameGroup; games: Game[] }[] {
  return GAME_GROUPS.map((group) => ({ group, games: games.filter((g) => gameGroup(g) === group) })).filter((s) => s.games.length > 0);
}

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
