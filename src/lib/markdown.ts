import { marked } from "marked";

export type InfoSection = { id: number; title: string; body: string; sort_order: number; updated_at: string };
export type InfoVersion = { id: number; section_id: number; title: string; body: string; saved_at: string };

marked.use({ gfm: true, breaks: true });

/** 마크다운 → HTML. 작성자는 본인만(RLS)이라 별도 정화는 생략 */
export function renderMd(md: string): string {
  return marked.parse(md, { async: false });
}

/**
 * '핵심 정보' 표의 `| 항목 | 내용 |` 줄들을 자리표로. 응대 템플릿의 `{{출입 비밀번호}}` 가 이걸 쓴다.
 * 번호가 바뀌면 **정보 화면 한 곳만** 고치면 문구가 따라온다.
 * 머리줄(항목/내용)과 구분줄(---)은 건너뛰고, 칸이 둘인 줄만 읽는다.
 */
export function infoTokens(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*\|([^|]+)\|([^|]+)\|\s*$/);
    if (!m) continue;
    const key = m[1].trim(), value = m[2].trim();
    if (!key || !value || /^-+$/.test(key) || key === "항목") continue;
    out[key] = value;
  }
  return out;
}

/**
 * 반대 방향: '| 항목 | 값 |' 줄의 **값만** 바꾼다. 그 항목이 없으면 null.
 * 응대 템플릿에서 고친 값을 원본(핵심 정보)에 되돌려 적을 때 쓴다 — 두 곳이 어긋나지 않게.
 */
export function setInfoToken(body: string, key: string, value: string): string | null {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^(\\s*\\|\\s*${esc}\\s*\\|)[^|\\n]*(\\|\\s*)$`, "m");
  if (!re.test(body)) return null;
  return body.replace(re, `$1 ${value.replace(/\|/g, "")} $2`); // 값 안의 | 는 표를 깨뜨리므로 뺀다
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "2-digit", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
