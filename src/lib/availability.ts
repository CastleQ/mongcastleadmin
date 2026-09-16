import { packageKind } from "./calendar.ts";

export const SLOTS = ["낮", "밤", "전일"] as const;
export type Slot = (typeof SLOTS)[number];
export type SlotState = "가능" | "예약" | "불가";

/** 손님 달력: 예약 가능한 슬롯 색 (낮 노랑 · 밤 파랑 · 전일 초록). 불가·예약은 모두 회색 */
export const OPEN_COLOR: Record<Slot, string> = {
  낮: "bg-yellow-200 text-yellow-950 hover:bg-yellow-300",
  밤: "bg-sky-200 text-sky-950 hover:bg-sky-300",
  전일: "bg-green-200 text-green-950 hover:bg-green-300",
};

/**
 * 하루에 잡힌 패키지들 → 낮·밤·전일 슬롯 상태.
 * 전일 = 낮+밤이므로 둘 다 비어야 가능. 전일(또는 알 수 없는 기타) 예약은 하루 전체를 막음.
 */
export function slotStates(packages: (string | null)[]): Record<Slot, SlotState> {
  const kinds = packages.map(packageKind);
  const full = kinds.includes("전일") || kinds.includes("기타");
  const 낮: SlotState = full || kinds.includes("낮") ? "예약" : "가능";
  const 밤: SlotState = full || kinds.includes("밤") ? "예약" : "가능";
  const 전일: SlotState = full ? "예약" : 낮 === "가능" && 밤 === "가능" ? "가능" : "불가";
  return { 낮, 밤, 전일 };
}
