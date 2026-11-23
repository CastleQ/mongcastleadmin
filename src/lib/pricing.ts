import { CHANNELS } from "./ledger.ts";
import { dayType, isHoliday, nextDay } from "./holidays.ts";
import { DEFAULT_PRICES, FRIEND_DISCOUNT_RATE, friendDiscountPct, type Prices } from "./prices.ts";

export type Suggestion = { base: number; overnight: number; extraPeople: number; deposit: number; total: number; label: string };

/** 보증금 규칙: 지정 채널(지인 제외)만. 기타·미입력은 0 */
export const depositFor = (channel: string | null, deposit: number) =>
  channel && CHANNELS.includes(channel) && channel !== "지인" ? deposit : 0;

/** 예약일·패키지·채널·인원으로 입금액 제안. 모르는 패키지(기타)면 null */
export function suggestAmount(date: string, pkg: string | null, channel: string | null, prices: Prices = DEFAULT_PRICES, headcount: number | null = null): Suggestion | null {
  if (!date || !pkg) return null;
  const overnight = pkg === "밤+밤샘";
  const key = overnight ? "밤" : pkg;
  if (key !== "낮" && key !== "밤" && key !== "전일") return null;
  const day = dayType(date);
  // 다음 날이 공휴일이면 금요일이어도 "공휴일 전일" (요금은 금요일 칸 그대로)
  const dayLabel = day === "금요일" && isHoliday(nextDay(date)) ? "공휴일 전일" : day;
  const pkgLabel = dayLabel === "공휴일 전일" && key === "전일" ? "하루종일" : key; // '공휴일 전일 전일' 겹침 방지
  const col = day === "평일" ? 0 : day === "금요일" ? 1 : 2;
  const base = prices[key][col];
  const extra = overnight ? prices.밤샘 : 0;
  const over = key === "전일" ? 0 : Math.max(0, (headcount ?? 0) - prices.기준인원); // 전일은 인원 추가 무료
  const extraPeople = over * prices.인원추가;
  const deposit = depositFor(channel, prices.보증금);
  // 지인은 총 금액에서 20% 할인. 보증금은 지인에게 아예 없으므로(depositFor) 할인 대상 밖
  const friend = channel === "지인";
  const subtotal = base + extra + extraPeople;
  const won = (n: number) => n.toLocaleString("ko-KR");
  return {
    base, overnight: extra, extraPeople, deposit,
    total: (friend ? Math.round(subtotal * FRIEND_DISCOUNT_RATE) : subtotal) + deposit,
    label: `${dayLabel} ${pkgLabel} ${won(base)}${extra ? ` + 밤샘 ${won(extra)}` : ""}${extraPeople ? ` + 인원 ${over}명 ${won(extraPeople)}` : ""}${deposit ? ` + 보증금 ${won(deposit)}` : ""}${friend ? ` − 지인할인 ${friendDiscountPct()}%` : ""}`,
  };
}
