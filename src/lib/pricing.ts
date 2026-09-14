import { CHANNELS } from "./ledger.ts";
import { dayType } from "./holidays.ts";
import { DEFAULT_PRICES, type Prices } from "./prices.ts";

const PLATFORM_CHANNELS = ["스페이스클라우드", "아워플레이스"]; // 검색 노출가(인하가) 적용 채널

export type Suggestion = { base: number; overnight: number; deposit: number; total: number; label: string };

/** 보증금 규칙: 지정 채널(지인 제외)만. 기타·미입력은 0 */
export const depositFor = (channel: string | null, deposit: number) =>
  channel && CHANNELS.includes(channel) && channel !== "지인" ? deposit : 0;

/** 예약일·패키지·채널로 입금액 제안. 모르는 패키지(기타)면 null */
export function suggestAmount(date: string, pkg: string | null, channel: string | null, prices: Prices = DEFAULT_PRICES): Suggestion | null {
  if (!date || !pkg) return null;
  const overnight = pkg === "밤+밤샘";
  const key = overnight ? "밤" : pkg;
  if (key !== "낮" && key !== "밤" && key !== "전일") return null;
  const day = dayType(date);
  const [y, m, d] = date.split("-").map(Number);
  const isFri = new Date(y, m - 1, d).getDay() === 5;
  const dayLabel = day === "금요일" && !isFri ? "공휴일 전날" : day;
  const col = day === "평일" ? 0 : day === "금요일" ? 1 : 2;
  const table = channel && PLATFORM_CHANNELS.includes(channel) ? prices.플랫폼 : prices.기본;
  const base = table[key][col];
  const extra = overnight ? prices.밤샘 : 0;
  const deposit = depositFor(channel, prices.보증금);
  const won = (n: number) => n.toLocaleString("ko-KR");
  return {
    base, overnight: extra, deposit, total: base + extra + deposit,
    label: `${dayLabel} ${key} ${won(base)}${extra ? ` + 밤샘 ${won(extra)}` : ""}${deposit ? ` + 보증금 ${won(deposit)}` : ""}`,
  };
}
