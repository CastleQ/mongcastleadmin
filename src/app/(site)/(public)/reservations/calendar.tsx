"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { monthGrid, monthInfo, packageKind, TODAY_MARK, type PackageKind, type Reservation } from "@/lib/calendar";
import { customerKey, type Customer } from "@/lib/customers";
import { HOLIDAYS } from "@/lib/holidays";
import { OPEN_COLOR, SLOTS, slotStates } from "@/lib/availability";
import type { Prices } from "@/lib/prices";
import type { Contact } from "@/lib/settings";
import { Chip } from "./chip";
import { PublicCells } from "./public-cells";

/** 예약된 칩은 진하게(가능 슬롯의 연한 초록과 확실히 구분) */
const COLOR: Record<PackageKind, string> = {
  낮: "bg-amber-300 text-amber-950",
  밤: "bg-indigo-300 text-indigo-950",
  전일: "bg-emerald-400 text-emerald-950",
  기타: "bg-zinc-300 text-zinc-900",
};
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
/** 슬롯 타일: 폰=세로 3열(세로쓰기), PC=가로 3행 */
const SLOT = "flex h-12 flex-1 items-center justify-center rounded text-[10px] leading-tight [writing-mode:vertical-rl] sm:block sm:h-auto sm:truncate sm:px-1 sm:py-0.5 sm:text-xs sm:[writing-mode:horizontal-tb]";
const btn = "rounded border border-zinc-300 px-3 py-1 text-sm whitespace-nowrap hover:bg-zinc-50";
const WHEEL_STEP = 40;   // 이만큼 굴려야 한 달 이동 (트랙패드 잔떨림 무시)
const WHEEL_LOCK = 350;  // 이동 후 잠금(ms) — 관성으로 여러 달 넘어가는 것 방지

type Props = {
  month: string; today: string; isAdmin: boolean;
  rows: Reservation[];          // 전 기간. 달 이동은 이 안에서 골라 쓰므로 서버 왕복 없음
  flagged?: Customer[];         // 관리자: 그레이·블랙 고객
  highlightId?: number | null;  // 검색 결과에서 넘어온 칩
  prices?: Prices; contact?: Contact | null; // 손님: 문의 창
  toolbar?: ReactNode;          // 제목 아래에 놓을 것 (관리자 검색창)
};

/** 달력 전체(제목·달 이동·칸). 전 기간 데이터를 들고 있어서 달 이동이 즉시 */
export function Calendar({ month: initialMonth, today, isAdmin, rows, flagged = [], highlightId = null, prices, contact, toolbar }: Props) {
  const [month, setMonth] = useState(initialMonth);
  const grid = useRef<HTMLDivElement>(null);
  const acc = useRef(0);
  const until = useRef(0);
  const info = monthInfo(month);
  const cells = monthGrid(info.year, info.month);
  const hl = month === initialMonth ? highlightId : null; // 달을 옮기면 강조 해제

  // 주소만 바꿔 기록에 남김 (서버를 다시 부르지 않음). 뒤로가기는 popstate로 되돌림
  const show = (m: string) => {
    setMonth(m);
    const url = m === today.slice(0, 7) ? "/reservations" : `/reservations?m=${m}`;
    window.history.pushState(null, "", url);
  };
  // 서버가 다른 달을 넘겨주면(검색 결과 클릭 등) 따라감
  useEffect(() => { setMonth(initialMonth); }, [initialMonth]);

  useEffect(() => {
    const onPop = () => {
      const m = new URLSearchParams(window.location.search).get("m");
      setMonth(m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [today]);

  // 달력 위 휠 = 앞뒤 달 (passive:false 여야 페이지 스크롤을 막을 수 있음)
  useEffect(() => {
    const el = grid.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // 가로 스와이프는 그대로
      e.preventDefault();
      const now = Date.now();
      if (now < until.current) return;
      acc.current += e.deltaY;
      if (Math.abs(acc.current) < WHEEL_STEP) return;
      const next = acc.current > 0;
      acc.current = 0;
      until.current = now + WHEEL_LOCK;
      const i = monthInfo(new URLSearchParams(window.location.search).get("m") ?? month);
      show(next ? i.next : i.prev);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const inMonth = rows.filter((r) => r.date.startsWith(month));
  const byDate = new Map<string, Reservation[]>();
  for (const r of inMonth) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);
  const flags = new Map(flagged.map((c) => [c.key, c]));
  const sales = inMonth.filter((r) => r.kind === "매출").length;
  const publicByDate: Record<string, (string | null)[]> = {};
  if (!isAdmin) for (const r of inMonth) (publicByDate[r.date] ??= []).push(r.package);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold whitespace-nowrap sm:text-xl"><span className="hidden sm:inline">예약 현황 · </span>{info.year}년 {info.month}월</h2>
        <div className="flex gap-1">
          <button type="button" onClick={() => show(info.prev)} className={btn}>‹<span className="hidden sm:inline"> 이전달</span></button>
          <button type="button" onClick={() => show(today.slice(0, 7))} className={btn}>오늘</button>
          <button type="button" onClick={() => show(info.next)} className={btn}><span className="hidden sm:inline">다음달 </span>›</button>
          {isAdmin && <Link href="/ledger/new" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white whitespace-nowrap hover:bg-zinc-700">+ 추가</Link>}
        </div>
      </div>

      {toolbar}

      <div ref={grid} className="grid grid-cols-7 border-l border-t border-zinc-200 text-xs sm:text-sm">
        {DOW.map((d, i) => (
          <div key={d} className={`border-r border-b border-zinc-200 bg-zinc-50 py-2 text-center font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}`}>{d}</div>
        ))}

        {!isAdmin && prices && <PublicCells cells={cells} byDate={publicByDate} today={today} prices={prices} contact={contact ?? null} />}

        {isAdmin && cells.map((date, i) => {
          const dow = i % 7;
          const isToday = date === today;
          const holiday = date ? HOLIDAYS[date] : undefined;
          const all = date ? byDate.get(date) ?? [] : [];
          const dayRows = all.filter((r) => r.kind === "매출");
          const buys = all.filter((r) => r.kind === "매입");
          const states = slotStates(dayRows.map((r) => r.package));
          const alignRight = dow >= 4; // 목~토는 팝오버를 오른쪽 맞춤 (화면 밖으로 안 나가게)
          const chip = (r: Reservation) => {
            const kind = packageKind(r.package);
            const who = r.customer_name || r.content || "";
            const warn = flags.get(customerKey(r) ?? "");
            return (
              <Chip key={r.id} r={r} alignRight={alignRight} highlight={r.id === hl} dim={hl !== null && r.id !== hl} className={`${SLOT} hover:opacity-80 ${COLOR[kind]}`}>
                {warn && <span className={warn.grade === "블랙" ? "text-red-600" : "text-zinc-700"} title={`⚠ ${warn.grade} 고객`}>⚠ </span>}
                {!r.settled && <span className="text-red-600">● </span>}
                <span className="font-semibold">{kind}</span>
                <span className="hidden sm:inline"> {who}</span>
                {r.channel && <span className="hidden text-[10px] opacity-70 lg:inline"> · {r.channel.split(",")[0]}</span>}
              </Chip>
            );
          };
          return (
            <div key={i} className={`min-h-16 border-r border-b border-zinc-200 p-1 sm:min-h-24 ${date ? "" : "bg-zinc-50"} ${isToday ? "bg-yellow-50" : ""}`}>
              {date && (
                <Link href={`/ledger/new?date=${date}`} title="이 날짜에 추가" className={`mb-1 flex items-baseline justify-between gap-1 hover:underline ${dow === 0 || holiday ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-zinc-500"}`}>
                  <span className="hidden truncate text-[10px] font-normal sm:inline">{holiday ?? ""}</span>
                  <span className={isToday ? TODAY_MARK : ""}>{Number(date.slice(8))}</span>
                </Link>
              )}
              {date && (
                <>
                  <div className="flex flex-row gap-0.5 sm:flex-col">
                    {SLOTS.map((s) => {
                      const booked = dayRows.filter((r) => packageKind(r.package) === s);
                      if (booked.length) return <div key={s} className="flex flex-1 flex-col gap-0.5">{booked.map(chip)}</div>;
                      if (states[s] === "가능") return <Link key={s} href={`/ledger/new?date=${date}&package=${s}`} title={`${s} 예약 추가`} className={`${SLOT} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}><span className="font-semibold">{s}</span><span className="hidden sm:inline"> 가능</span></Link>;
                      return <div key={s} className={`${SLOT} bg-zinc-100 text-zinc-400`}><span className="font-semibold">{s}</span><span className="hidden sm:inline"> {states[s]}</span></div>;
                    })}
                  </div>
                  {dayRows.filter((r) => packageKind(r.package) === "기타").map(chip)}
                  {buys.map((r) => (
                    <Chip key={r.id} r={r} alignRight={alignRight} highlight={r.id === hl} dim={hl !== null && r.id !== hl} className={`${SLOT} mt-0.5 bg-orange-100 text-orange-900 hover:opacity-80`}>
                      <span className="font-semibold">매입</span><span className="hidden sm:inline"> {r.category}</span>
                    </Chip>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
        {isAdmin ? (
          <>
            {(Object.keys(COLOR) as PackageKind[]).map((k) => (
              <span key={k} className="flex items-center gap-1"><span className={`inline-block h-3 w-3 rounded ${COLOR[k]}`} />{k}</span>
            ))}
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-orange-100" />매입</span>
            <span><span className="text-red-600">●</span> 미정산</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-emerald-200 bg-emerald-50" />가능 (눌러서 추가)</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-zinc-100" />불가</span>
            <span className="text-zinc-400">{sales ? `이번 달 예약 ${sales}건` : "이 달엔 예약이 없어요. 날짜를 눌러 추가하세요."}</span>
          </>
        ) : (
          <>
            {SLOTS.map((s) => <span key={s} className="flex items-center gap-1"><span className={`inline-block h-3 w-3 rounded ${OPEN_COLOR[s]}`} />{s} 가능</span>)}
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-zinc-200" />예약 불가</span>
            <span className="text-zinc-400">색 있는 칸을 누르면 가격과 문의 연락처가 나와요. 전일은 낮·밤이 모두 비어 있을 때만 가능해요.</span>
          </>
        )}
      </div>
    </>
  );
}
