"use client";

import { deleteLedger } from "./actions";

export function DeleteButton({ id, date, from }: { id: number; date: string; from?: string }) {
  return (
    <button
      type="button"
      onClick={() => { if (confirm("이 거래를 삭제할까요? 되돌릴 수 없어요.")) deleteLedger(id, date, from ?? null); }}
      className="text-sm text-red-600 hover:underline"
    >
      이 거래 삭제
    </button>
  );
}
