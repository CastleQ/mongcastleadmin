import { suggestAmount } from "./pricing.ts";
import { FRIEND_DISCOUNT_RATE, type Prices } from "./prices.ts";
import { PACKAGE_LABEL, packageTime, timeRange } from "./hours.ts";

/** 입금안내 템플릿의 패키지 드롭다운 (밤샘은 옵션으로) */
export const QUOTE_PACKAGES = ["낮", "밤", "전일"] as const;

/** 인원추가 옵션 이름 한 곳. 이 옵션을 고르면 인원수 칸이 열리고 문구에 '이용인원 N인'이 들어간다 */
export const HEADCOUNT_OPTION = "인원추가";

/** 옵션: add = 더하는 금액, rate = 총액에 곱하는 비율 (지인할인 0.8) */
export type QuoteOption = { label: string; add: number; rate: number };
/** 고른 패키지를 받는 이유: 전일 대관은 밤샘이 무료라 가산금이 0이 된다 */
export const quoteOptions = (p: Prices, pkg = ""): QuoteOption[] => [
  { label: "밤샘", add: pkg === "전일" ? 0 : p.밤샘, rate: 1 },
  { label: "청소보증금", add: p.보증금, rate: 1 },
  { label: "지인할인", add: 0, rate: FRIEND_DISCOUNT_RATE },
  { label: HEADCOUNT_OPTION, add: 0, rate: 1 }, // 금액은 인원수에 달려 있어 여기선 0 — extraPeopleFee 로 따로 센다
  { label: "시계피 사회", add: 100_000, rate: 1 },
];

const won = (n: number) => n.toLocaleString("ko-KR");

/**
 * 기준인원 초과 가산금. 전일 대관은 인원 추가가 무료다(가격 정보 표·pricing.ts 와 같은 규칙).
 * 인원수를 안 적었으면 0.
 */
export function extraPeopleFee(headcount: number | null, p: Prices, pkg = ""): number {
  if (pkg === "전일" || !headcount) return 0;
  return Math.max(0, headcount - p.기준인원) * p.인원추가;
}

/**
 * 옵션 한 줄 문구: "밤샘 +30,000원" / "지인할인 -20%" / 전일이면 "밤샘 포함 (무료)".
 * 인원추가는 "이용인원 12인" (10인 초과분이 있으면 "+20,000원"까지).
 * 목록에 없는 값(직접 입력)은 그대로
 */
export function optionText(label: string, p: Prices, pkg = "", headcount: number | null = null): string {
  if (label === HEADCOUNT_OPTION) {
    if (!headcount) return ""; // 인원수를 아직 안 적었으면 줄을 만들지 않는다
    const fee = extraPeopleFee(headcount, p, pkg);
    return `이용인원 ${headcount}인${fee ? ` (${headcount - p.기준인원}인 추가 +${won(fee)}원)` : ""}`;
  }
  const o = quoteOptions(p, pkg).find((x) => x.label === label);
  if (!o) return label;
  if (o.rate !== 1) return `${label} -${Math.round((1 - o.rate) * 100)}%`;
  return o.add === 0 ? `${label} 포함 (무료)` : `${label} +${won(o.add)}원`;
}

/**
 * 패키지 줄 문구 + 기본가: "밤 패키지(18:00~23:00) 110,000원".
 * 요일 이름 대신 **이용 시간**을 보여준다 (2026-10-24 사장님 요청 — 손님에게 평일/주말 구분은 필요 없고 시간이 중요).
 * 날짜나 패키지를 모르면(직접 입력) 기본가 null, 문구는 입력값 그대로
 */
export function packageQuote(date: string, pkg: string, p: Prices): { text: string; base: number | null } {
  const sg = date && pkg ? suggestAmount(date, pkg, null, p) : null;
  if (!sg) return { text: pkg, base: null };
  const t = packageTime(pkg);
  const name = PACKAGE_LABEL[pkg] ?? `${pkg} 패키지`;
  const when = t ? `(${timeRange(t.start, t.end)})` : "";
  return { text: `${name}${when} ${won(sg.base)}원`, base: sg.base };
}

/** 총액 = 기본가 + 옵션 금액 + 인원 가산금, 그 뒤 지인할인이 있으면 ×0.8 */
export function quoteTotal(base: number, labels: string[], p: Prices, pkg = "", headcount: number | null = null): number {
  const opts = quoteOptions(p, pkg);
  let sum = base, rate = 1;
  // 같은 옵션을 여러 칸에서 골라도 한 번만 센다 (인원추가를 옵션1·2에 둘 다 골라 두 번 더해지면 안 된다)
  for (const l of new Set(labels)) {
    const o = opts.find((x) => x.label === l);
    if (o) { sum += o.add; rate *= o.rate; }
  }
  if (labels.includes(HEADCOUNT_OPTION)) sum += extraPeopleFee(headcount, p, pkg);
  return Math.round(sum * rate);
}
