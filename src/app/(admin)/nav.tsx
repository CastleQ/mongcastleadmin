"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV: { href: string; label: string; sub?: true }[] = [
  { href: "/", label: "예약현황" },
  { href: "/ledger", label: "거래" },
  { href: "/sales", label: "매출현황" },
  { href: "/customers", label: "고객관리" },
  { href: "/templates", label: "응대 문구" },
  { href: "/games", label: "보유게임목록", sub: true },
  { href: "/info", label: "몽캐슬파티룸 정보", sub: true },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex md:flex-col overflow-x-auto md:overflow-visible bg-white md:rounded-lg md:border border-b border-zinc-200">
      {NAV.map((n, i) => {
        const active = path === n.href;
        const firstSub = n.sub && !NAV[i - 1]?.sub;
        return (
          <div key={n.href} className="shrink-0">
            {firstSub && (
              <div className="hidden md:block px-4 pt-3 pb-1 text-xs text-zinc-400 border-t border-zinc-100">기타</div>
            )}
            <Link
              href={n.href}
              className={`block whitespace-nowrap px-4 py-3 text-sm md:border-b border-zinc-100 ${
                n.sub ? "md:pl-7" : ""
              } ${active ? "font-bold text-zinc-900 border-b-2 border-b-zinc-900 md:border-b md:border-b-zinc-100 md:bg-zinc-50" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {n.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
