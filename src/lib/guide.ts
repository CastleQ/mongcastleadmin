import { createClient } from "./supabase/server";

/** 손님용 이용 가이드 섹션 (guide_sections 표). 내부용 info_sections와는 별개 */
export type GuideSection = {
  id: number;
  title: string;
  body: string;
  sort_order: number;
  published: boolean;
  updated_at: string;
};

/** 저장할 때마다 DB 트리거가 남기는 사본 (guide_versions 표) */
export type GuideVersion = {
  id: number;
  section_id: number;
  title: string;
  body: string;
  saved_at: string;
};

/**
 * 손님용: 공개 스위치가 켜진 섹션만.
 * 관리자로 로그인하면 RLS가 비공개 섹션까지 넘겨주므로, 여기서 published로 한 번 더 걸러낸다.
 */
export async function loadPublishedGuide(): Promise<GuideSection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guide_sections")
    .select("*")
    .eq("published", true)
    .order("sort_order")
    .order("id");
  return (data ?? []) as GuideSection[];
}

/** 관리자 편집 화면용: 전체 섹션 + 섹션별 수정 기록(최신순) */
export async function loadGuideForAdmin(): Promise<{ sections: GuideSection[]; versions: Map<number, GuideVersion[]> }> {
  const supabase = await createClient();
  const [{ data: s }, { data: v }] = await Promise.all([
    supabase.from("guide_sections").select("*").order("sort_order").order("id"),
    // ponytail: 기록을 전부 불러옴. 수백 개 넘어가면 섹션별 최근 N개로 제한
    supabase.from("guide_versions").select("*").order("saved_at", { ascending: false }),
  ]);
  const versions = new Map<number, GuideVersion[]>();
  for (const row of (v ?? []) as GuideVersion[]) {
    versions.set(row.section_id, [...(versions.get(row.section_id) ?? []), row]);
  }
  return { sections: (s ?? []) as GuideSection[], versions };
}
