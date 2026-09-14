"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, PUBLIC_NAV, type NavItem } from "./nav-items";

function Item({ n, active }: { n: NavItem; active: boolean }) {
  return (
    <Link
      href={n.href}
      className={`block whitespace-nowrap px-4 py-3 text-sm md:border-b border-zinc-100 ${n.sub ? "md:pl-7" : ""} ${
        active ? "font-bold text-zinc-900 border-b-2 border-b-zinc-900 md:border-b md:border-b-zinc-100 md:bg-zinc-50" : "text-zinc-500 hover:text-zinc-900"
      }`}
    >
      {n.label}
    </Link>
  );
}

/** 공개 메뉴는 항상, 관리자 메뉴는 관리자에게만 */
export function Nav({ admin }: { admin: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex md:flex-col overflow-x-auto md:overflow-visible bg-white md:rounded-lg md:border border-b border-zinc-200">
      {PUBLIC_NAV.map((n) => <div key={n.href} className="shrink-0"><Item n={n} active={path === n.href} /></div>)}
      {admin && (
        <>
          <div className="hidden md:block px-4 pt-3 pb-1 text-xs text-zinc-400 border-t border-zinc-100">관리자</div>
          {ADMIN_NAV.map((n) => <div key={n.href} className="shrink-0"><Item n={n} active={path === n.href || path.startsWith(n.href + "/")} /></div>)}
        </>
      )}
    </nav>
  );
}
