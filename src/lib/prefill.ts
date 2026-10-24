import { CATEGORIES, CHANNELS, PACKAGES, PAYMENTS } from "./ledger.ts";
import { isTime } from "./hours.ts";

/**
 * 응대 템플릿에서 거래 추가·예약 수정으로 넘기는 값.
 * 템플릿 쪽(브라우저)에서 prefillParams 로 주소에 담고, 페이지(서버)에서 parsePrefill 로 꺼낸다.
 * 한 곳에 둔 이유: 양쪽이 다른 칸 이름을 쓰면 조용히 안 채워진다.
 */
export type Prefill = {
  date?: string;
  category?: string;
  package?: string;
  channel?: string;
  payment_method?: string;
  settled?: boolean;
  amount?: number;
  headcount?: number;
  customer_name?: string;
  customer_phone?: string;
  inquiry_date?: string;
  start_time?: string;
  end_time?: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** 모양만 맞는 날짜(2026-13-99)도 걸러낸다 — 다시 글자로 돌려 같은지 본다 */
const realDate = (v: string) => {
  if (!ISO.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
const inList = (v: string, list: readonly string[]) => (list.includes(v) ? v : undefined);

/** 주소의 ?칸=값 → Prefill. 모르는 값·형식이 틀린 값은 버린다(폼에 쓰레기가 들어가지 않게) */
export function parsePrefill(sp: Record<string, string | string[] | undefined>): Prefill {
  const s = (k: string) => one(sp[k]).trim();
  const num = (k: string) => { const n = Number(s(k).replace(/[^\d]/g, "")); return Number.isFinite(n) && n > 0 ? n : undefined; };
  const date = (k: string) => (realDate(s(k)) ? s(k) : undefined);
  const time = (k: string) => (isTime(s(k)) ? s(k) : undefined);
  const settled = s("settled");
  // 값이 없는 칸은 **키째로 없애서** 돌려준다.
  // 예약 수정에서 { ...기존행, ...prefill } 로 겹칠 때, undefined 가 들어 있으면 기존 값을 지워버린다
  return dropEmpty({
    date: date("date"),
    category: inList(s("category"), CATEGORIES),
    package: inList(s("package"), PACKAGES),
    // 채널·결제방식은 목록에 없는 값(직접 입력한 플랫폼 이름)도 그대로 받는다
    channel: s("channel") || undefined,
    payment_method: inList(s("payment_method"), PAYMENTS),
    settled: settled === "" ? undefined : settled === "1",
    amount: num("amount"),
    headcount: num("headcount"),
    customer_name: s("customer_name") || undefined,
    customer_phone: s("customer_phone") || undefined,
    inquiry_date: date("inquiry_date"),
    start_time: time("start_time"),
    end_time: time("end_time"),
  });
}

const dropEmpty = (p: Prefill): Prefill =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) as Prefill;

/** Prefill → 주소에 붙일 ?칸=값. 빈 값은 넣지 않는다 */
export function prefillParams(p: Prefill): URLSearchParams {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  return q;
}

/** 채널이 우리가 아는 플랫폼 목록에 있는지 (수수료 계산이 되는 채널인지) */
export const knownChannel = (v: string | undefined) => !!v && CHANNELS.includes(v);
