/** 메뉴 클릭 직후, 데이터가 오기 전까지 보이는 뼈대 화면 */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="불러오는 중">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-zinc-200" />
        <div className="h-7 w-24 rounded bg-zinc-200" />
      </div>
      <div className="mb-4 h-16 rounded bg-zinc-100" />
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-10 rounded bg-zinc-100" />)}
      </div>
    </div>
  );
}
