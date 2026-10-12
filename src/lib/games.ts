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

/** 보유 게임 탭 순서: 파티 → 전략 → 테마 → 머더미스터리 → 닌텐도 스위치. 빈 탭은 뺌 (2026-10-12 사장님 지시로 '그 외' 없앰) */
export const GAME_GROUPS = ["파티게임", "전략게임", "테마게임", "머더미스터리", "닌텐도 스위치"] as const;
export type GameGroup = (typeof GAME_GROUPS)[number];

/** 탭에 보이는 이름 (묶음 이름과 다른 것만) */
export const GROUP_LABELS: Partial<Record<GameGroup, string>> = { "닌텐도 스위치": "닌텐도 스위치🎮" };

/** 보드게임 장르(category) → 탭. 게임 관리의 장르 보기도 이 목록이다. 카드엔 원래 장르 글자가 그대로 보인다. 여기 없는 장르(옛 값)는 테마게임 */
export const BOARD_CATEGORIES: Record<string, GameGroup> = { 파티: "파티게임", 전략: "전략게임", 추상전략: "전략게임", 마피아: "테마게임", 테마게임: "테마게임" };

/** 묶음 제목 아래 한 줄 안내. 없는 묶음은 아무것도 안 보인다 */
export const GROUP_NOTES: Partial<Record<GameGroup, string>> = {
  "닌텐도 스위치": "인원은 본체 1대·TV 1대로 함께 할 수 있는 사람 수예요. 조이콘이 더 필요한 게임은 소개에 적어뒀어요.",
};

export function gameGroup(g: Pick<Game, "kind" | "category">): GameGroup {
  // 종류를 먼저 본다 — 스위치 게임에도 장르가 '파티'인 것이 있어서(슈퍼 마리오 파티) 장르부터 보면 보드게임 묶음으로 샌다
  if (g.kind === "스위치게임") return "닌텐도 스위치";
  if (g.kind === "머더미스터리") return "머더미스터리";
  return BOARD_CATEGORIES[g.category ?? ""] ?? "테마게임"; // 장르 없음·목록 밖 → 테마게임
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
