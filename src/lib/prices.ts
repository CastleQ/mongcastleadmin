/** 요금표 한 곳: settings 표 'prices' 키. 정보 페이지·거래 제안·응대 템플릿이 모두 이걸 읽음 */
export const DAYS = ["평일", "금", "주말"] as const; // 금 = 금요일·공휴일 전날, 주말 = 토·일·공휴일
export const PKGS = ["낮", "밤", "전일"] as const;
export type Triple = [number, number, number]; // [평일, 금, 주말]
export type Prices = {
  낮: Triple; 밤: Triple; 전일: Triple;
  밤샘: number;   // 밤 패키지 옵션
  보증금: number; // 청소보증금 (입금액 포함, 지인·기타 채널 없음)
  기준인원: number; 인원추가: number; // 기준인원 초과 시 1인당 (전일은 무료)
};

/** 저가(개인 연락·계좌이체) 기준 */
export const DEFAULT_PRICES: Prices = {
  낮: [40_000, 40_000, 100_000],
  밤: [70_000, 110_000, 170_000],
  전일: [100_000, 180_000, 260_000],
  밤샘: 30_000,
  보증금: 50_000,
  기준인원: 10, 인원추가: 10_000,
};

type Legacy = { 기본?: Partial<Record<(typeof PKGS)[number], Triple>>; 플랫폼?: Partial<Record<(typeof PKGS)[number], Triple>> };
const isTriple = (v: unknown): v is Triple => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number");

/** settings 값이 일부만 있거나 옛 형식(기본/플랫폼 2단)이어도 → 저가 기준 한 줄로 */
export function mergePrices(v: unknown): Prices {
  const p = (v ?? {}) as Partial<Prices> & Legacy;
  const pick = (pkg: (typeof PKGS)[number]): Triple => {
    if (isTriple(p[pkg])) return p[pkg];
    const a = p.기본?.[pkg], b = p.플랫폼?.[pkg];
    if (isTriple(a) && isTriple(b)) return [0, 1, 2].map((i) => Math.min(a[i], b[i])) as Triple;
    return isTriple(a) ? a : isTriple(b) ? b : DEFAULT_PRICES[pkg];
  };
  const num = (k: keyof Prices) => (typeof p[k] === "number" ? (p[k] as number) : (DEFAULT_PRICES[k] as number));
  return { 낮: pick("낮"), 밤: pick("밤"), 전일: pick("전일"), 밤샘: num("밤샘"), 보증금: num("보증금"), 기준인원: num("기준인원"), 인원추가: num("인원추가") };
}

const won = (n: number) => n.toLocaleString("ko-KR");

/** 템플릿 자리표 → 값. {{평일 낮}} {{금 밤}} {{주말 전일}} {{밤샘}} {{보증금}} {{기준인원}} {{인원추가}} */
export function priceTokens(p: Prices): Record<string, string> {
  const out: Record<string, string> = { 밤샘: won(p.밤샘), 보증금: won(p.보증금), 기준인원: String(p.기준인원), 인원추가: won(p.인원추가) };
  for (const pkg of PKGS) DAYS.forEach((day, i) => { out[`${day} ${pkg}`] = won(p[pkg][i]); });
  return out;
}

/** 본문의 {{자리표}}를 현재 가격으로. 모르는 자리표는 그대로 둠 */
export function fillPrices(body: string, p: Prices): string {
  const t = priceTokens(p);
  return body.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (whole, key: string) => t[key] ?? whole);
}
