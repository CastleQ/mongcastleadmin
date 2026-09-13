"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = { open: boolean; onClose: () => void; children: ReactNode; className?: string };

/**
 * 공용 모달. 바깥 클릭·ESC로 닫힘.
 * 단, 글자를 드래그로 선택하다 바깥에서 손을 떼는 경우는 닫지 않음
 * — "누른 곳"과 "뗀 곳"이 모두 바깥(배경)일 때만 닫음.
 */
export function Modal({ open, onClose, children, className = "" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onPointerDown={(e) => { downOnBackdrop.current = e.target === ref.current; }}
      onClick={(e) => { if (downOnBackdrop.current && e.target === ref.current) onClose(); downOnBackdrop.current = false; }}
      className={`m-auto w-[calc(100%-2rem)] max-w-4xl rounded-lg p-0 shadow-xl backdrop:bg-black/40 ${className}`}
    >
      {open && children}
    </dialog>
  );
}
