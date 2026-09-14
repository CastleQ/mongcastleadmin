"use client";

import { useState } from "react";
import type { DayEntry } from "@/lib/sales";

type Props = {
  points: { day: number; cum: number }[]; days: number; target: number;
  breakEven: number; // 손익분기 매출 = 고정비 + 추가 매입
  entries: Record<number, DayEntry[]>;
};

/** 이달 누적 매출 꺾은선 (일 단위). 거래 있는 날만 점·날짜, 위치는 달력 위치 그대로. 점에 호버/터치하면 그날 거래 카드 */
export function DailyChart({ points, days, target, breakEven, entries }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const W = 640, H = 240, L = 52, R = 16, T = 16, B = 28;
  const maxV = Math.max(target, breakEven, ...points.map((p) => p.cum), 100_000);
  const minV = Math.min(0, ...points.map((p) => p.cum));
  const step = 100_000 * Math.max(1, Math.ceil((maxV - minV) / 100_000 / 8)); // 10만원 눈금, 8개 넘으면 20만·30만…
  const top = Math.ceil(maxV / step) * step, bottom = Math.floor(minV / step) * step;
  const x = (day: number) => L + ((day - 1) / (days - 1)) * (W - L - R);
  const y = (v: number) => T + ((top - v) / (top - bottom)) * (H - T - B);
  const ticks = Array.from({ length: (top - bottom) / step + 1 }, (_, i) => bottom + i * step);
  const won = (n: number) => n.toLocaleString("ko-KR");
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.cum).toFixed(1)}`).join(" ");
  // 날짜 라벨: 이전 라벨과 24px 이상 떨어진 점만 (겹침 방지)
  const showLabel = points.reduce<{ last: number; out: boolean[] }>((acc, p) => {
    const px = x(p.day), ok = px - acc.last >= 24;
    return { last: ok ? px : acc.last, out: [...acc.out, ok] };
  }, { last: -Infinity, out: [] }).out;
  const act = points.find((p) => p.day === active);

  return (
    <div className="relative" onPointerLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="이달 누적 매출 꺾은선 그래프" onClick={() => setActive(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#a1a1aa" : "#ececee"} />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#71717a">{v === 0 ? "0" : `${v / 10_000}만`}</text>
          </g>
        ))}
        {/* 목표: 1일 0 → 말일 목표 직선 */}
        <line x1={x(1)} y1={y(0)} x2={x(days)} y2={y(target)} stroke="#2563eb" strokeWidth="2" />
        <text x={x(days)} y={y(target) - 6} textAnchor="end" fontSize="10" fill="#2563eb">목표 매출 {won(target)}</text>
        {/* 손익분기: 매출이 이 선을 넘어야 순이익 0 이상 */}
        <line x1={L} x2={W - R} y1={y(breakEven)} y2={y(breakEven)} stroke="#71717a" strokeWidth="1" strokeDasharray="2 3" />
        <text x={L + 4} y={y(breakEven) - 4} fontSize="10" fill="#71717a">손익분기 {won(breakEven)} (고정비+추가 매입)</text>
        {/* 실적 누적 */}
        {points.length > 0 && <path d={path} fill="none" stroke="#18181b" strokeWidth="2" strokeLinejoin="round" />}
        {points.map((p, i) => (
          <g key={p.day}>
            <circle cx={x(p.day)} cy={y(p.cum)} r={active === p.day ? 6 : 4} fill="#18181b" stroke="#fff" strokeWidth="2" />
            {/* 손가락으로도 잡히게 넓은 투명 영역 */}
            <circle cx={x(p.day)} cy={y(p.cum)} r="14" fill="transparent" className="cursor-pointer"
              onPointerEnter={() => setActive(p.day)}
              onClick={(e) => { e.stopPropagation(); setActive(active === p.day ? null : p.day); }} />
            {showLabel[i] && <text x={x(p.day)} y={H - B + 14} textAnchor="middle" fontSize="10" fill="#3f3f46">{p.day}일</text>}
          </g>
        ))}
        {points.length === 0 && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill="#a1a1aa">이 달엔 정산된 거래가 아직 없어요</text>}
        {!points.some((p) => p.day === days) && <text x={x(days)} y={H - B + 14} textAnchor="end" fontSize="10" fill="#a1a1aa">{days}일</text>}
        <g fontSize="10" fill="#52525b">
          <line x1={L} x2={L + 14} y1={H - 4} y2={H - 4} stroke="#18181b" strokeWidth="2" /><text x={L + 18} y={H - 1}>누적 매출</text>
          <line x1={L + 90} x2={L + 104} y1={H - 4} y2={H - 4} stroke="#2563eb" strokeWidth="2" /><text x={L + 108} y={H - 1}>목표</text>
          <line x1={L + 150} x2={L + 164} y1={H - 4} y2={H - 4} stroke="#71717a" strokeDasharray="2 3" /><text x={L + 168} y={H - 1}>손익분기</text>
        </g>
      </svg>

      {act && entries[act.day] && (
        <div
          className="pointer-events-none absolute z-10 min-w-44 rounded border border-zinc-200 bg-white p-2 text-xs shadow-lg"
          style={{
            left: `${(x(act.day) / W) * 100}%`, top: `${(y(act.cum) / H) * 100}%`,
            transform: x(act.day) > W / 2 ? "translate(calc(-100% - 12px), -50%)" : "translate(12px, -50%)",
          }}
        >
          <div className="mb-1 flex justify-between gap-3 font-medium">
            <span>{act.day}일</span><span className="text-zinc-500">누적 {won(act.cum)}원</span>
          </div>
          <table className="w-full">
            <tbody>
              {entries[act.day].map((e, i) => (
                <tr key={i} className="border-t border-zinc-100">
                  <td className="py-0.5 pr-2 font-medium whitespace-nowrap">{e.name}</td>
                  <td className="py-0.5 pr-2 text-zinc-500 whitespace-nowrap">{e.content}</td>
                  <td className="py-0.5 pr-2 text-right tabular-nums whitespace-nowrap">{won(e.amount)}</td>
                  <td className="py-0.5 text-right tabular-nums whitespace-nowrap">→ {won(e.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-1 text-[10px] text-zinc-400">고객 · 콘텐츠 · 매출액 → 실수령</div>
        </div>
      )}
    </div>
  );
}
