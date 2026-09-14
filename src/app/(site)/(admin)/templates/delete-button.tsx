"use client";

import { deleteTemplate } from "./actions";

export function DeleteTemplateButton({ id }: { id: number }) {
  return (
    <button type="button" className="text-sm text-red-600 hover:underline"
      onClick={() => { if (confirm("이 문구를 삭제할까요? 되돌릴 수 없어요.")) deleteTemplate(id); }}>
      이 문구 삭제
    </button>
  );
}
