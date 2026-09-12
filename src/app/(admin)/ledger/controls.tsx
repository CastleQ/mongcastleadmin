"use client";

import type { ReactNode } from "react";

/** 켜짐/꺼짐 스위치. 폼 안(name)에서도, 즉시 저장(onChange)에서도 사용 */
export function Switch({ name, checked, defaultChecked, onChange, disabled, children }: {
  name?: string; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean; children?: ReactNode;
}) {
  return (
    <label className={`inline-flex items-center gap-3 text-sm ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input type="checkbox" name={name} checked={checked} defaultChecked={defaultChecked} disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)} className="peer sr-only" />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-zinc-300 transition peer-checked:bg-zinc-900 peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-400 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
      {children}
    </label>
  );
}
