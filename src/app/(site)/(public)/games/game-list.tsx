"use client";

import { useState } from "react";
import { GAME_KINDS, filterGames, type Game } from "@/lib/games";

/** 검색 + 종류 필터 (브라우저에서 즉시) */
export function GameList({ games }: { games: Game[] }) {
  const [kind, setKind] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const shown = filterGames(games, kind, q);
  const seg = (on: boolean) => `px-3 py-1.5 text-sm ${on ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded border border-zinc-900">
          <button type="button" onClick={() => setKind(null)} className={seg(kind === null)}>전체</button>
          {GAME_KINDS.map((k) => <button key={k} type="button" onClick={() => setKind(k)} className={seg(kind === k)}>{k}</button>)}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="게임 이름 검색" type="search"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-1.5 text-base focus:border-zinc-900 focus:outline-none sm:max-w-xs" />
        <span className="text-sm text-zinc-500">{shown.length}개</span>
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">해당하는 게임이 없어요.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((g) => (
            <li key={g.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold">{g.name}{g.expansion && <span className="ml-1 font-normal text-zinc-500">+ {g.expansion}</span>}</div>
                  {g.name_original && <div className="truncate text-xs text-zinc-400">{g.name_original}</div>}
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${g.kind === "머더미스터리" ? "bg-violet-100 text-violet-800" : "bg-emerald-100 text-emerald-800"}`}>{g.kind}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
                {g.category && <span>{g.category}</span>}
                {g.players && <span>👥 {g.players}</span>}
                {g.play_minutes && <span>⏱ {g.play_minutes}분</span>}
                {g.qty > 1 && <span>×{g.qty}</span>}
                {g.kind === "머더미스터리" && <span>{g.gm_required ? "GM 필요" : "GM 없이"} · {g.translated ? "번역됨" : "미번역"}</span>}
                {g.language && <span>{g.language}</span>}
              </div>
              {g.synopsis && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-zinc-500 hover:text-zinc-900">소개 보기</summary>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-600">{g.synopsis}</p>
                </details>
              )}
              {g.note && <div className="mt-1 text-xs text-amber-700">※ {g.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
