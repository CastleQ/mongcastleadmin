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

/** 채운 값 → 없으면 기본값 → 그것도 없으면 [칸] 그대로. drop(칸)이 참이면 빈 칸은 흔적 없이 사라진다 */
export function fill(body: string, values: Record<string, string>, drop?: (key: string) => boolean): string {
  return body.replace(SLOT, (_, key: string, def: string | undefined) =>
    values[key]?.trim() || (drop?.(key) ? "" : def || `[${key}]`));
}

/**
 * 비워 두면 문구에서 **아예 사라지는** 칸: 옵션N · 기타… · 플랫폼….
 * (옵션은 원래 그랬고, 2026-10-24에 '기타(할인 등)'과 '플랫폼'도 같게 했다 —
 *  할인이 없는데 "기타(할인 등)"이라는 빈 줄이 손님에게 가면 안 된다)
 */
export const isDropKey = (key: string) => isOptionKey(key) || key.startsWith("기타") || key.includes("플랫폼");

/**
 * 보낼 문구 만들기. 빈 drop 칸은 지우고, **그 칸만 있던 줄은 줄째로** 지운다.
 * 글 중간에 있던 칸(예: "[플랫폼] 예약 확인되어")은 칸만 빠지고 남는 두 칸 띄어쓰기를 하나로 줄인다.
 */
export function render(body: string, values: Record<string, string>): string {
  const empty = (key: string) => !(values[key] ?? "").trim();
  const lines = body.split("\n").filter((ln) => {
    if (ln.trim() === "") return true; // 원래 있던 빈 줄은 그대로
    // 이 줄에서 '사라질 칸'을 지웠을 때 아무것도 안 남으면 줄째로 버린다
    const rest = ln.replace(new RegExp(SLOT.source, "g"), (_, k: string) => (isDropKey(k) && empty(k) ? "" : "x"));
    return rest.trim() !== "";
  });
  // 사라지는 칸은 **뒤에 붙은 띄어쓰기 한 칸까지** 함께 지운다
  // ("[플랫폼] 예약 확인되어" → "예약 확인되어". 안 그러면 줄 맨 앞에 공백이 남는다)
  const trimmed = lines.join("\n").replace(new RegExp(`${SLOT.source}[^\\S\\n]?`, "g"), (whole, k: string) =>
    isDropKey(k) && empty(k) ? "" : whole);
  return fill(trimmed, values, isDropKey).replace(/[^\S\n]+$/gm, ""); // 줄 끝 공백 제거
}

/** 템플릿 본문에서 한 칸의 기본값을 바꿈: [칸] / [칸=옛값] → [칸=새값] */
export function setDefault(body: string, key: string, value: string): string {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const v = value.replace(/[\[\]]/g, "").trim(); // 기본값 안의 대괄호는 제거 (중첩 방지)
  return body.replace(new RegExp(`\\[${esc}(?:=[^\\[\\]]*)?\\]`, "g"), v ? `[${key}=${v}]` : `[${key}]`);
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-09-20" → "26/09/20(일)" — 목록에서 자리 폭이 일정하게 */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${iso.slice(2, 4)}/${iso.slice(5, 7)}/${iso.slice(8)}(${DOW[new Date(y, m - 1, d).getDay()]})`;
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일(${DOW[new Date(y, m - 1, d).getDay()]})`;
}

/** 플랫폼 칸 드롭다운. '없음'(빈 값)이 기본 — 고르지 않으면 문구에서 사라진다 */
export const PLATFORMS = ["네이버플레이스", "스페이스클라우드"] as const;

/** 칸 이름으로 입력 방식 결정 (채우기 화면·자동 채움 공용) */
export const isDateKey = (key: string) => key.includes("날짜") || key.includes("예약일");
export const isPackageKey = (key: string) => key.includes("패키지");
export const isOptionKey = (key: string) => /^옵션\s*\d*$/.test(key);
export const isTotalKey = (key: string) => key.includes("총액");
export const isPlatformKey = (key: string) => key.includes("플랫폼");

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
    // 고객·이름보다 먼저 본다 — '플랫폼이름' 처럼 '이름'이 들어간 칸이 고객명으로 채워지면 안 된다
    else if (key.includes("플랫폼") || key.includes("채널")) out[key] = r.channel ?? "";
    else if (key.includes("고객") || key.includes("이름")) out[key] = r.customer_name ?? "";
    else if (key.includes("인원")) out[key] = r.headcount ? `${r.headcount}명` : "";
  }
  return out;
}
