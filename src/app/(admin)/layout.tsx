import { createClient } from "@/lib/supabase/server";
import { Nav } from "./nav";
import { SignOutButton } from "./sign-out-button";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <header className="bg-zinc-900 text-white">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
          <h1 className="font-bold text-lg">몽캐슬 파티룸 <span className="text-zinc-400 font-normal text-sm">관리자</span></h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-zinc-300">{user?.email}</span>
            <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs">관리자</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl flex flex-col md:flex-row gap-4 md:p-4">
        <aside className="md:w-52 shrink-0">
          <Nav />
        </aside>
        <main className="flex-1 min-w-0 bg-white md:rounded-lg md:border border-zinc-200 p-4">
          {children}
        </main>
      </div>
    </>
  );
}
