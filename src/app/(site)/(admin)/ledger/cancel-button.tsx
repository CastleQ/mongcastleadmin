"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setCancelled } from "./actions";

/** 예약취소 ↔ 취소 되돌리기. 거래·고객 정보는 남고 합계·달력에서만 빠진다 */
export function CancelButton({ id, cancelled }: { id: number; cancelled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const ask = cancelled
    ? "예약을 되살릴까요? 다시 합계·달력에 들어가요."
    : "손님이 취소한 예약으로 표시할까요?\n합계·매출·달력에서 빠지고, 고객 정보는 남아요. (나중에 되돌릴 수 있어요)";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => { if (confirm(ask)) start(async () => { await setCancelled(id, !cancelled); router.refresh(); }); }}
      className={`rounded border px-5 py-2.5 disabled:opacity-50 ${cancelled ? "border-zinc-300 hover:bg-zinc-50" : "border-red-300 text-red-700 hover:bg-red-50"}`}
    >
      {pending ? "바꾸는 중…" : cancelled ? "취소 되돌리기" : "예약취소"}
    </button>
  );
}
