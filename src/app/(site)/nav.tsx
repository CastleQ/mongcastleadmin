"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, PUBLIC_NAV, type NavItem } from "./nav-items";

function Item({ n, active }: { n: NavItem; active: boolean }) {
  return (
    <Link
      href={n.href}
      className={`block whitespace-nowrap px-4 py-2.5 text-[15px] md:border-l-[3px] ${
        active
          ? "font-bold text-zinc-900 bg-zinc-100 border-b-2 border-b-zinc-900 md:border-b-0 md:border-l-zinc-900"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 md:border-l-transparent"
      }`}
    >
      {n.label}
    </Link>
  );
}

function Group({ title, items, path }: { title: string; items: NavItem[]; path: string }) {
  return (
    <div className="flex shrink-0 md:block">
      <div className="hidden md:block px-4 pb-1 pt-3 text-xs font-semibold tracking-wide text-zinc-400">{title}</div>
      {items.map((n) => <Item key={n.href} n={n} active={path === n.href || (n.href !== "/" && path.startsWith(n.href + "/"))} />)}
    </div>
  );
}

/** 공개 메뉴는 항상, 관리자 메뉴는 관리자에게만. 폰에선 가로 탭, PC에선 세로 그룹 */
export function Nav({ admin }: { admin: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex md:flex-col overflow-x-auto md:overflow-visible bg-white md:rounded-lg md:border border-b border-zinc-200 md:pb-2">
      <Group title="공개" items={PUBLIC_NAV} path={path} />
      {admin && (
        <>
          <div className="hidden md:block mx-4 mt-2 border-t border-zinc-200" />
          <div className="md:hidden self-stretch border-l border-zinc-200 mx-1" />
          <Group title="관리자" items={ADMIN_NAV} path={path} />
        </>
      )}
    </nav>
  );
}
