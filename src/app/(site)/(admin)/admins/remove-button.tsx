"use client";

import { removeAdmin } from "./actions";

export function RemoveAdminButton({ email }: { email: string }) {
  return (
    <button type="button" className="text-xs text-red-600 hover:underline"
      onClick={() => { if (confirm(`${email} 의 관리자 권한을 뺄까요?`)) removeAdmin(email); }}>
      권한 제거
    </button>
  );
}
