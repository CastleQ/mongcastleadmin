-- 게임 이미지: games 표에 image_url 칸 + 파일 업로드용 저장공간(bucket)
alter table games add column if not exists image_url text;
alter table games add column if not exists bgg_id int;

-- 저장공간 'games': 누구나 볼 수 있고(공개 페이지에 표시), 올리기/지우기는 관리자만
insert into storage.buckets (id, name, public) values ('games', 'games', true)
on conflict (id) do nothing;

drop policy if exists "games_public_read"  on storage.objects;
drop policy if exists "games_admin_write"  on storage.objects;
drop policy if exists "games_admin_update" on storage.objects;
drop policy if exists "games_admin_delete" on storage.objects;
create policy "games_public_read"  on storage.objects for select to anon, authenticated using (bucket_id = 'games');
create policy "games_admin_write"  on storage.objects for insert to authenticated with check (bucket_id = 'games' and is_admin());
create policy "games_admin_update" on storage.objects for update to authenticated using (bucket_id = 'games' and is_admin());
create policy "games_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'games' and is_admin());
