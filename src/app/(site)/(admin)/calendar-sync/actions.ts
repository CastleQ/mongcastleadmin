"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * 연동 시작 시점(settings.calendar_sync.startedAt) 켜기·끄기.
 *
 * 이 값보다 먼저 만들어진 구글 일정은 전부 무시한다.
 * "이미 구글캘린더에 기록된 일정은 무시" 결정을 이 한 값으로 구현한다 (docs/google-calendar-sync-plan.md).
 * 끄면 다시 전체가 대상이 되므로, 잘못 켜도 되돌릴 수 있다 (작업 규칙 7).
 */
export async function setSyncStart(on: boolean) {
  const supabase = await createClient();
  const { data, error: readError } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "calendar_sync")
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!data) throw new Error("연동 설정이 없습니다 — supabase/calendar-sync.sql 을 먼저 실행하세요");

  // 캘린더 주소 같은 나머지 설정은 그대로 두고 startedAt 만 바꾼다
  const value = { ...(data.value as Record<string, unknown>), startedAt: on ? new Date().toISOString() : null };
  const { error } = await supabase
    .from("settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", "calendar_sync");
  if (error) throw new Error(error.message);

  revalidatePath("/calendar-sync");
}
