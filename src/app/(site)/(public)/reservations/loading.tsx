/** 예약현황 탭을 누른 직후, 데이터가 오기 전까지 보이는 달력 모양 뼈대 (칸 높이는 calendar.tsx와 같게) */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="불러오는 중">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-8 w-44 rounded bg-zinc-200 sm:h-9 sm:w-72" />
        <div className="h-7 w-32 rounded bg-zinc-200 sm:w-64" />
      </div>
      <div className="mb-4 h-10 rounded bg-zinc-100" />
      <div className="grid grid-cols-7 border-l border-t border-zinc-200">
        {Array.from({ length: 42 }, (_, i) => (
          <div key={i} className={`border-r border-b border-zinc-200 ${i < 7 ? "h-9 bg-zinc-50" : "min-h-16 p-1 sm:min-h-24"}`}>
            {i >= 7 && <div className="h-3 w-4 rounded bg-zinc-100" />}
          </div>
        ))}
      </div>
    </div>
  );
}
