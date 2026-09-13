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
  return body.replace(new RegExp(`\\[${esc}(?:=[^\\[\\]]*)?\\]`, "g"), `[${key}=${value}]`);
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일(${DOW[new Date(y, m - 1, d).getDay()]})`;
}

/** 예약 정보로 칸 이름을 보고 자동 채움 (이름에 포함된 단어 기준) */
export function autoFill(slots: Slot[], r: Ledger): Record<string, string> {
  const won = (n: number) => n.toLocaleString("ko-KR") + "원";
  const { deposit } = calcMoney(r.kind, r.amount, r.channel, r.payment_method);
  const out: Record<string, string> = {};
  for (const { key } of slots) {
    if (key.includes("날짜") || key.includes("예약일")) out[key] = fmtDate(r.date);
    else if (key.includes("패키지")) out[key] = r.package ? `${r.package} 패키지${r.payment_method === "플랫폼결제" ? " (플랫폼 결제 완료)" : ""}` : "";
    else if (key.includes("보증금")) out[key] = deposit ? `청소보증금 ${won(deposit)}` : "";
    else if (key.includes("총액") || key.includes("금액")) out[key] = won(r.amount);
    else if (key.includes("고객") || key.includes("이름")) out[key] = r.customer_name ?? "";
    else if (key.includes("인원")) out[key] = r.headcount ? `${r.headcount}명` : "";
  }
  return out;
}
