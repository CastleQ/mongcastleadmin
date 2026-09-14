"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const signIn = () =>
    createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">몽캐슬 파티룸 관리자</h1>
      <p className="-mt-3 text-sm text-zinc-500">관리자로 등록된 구글 계정만 관리 메뉴를 쓸 수 있어요.</p>
      <button
        onClick={signIn}
        className="rounded border px-5 py-2 hover:bg-zinc-100"
      >
        구글 계정으로 로그인
      </button>
    </main>
  );
}
