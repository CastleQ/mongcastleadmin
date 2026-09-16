import type { Ledger } from "./ledger.ts";
import { calcMoney } from "./ledger.ts";

export type Template = {
  id: number;
  name: string; // 상황
  when_to: string | null; // 언제
  body: string; // 템플릿
  note: string | null; // 기타
  sort_order: number;
};

/** [칸] 또는 [칸=기본값] */
export type Slot = { key: string; def: string };
const SLOT = /\[([^\[\]=]+)(?:=([^\[\]]*))?\]/g;

/** 본문의 대괄호 칸을 순서대로, 중복 없이 (기본값은 처음 나온 것) */
export function placeholders(body: string): Slot[] {
  const seen = new Map<string, string>();
  for (const m of body.matchAll(SLOT)) if (!seen.has(m[1])) seen.set(m[1], m[2] ?? "");
  return [...seen].map(([key, def]) => ({ key, def }));
}

/** 채운 값 → 없으면 기본값 → 그것도 없으면 [칸] 그대로 */
export function fill(body: string, values: Record<string, string>): string {
  return body.replace(SLOT, (_, key: string, def: string | undefined) => values[key]?.trim() || def || `[${key}]`);
}

/** 템플릿 본문에서 한 칸의 기본값을 바꿈: [칸] / [칸=옛값] → [칸=새값] */
export function setDefault(body: string, key: string, value: string): string {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const v = value.replace(/[\[\]]/g, "").trim(); // 기본값 안의 대괄호는 제거 (중첩 방지)
  return body.replace(new RegExp(`\\[${esc}(?:=[^\\[\\]]*)?\\]`, "g"), v ? `[${key}=${v}]` : `[${key}]`);
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일(${DOW[new Date(y, m - 1, d).getDay()]})`;
}

/** 칸 이름으로 입력 방식 결정 (채우기 화면·자동 채움 공용) */
export const isDateKey = (key: string) => key.includes("날짜") || key.includes("예약일");
export const isPackageKey = (key: string) => key.includes("패키지");
export const isOptionKey = (key: string) => /^옵션\s*\d*$/.test(key);
export const isTotalKey = (key: string) => key.includes("총액");

/**
 * 예약 정보로 칸 이름을 보고 자동 채움 (이름에 포함된 단어 기준).
 * 날짜 칸은 YYYY-MM-DD(달력 입력용), 패키지 '밤+밤샘'은 패키지 밤 + 옵션 밤샘으로 나눔, 보증금·지인은 옵션 칸에 차례로
 */
export function autoFill(slots: Slot[], r: Ledger): Record<string, string> {
  const won = (n: number) => n.toLocaleString("ko-KR") + "원";
  const { deposit } = calcMoney(r.kind, r.amount, r.channel, r.payment_method);
  const overnight = r.package === "밤+밤샘";
  const options = [overnight ? "밤샘" : "", deposit ? "청소보증금" : "", r.channel === "지인" ? "지인할인" : ""].filter(Boolean);
  const out: Record<string, string> = {};
  for (const { key } of slots) {
    if (isDateKey(key)) out[key] = r.date;
    else if (isOptionKey(key)) out[key] = options.shift() ?? "";
    else if (isPackageKey(key)) out[key] = overnight ? "밤" : r.package ?? "";
    else if (key.includes("보증금")) out[key] = deposit ? `청소보증금 ${won(deposit)}` : "";
    else if (isTotalKey(key) || key.includes("금액")) out[key] = won(r.amount);
    else if (key.includes("고객") || key.includes("이름")) out[key] = r.customer_name ?? "";
    else if (key.includes("인원")) out[key] = r.headcount ? `${r.headcount}명` : "";
  }
  return out;
}
