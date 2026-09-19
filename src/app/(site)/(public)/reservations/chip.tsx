"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Reservation } from "@/lib/calendar";

type Props = { r: Reservation; className: string; alignRight: boolean; children: ReactNode };

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/**
 * 관리자 달력 칩. 마우스 올리면(또는 폰에서 한 번 터치) 예약 정보 팝오버, 클릭(두 번째 터치)하면 거래 수정으로.
 * 팝오버 배경: 미정산 회색 · 정산 흰색 · 매입 연한 주황
 */
export function Chip({ r, className, alignRight, children }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const bg = r.kind === "매입" ? "bg-orange-50 border-orange-200" : r.settled ? "bg-white border-zinc-200" : "bg-zinc-200 border-zinc-400";
  const line = "flex justify-between gap-3";

  return (
    <div className="relative flex flex-1 flex-col" onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(true); }} onPointerLeave={() => setOpen(false)} onPointerDown={(e) => e.stopPropagation()}>
      <Link href={`/ledger/${r.id}`} className={className}
        onClick={(e) => { if ((e.nativeEvent as PointerEvent).pointerType === "touch" && !open) { e.preventDefault(); setOpen(true); } }}>
        {children}
      </Link>
      {open && (
        <div role="tooltip" className={`absolute top-full z-20 mt-1 w-56 rounded-lg border p-2.5 text-left text-xs leading-relaxed shadow-lg ${bg} ${alignRight ? "right-0" : "left-0"} [writing-mode:horizontal-tb]`}>
          {r.kind === "매입" ? (
            <>
              <p className={line}><span className="font-semibold">매입 · {r.category}</span><span className="tabular-nums">{won(r.amount)}</span></p>
              {r.channel && <p className="text-zinc-600">{r.channel}</p>}
            </>
          ) : (
            <>
              <p className={line}><span className="font-semibold">{r.customer_name || "이름 없음"}</span><span className="text-zinc-600">{r.customer_phone || ""}</span></p>
              <p className={line}><span>{r.package || "패키지 없음"}</span><span className="tabular-nums">{won(r.amount)}{r.settled ? "" : " (미정산)"}</span></p>
              {r.content && <p className="text-zinc-600">{r.content}{r.headcount ? ` · ${r.headcount}명` : ""}</p>}
            </>
          )}
          {r.note && <p className="mt-1 whitespace-pre-wrap border-t border-black/10 pt-1 text-zinc-700">{r.note}</p>}
        </div>
      )}
    </div>
  );
}
