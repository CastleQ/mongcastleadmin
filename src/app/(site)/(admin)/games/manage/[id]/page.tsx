import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/games";
import { GameForm } from "../game-form";

export default async function EditGamePage({ params }: PageProps<"/games/manage/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").eq("id", Number(id)).maybeSingle();
  const row: Game | null = data;
  if (!row) notFound();
  return (
    <>
      <div className="mb-1 text-sm text-zinc-500"><Link href="/games/manage" className="hover:underline">게임 관리</Link> ›</div>
      <h2 className="mb-5 text-xl font-bold">{row.name}</h2>
      <GameForm row={row} />
    </>
  );
}
