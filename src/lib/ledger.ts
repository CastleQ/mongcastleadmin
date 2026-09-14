export type Ledger = {
  id: number;
  date: string; // 예약일
  kind: "매출" | "매입";
  category: string;
  channel: string | null;
  inquiry_date: string | null; // 인입일(연락 온 날)
  customer_name: string | null;
  customer_phone: string | null;
  content: string | null;
  headcount: number | null;
  package: string | null;
  hours: number | null;
  settled: boolean;
  amount: number; // 입금액
  fee: number; // 플랫폼 수수료
  other_expense: number;
  net: number; // 실수령
  payment_method: string | null;
  note: string | null;
};

export type LedgerInput = Omit<Ledger, "id">;

export const OTHER = "기타";
export const CATEGORIES = ["대여", "집기구매", "월세기타", "광고비"];
export const CHANNELS = ["네이버플레이스", "스페이스클라우드", "별도컨택", "지인", "아워플레이스"];
export const PACKAGES = ["낮", "밤", "밤+밤샘", "전일", "기타"] as const;
export const PAYMENTS = ["계좌이체", "플랫폼결제", "카드결제", "현금"] as const;
export const CONTENTS = ["홀덤", "시계피", "머더미스터리", "보드게임"];

export const DEPOSIT = 50_000; // 기본값. 실제 값은 settings prices.보증금 (인자로 받음)
const FEE_RATE: Record<string, number> = { 네이버플레이스: 0.0319, 스페이스클라우드: 0.1, 아워플레이스: 0.1 };

export type Money = { deposit: number; fee: number; net: number };

/** 입금액·채널·결제방식으로 보증금/수수료/실수령 계산 */
export function calcMoney(kind: Ledger["kind"], amount: number, channel: string | null, payment: string | null, other = 0, depositAmount = DEPOSIT): Money {
  if (kind === "매입") return { deposit: 0, fee: 0, net: -amount };
  const deposit = channel && CHANNELS.includes(channel) && channel !== "지인" ? depositAmount : 0; // 기타·미입력은 보증금 없음
  const base = Math.max(0, amount - deposit);
  const rate = payment === "플랫폼결제" ? (FEE_RATE[channel ?? ""] ?? 0) : 0;
  const fee = Math.round(base * rate);
  return { deposit, fee, net: amount - deposit - fee - other };
}

/** 드롭다운 값이 '기타'면 직접 입력값 사용 */
export function pickOther(selected: string | null, typed: string | null): string | null {
  return selected === OTHER ? typed : selected;
}

/** 폼 값(전부 문자열) → 저장할 행 */
export function parseLedgerForm(f: FormData, depositAmount = DEPOSIT): LedgerInput {
  const s = (k: string) => (f.get(k) as string | null)?.trim() || null;
  const n = (k: string) => { const v = s(k); return v === null ? null : Number(v.replace(/[^\d.-]/g, "")) || 0; };
  const kind = s("kind") === "매입" ? "매입" : "매출";
  const sale = kind === "매출";
  const amount = n("amount") ?? 0;
  const other = n("other_expense") ?? 0;
  const channel = pickOther(s("channel"), s("channel_other"));
  const payment = s("payment_method") ?? "계좌이체";
  const { fee, net } = calcMoney(kind, amount, channel, payment, other, depositAmount);
  return {
    date: s("date") ?? "",
    kind,
    category: pickOther(s("category"), s("category_other")) ?? (sale ? "대여" : OTHER),
    channel,
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
    net,
    payment_method: payment,
    note: s("note"),
  };
}
