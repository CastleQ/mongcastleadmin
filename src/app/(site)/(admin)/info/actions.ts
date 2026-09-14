"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const clean = (s: FormDataEntryValue | string | null) => (typeof s === "string" ? s.replace(/\r\n/g, "\n").trim() : "");

/** 섹션 저장 (기록은 DB 트리거가 자동으로 남김) */
export async function saveSection(id: number, title: string, body: string) {
  title = clean(title); body = clean(body);
  if (!title) throw new Error("제목은 비울 수 없어요");
  const supabase = await createClient();
  const { error } = await supabase.from("info_sections").update({ title, body, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createSection(formData: FormData) {
  const title = clean(formData.get("title")); const body = clean(formData.get("body"));
  if (!title) throw new Error("제목은 비울 수 없어요");
  const supabase = await createClient();
  const { count } = await supabase.from("info_sections").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("info_sections").insert({ title, body, sort_order: (count ?? 0) + 1 });
  if (error) throw new Error(error.message);
  redirect("/info");
}

export async function deleteSection(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("info_sections").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/info");
}

/** 순서 한 칸 이동 (기록 안 남음: 제목/본문이 안 바뀌므로 트리거 미발동) */
export async function moveSection(id: number, dir: "up" | "down") {
  const supabase = await createClient();
  const { data, error } = await supabase.from("info_sections").select("id").order("sort_order").order("id");
  if (error) throw new Error(error.message);
  const ids = data.map((r) => r.id as number);
  const i = ids.indexOf(id), j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((sid, k) => supabase.from("info_sections").update({ sort_order: k + 1 }).eq("id", sid)));
}

/** 옛 버전으로 되돌리기 = 그 내용으로 다시 저장 (이것도 기록에 남음) */
export async function restoreVersion(sectionId: number, versionId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("info_versions").select("title,body").eq("id", versionId).eq("section_id", sectionId).single();
  if (error) throw new Error(error.message);
  await saveSection(sectionId, data.title, data.body);
}
