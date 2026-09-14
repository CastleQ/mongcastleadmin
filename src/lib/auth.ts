import { createClient } from "./supabase/server";

export type Session = { email: string | null; isAdmin: boolean };

/** 로그인 이메일(토큰 로컬 검증) + 관리자 여부(admins 표). 화면 분기용 — 데이터 보호는 RLS가 담당 */
export async function getSession(): Promise<Session> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims.email === "string" ? data.claims.email : null;
  if (!email) return { email: null, isAdmin: false };
  const { data: row } = await supabase.from("admins").select("email").eq("email", email).maybeSingle();
  return { email, isAdmin: !!row };
}
