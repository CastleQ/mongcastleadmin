"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const clean = (s: FormDataEntryValue | string | null) => (typeof s === "string" ? s.replace(/\r\n/g, "\n").trim() : "");

/** 공개 가이드와 편집 화면 둘 다 새로 그리게 */
const refresh = () => {
  revalidatePath("/guide");
  revalidatePath("/guide/manage");
};

/** 섹션 저장 (수정 기록은 DB 트리거가 자동으로 남김) */
export async function saveGuideSection(id: number, title: string, body: string) {
  title = clean(title);
  body = clean(body);
  if (!title) throw new Error("제목은 비울 수 없어요");
  const supabase = await createClient();
  const { error } = await supabase
    .from("guide_sections")
    .update({ title, body, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function createGuideSection(formData: FormData) {
  const title = clean(formData.get("title"));
  const body = clean(formData.get("body"));
  if (!title) throw new Error("제목은 비울 수 없어요");
  const supabase = await createClient();
  const { count } = await supabase.from("guide_sections").select("*", { count: "exact", head: true });
  // published 기본값 false — 다 쓰고 나서 직접 공개 스위치를 켠다
  const { error } = await supabase.from("guide_sections").insert({ title, body, sort_order: (count ?? 0) + 1 });
  if (error) throw new Error(error.message);
  refresh();
  redirect("/guide/manage");
}

export async function deleteGuideSection(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("guide_sections").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
  redirect("/guide/manage");
}

/** 손님에게 공개할지 켜고 끄기 (기록은 남지 않음: 제목·본문이 안 바뀌므로 트리거 미발동) */
export async function setGuidePublished(id: number, published: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("guide_sections").update({ published }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

/** 순서 한 칸 이동 */
export async function moveGuideSection(id: number, dir: "up" | "down") {
  const supabase = await createClient();
  const { data, error } = await supabase.from("guide_sections").select("id").order("sort_order").order("id");
  if (error) throw new Error(error.message);
  const ids = data.map((r) => r.id as number);
  const i = ids.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((sid, k) => supabase.from("guide_sections").update({ sort_order: k + 1 }).eq("id", sid)));
  refresh();
}

/** 옛 버전으로 되돌리기 = 그 내용으로 다시 저장 (이것도 기록에 남음) */
export async function restoreGuideVersion(sectionId: number, versionId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guide_versions")
    .select("title,body")
    .eq("id", versionId)
    .eq("section_id", sectionId)
    .single();
  if (error) throw new Error(error.message);
  await saveGuideSection(sectionId, data.title, data.body);
}
