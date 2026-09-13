"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Ledger } from "@/lib/ledger";
import { SettledToggle } from "./settled-toggle";

const won = (n: number) => n.toLocaleString("ko-KR");

type SortKey = "date" | "kind" | "category" | "package" | "amount" | "net";
const HEAD: { label: string; key?: SortKey }[] = [
  { label: "no." }, { label: "예약일", key: "date" }, { label: "구분", key: "kind" }, { label: "항목", key: "category" },
  { label: "고객명" }, { label: "고객연락처" }, { label: "패키지", key: "package" }, { label: "콘텐츠" }, { label: "이용시간" }, { label: "결제방식" },
  { label: "입금액", key: "amount" }, { label: "수수료" }, { label: "기타지출" }, { label: "실수령", key: "net" }, { label: "정산여부" },
];

/** 숫자는 크기순, 글자는 가나다순. 빈 값은 항상 뒤로 */
function compare(a: Ledger, b: Ledger, key: SortKey): number {
  const x = a[key], y = b[key];
  if (x === null || x === undefined) return 1;
  if (y === null || y === undefined) return -1;
  return typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ko");
}

export function LedgerTable({ rows }: { rows: Ledger[] }) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "date", asc: false });
  const sorted = [...rows].sort((a, b) => (compare(a, b, sort.key) || b.id - a.id) * (sort.asc ? 1 : -1));
  const td = "px-2 py-2 whitespace-nowrap text-center";

  const toggle = (key: SortKey) => setSort((s) => ({ key, asc: s.key === key ? !s.asc : key === "date" || key === "amount" || key === "net" ? false : true }));

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm border-y border-zinc-200">
        <thead>
          <tr className="bg-zinc-50 text-xs text-zinc-500">
            {HEAD.map((h) => (
              <th key={h.label} className={`${td} font-medium ${h.key ? "cursor-pointer select-none hover:text-zinc-900" : ""}`}
                onClick={h.key ? () => toggle(h.key!) : undefined}
                aria-sort={h.key === sort.key ? (sort.asc ? "ascending" : "descending") : undefined}>
                {h.label}
                {h.key === sort.key && <span className="ml-0.5">{sort.asc ? "↑" : "↓"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {sorted.map((r, i) => {
            const sale = r.kind === "매출";
            return (
              <tr key={r.id} onClick={() => router.push(`/ledger/${r.id}?from=ledger`)}
                className={`cursor-pointer ${r.settled ? "hover:bg-zinc-50" : "bg-amber-50 hover:bg-amber-100"}`}>
                <td className={`${td} text-zinc-400`}>{i + 1}</td>
                <td className={td}>{r.date.slice(5).replace("-", "/")}</td>
                <td className={td}><span className={`rounded px-1.5 py-0.5 text-xs ${sale ? "bg-zinc-900 text-white" : "bg-red-50 text-red-700"}`}>{r.kind}</span></td>
                <td className={td}>{r.category}</td>
                <td className={`${td} font-medium`}>{r.customer_name ?? "—"}</td>
                <td className={`${td} text-zinc-500`}>{r.customer_phone ?? ""}</td>
                <td className={td}>{r.package ?? ""}</td>
                <td className={td}>{r.content ?? ""}</td>
                <td className={td}>{r.hours ? `${r.hours}h` : ""}</td>
                <td className={`${td} text-zinc-500`}>{r.payment_method ?? ""}</td>
                <td className={`${td} tabular-nums ${r.settled ? "" : "text-zinc-400"}`}>{won(r.amount)}</td>
                <td className={`${td} tabular-nums text-zinc-500`}>{r.fee ? won(r.fee) : ""}</td>
                <td className={`${td} tabular-nums text-zinc-500`}>{r.other_expense ? won(r.other_expense) : ""}</td>
                <td className={`${td} tabular-nums ${r.settled ? (sale ? "font-medium" : "text-red-600") : "text-zinc-400"}`}>{won(r.net)}</td>
                {/* 스위치 칸은 행 클릭(상세 이동)과 분리 */}
                <td className={td} onClick={(e) => e.stopPropagation()}><SettledToggle id={r.id} settled={r.settled} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
