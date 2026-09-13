import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "../template-form";

export default async function NewTemplatePage() {
  const supabase = await createClient();
  const { count } = await supabase.from("templates").select("*", { count: "exact", head: true });
  return (
    <>
      <div className="mb-1 text-sm text-zinc-500"><Link href="/templates" className="hover:underline">고객 응대 템플릿</Link> ›</div>
      <h2 className="mb-5 text-xl font-bold">문구 추가</h2>
      <TemplateForm nextOrder={(count ?? 0) + 1} />
    </>
  );
}
