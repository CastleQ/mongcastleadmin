/**
 * DB 에 아직 없는 칸을 물어봤을 때를 알아내는 곳.
 *
 * 왜 필요한가 (2026-10-24에 실제로 터진 일):
 * 코드는 Vercel 이 바로 배포하지만 DB 칸은 사장님이 SQL 을 돌려야 생긴다.
 * 그 사이에 '예약 시간(start_time·end_time)'을 함께 물어보는 목록 조회가
 * 통째로 오류가 나서 **예약현황이 빈 화면으로 보였다**(자료는 멀쩡했다).
 * 그래서 새 칸을 쓰는 곳은 "없으면 그 칸만 빼고 다시" 하도록 감싼다.
 * SQL 을 돌린 뒤에는 저절로 새 칸까지 쓰게 된다 — 코드를 다시 고칠 필요가 없다.
 */

/** PostgREST/Postgres 의 '그런 칸 없다' 코드 (undefined_column) */
export const UNDEFINED_COLUMN = "42703";

export const isMissingColumn = (error: { code?: string | null } | null | undefined): boolean =>
  error?.code === UNDEFINED_COLUMN;

/** 저장할 값에서 칸 몇 개를 빼기 (아직 DB 에 없는 칸을 넣으면 저장 자체가 실패한다) */
export function withoutKeys<T extends object>(row: T, keys: readonly string[]): T {
  return Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k))) as T;
}

/** 예약 시간 칸 이름 한 곳 — supabase/ledger-times.sql 로 생긴다 */
export const TIME_COLUMNS = ["start_time", "end_time"] as const;
