"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { filterGames, GAME_GROUPS, gameGroup, groupGames, GROUP_LABELS, GROUP_NOTES, type Game, type GameGroup } from "@/lib/games";
import { GameRow } from "@/app/(site)/game-row";

type View = "card" | "list";
/** 편집 화면 주소. 그 게임의 탭을 넘겨서 저장·삭제 뒤 그 탭으로 돌아오게 */
const editHref = (base: string, g: Game) => `${base}${g.id}?tab=${encodeURIComponent(gameGroup(g))}`;
const VIEW_KEY = "games-view";
// 아이콘: 카드 = 네모 4칸, 목록 = 가로줄 3개 (currentColor라 선택되면 흰색)
const VIEWS: { v: View; label: string; icon: React.ReactNode }[] = [
  { v: "card", label: "카드 보기", icon: <><rect x="3" y="3" width="7.5" height="7.5" rx=".5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx=".5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx=".5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx=".5" /></> },
  { v: "list", label: "목록 보기", icon: <path d="M3 5h18M3 12h18M3 19h18" /> },
];

/** 묶음 탭 + 검색 + 카드/목록 보기 전환 (브라우저에서 즉시, 보기 방식은 이 기기에 기억).
 *  고른 탭은 주소(?tab=)에 남겨서 편집하고 돌아와도 같은 탭. 검색 중엔 탭과 상관없이 전체에서 찾아 묶음별로 보여준다.
 *  editBase가 있으면(게임 관리) 각 게임을 누르면 `${editBase}${id}` 편집 화면으로 */
export function GameList({ games, editBase }: { games: Game[]; editBase?: string }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("card");
  const [tab, setTab] = useState<GameGroup | null>(null);
  const shown = filterGames(games, null, q);
  const searching = q.trim() !== "";
  const groups = groupGames(searching ? shown : games); // 탭 = 게임이 있는 묶음만
  const active = groups.find((s) => s.group === tab) ?? groups[0];

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 렌더와 맞추려고 첫 화면 뒤에 읽음
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {}
    const t = new URLSearchParams(window.location.search).get("tab");
    if ((GAME_GROUPS as readonly string[]).includes(t ?? "")) setTab(t as GameGroup);
  }, []);
  const pickTab = (g: GameGroup) => {
    setTab(g);
    setQ("");
    const url = new URL(window.location.href);
    url.searchParams.set("tab", g);
    window.history.replaceState(null, "", url);
  };
  const pick = (v: View) => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch {}
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="게임 이름 검색" type="search"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-1.5 text-base focus:border-zinc-900 focus:outline-none sm:max-w-xs" />
        {searching && <span className="text-sm text-zinc-500">{shown.length}개</span>}
        <div className="ml-auto inline-flex overflow-hidden rounded border border-zinc-900" role="group" aria-label="보기 방식">
          {VIEWS.map(({ v, label, icon }) => (
            <button key={v} type="button" onClick={() => pick(v)} aria-pressed={view === v} aria-label={label} title={label}
              className={`px-2.5 py-2 ${view === v ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{icon}</svg>
            </button>
          ))}
        </div>
      </div>

      {/* 탭: 폰에서 넘치면 탭 줄만 가로로 밀린다 (페이지 폭은 그대로) */}
      <div className="mb-4 flex overflow-x-auto border-b-2 border-zinc-900" role="tablist" aria-label="게임 분류">
        {groups.map((s) => {
          const on = !searching && s.group === active?.group;
          return (
            <button key={s.group} type="button" role="tab" aria-selected={on} onClick={() => pickTab(s.group)}
              className={`shrink-0 whitespace-nowrap rounded-t px-3 py-2 text-sm font-semibold ${on ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>
              {GROUP_LABELS[s.group] ?? s.group}<span className={`ml-1 text-xs font-normal ${on ? "text-zinc-300" : "text-zinc-400"}`}>{s.games.length}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">해당하는 게임이 없어요.</p>
      ) : (searching ? groups : active ? [active] : []).map((s) => (
        <section key={s.group} className="mb-8">
          {searching && (
            <h3 className="mb-3 flex items-baseline gap-2 border-b border-zinc-300 pb-1 text-lg font-bold">
              {GROUP_LABELS[s.group] ?? s.group}<span className="text-sm font-normal text-zinc-400">{s.games.length}개</span>
            </h3>
          )}
          {GROUP_NOTES[s.group] && <p className="mb-3 text-xs text-zinc-500">{GROUP_NOTES[s.group]}</p>}
          {view === "list" ? (
            <ul className="divide-y divide-zinc-100 border-b border-zinc-200">
              {s.games.map((g) => (
                <li key={g.id}>
                  {editBase
                    ? <Link href={editHref(editBase, g)} className="flex items-center gap-3 px-2 py-2 hover:bg-zinc-50"><GameRow g={g} /></Link>
                    : <div className="flex items-center gap-3 px-2 py-2"><GameRow g={g} /></div>}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {s.games.map((g) => <GameCard key={g.id} g={g} href={editBase && editHref(editBase, g)} />)}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

function GameCard({ g, href }: { g: Game; href?: string }) {
  const head = (
    <>
      {g.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={g.image_url} alt={g.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
      ) : href && (
        <span className="flex aspect-[4/3] w-full items-center justify-center bg-zinc-100 text-sm text-zinc-400">이미지 없음</span>
      )}
      <span className="block p-3">
        <span className="block font-bold">{g.name}{g.expansion && <span className="ml-1 font-normal text-zinc-500">+ {g.expansion}</span>}</span>
        {g.name_original && <span className="block truncate text-xs text-zinc-400">{g.name_original}</span>}
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
          {g.category && <span>{g.category}</span>}
          {g.players && <span>👥 {g.players}</span>}
          {g.play_minutes && <span>⏱ {g.play_minutes}분</span>}
          {g.qty > 1 && <span>×{g.qty}</span>}
          {g.kind === "머더미스터리" && <span>{g.gm_required ? "GM 필요" : "GM 없이"} · {g.translated ? "번역됨" : "미번역"}</span>}
          {g.language && <span>{g.language}</span>}
        </span>
      </span>
    </>
  );
  return (
    <li className="overflow-hidden rounded-lg border border-zinc-200">
      {href ? <Link href={href} className="block hover:bg-zinc-50">{head}</Link> : head}
      {/* 소개 펼치기는 링크 밖에 (누르면 편집으로 넘어가지 않게) */}
      {g.synopsis && (
        <details className="-mt-1 px-3 pb-3 text-xs">
          <summary className="cursor-pointer text-zinc-500 hover:text-zinc-900">소개 보기</summary>
          <p className="mt-1 whitespace-pre-wrap text-zinc-600">{g.synopsis}</p>
        </details>
      )}
    </li>
  );
}
