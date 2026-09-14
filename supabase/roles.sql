-- 역할 도입: 관리자 = admins 표에 이메일이 있는 사람. 그 외는 일반(공개 페이지만).
-- 재실행 가능 (if exists / or replace / on conflict)

create table if not exists admins (
  email    text primary key,
  added_at timestamptz not null default now()
);
insert into admins (email) values ('gjow2007@gmail.com') on conflict (email) do nothing;

-- 로그인한 사람이 관리자인지. security definer: admins 표를 못 읽는 일반 사용자도 판정 가능
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = auth.jwt()->>'email')
$$;

-- admins 표 자체: 관리자만
alter table admins enable row level security;
drop policy if exists "admin_all" on admins;
create policy "admin_all" on admins for all to authenticated using (is_admin()) with check (is_admin());

-- 관리자 전용 표들: owner_only(내 이메일) → admin_all(admins 표)
do $$
declare t text;
begin
  foreach t in array array['ledger','customers','templates','template_versions','settings','info_sections','info_versions'] loop
    execute format('drop policy if exists "owner_only" on %I', t);
    execute format('drop policy if exists "admin_all" on %I', t);
    execute format('create policy "admin_all" on %I for all to authenticated using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- 보유 게임: 로그인 없이 누구나 읽기, 쓰기는 관리자만
drop policy if exists "owner_only" on games;
drop policy if exists "games_public_read" on games;
drop policy if exists "games_admin_insert" on games;
drop policy if exists "games_admin_update" on games;
drop policy if exists "games_admin_delete" on games;
create policy "games_public_read"  on games for select to anon, authenticated using (true);
create policy "games_admin_insert" on games for insert to authenticated with check (is_admin());
create policy "games_admin_update" on games for update to authenticated using (is_admin()) with check (is_admin());
create policy "games_admin_delete" on games for delete to authenticated using (is_admin());
