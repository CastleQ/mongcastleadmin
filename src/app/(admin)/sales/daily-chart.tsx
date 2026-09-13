/** 이달 누적 순이익 꺾은선 (일 단위). 거래 있는 날만 점·날짜, 위치는 달력 위치 그대로 */
export function DailyChart({ points, days, elapsed, target, scenario }: {
  points: { day: number; cum: number }[]; days: number; elapsed: number; target: number; scenario: string;
}) {
  const W = 640, H = 240, L = 52, R = 16, T = 16, B = 28;
  const last = points[points.length - 1];
  const pace = last && elapsed > 0 ? (last.cum / elapsed) * days : 0; // 현재 페이스로 월말 예상
  const maxV = Math.max(target, ...points.map((p) => p.cum), pace, 100_000);
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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="이달 누적 순이익 꺾은선 그래프">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#a1a1aa" : "#ececee"} />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#71717a">{v === 0 ? "0" : `${v / 10_000}만`}</text>
        </g>
      ))}
      {/* 목표: 1일 0 → 말일 목표 직선 */}
      <line x1={x(1)} y1={y(0)} x2={x(days)} y2={y(target)} stroke="#2563eb" strokeWidth="2" />
      <text x={x(days)} y={y(target) - 6} textAnchor="end" fontSize="10" fill="#2563eb">{scenario} 목표 {won(target)}</text>
      {/* 현재 페이스 예상 (점선) */}
      {last && elapsed < days && pace !== last.cum && (
        <line x1={x(last.day)} y1={y(last.cum)} x2={x(days)} y2={y(pace)} stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" />
      )}
      {/* 실적 누적 */}
      {points.length > 0 && <path d={path} fill="none" stroke="#18181b" strokeWidth="2" strokeLinejoin="round" />}
      {points.map((p, i) => (
        <g key={p.day}>
          <circle cx={x(p.day)} cy={y(p.cum)} r="4" fill="#18181b" stroke="#fff" strokeWidth="2"><title>{`${p.day}일 누적 ${won(p.cum)}원`}</title></circle>
          {showLabel[i] && <text x={x(p.day)} y={H - B + 14} textAnchor="middle" fontSize="10" fill="#3f3f46">{p.day}일</text>}
        </g>
      ))}
      {points.length === 0 && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill="#a1a1aa">이 달엔 정산된 거래가 아직 없어요</text>}
      {!points.some((p) => p.day === days) && <text x={x(days)} y={H - B + 14} textAnchor="end" fontSize="10" fill="#a1a1aa">{days}일</text>}
      <g fontSize="10" fill="#52525b">
        <line x1={L} x2={L + 14} y1={H - 4} y2={H - 4} stroke="#18181b" strokeWidth="2" /><text x={L + 18} y={H - 1}>누적 순이익</text>
        <line x1={L + 90} x2={L + 104} y1={H - 4} y2={H - 4} stroke="#2563eb" strokeWidth="2" /><text x={L + 108} y={H - 1}>목표</text>
        <line x1={L + 150} x2={L + 164} y1={H - 4} y2={H - 4} stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" /><text x={L + 168} y={H - 1}>현재 페이스 예상</text>
      </g>
    </svg>
  );
}
