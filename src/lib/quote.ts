import { suggestAmount } from "./pricing.ts";
import { FRIEND_DISCOUNT_RATE, type Prices } from "./prices.ts";

/** 입금안내 템플릿의 패키지 드롭다운 (밤샘은 옵션으로) */
export const QUOTE_PACKAGES = ["낮", "밤", "전일"] as const;

/** 옵션: add = 더하는 금액, rate = 총액에 곱하는 비율 (지인할인 0.8) */
export type QuoteOption = { label: string; add: number; rate: number };
/** 고른 패키지를 받는 이유: 전일 대관은 밤샘이 무료라 가산금이 0이 된다 */
export const quoteOptions = (p: Prices, pkg = ""): QuoteOption[] => [
  { label: "밤샘", add: pkg === "전일" ? 0 : p.밤샘, rate: 1 },
  { label: "청소보증금", add: p.보증금, rate: 1 },
  { label: "지인할인", add: 0, rate: FRIEND_DISCOUNT_RATE },
  { label: "시계피 사회", add: 100_000, rate: 1 },
];

const won = (n: number) => n.toLocaleString("ko-KR");

/**
 * 옵션 한 줄 문구: "밤샘 +30,000원" / "지인할인 -20%" / 전일이면 "밤샘 포함 (무료)".
 * 목록에 없는 값(직접 입력)은 그대로
 */
export function optionText(label: string, p: Prices, pkg = ""): string {
  const o = quoteOptions(p, pkg).find((x) => x.label === label);
  if (!o) return label;
  if (o.rate !== 1) return `${label} -${Math.round((1 - o.rate) * 100)}%`;
  return o.add === 0 ? `${label} 포함 (무료)` : `${label} +${won(o.add)}원`;
}

/** 패키지 줄 문구 + 기본가. 날짜나 패키지를 모르면(직접 입력) 기본가 null, 문구는 입력값 그대로 */
export function packageQuote(date: string, pkg: string, p: Prices): { text: string; base: number | null } {
  const sg = date && pkg ? suggestAmount(date, pkg, null, p) : null;
  if (!sg) return { text: pkg, base: null };
  const day = sg.label.replace(/\s\S+\s[\d,]+$/, ""); // "금요일 밤 110,000" → "금요일"
  return { text: `${pkg} 패키지 (${day} 요금) ${won(sg.base)}원`, base: sg.base };
}

/** 총액 = 기본가 + 옵션 금액 합, 그 뒤 지인할인이 있으면 ×0.8 */
export function quoteTotal(base: number, labels: string[], p: Prices, pkg = ""): number {
  const opts = quoteOptions(p, pkg);
  let sum = base, rate = 1;
  for (const l of labels) {
    const o = opts.find((x) => x.label === l);
    if (o) { sum += o.add; rate *= o.rate; }
  }
  return Math.round(sum * rate);
}
