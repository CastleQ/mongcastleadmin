import Link from "next/link";
import type { Customer } from "@/lib/customers";

/** 그레이/블랙 고객 경고 띠. 일반이면 아무것도 안 그림 */
export function CustomerWarning({ c }: { c: Customer | null | undefined }) {
  if (!c || c.grade === "일반") return null;
  const black = c.grade === "블랙";
  return (
    <div role="alert" className={`flex flex-wrap items-center gap-2 rounded px-3 py-2 text-sm ${black ? "bg-red-600 text-white" : "bg-zinc-800 text-white"}`}>
      <span className="font-bold">⚠ {c.grade} 고객</span>
      <span>{c.name ?? ""}{c.phone ? ` · ${c.phone}` : ""}</span>
      {c.memo && <span className="opacity-90">— {c.memo}</span>}
      <Link href={`/customers/${encodeURIComponent(c.key)}`} className="ml-auto underline opacity-80 hover:opacity-100">이력 보기</Link>
    </div>
  );
}
