import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Nav } from "./nav";
import { SignOutButton } from "./sign-out-button";

/** 공통 껍데기: 헤더 + 메뉴. 관리자면 관리 메뉴까지, 아니면 공개 메뉴만 */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { email, isAdmin } = await getSession();

  return (
    <>
      <header className="bg-zinc-900 text-white">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
          <Link href="/" className="font-bold text-lg">
            몽캐슬 파티룸 {isAdmin && <span className="text-zinc-400 font-normal text-sm">관리자</span>}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {email ? (
              <>
                <span className="hidden sm:inline text-zinc-300">{email}</span>
                {isAdmin && <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs">관리자</span>}
                <SignOutButton />
              </>
            ) : (
              <Link href="/login" className="text-zinc-300 hover:text-white">관리자 로그인</Link>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl flex flex-col md:flex-row gap-4 md:p-4">
        <aside className="md:w-52 shrink-0">
          <Nav admin={isAdmin} />
        </aside>
        <main className="flex-1 min-w-0 bg-white md:rounded-lg md:border border-zinc-200 p-4">
          {children}
        </main>
      </div>
    </>
  );
}
