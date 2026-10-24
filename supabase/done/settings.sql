-- 설정 표: 키/값 (월 목표 순이익 등). 앞으로 수수료율 같은 설정도 여기에
create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;
drop policy if exists "owner_only" on settings;
create policy "owner_only" on settings for all to authenticated
  using (auth.jwt()->>'email' = 'gjow2007@gmail.com') with check (auth.jwt()->>'email' = 'gjow2007@gmail.com');

-- 시트 '사업계획서'의 보수/기본/낙관 월 순이익 목표
insert into settings (key, value) values
  ('monthly_targets', '{"보수": 419008, "기본": 685408, "낙관": 1340608}')
on conflict (key) do nothing;
