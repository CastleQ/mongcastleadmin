import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Template } from "@/lib/templates";
import { TemplateForm } from "../template-form";
import { TemplateHistory } from "../template-history";

type Version = { id: number; template_id: number; name: string; when_to: string | null; body: string; note: string | null; saved_at: string };

export default async function EditTemplatePage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: vs }] = await Promise.all([
    supabase.from("templates").select("*").eq("id", Number(id)).maybeSingle(),
    supabase.from("template_versions").select("*").eq("template_id", Number(id)).order("saved_at", { ascending: false }),
  ]);
  const row: Template | null = data;
  if (!row) notFound();
  // 기록 표는 제목+본문만 비교. '언제/기타'까지 합쳐서 본문으로 보여줌
  const versions = ((vs ?? []) as Version[]).map((v) => ({
    id: v.id, saved_at: v.saved_at, title: v.name,
    body: `${v.body}\n\n[언제] ${v.when_to ?? ""}\n[기타] ${v.note ?? ""}`,
  }));

  return (
    <>
      <div className="mb-1 text-sm text-zinc-500"><Link href="/templates" className="hover:underline">고객 응대 템플릿</Link> ›</div>
      <h2 className="mb-5 text-xl font-bold">문구 수정</h2>
      <TemplateForm row={row} />
      <TemplateHistory templateId={row.id} versions={versions} />
    </>
  );
}
