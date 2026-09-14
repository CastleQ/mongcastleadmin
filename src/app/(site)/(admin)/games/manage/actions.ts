"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GAME_KINDS, type Game } from "@/lib/games";

function parse(f: FormData): Omit<Game, "id" | "image_url"> {
  const s = (k: string) => (f.get(k) as string | null)?.trim() || null;
  const n = (k: string) => { const v = s(k); return v === null ? null : Number(v.replace(/[^\d]/g, "")) || null; };
  const kind = GAME_KINDS.includes(s("kind") as Game["kind"]) ? (s("kind") as Game["kind"]) : "보드게임";
  return {
    kind,
    name: s("name") ?? "",
    name_original: s("name_original"),
    category: s("category"),
    expansion: s("expansion"),
    qty: n("qty") ?? 1,
    language: s("language"),
    players: s("players"),
    play_minutes: n("play_minutes"),
    gm_required: f.get("gm_required") === "on",
    translated: f.get("translated") === "on",
    price: n("price"),
    link: s("link"),
    synopsis: s("synopsis"),
    note: s("note"),
    bgg_id: n("bgg_id"),
  };
}

/** 이미지: 파일이 있으면 저장공간에 올리고 그 주소, 없으면 입력한 주소 */
async function resolveImage(f: FormData, current: string | null): Promise<string | null> {
  const supabase = await createClient();
  const file = f.get("image_file");
  if (file instanceof File && file.size > 0) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("games").upload(path, file, { contentType: file.type || undefined });
    if (error) throw new Error("이미지 업로드 실패: " + error.message);
    return supabase.storage.from("games").getPublicUrl(path).data.publicUrl;
  }
  const url = (f.get("image_url") as string | null)?.trim();
  return url ? url : f.get("image_clear") === "on" ? null : current;
}

export async function saveGame(id: number | null, formData: FormData) {
  const row = parse(formData);
  if (!row.name) throw new Error("이름은 비울 수 없어요");
  const supabase = await createClient();
  let current: string | null = null;
  if (id !== null) {
    const { data } = await supabase.from("games").select("image_url").eq("id", id).maybeSingle();
    current = data?.image_url ?? null;
  }
  const image_url = await resolveImage(formData, current);
  const q = id === null
    ? supabase.from("games").insert({ ...row, image_url })
    : supabase.from("games").update({ ...row, image_url }).eq("id", id);
  const { error } = await q;
  if (error) throw new Error(error.message);
  redirect("/games/manage");
}

export async function deleteGame(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/games/manage");
}
