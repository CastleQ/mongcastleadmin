-- 손님용 이용 가이드(/guide) 전용 섹션 표.
-- 관리자 "몽캐슬파티룸 정보"(info_sections)와는 별개의 표 — 그쪽은 내부용 운영 기록, 이쪽은 손님에게 보여줄 글.
-- 섹션마다 published 스위치가 있어서, 다 쓸 때까지 비공개로 두고 완성되면 켤 수 있음.
-- 저장할 때마다 사본이 guide_versions에 남아 되돌릴 수 있음 (info_sections와 같은 방식).
--
-- 선행 조건: supabase/roles.sql이 먼저 실행돼 is_admin() 함수가 있어야 함.
-- 재실행 가능 (if not exists / or replace / drop if exists)

-- 1) 섹션 표
create table if not exists guide_sections (
  id         bigint generated always as identity primary key,
  title      text not null,
  body       text not null default '',
  sort_order int not null default 0,
  published  boolean not null default false, -- true여야 손님에게 보임
  updated_at timestamptz not null default now()
);

-- 이미 만든 표에 뒤늦게 칸을 더해도 되게 (재실행 안전)
alter table guide_sections add column if not exists published boolean not null default false;

-- 2) 수정 기록 표 (되돌리기용)
create table if not exists guide_versions (
  id         bigint generated always as identity primary key,
  section_id bigint not null references guide_sections(id) on delete cascade,
  title      text not null,
  body       text not null,
  saved_at   timestamptz not null default now()
);

-- 3) 제목·본문을 저장할 때마다 자동 기록.
--    순서(sort_order)나 공개 스위치(published)만 바뀔 때는 기록이 남지 않음 (update of 목록에 없으므로).
create or replace function guide_sections_version() returns trigger language plpgsql as $$
begin
  insert into guide_versions (section_id, title, body) values (new.id, new.title, new.body);
  return new;
end $$;

drop trigger if exists guide_sections_version on guide_sections;
create trigger guide_sections_version
after insert or update of title, body on guide_sections
for each row execute function guide_sections_version();

-- 4) 잠금(RLS): 공개된 섹션은 로그인 없이 누구나 읽기, 고치는 건 관리자만.
--    기록 표는 관리자만.
alter table guide_sections enable row level security;
alter table guide_versions enable row level security;

drop policy if exists "guide_public_read"  on guide_sections;
drop policy if exists "guide_admin_insert" on guide_sections;
drop policy if exists "guide_admin_update" on guide_sections;
drop policy if exists "guide_admin_delete" on guide_sections;

-- is_admin()을 함께 허용: 관리자는 아직 비공개인 섹션도 편집 화면에서 봐야 하므로
create policy "guide_public_read"  on guide_sections for select to anon, authenticated using (published or is_admin());
create policy "guide_admin_insert" on guide_sections for insert to authenticated with check (is_admin());
create policy "guide_admin_update" on guide_sections for update to authenticated using (is_admin()) with check (is_admin());
create policy "guide_admin_delete" on guide_sections for delete to authenticated using (is_admin());

drop policy if exists "admin_all" on guide_versions;
create policy "admin_all" on guide_versions for all to authenticated using (is_admin()) with check (is_admin());

-- 5) 확인: 섹션 목록 (처음 실행하면 0줄이 정상 — 내용은 관리자 화면에서 채움)
select id, sort_order, published, title, length(body) as 본문글자수, updated_at
from guide_sections order by sort_order, id;
