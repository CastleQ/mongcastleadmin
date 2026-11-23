import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** 로그아웃을 서버에서 처리 — 브라우저용 Supabase 부품(가장 큰 JS 파일)을 모든 페이지에서 받지 않게 (2026-11-23) */
export function SignOutButton() {
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout"); // 머리줄·메뉴를 로그아웃 상태로 다시 그림
    redirect("/");
  }
  return (
    <form action={signOut}>
      <button type="submit" className="text-zinc-300 hover:text-white">
        로그아웃
      </button>
    </form>
  );
}
