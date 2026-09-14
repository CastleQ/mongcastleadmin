"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setDefault } from "@/lib/templates";

export async function saveTemplate(id: number | null, formData: FormData) {
  const s = (k: string) => (formData.get(k) as string | null)?.trim() || null;
  const row = {
    name: s("name") ?? "",
    when_to: s("when_to"),
    body: (formData.get("body") as string | null)?.replace(/\r\n/g, "\n").trim() ?? "",
    note: s("note"),
    sort_order: Number(s("sort_order")) || 0,
  };
  if (!row.name || !row.body) throw new Error("상황과 템플릿은 비울 수 없어요");
  const supabase = await createClient();
  const q = id === null
    ? supabase.from("templates").insert(row)
    : supabase.from("templates").update(row).eq("id", id);
  const { error } = await q;
  if (error) throw new Error(error.message);
  redirect("/templates");
}

export async function deleteTemplate(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/templates");
}

/** 채운 값을 그 칸의 기본값으로 템플릿에 저장 */
export async function saveSlotDefault(id: number, key: string, value: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("templates").select("body").eq("id", id).single();
  if (error) throw new Error(error.message);
  const body = setDefault(data.body, key, value.trim());
  const { error: e2 } = await supabase.from("templates").update({ body }).eq("id", id);
  if (e2) throw new Error(e2.message);
}

/** 목록 순서 한 칸 이동 (위/아래). 이동 후 1..n으로 다시 번호 매김 */
export async function moveTemplate(id: number, dir: "up" | "down") {
  const supabase = await createClient();
  const { data, error } = await supabase.from("templates").select("id").order("sort_order").order("id");
  if (error) throw new Error(error.message);
  const ids = data.map((r) => r.id as number);
  const i = ids.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((tid, k) => supabase.from("templates").update({ sort_order: k + 1 }).eq("id", tid)));
}

/** 옛 버전으로 되돌리기 = 그 내용으로 다시 저장 (이것도 기록에 남음) */
export async function restoreTemplateVersion(templateId: number, versionId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("template_versions").select("name,when_to,body,note").eq("id", versionId).eq("template_id", templateId).single();
  if (error) throw new Error(error.message);
  const { error: e2 } = await supabase.from("templates").update(data).eq("id", templateId);
  if (e2) throw new Error(e2.message);
}
