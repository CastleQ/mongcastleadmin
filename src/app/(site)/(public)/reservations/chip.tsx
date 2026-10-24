"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { groupBuys, type Reservation } from "@/lib/calendar";
import { navigateOnTap } from "@/lib/tap";
import { timeRange } from "@/lib/hours";

type Props = { r: Reservation; className: string; alignRight: boolean; children: ReactNode; highlight?: boolean; dim?: boolean };

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/**
 * 관리자 달력 칩. 마우스 올리면(또는 폰에서 한 번 터치) 예약 정보 팝오버, 클릭(두 번째 터치)하면 거래 수정으로.
 * 두 번째 터치가 안 먹던 버그를 2026-10-11에 고쳤다 — 판정 시점이 범인이었다 (lib/tap.ts 주석 참고).
 * 팝오버 배경: 미정산 회색 · 정산 흰색 · 매입 연한 주황. highlight = 검색 결과에서 온 칩(테두리 강조 + 팝오버 열림), dim = 나머지 흐리게
 */
export function Chip({ r, className, alignRight, children, highlight = false, dim = false }: Props) {
  const [open, setOpen] = useState(highlight);
  // 팝오버 상태를 ref 에도 들고 있는다. 아래 '누를 때 정하기'가 리렌더 시점에 휘둘리지 않게
  const shown = useRef(highlight);
  const show = (v: boolean) => { shown.current = v; setOpen(v); };
  // 이번 누름이 '이동'인지 '팝오버 열기'인지 — pointerdown 에서 정해 담아둔다 (이유는 lib/tap.ts)
  const go = useRef(true);

  const box = useRef<HTMLDivElement>(null);

  // 바깥을 누르면 닫는다. '바깥인지'는 반드시 contains 로 따져야 한다 —
  // stopPropagation 만 믿으면 안 된다(리액트가 document 에 한 번에 받아서, 같은 document 의 이 처리기는 그대로 돌아간다).
  // 그걸 안 따졌을 때: 팝오버를 누르는 순간 팝오버가 사라져 click 이 닿을 곳이 없어 이동하지 못했다.
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) show(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const bg = r.kind === "매입" ? "bg-orange-50 border-orange-200" : r.settled ? "bg-white border-zinc-200" : "bg-zinc-200 border-zinc-400";
  const line = "whitespace-nowrap"; // 왼쪽부터 붙여 쓰고 항목 사이는 세로 구분선
  const sep = <span className="mx-1.5 text-zinc-400">|</span>;

  return (
    <div ref={box} className="relative flex flex-1 flex-col"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") show(true); }}
      // 터치의 pointerleave 는 무시한다. 터치에서는 click 보다 먼저 와서 팝오버를 닫아버린다 (lib/tap.ts)
      onPointerLeave={(e) => { if (e.pointerType === "mouse") show(false); }}
      onPointerDown={(e) => { go.current = navigateOnTap(e.pointerType, shown.current); e.stopPropagation(); }}>
      <Link href={`/ledger/${r.id}`} className={`${className} ${highlight ? "ring-2 ring-blue-600 ring-offset-1" : dim ? "opacity-40" : ""}`}
        onClick={(e) => { if (!go.current) { e.preventDefault(); show(true); } }}>
        {children}
      </Link>
      {open && (
        // 팝오버 자체도 거래 수정으로 가는 링크다 — 폰에선 설명이 뜨면 손가락이 자연히 거기로 간다 (사장님이 실제로 그러셨음).
        // role="tooltip" 은 뺐다 — 이제 누를 수 있는 링크라서 '설명 상자'로 읽히면 안 된다
        // 칩과 붙여 둔다(mt 없음): 틈을 두면 마우스가 그 틈에서 칩 밖으로 나가 팝오버가 닫혀 PC에서 누를 수 없다
        <Link href={`/ledger/${r.id}`} data-popover className={`absolute top-full z-20 block w-max max-w-64 rounded-lg border p-2.5 text-left text-xs leading-relaxed shadow-lg hover:brightness-95 ${bg} ${alignRight ? "right-0" : "left-0"} [writing-mode:horizontal-tb]`}>
          {r.kind === "매입" ? (
            <>
              <p className={line}><span className="font-semibold">매입 · {r.category}</span>{sep}<span className="tabular-nums">{won(r.amount)}</span></p>
              {r.channel && <p className="text-zinc-600">{r.channel}</p>}
            </>
          ) : (
            <>
              <p className={line}><span className="font-semibold">{r.customer_name || "이름 없음"}</span>{r.customer_phone && <>{sep}<span className="text-zinc-600">{r.customer_phone}</span></>}</p>
              <p className={line}><span>{r.package || "패키지 없음"}</span>{sep}<span className="tabular-nums">{won(r.amount)}{r.settled ? "" : " (미정산)"}</span></p>
              {/* 예약 시간 — 적어 둔 예약만 보여준다 (옛 예약은 비어 있다) */}
              {timeRange(r.start_time, r.end_time) && <p className={`${line} tabular-nums text-zinc-600`}>⏰ {timeRange(r.start_time, r.end_time)}</p>}
              {r.content && <p className="text-zinc-600">{r.content}{r.headcount ? ` · ${r.headcount}명` : ""}</p>}
            </>
          )}
          {r.note && <p className="mt-1 whitespace-pre-wrap border-t border-black/10 pt-1 text-zinc-700">{r.note}</p>}
        </Link>
      )}
    </div>
  );
}

/**
 * 하루치 매입을 한 칸으로. 매입이 몰린 날 칸이 길어지지 않게 (2026-10-12 사장님 요청).
 * 마우스 올리면(폰은 한 번 터치) 항목별로 묶은 상세 팝오버, 줄을 누르면 그 거래 수정으로.
 * 1건뿐이면 칸을 다시 눌러도 바로 수정으로 간다(Chip 과 같은 판정). 여러 건이면 칸은 팝오버만 연다.
 * 폰에서도 가로쓰기 — 세로쓰기였을 때 '매입'이 '입매'로 보이는 일이 있었다.
 */
export function BuyChip({ rows, className, alignRight, highlightId = null }: { rows: Reservation[]; className: string; alignRight: boolean; highlightId?: number | null }) {
  const hit = highlightId !== null && rows.some((r) => r.id === highlightId);
  const [open, setOpen] = useState(hit);
  const shown = useRef(hit);
  const show = (v: boolean) => { shown.current = v; setOpen(v); };
  const go = useRef(true);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) show(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const single = rows.length === 1 ? rows[0] : null;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const ring = hit ? "ring-2 ring-blue-600 ring-offset-1" : highlightId !== null ? "opacity-40" : "";
  const label = <><span className="font-semibold">매입</span>{rows.length > 1 && <span> {rows.length}<span className="hidden sm:inline">건</span></span>}</>;

  return (
    <div ref={box} className="relative"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") show(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") show(false); }}
      onPointerDown={(e) => { go.current = navigateOnTap(e.pointerType, shown.current); e.stopPropagation(); }}>
      {single ? (
        <Link href={`/ledger/${single.id}`} className={`${className} ${ring}`}
          onClick={(e) => { if (!go.current) { e.preventDefault(); show(true); } }}>{label}</Link>
      ) : (
        <button type="button" className={`${className} w-full ${ring}`} onClick={() => show(true)}>{label}</button>
      )}
      {open && (
        <div data-popover className={`absolute top-full z-20 w-max min-w-44 max-w-72 rounded-lg border border-orange-200 bg-orange-50 p-2.5 text-left text-xs leading-relaxed shadow-lg ${alignRight ? "right-0" : "left-0"}`}>
          {groupBuys(rows).map((g) => (
            <div key={g.category} className="mb-1.5 last:mb-0">
              <p className="flex justify-between gap-3 font-semibold"><span>{g.category}</span><span className="tabular-nums">{won(g.total)}</span></p>
              <ul>
                {g.rows.map((r) => (
                  <li key={r.id}>
                    <Link href={`/ledger/${r.id}`} className={`flex justify-between gap-3 rounded px-1 text-zinc-700 hover:bg-orange-100 ${r.id === highlightId ? "bg-orange-100" : ""}`}>
                      <span className="truncate">{r.customer_name || r.channel || "이름 없음"}</span>
                      <span className="shrink-0 tabular-nums">{won(r.amount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {rows.length > 1 && <p className="mt-1.5 flex justify-between gap-3 border-t border-black/10 pt-1 font-semibold"><span>합계 {rows.length}건</span><span className="tabular-nums">{won(total)}</span></p>}
        </div>
      )}
    </div>
  );
}
