-- 몽캐슬 admin 테이블 (시트 탭 → 테이블)

-- 1. 장부: 매출/매입 한 건 = 한 줄
create table ledger (
  id             bigint generated always as identity primary key,
  date           date not null,
  kind           text not null check (kind in ('매출','매입')),
  category       text not null,          -- 공간대여 / 집기구매 / 월세기타 / 광고비 ...
  channel        text,                   -- 네이버예약 / 별도컨택 / 지인 / 쿠팡 ...
  inquiry_date   date,
  customer_name  text,
  customer_phone text,
  content        text,                   -- 홀덤 / 시계피 ...
  headcount      int,
  package        text,                   -- 전일 / 밤 / 밤+밤샘 ...
  hours          numeric,
  settled        boolean not null default false,
  amount         int not null default 0, -- 총액(원)
  fee            int not null default 0, -- 수수료
  other_expense  int not null default 0, -- 기타지출
  net            int not null default 0, -- 실수령(매입이면 음수)
  payment_method text,                   -- 계좌이체 / 카드결제
  note           text,
  created_at     timestamptz not null default now()
);

-- 2. 보유 게임: 보드게임 + 머더미스터리 한 테이블
create table games (
  id            bigint generated always as identity primary key,
  kind          text not null check (kind in ('보드게임','머더미스터리')),
  name          text not null,
  name_original text,
  category      text,                    -- 전략게임 / 파티게임 / 공포 / 코믹 ...
  expansion     text,
  qty           int not null default 1,
  language      text,
  players       text,                    -- '5인', '2~4인'
  play_minutes  int,
  gm_required   boolean not null default false,
  translated    boolean not null default false,
  price         int,
  link          text,
  synopsis      text,
  note          text,
  created_at    timestamptz not null default now()
);

-- 3. 고객대응 문자 템플릿
create table templates (
  id         bigint generated always as identity primary key,
  name       text not null,
  body       text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 잠금: 로그인한 사람만 읽기/쓰기
alter table ledger    enable row level security;
alter table games     enable row level security;
alter table templates enable row level security;

create policy "auth_all" on ledger    for all to authenticated using (true) with check (true);
create policy "auth_all" on games     for all to authenticated using (true) with check (true);
create policy "auth_all" on templates for all to authenticated using (true) with check (true);

-- 잠금 강화: 본인 계정만 (위 auth_all 정책을 대체)
drop policy "auth_all" on ledger;
drop policy "auth_all" on games;
drop policy "auth_all" on templates;

create policy "owner_only" on ledger    for all to authenticated
  using (auth.jwt()->>'email' = 'gjow2007@gmail.com') with check (auth.jwt()->>'email' = 'gjow2007@gmail.com');
create policy "owner_only" on games     for all to authenticated
  using (auth.jwt()->>'email' = 'gjow2007@gmail.com') with check (auth.jwt()->>'email' = 'gjow2007@gmail.com');
create policy "owner_only" on templates for all to authenticated
  using (auth.jwt()->>'email' = 'gjow2007@gmail.com') with check (auth.jwt()->>'email' = 'gjow2007@gmail.com');
