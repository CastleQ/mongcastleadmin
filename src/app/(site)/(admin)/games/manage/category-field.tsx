"use client";

import { useEffect, useRef, useState } from "react";
import { BOARD_CATEGORIES, type Game } from "@/lib/games";

const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
const label = "block text-sm text-zinc-600 mb-1";

/**
 * 장르 칸. 같은 폼의 '종류' 라디오를 따라 바뀐다.
 * - 보드게임: 보기에서 고름 (장르가 곧 탭을 정하므로 오타로 엉뚱한 탭에 가지 않게). 목록 밖 옛 값은 그대로 보기에 남겨 둔다
 * - 머더미스터리: '머더미스터리' 고정 (탭은 종류로 정해짐)
 * - 스위치게임: 자유 입력 (탭은 종류로 정해지고 장르는 카드 글자일 뿐). 기존 장르를 보기로 띄워 줌
 */
export function CategoryField({ row, switchGenres }: { row?: Game; switchGenres: string[] }) {
  const [kind, setKind] = useState<string>(row?.kind ?? "보드게임");
  const box = useRef<HTMLDivElement>(null);
  const initial = row?.category ?? "";

  useEffect(() => {
    const form = box.current?.closest("form");
    if (!form) return;
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.name === "kind") setKind(t.value);
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);

  return (
    <div ref={box}>
      <label className={label} htmlFor="category">장르</label>
      {kind === "보드게임" ? (
        <select id="category" name="category" required defaultValue={kind === row?.kind ? initial : ""} className={input}>
          <option value="" disabled>골라 주세요</option>
          {Object.entries(BOARD_CATEGORIES).map(([c, tab]) => <option key={c} value={c}>{c} → {tab} 탭</option>)}
          {row?.kind === "보드게임" && initial && !(initial in BOARD_CATEGORIES) && <option value={initial}>{initial} (옛 값 → 테마게임 탭)</option>}
        </select>
      ) : kind === "머더미스터리" ? (
        <>
          <input type="hidden" name="category" value="머더미스터리" />
          <p className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-base text-zinc-500">머더미스터리 (자동)</p>
        </>
      ) : (
        <>
          <input id="category" name="category" list="switch-genres" defaultValue={kind === row?.kind ? initial : ""} placeholder="파티 / 레이싱 / 리듬…" className={input} />
          <datalist id="switch-genres">{switchGenres.map((g) => <option key={g} value={g} />)}</datalist>
        </>
      )}
    </div>
  );
}
