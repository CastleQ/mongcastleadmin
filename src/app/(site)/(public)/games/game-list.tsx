"use client";

import { useEffect, useState } from "react";
import { filterGames, type Game } from "@/lib/games";
import { GameRow } from "@/app/(site)/game-row";

type View = "card" | "list";
const VIEW_KEY = "games-view";
// 아이콘: 카드 = 네모 4칸, 목록 = 가로줄 3개 (currentColor라 선택되면 흰색)
const VIEWS: { v: View; label: string; icon: React.ReactNode }[] = [
  { v: "card", label: "카드 보기", icon: <><rect x="3" y="3" width="7.5" height="7.5" rx=".5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx=".5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx=".5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx=".5" /></> },
  { v: "list", label: "목록 보기", icon: <path d="M3 5h18M3 12h18M3 19h18" /> },
];

/** 검색 + 카드/목록 보기 전환 (브라우저에서 즉시, 보기 방식은 이 기기에 기억) */
export function GameList({ games }: { games: Game[] }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("card");
  const shown = filterGames(games, null, q);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 렌더와 맞추려고 첫 화면 뒤에 읽음
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {}
  }, []);
  const pick = (v: View) => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch {}
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="게임 이름 검색" type="search"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-1.5 text-base focus:border-zinc-900 focus:outline-none sm:max-w-xs" />
        <span className="text-sm text-zinc-500">{shown.length}개</span>
        <div className="ml-auto inline-flex overflow-hidden rounded border border-zinc-900" role="group" aria-label="보기 방식">
          {VIEWS.map(({ v, label, icon }) => (
            <button key={v} type="button" onClick={() => pick(v)} aria-pressed={view === v} aria-label={label} title={label}
              className={`px-2.5 py-2 ${view === v ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{icon}</svg>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">해당하는 게임이 없어요.</p>
      ) : view === "list" ? (
        <ul className="divide-y divide-zinc-100 border-y border-zinc-200">
          {shown.map((g) => (
            <li key={g.id} className="flex items-center gap-3 px-2 py-2"><GameRow g={g} /></li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((g) => (
            <li key={g.id} className="overflow-hidden rounded-lg border border-zinc-200">
              {g.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.image_url} alt={g.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              )}
              <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold">{g.name}{g.expansion && <span className="ml-1 font-normal text-zinc-500">+ {g.expansion}</span>}</div>
                  {g.name_original && <div className="truncate text-xs text-zinc-400">{g.name_original}</div>}
                </div>
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
