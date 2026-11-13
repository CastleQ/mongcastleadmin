"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GRADES, GRADE_STYLE, type CustomerSummary, type Grade } from "@/lib/customers";
import { fillCustomerPhone, saveCustomer } from "./actions";

const won = (n: number) => n.toLocaleString("ko-KR");
const ROW_STYLE: Record<Grade, string> = { 일반: "hover:bg-zinc-50", 단골: "bg-yellow-50 hover:bg-yellow-100", 그레이: "bg-zinc-100 hover:bg-zinc-200", 블랙: "bg-red-50 hover:bg-red-100" };

function MemoCell({ c }: { c: CustomerSummary }) {
  const [v, setV] = useState(c.memo ?? "");
  const save = () => { if (v.trim() !== (c.memo ?? "")) saveCustomer(c.key, { name: c.name, phone: c.phone, memo: v.trim() || null }); };
  return (
    <input value={v} onChange={(e) => setV(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      placeholder="메모" onClick={(e) => e.stopPropagation()}
      className="w-full min-w-40 rounded border border-transparent bg-transparent px-2 py-1 text-sm hover:border-zinc-300 focus:border-zinc-900 focus:bg-white focus:outline-none" />
  );
}

/** 연락처가 빈 고객만: 입력하면 그 고객의 빈 거래 연락처에 채워진다 */
function PhoneCell({ c }: { c: CustomerSummary }) {
  const router = useRouter();
  const [v, setV] = useState("");
  const [pending, start] = useTransition();
  const save = () => {
    if (!v.trim()) return;
    if (!confirm(`${c.name ?? "이 고객"}님의 연락처 빈 거래 ${c.ledger_ids.length}건에 ${v.trim()} 을(를) 넣을까요?`)) return;
    start(async () => {
      const err = await fillCustomerPhone(c.key, v);
      if (err) alert(err); else router.refresh();
    });
  };
  return (
    <input value={v} onChange={(e) => setV(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      placeholder={pending ? "저장 중…" : "연락처 입력"} disabled={pending} inputMode="tel" onClick={(e) => e.stopPropagation()}
      className="w-32 rounded border border-dashed border-zinc-300 bg-white px-2 py-1 text-sm tabular-nums focus:border-zinc-900 focus:outline-none" />
  );
}

export function CustomerTable({ rows }: { rows: CustomerSummary[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const setGrade = (c: CustomerSummary, grade: Grade) =>
    start(async () => { await saveCustomer(c.key, { name: c.name, phone: c.phone, grade }); router.refresh(); });
  const td = "px-2 py-2 whitespace-nowrap text-center";

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm border-y border-zinc-200">
        <thead>
          <tr className="bg-zinc-50 text-xs text-zinc-500">
            {["고객명", "연락처", "등급", "방문", "최근 방문", "누적 실수령", "채널", "메모"].map((h) => <th key={h} className={`${td} font-medium`}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((c) => (
            <tr key={c.key} onClick={() => router.push(`/customers/${encodeURIComponent(c.key)}`)} className={`cursor-pointer ${ROW_STYLE[c.grade]}`}>
              <td className={`${td} font-medium`}>{c.name ?? <span className="text-zinc-400">이름 없음</span>}</td>
              <td className={`${td} text-zinc-500 tabular-nums`} onClick={c.phone ? undefined : (e) => e.stopPropagation()}>{c.phone ?? <PhoneCell c={c} />}</td>
              <td className={td} onClick={(e) => e.stopPropagation()}>
                <select value={c.grade} disabled={pending} onChange={(e) => setGrade(c, e.target.value as Grade)}
                  className={`rounded border border-zinc-300 px-2 py-1 text-xs ${GRADE_STYLE[c.grade]}`}>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </td>
              <td className={`${td} tabular-nums`}>{c.visits}회</td>
              <td className={`${td} tabular-nums`}>{c.last_date}</td>
              <td className={`${td} tabular-nums`}>{won(c.total_net)}</td>
              <td className={`${td} text-zinc-500`}>{c.channels.join(", ")}</td>
              <td className="px-1 py-1" onClick={(e) => e.stopPropagation()}><MemoCell c={c} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
