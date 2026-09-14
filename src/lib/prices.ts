/** 요금표 한 곳: settings 표 'prices' 키. 정보 페이지·거래 제안·응대 템플릿이 모두 이걸 읽음 */
export const DAYS = ["평일", "금", "주말"] as const; // 금 = 금요일·공휴일 전날, 주말 = 토·일·공휴일
export const PKGS = ["낮", "밤", "전일"] as const;
export type Triple = [number, number, number]; // [평일, 금, 주말]
export type Tier = Record<(typeof PKGS)[number], Triple>;
export type Prices = { 기본: Tier; 플랫폼: Tier; 밤샘: number; 보증금: number };

export const DEFAULT_PRICES: Prices = {
  기본: { 낮: [50_000, 50_000, 100_000], 밤: [70_000, 110_000, 170_000], 전일: [100_000, 180_000, 260_000] },
  플랫폼: { 낮: [40_000, 40_000, 110_000], 밤: [80_000, 110_000, 170_000], 전일: [100_000, 180_000, 260_000] },
  밤샘: 30_000,
  보증금: 50_000,
};

/** settings에서 읽은 값이 일부만 있어도 기본값으로 메움 */
export function mergePrices(v: unknown): Prices {
  const p = (v ?? {}) as Partial<Prices>;
  const tier = (t: Partial<Tier> | undefined, d: Tier): Tier => ({
    낮: t?.낮 ?? d.낮, 밤: t?.밤 ?? d.밤, 전일: t?.전일 ?? d.전일,
  });
  return {
    기본: tier(p.기본, DEFAULT_PRICES.기본),
    플랫폼: tier(p.플랫폼, DEFAULT_PRICES.플랫폼),
    밤샘: typeof p.밤샘 === "number" ? p.밤샘 : DEFAULT_PRICES.밤샘,
    보증금: typeof p.보증금 === "number" ? p.보증금 : DEFAULT_PRICES.보증금,
  };
}

const won = (n: number) => n.toLocaleString("ko-KR");

/** 템플릿 자리표 → 값. {{평일 낮}} {{주말 밤}} {{플랫폼 금 낮}} {{밤샘}} {{보증금}} */
export function priceTokens(p: Prices): Record<string, string> {
  const out: Record<string, string> = { 밤샘: won(p.밤샘), 보증금: won(p.보증금) };
  for (const pkg of PKGS) DAYS.forEach((day, i) => {
    out[`${day} ${pkg}`] = won(p.기본[pkg][i]);
    out[`플랫폼 ${day} ${pkg}`] = won(p.플랫폼[pkg][i]);
  });
  return out;
}

/** 본문의 {{자리표}}를 현재 가격으로. 모르는 자리표는 그대로 둠 */
export function fillPrices(body: string, p: Prices): string {
  const t = priceTokens(p);
  return body.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (whole, key: string) => t[key] ?? whole);
}
