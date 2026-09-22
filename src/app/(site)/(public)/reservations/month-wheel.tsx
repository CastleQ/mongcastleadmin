"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type Props = { prevHref: string; nextHref: string; className: string; children: ReactNode };

const STEP = 40;   // 이만큼 굴려야 한 달 이동 (트랙패드 잔떨림 무시)
const LOCK = 450;  // 이동 후 잠금 시간(ms) — 관성으로 여러 달 넘어가는 것 방지

/**
 * 달력 위에서 휠을 굴리면 앞뒤 달로 (구글 캘린더처럼).
 * 이전·다음 달 화면을 미리 받아둬서(prefetch) 휠도 ‹ › 버튼도 기다림 없이 바뀜.
 */
export function MonthWheel({ prevHref, nextHref, className, children }: Props) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const acc = useRef(0);
  const until = useRef(0);

  // 미리 받기는 헤더의 ‹ › Link(prefetch)가 담당 — 같은 주소라 휠도 그 캐시를 씀

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // 가로 스와이프는 그대로 둠
      e.preventDefault();
      const now = Date.now();
      if (now < until.current) return;
      acc.current += e.deltaY;
      if (Math.abs(acc.current) < STEP) return;
      const next = acc.current > 0;
      acc.current = 0;
      until.current = now + LOCK;
      router.push(next ? nextHref : prevHref);
    };
    el.addEventListener("wheel", onWheel, { passive: false }); // passive:false 여야 페이지 스크롤을 막을 수 있음
    return () => el.removeEventListener("wheel", onWheel);
  }, [router, prevHref, nextHref]);

  return <div ref={box} className={className}>{children}</div>;
}
