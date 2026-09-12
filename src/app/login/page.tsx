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
      <h1 className="text-2xl font-bold">몽캐슬 admin</h1>
      <button
        onClick={signIn}
        className="rounded border px-5 py-2 hover:bg-zinc-100"
      >
        구글로 로그인
      </button>
    </main>
  );
}
