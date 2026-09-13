import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Template } from "@/lib/templates";
import { TemplateForm } from "../template-form";

export default async function EditTemplatePage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select("*").eq("id", Number(id)).maybeSingle();
  const row: Template | null = data;
  if (!row) notFound();

  return (
    <>
      <div className="mb-1 text-sm text-zinc-500"><Link href="/templates" className="hover:underline">고객 응대 템플릿</Link> ›</div>
      <h2 className="mb-5 text-xl font-bold">문구 수정</h2>
      <TemplateForm row={row} />
    </>
  );
}
