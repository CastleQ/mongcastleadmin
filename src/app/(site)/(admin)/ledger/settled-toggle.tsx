"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setSettled } from "./actions";
import { Switch } from "./controls";

/** 목록에서 정산여부를 바로 바꾸는 스위치 */
export function SettledToggle({ id, settled }: { id: number; settled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={settled}
      disabled={pending}
      onChange={(v) => start(async () => { await setSettled(id, v); router.refresh(); })}
    />
  );
}
