import { marked } from "marked";

export type InfoSection = { id: number; title: string; body: string; sort_order: number; updated_at: string };
export type InfoVersion = { id: number; section_id: number; title: string; body: string; saved_at: string };

marked.use({ gfm: true, breaks: true });

/** 마크다운 → HTML. 작성자는 본인만(RLS)이라 별도 정화는 생략 */
export function renderMd(md: string): string {
  return marked.parse(md, { async: false });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "2-digit", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
