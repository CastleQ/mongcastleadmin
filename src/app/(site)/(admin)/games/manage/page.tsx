import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GAME_KINDS, type Game } from "@/lib/games";

export default async function ManageGamesPage({ searchParams }: PageProps<"/games/manage">) {
  const { kind } = await searchParams;
  const k = GAME_KINDS.includes(kind as Game["kind"]) ? (kind as Game["kind"]) : null;
  const supabase = await createClient();
  let q = supabase.from("games").select("*").order("kind").order("name");
  if (k) q = q.eq("kind", k);
  const { data } = await q;
  const games: Game[] = data ?? [];
  const seg = (on: boolean) => `px-3 py-1.5 text-sm ${on ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`;
  const noImage = games.filter((g) => !g.image_url).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">게임 관리</h2>
        <Link href="/games/manage/new" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700">+ 추가</Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="inline-flex overflow-hidden rounded border border-zinc-900">
          <Link href="/games/manage" className={seg(k === null)}>전체</Link>
          {GAME_KINDS.map((x) => <Link key={x} href={`/games/manage?kind=${x}`} className={seg(k === x)}>{x}</Link>)}
        </div>
        <span className="text-zinc-500">{games.length}개{noImage > 0 && ` · 이미지 없음 ${noImage}개`}</span>
        <Link href="/games" className="text-zinc-500 underline hover:text-zinc-900">공개 페이지 보기 →</Link>
      </div>

      <ul className="divide-y divide-zinc-100 border-y border-zinc-200">
        {games.map((g) => (
          <li key={g.id}>
            <Link href={`/games/manage/${g.id}`} className="flex items-center gap-3 px-2 py-2 hover:bg-zinc-50">
              {g.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.image_url} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400">이미지 없음</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{g.name}{g.expansion && <span className="ml-1 font-normal text-zinc-500">+ {g.expansion}</span>}</span>
                <span className="block truncate text-xs text-zinc-500">{[g.kind, g.category, g.players, g.play_minutes && `${g.play_minutes}분`, g.qty > 1 && `×${g.qty}`].filter(Boolean).join(" · ")}</span>
              </span>
              {g.kind === "머더미스터리" && <span className="shrink-0 text-xs text-zinc-400">{g.translated ? "번역됨" : "미번역"}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
