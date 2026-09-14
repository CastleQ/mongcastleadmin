import { CHANNELS, DEPOSIT } from "./ledger.ts";
import { dayType } from "./holidays.ts";

/** 요금표 (원). 값 바뀌면 여기만 고치면 됨. 순서: [월~목, 금, 토·일] */
const PRICE = {
  기본: { 낮: [50_000, 50_000, 100_000], 밤: [70_000, 110_000, 170_000], 전일: [100_000, 180_000, 260_000] },
  플랫폼: { 낮: [40_000, 40_000, 110_000], 밤: [80_000, 110_000, 170_000], 전일: [100_000, 180_000, 260_000] },
} as const;
const OVERNIGHT = 30_000; // 밤샘 옵션
const PLATFORM_CHANNELS = ["스페이스클라우드", "아워플레이스"]; // 검색 노출가(인하가) 적용 채널

export type Suggestion = { base: number; overnight: number; deposit: number; total: number; label: string };

/** 예약일·패키지·채널로 입금액 제안. 모르는 패키지(기타)면 null */
export function suggestAmount(date: string, pkg: string | null, channel: string | null): Suggestion | null {
  if (!date || !pkg) return null;
  const overnight = pkg === "밤+밤샘";
  const key = overnight ? "밤" : pkg;
  if (key !== "낮" && key !== "밤" && key !== "전일") return null;
  const day = dayType(date);
  const [y, m, d] = date.split("-").map(Number);
  const isFri = new Date(y, m - 1, d).getDay() === 5;
  const dayLabel = day === "금요일" && !isFri ? "공휴일 전날" : day;
  const col = day === "평일" ? 0 : day === "금요일" ? 1 : 2;
  const table = channel && PLATFORM_CHANNELS.includes(channel) ? PRICE.플랫폼 : PRICE.기본;
  const base = table[key][col];
  const extra = overnight ? OVERNIGHT : 0;
  const deposit = channel && CHANNELS.includes(channel) && channel !== "지인" ? DEPOSIT : 0; // 기타·미입력은 보증금 없음
  return {
    base, overnight: extra, deposit, total: base + extra + deposit,
    label: `${dayLabel} ${key} ${base.toLocaleString("ko-KR")}${extra ? ` + 밤샘 ${extra.toLocaleString("ko-KR")}` : ""}${deposit ? ` + 보증금 ${deposit.toLocaleString("ko-KR")}` : ""}`,
  };
}
