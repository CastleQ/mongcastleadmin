import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 구글에서 돌아올 때 받은 code를 세션(로그인 상태)으로 바꿈
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
