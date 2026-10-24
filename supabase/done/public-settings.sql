-- 공개 달력이 읽을 설정 두 개(요금표 prices, 문의 연락처 contact)만 로그인 없이 읽히게.
-- settings 표 자체는 관리자만(RLS). 이 창(view)은 지정한 키 두 개만 내보냄.
-- 재실행 가능. 연락처 값 자체는 supabase/info-contact.sql(공개 저장소 제외)에서 넣음.

create or replace view public_settings as
  select key, value
  from settings
  where key in ('prices', 'contact');

grant select on public_settings to anon, authenticated;
