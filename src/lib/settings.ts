import { createClient } from "./supabase/server";
import { mergePrices, type Prices } from "./prices";

/** settings 표의 요금표. 없으면 기본값 */
export async function loadPrices(): Promise<Prices> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "prices").maybeSingle();
  return mergePrices(data?.value);
}

/** 구글캘린더 연동 설정 (settings 표의 calendar_sync 키). SQL은 supabase/calendar-sync.sql */
export type CalendarSync = {
  readCalendarIds: string[];
  writeCalendarId: string;
  /** 연동을 켠 시각. 이보다 먼저 만들어진 구글 일정은 무시한다. null이면 아직 안 켬 */
  startedAt: string | null;
  /** 구글 일정에 칠할 색 번호(1~11). null이면 색을 지정하지 않는다 */
  eventColorId: string | null;
};

export async function loadCalendarSync(): Promise<CalendarSync | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "calendar_sync").maybeSingle();
  const v = data?.value as Partial<CalendarSync> | undefined;
  if (!v || !Array.isArray(v.readCalendarIds) || typeof v.writeCalendarId !== "string") return null;
  return {
    readCalendarIds: v.readCalendarIds.filter((s): s is string => typeof s === "string"),
    writeCalendarId: v.writeCalendarId,
    startedAt: typeof v.startedAt === "string" ? v.startedAt : null,
    eventColorId: typeof v.eventColorId === "string" ? v.eventColorId : null,
  };
}

export type Contact = { phone: string; kakao: string };

/** 공개 달력용: public_settings 창(요금표 + 문의 연락처). 로그인 없이 읽힘 */
export async function loadPublicSettings(): Promise<{ prices: Prices; contact: Contact | null }> {
  const supabase = await createClient();
  const { data } = await supabase.from("public_settings").select("key,value");
  const rows = (data ?? []) as { key: string; value: Partial<Contact> }[];
  const c = rows.find((r) => r.key === "contact")?.value;
  const contact = c && typeof c.phone === "string" && typeof c.kakao === "string" ? { phone: c.phone, kakao: c.kakao } : null;
  return { prices: mergePrices(rows.find((r) => r.key === "prices")?.value), contact };
}
