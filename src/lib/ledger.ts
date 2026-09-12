export type Ledger = {
  id: number;
  date: string;
  kind: "매출" | "매입";
  category: string;
  channel: string | null;
  inquiry_date: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  content: string | null;
  headcount: number | null;
  package: string | null;
  hours: number | null;
  settled: boolean;
  amount: number;
  fee: number;
  other_expense: number;
  net: number;
  payment_method: string | null;
  note: string | null;
};

export type LedgerInput = Omit<Ledger, "id">;

export const PACKAGES = ["낮", "밤", "밤+밤샘", "전일", "기타"] as const;
export const PAYMENTS = ["계좌이체", "카드결제", "현금"] as const;
export const CHANNELS = ["네이버예약", "스페이스클라우드", "별도컨택", "지인"];
export const CONTENTS = ["홀덤", "시계피", "머더미스터리", "보드게임"];
export const BUY_CATEGORIES = ["집기구매", "월세+기타", "광고비", "소모품", "기타"];

/** 실수령: 매출이면 총액-수수료-기타지출, 매입이면 -총액 */
export function calcNet(kind: Ledger["kind"], amount: number, fee: number, other: number): number {
  return kind === "매출" ? amount - fee - other : -amount;
}

/** 폼 값(전부 문자열) → 저장할 행. 비어 있으면 null, 실수령 비우면 자동계산 */
export function parseLedgerForm(f: FormData): LedgerInput {
  const s = (k: string) => (f.get(k) as string | null)?.trim() || null;
  const n = (k: string) => { const v = s(k); return v === null ? null : Number(v.replace(/[^\d.-]/g, "")) || 0; };
  const kind = s("kind") === "매입" ? "매입" : "매출";
  const amount = n("amount") ?? 0;
  const fee = n("fee") ?? 0;
  const other = n("other_expense") ?? 0;
  const net = n("net");
  const sale = kind === "매출";
  return {
    date: s("date") ?? "",
    kind,
    category: s("category") ?? (sale ? "공간대여" : "기타"),
    channel: s("channel"),
    inquiry_date: sale ? s("inquiry_date") : null,
    customer_name: s("customer_name"),
    customer_phone: sale ? s("customer_phone") : null,
    content: sale ? s("content") : null,
    headcount: sale ? n("headcount") : null,
    package: sale ? s("package") : null,
    hours: sale ? n("hours") : null,
    settled: f.get("settled") === "on",
    amount,
    fee,
    other_expense: other,
    net: net ?? calcNet(kind, amount, fee, other),
    payment_method: s("payment_method"),
    note: s("note"),
  };
}
