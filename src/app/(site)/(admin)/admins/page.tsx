import { getSession } from "@/lib/auth";
import { fmtDateTime } from "@/lib/markdown";
import { createClient } from "@/lib/supabase/server";
import { addAdmin } from "./actions";
import { RemoveAdminButton } from "./remove-button";

export default async function AdminsPage() {
  const me = await getSession();
  const supabase = await createClient();
  const { data } = await supabase.from("admins").select("*").order("added_at");
  const rows: { email: string; added_at: string }[] = data ?? [];

  return (
    <>
      <h2 className="mb-1 text-xl font-bold">관리자 관리</h2>
      <p className="mb-4 text-sm text-zinc-500">여기 등록된 구글 계정만 관리 메뉴를 쓸 수 있어요. 등록하면 그 사람이 다음에 로그인할 때부터 바로 적용됩니다.</p>

      <ul className="mb-5 max-w-xl divide-y divide-zinc-100 border-y border-zinc-200">
        {rows.map((r) => (
          <li key={r.email} className="flex items-center gap-3 px-2 py-2.5 text-sm">
            <span className="flex-1 font-medium">{r.email}{r.email === me.email && <span className="ml-2 text-xs text-zinc-400">(나)</span>}</span>
            <span className="text-xs text-zinc-400">{fmtDateTime(r.added_at)}</span>
            {r.email !== me.email && <RemoveAdminButton email={r.email} />}
          </li>
        ))}
      </ul>

      <form action={addAdmin} className="flex max-w-xl gap-2">
        <input name="email" type="email" required placeholder="추가할 구글 계정 이메일" autoComplete="off"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none" />
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700">관리자 추가</button>
      </form>
    </>
  );
}
