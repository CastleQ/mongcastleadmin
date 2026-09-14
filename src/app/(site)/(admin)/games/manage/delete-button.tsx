"use client";

import { deleteGame } from "./actions";

export function DeleteGameButton({ id, name, back }: { id: number; name: string; back?: string }) {
  return (
    <button type="button" className="text-sm text-red-600 hover:underline"
      onClick={() => { if (confirm(`"${name}"을(를) 삭제할까요? 되돌릴 수 없어요.`)) deleteGame(id, back ?? null); }}>
      이 게임 삭제
    </button>
  );
}
