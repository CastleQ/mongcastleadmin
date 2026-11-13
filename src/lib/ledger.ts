import { isTime } from "./hours.ts";

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
  /** 예약 시작·종료 시각 'HH:MM'. 종료가 시작보다 이르면 다음 날 (lib/hours.ts) */
  start_time?: string | null;
  end_time?: string | null;
  settled: boolean;
  amount: number; // 입금액
  fee: number; // 플랫폼 수수료
  other_expense: number;
  net: number; // 실수령
  payment_method: string | null;
  note: string | null;
  /** 구글캘린더에서 들어와 금액을 날짜·패키지로 추정한 건. 사장님이 확정하면 false (DB 기본값 false) */
  amount_estimated?: boolean;
  /** 손님이 취소한 예약. 합계·분석·달력에선 빼고 고객 정보만 남긴다 (DB 기본값 false).
   *  폼 저장(parseLedgerForm)엔 일부러 넣지 않음 → 내용을 고쳐 저장해도 취소 상태가 풀리지 않는다 */
  cancelled?: boolean;
};

/** 합계·분석에 넣을 거래 (취소된 예약 제외) */
export const isActive = (r: Pick<Ledger, "cancelled">) => !r.cancelled;

export type LedgerInput = Omit<Ledger, "id">;

export const OTHER = "기타";
/** DB 값은 '매입' 그대로, 화면 글자만 '지출' (2026-11-12 사장님 요청 — 기존 기록을 고치지 않으려고) */
export const kindLabel = (kind: string) => (kind === "매입" ? "지출" : kind);
export const SALE_CATEGORIES = ["대여"];
export const EXPENSE_CATEGORIES = ["집기구매", "보드게임", "소모품", "인건비", "월세기타", "광고비"];
export const CATEGORIES = [...SALE_CATEGORIES, ...EXPENSE_CATEGORIES];
/** 파티룸에 남는 물건 — 권리금으로 돌려받을 돈이라 기본 미정산 (docs/운영규칙.md 1번) */
export const KEEP_CATEGORIES = ["집기구매", "보드게임"];
export const expenseSettledDefault = (category: string | null) => !KEEP_CATEGORIES.includes(category ?? "");
export const CHANNELS = ["네이버플레이스", "스페이스클라우드", "별도컨택", "지인", "아워플레이스"];
/** 지출의 '구매처'. DB 칸은 매출의 인입 채널과 같은 channel */
export const SHOPS = ["당근마켓", "쿠팡", "네이버쇼핑", "테무", "지인"];
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

/**
 * 두 거래가 '같은 건'인가 — 저장 버튼을 여러 번 눌러 생긴 중복을 가려내는 데 쓴다.
 * 사람이 1분 안에 똑같은 날짜·구분·항목·금액·고객명·패키지로 두 건을 일부러 넣는 일은 없다고 본다.
 * (비고·연락처처럼 손으로 고칠 수 있는 칸은 보지 않는다 — 중복 판정이 흔들린다)
 */
export function sameLedgerRow(a: Partial<Ledger>, b: Partial<Ledger>): boolean {
  const same = (k: keyof Ledger) => (a[k] ?? null) === (b[k] ?? null);
  return same("date") && same("kind") && same("category") && same("amount")
    && same("customer_name") && same("package") && same("channel");
}

/** 드롭다운 값이 '기타'면 직접 입력값 사용 */
export function pickOther(selected: string | null, typed: string | null): string | null {
  return selected === OTHER ? typed : selected;
}

/** 폼 값(전부 문자열) → 저장할 행 */
export function parseLedgerForm(f: FormData, depositAmount = DEPOSIT): LedgerInput {
  const s = (k: string) => (f.get(k) as string | null)?.trim() || null;
  const n = (k: string) => { const v = s(k); return v === null ? null : Number(v.replace(/[^\d.-]/g, "")) || 0; };
  const time = (k: string) => { const v = s(k); return isTime(v) ? v : null; };
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
    // 시간은 대여 매출만 — 매입·월세에는 시간 개념이 없다. 'HH:MM' 형식이 아니면 비운다
    start_time: sale ? time("start_time") : null,
    end_time: sale ? time("end_time") : null,
    settled: f.get("settled") === "on",
    amount,
    fee,
    other_expense: other,
    net,
    payment_method: payment,
    note: s("note"),
  };
}
