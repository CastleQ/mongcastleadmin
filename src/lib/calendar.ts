export type Reservation = {
  id: number;
  date: string; // YYYY-MM-DD
  kind: "매출" | "매입";
  category: string;
  package: string | null;
  channel: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  content: string | null;
  headcount: number | null;
  amount: number;
  note: string | null;
  settled: boolean;
};

export type PackageKind = "낮" | "밤" | "전일" | "기타";

/** 달력에서 오늘 날짜 숫자 강조: 진한 파란 세로 막대 (관리자·손님 달력 공용) */
export const TODAY_MARK = "border-l-[3px] border-blue-700 pl-1 font-bold text-blue-700";

export function packageKind(pkg: string | null): PackageKind {
  if (!pkg) return "기타";
  if (pkg.startsWith("낮") || pkg.startsWith("주간")) return "낮";
  if (pkg.startsWith("밤") || pkg.startsWith("야간")) return "밤";
  if (pkg.startsWith("전일")) return "전일";
  return "기타";
}

/** "2026-09" → 그 달의 첫날/마지막날/이전달/다음달 */
export function monthInfo(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const key = (yy: number, mm: number) => `${yy}-${pad(mm)}`;
  const lastDay = new Date(y, mo, 0).getDate();
  return {
    year: y,
    month: mo,
    start: `${m}-01`,
    end: `${m}-${pad(lastDay)}`,
    prev: mo === 1 ? key(y - 1, 12) : key(y, mo - 1),
    next: mo === 12 ? key(y + 1, 1) : key(y, mo + 1),
    lastDay,
  };
}

/** 달력 칸 배열. 일요일 시작, 앞뒤 빈칸은 null, 길이는 7의 배수 */
export function monthGrid(year: number, month: number): (string | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const lastDay = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** 오늘을 "YYYY-MM-DD" (한국 시간) */
export function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
