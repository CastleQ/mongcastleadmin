"use client";

import { useState } from "react";
import { Modal } from "../../modal";
import { OPEN_COLOR, SLOTS, slotStates, type Slot } from "@/lib/availability";
import { TODAY_MARK } from "@/lib/calendar";
import { HOLIDAYS } from "@/lib/holidays";
import { suggestAmount } from "@/lib/pricing";
import type { Prices } from "@/lib/prices";
import type { Contact } from "@/lib/settings";

type Props = { cells: (string | null)[]; byDate: Record<string, (string | null)[]>; today: string; prices: Prices; contact: Contact | null };

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const CLOSED = "bg-zinc-200 text-zinc-400"; // 예약됨·불가·지난 날 모두 같은 회색 — 손님에겐 "안 됨"만 중요
const won = (n: number) => n.toLocaleString("ko-KR");

/** 손님용 달력 칸: 낮·밤·전일 슬롯 (폰=세로 3열, PC=가로 3행). 빈 슬롯을 누르면 가격·문의 연락처 창 */
export function PublicCells({ cells, byDate, today, prices, contact }: Props) {
  const [sel, setSel] = useState<{ date: string; slot: Slot } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const sg = sel ? suggestAmount(sel.date, sel.slot, null, prices) : null;
  const selLabel = (() => {
    if (!sel) return "";
    const [y, m, d] = sel.date.split("-").map(Number);
    const dow = DOW[new Date(y, m - 1, d).getDay()];
    const hol = HOLIDAYS[sel.date];
    return `${m}월 ${d}일 (${dow}${hol ? ` · ${hol}` : ""})`;
  })();

  return (
    <>
      {cells.map((date, i) => {
        const dow = i % 7;
        const isToday = date === today;
        const past = !!date && date < today;
        const holiday = date ? HOLIDAYS[date] : undefined;
        const states = date ? slotStates(byDate[date] ?? []) : null;
        return (
          <div key={i} className={`min-h-16 sm:min-h-24 border-r border-b border-zinc-200 p-1 ${date ? "" : "bg-zinc-50"} ${isToday ? "bg-yellow-50" : ""}`}>
            {date && (
              <div className={`mb-1 flex items-baseline justify-between gap-1 ${dow === 0 || holiday ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-zinc-500"} ${past ? "opacity-40" : ""}`}>
                <span className="hidden truncate text-[10px] font-normal sm:inline">{holiday ?? ""}</span>
                <span className={isToday ? TODAY_MARK : ""}>{Number(date.slice(8))}</span>
              </div>
            )}
            {date && states && (
              <div className="flex flex-row gap-0.5 sm:flex-col">
                {SLOTS.map((s) => {
                  const open = !past && states[s] === "가능";
                  const cls = `flex-1 rounded text-[10px] leading-tight sm:px-1 sm:py-0.5 sm:text-xs sm:text-left ${open ? OPEN_COLOR[s] : CLOSED}`;
                  const label = <><span className="font-semibold">{s}</span><span className="hidden sm:inline"> {open ? "가능" : "불가"}</span></>;
                  return open
                    ? <button key={s} type="button" onClick={() => setSel({ date, slot: s })} className={`${cls} flex h-12 items-center justify-center [writing-mode:vertical-rl] sm:block sm:h-auto sm:[writing-mode:horizontal-tb]`} title={`${s} 예약 문의`}>{label}</button>
                    : <div key={s} className={`${cls} flex h-12 items-center justify-center [writing-mode:vertical-rl] sm:block sm:h-auto sm:[writing-mode:horizontal-tb]`}>{label}</div>;
                })}
              </div>
            )}
          </div>
        );
      })}

      <Modal open={!!sel} onClose={() => setSel(null)} className="max-w-sm">
        {sel && (
          <div className="p-5 text-sm">
            <p className="text-base font-bold">{selLabel} · {sel.slot} 패키지</p>
            {sg && <p className="mt-1 text-2xl font-bold tabular-nums">{won(sg.base)}<span className="text-sm font-normal text-zinc-500">원 · {sg.label.replace(/\s[\d,]+$/, "")} 요금</span></p>}
            <p className="mt-4 font-semibold">예약 문의하기</p>
            {contact ? (
              <ul className="mt-2 space-y-2">
                <li className="flex items-center gap-2">
                  <a href={`tel:${contact.phone}`} className="flex-1 truncate underline">{contact.phone}</a>
                  <button type="button" onClick={() => copy(contact.phone)} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">{copied === contact.phone ? "복사됨" : "복사"}</button>
                </li>
                <li className="flex items-center gap-2">
                  <a href={contact.kakao} target="_blank" rel="noopener noreferrer" className="flex-1 truncate underline">{contact.kakao}</a>
                  <button type="button" onClick={() => copy(contact.kakao)} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">{copied === contact.kakao ? "복사됨" : "복사"}</button>
                </li>
              </ul>
            ) : <p className="mt-2 text-zinc-500">연락처 준비 중</p>}
            <button type="button" onClick={() => setSel(null)} className="mt-4 w-full rounded border border-zinc-300 py-2 hover:bg-zinc-50">닫기</button>
          </div>
        )}
      </Modal>
    </>
  );
}
