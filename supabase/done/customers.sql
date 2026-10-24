-- 고객: 거래의 연락처(없으면 이름)로 자동 묶이고, 등급·메모만 여기 저장
create table customers (
  key        text primary key,          -- 숫자만 남긴 연락처, 또는 "name:이름"
  name       text,
  phone      text,
  grade      text not null default '일반' check (grade in ('일반','그레이','블랙')),
  memo       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customers enable row level security;
create policy "owner_only" on customers for all to authenticated
  using (auth.jwt()->>'email' = 'gjow2007@gmail.com') with check (auth.jwt()->>'email' = 'gjow2007@gmail.com');
