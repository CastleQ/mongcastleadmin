/**
 * 예약 시간 한 곳: 패키지별 기본 시작·종료 시각.
 * 거래 추가 폼의 기본값, 예약현황 팝오버 표시, 입금안내 템플릿 문구, 가격 정보의 시간당 단가가 모두 이걸 쓴다.
 * 종료가 시작보다 이르거나 같으면 다음 날이다(밤샘·하루종일) — 그래서 '익일'을 따로 저장하지 않는다.
 */
export type TimeRange = { start: string; end: string };

/** ledger.package 값 → 기본 시간. '기타'는 정해진 시간이 없어 비워 둔다 */
export const PACKAGE_TIMES: Record<string, TimeRange> = {
  낮: { start: "10:00", end: "17:00" },
  밤: { start: "18:00", end: "23:00" },
  "밤+밤샘": { start: "18:00", end: "09:00" },
  전일: { start: "10:00", end: "09:00" },
};

/** 요금표의 '시간당 단가'를 내는 데 쓰는 이용 시간 (낮 7시간, 밤 5시간) */
export const PACKAGE_HOURS: Record<string, number> = { 낮: 7, 밤: 5 };

/** 입금안내 문구에 쓰는 패키지 이름 — '전일'은 사장님이 '하루종일'로 부른다 */
export const PACKAGE_LABEL: Record<string, string> = { 낮: "낮 패키지", 밤: "밤 패키지", 전일: "하루종일" };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isTime = (v: string | null | undefined): v is string => !!v && HHMM.test(v);

/** DB의 'HH:MM:SS'도 받아 'HH:MM'으로 (time 칸은 초까지 돌아온다) */
export const hhmm = (v: string | null | undefined): string => (v ? v.slice(0, 5) : "");

/** 종료가 시작보다 이르거나 같으면 다음 날 */
export const crossesMidnight = (start: string, end: string): boolean => end <= start;

/** "18:00~익일09:00". 한쪽이라도 없으면 빈 글자 */
export function timeRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = hhmm(start), e = hhmm(end);
  if (!isTime(s) || !isTime(e)) return "";
  return `${s}~${crossesMidnight(s, e) ? "익일" : ""}${e}`;
}

/** 패키지 기본 시간 ("기타"·모르는 값은 null) */
export const packageTime = (pkg: string | null | undefined): TimeRange | null => (pkg && PACKAGE_TIMES[pkg]) || null;

/**
 * 시간당 단가 = 패키지 금액 ÷ 이용 시간, **천원 단위 올림**.
 * 올림이라 표시 단가로 계산해도 실제 요금보다 적게 나오지 않는다.
 * (낮 40,000÷7h = 5,714 → 6,000 · 밤 110,000÷5h = 22,000 그대로)
 */
export function hourlyRate(total: number, hours: number): number {
  if (!hours) return 0;
  return Math.ceil(total / hours / 1000) * 1000;
}
