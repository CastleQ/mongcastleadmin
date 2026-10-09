import type { Game } from "@/lib/games";

/** 목록 한 줄 (게임 관리 · 공개 페이지 목록 보기 공용) — 감싸는 Link/li는 쓰는 쪽에서 */
export function GameRow({ g }: { g: Game }) {
  return (
    <>
      {g.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={g.image_url} alt="" className="h-12 w-12 shrink-0 rounded object-cover" loading="lazy" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400">이미지 없음</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{g.name}{g.expansion && <span className="ml-1 font-normal text-zinc-500">+ {g.expansion}</span>}</span>
        <span className="block truncate text-xs text-zinc-500">{[g.category, g.players, g.play_minutes && `${g.play_minutes}분`, g.qty > 1 && `×${g.qty}`].filter(Boolean).join(" · ")}</span>
      </span>
      {g.kind === "머더미스터리" && <span className="shrink-0 text-xs text-zinc-400">{g.translated ? "번역됨" : "미번역"}</span>}
    </>
  );
}
