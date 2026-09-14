"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("이메일 형식이 아니에요");
  const supabase = await createClient();
  const { error } = await supabase.from("admins").insert({ email });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  revalidatePath("/admins");
}

export async function removeAdmin(email: string) {
  const me = await getSession();
  if (email === me.email) throw new Error("자기 자신은 뺄 수 없어요");
  const supabase = await createClient();
  const { error } = await supabase.from("admins").delete().eq("email", email);
  if (error) throw new Error(error.message);
  revalidatePath("/admins");
}
