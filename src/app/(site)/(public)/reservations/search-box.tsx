"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { searchLedger, type SearchRow } from "@/lib/search";
import { fmtDate } from "@/lib/templates";

const won = (n: number) => n.toLocaleString("ko-KR");
const MAX = 20; // 드롭다운에 보여줄 최대 건수. 나머지는 Enter로 전체 보기

/**
 * 예약 검색창. 처음 누를 때 거래 목록을 한 번 받아두고(약 150바이트/건), 타자마다 브라우저에서 걸러 바로 보여줌.
 * Enter = /reservations?q= 전체 표, 항목 클릭 = 그 달 달력에서 칩 강조
 */
export function SearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [rows, setRows] = useState<SearchRow[] | null>(null); // null = 아직 안 받음
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1); // 키보드 ↑↓ 선택
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const load = async () => {
    if (rows !== null) return;
    const res = await fetch("/api/ledger");
    if (!res.ok) return;
    const body = (await res.json()) as { rows: SearchRow[] };
    setRows(body.rows);
  };

  const hits = rows && q.trim() ? searchLedger(rows, q) : [];
  const shown = hits.slice(0, MAX);
  const go = (r: SearchRow) => { setOpen(false); router.push(`/reservations?m=${r.date.slice(0, 7)}&hl=${r.id}`); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(-1, Math.min(shown.length - 1, c + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" && cursor >= 0 && shown[cursor]) {
      e.preventDefault();
      go(shown[cursor]);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={box} className="relative mb-4 max-w-md">
      <form action="/reservations" className="flex gap-1">
        <input name="q" value={q} autoComplete="off" placeholder="고객명 · 연락처 · 콘텐츠 · 비고 검색" aria-label="예약 검색"
          onFocus={() => { load(); setOpen(true); }}
          onChange={(e) => { load(); setQ(e.target.value); setCursor(-1); setOpen(true); }}
          onKeyDown={onKey}
          className="w-full rounded border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-900 focus:outline-none" />
        <button type="submit" className="rounded border border-zinc-300 px-3 py-1 text-sm whitespace-nowrap hover:bg-zinc-50">검색</button>
        {initial && <a href="/reservations" className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50" title="검색 지우고 달력으로">✕</a>}
      </form>

      {open && q.trim() && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-zinc-300 bg-white text-sm shadow-lg">
          {rows === null ? (
            <li className="px-3 py-2 text-zinc-400">불러오는 중…</li>
          ) : shown.length === 0 ? (
            <li className="px-3 py-2 text-zinc-400">맞는 거래가 없어요</li>
          ) : (
            <>
              {shown.map((r, i) => (
                <li key={r.id}>
                  <button type="button" onClick={() => go(r)} onPointerEnter={() => setCursor(i)}
                    className={`flex w-full items-baseline gap-2 px-3 py-1.5 text-left ${i === cursor ? "bg-zinc-100" : "hover:bg-zinc-50"}`}>
                    <span className="w-20 shrink-0 text-zinc-500">{fmtDate(r.date)}</span>
                    <span className="shrink-0">{r.kind === "매입" ? r.category : r.package ?? ""}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{r.customer_name || r.content || r.channel || ""}</span>
                    {!r.settled && <span className="shrink-0 text-red-600">●</span>}
                    <span className="shrink-0 tabular-nums text-zinc-500">{won(r.amount)}</span>
                  </button>
                </li>
              ))}
              {hits.length > MAX && (
                <li className="border-t border-zinc-100 px-3 py-1.5 text-xs text-zinc-500">{hits.length - MAX}건 더 — Enter로 전체 보기</li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
