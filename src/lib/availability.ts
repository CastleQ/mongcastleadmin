import { packageKind } from "./calendar.ts";

export const SLOTS = ["낮", "밤", "전일"] as const;
export type Slot = (typeof SLOTS)[number];
export type SlotState = "가능" | "예약" | "불가";

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
