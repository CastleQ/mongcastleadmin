-- 구글캘린더 ↔ 예약현황 양방향 연동 1단계: DB 준비
-- 설계 전문은 docs/google-calendar-sync-plan.md
--
-- 선행 조건: supabase/schema.sql(ledger, settings)과 supabase/roles.sql(is_admin())이 먼저 실행돼 있어야 함.
-- 재실행 가능 (if not exists / add column if not exists / drop policy if exists / on conflict do nothing).
-- 이미 실행한 뒤 다시 실행해도 저장된 값이 지워지지 않는다.

-- ─────────────────────────────────────────────────────────────
-- 1) 짝 맞춤 표: 거래 한 줄 ↔ 구글 일정 하나 (1:1)
-- ─────────────────────────────────────────────────────────────
-- content_hash 가 메아리(무한 반복) 방지의 핵심이다.
-- 우리가 구글에 써 넣은 내용의 지문을 여기 저장해두고, 동기화 때 지문이 같으면 "내가 쓴 것이 돌아온 것"이라 보고 건드리지 않는다.
create table if not exists calendar_links (
  ledger_id         bigint primary key references ledger(id) on delete cascade,
  google_event_id   text not null unique,
  calendar_id       text not null,            -- 캘린더를 바꿔도 옛 일정을 지울 수 있게 함께 저장
  content_hash      text not null,            -- 마지막으로 맞춘 내용의 지문
  google_updated    timestamptz,              -- 구글이 알려준 그 일정의 마지막 수정 시각 (충돌 시 나중 것이 이김)
  deleted_in_google boolean not null default false, -- 구글에서 지워짐. 거래 행은 지우지 않고 표시만 (합의된 결정 ③)
  synced_at         timestamptz not null default now()
);

-- 구글 일정 id로 거꾸로 찾는 일이 매 동기화마다 생김
create index if not exists calendar_links_event_idx on calendar_links (google_event_id);

-- ─────────────────────────────────────────────────────────────
-- 2) 동기화 기록: 무엇을 만들고 고치고 지웠는지 (되돌리기용 — 작업 규칙 7)
-- ─────────────────────────────────────────────────────────────
-- ledger_id 에 외래키를 걸지 않는다: 거래 행이 지워져도 "지웠다"는 기록은 남아야 하기 때문.
-- 바뀐 것만 남긴다. 변화 없이 지나간 건(skipped)은 적지 않는다 — 5분마다 돌면 금방 수백만 줄이 된다.
create table if not exists sync_log (
  id              bigint generated always as identity primary key,
  ran_at          timestamptz not null default now(),
  direction       text not null check (direction in ('google_to_ledger', 'ledger_to_google')),
  action          text not null check (action in ('created', 'updated', 'deleted', 'conflict', 'error')),
  ledger_id       bigint,
  google_event_id text,
  before_json     jsonb,   -- 바뀌기 전 값. 되돌리기는 이걸 그대로 다시 써넣는 것
  after_json      jsonb,
  message         text
);

create index if not exists sync_log_ran_at_idx on sync_log (ran_at desc);

-- ─────────────────────────────────────────────────────────────
-- 3) 거래 표에 '금액 추정' 표시 칸 추가
-- ─────────────────────────────────────────────────────────────
-- 구글에서 들어온 건은 금액을 모르므로 날짜·패키지로 추정해 넣는다.
-- 이 칸이 true면 거래 표에 '금액 추정' 띠가 붙고, 사장님이 '확정'을 누르면 false가 된다.
-- 확정 매출을 추측으로 오염시키지 않기 위한 장치.
alter table ledger add column if not exists amount_estimated boolean not null default false;

-- ─────────────────────────────────────────────────────────────
-- 4) 슬롯 시각 설정 (사장님이 나중에 화면에서 고칠 수 있게 settings 에 둔다)
-- ─────────────────────────────────────────────────────────────
-- endNextDay = true 면 종료 시각이 다음날이라는 뜻.
-- 밤+밤샘과 전일은 종료가 같고(익일 09:00) 시작으로 구분한다 (18:00 vs 10:00).
-- on conflict do nothing: 다시 실행해도 사장님이 고친 값을 덮어쓰지 않는다.
insert into settings (key, value) values (
  'slot_hours',
  '{
     "낮":      {"start": "10:00", "end": "17:00", "endNextDay": false},
     "밤":      {"start": "18:00", "end": "23:00", "endNextDay": false},
     "밤+밤샘": {"start": "18:00", "end": "09:00", "endNextDay": true},
     "전일":    {"start": "10:00", "end": "09:00", "endNextDay": true}
   }'::jsonb
) on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 5) 잠금(RLS): 두 표 모두 관리자만. 손님에게는 전혀 보이지 않는다.
-- ─────────────────────────────────────────────────────────────
-- 손님 달력은 public_reservations 창(날짜·패키지만)을 쓰므로 고객명·연락처가 새지 않는다.
-- 구글에서 들어온 예약도 kind='매출' category='대여' 이므로 그 창에 자동으로 잡힌다 (창은 고칠 필요 없음).
alter table calendar_links enable row level security;
alter table sync_log       enable row level security;

drop policy if exists "admin_all" on calendar_links;
drop policy if exists "admin_all" on sync_log;

create policy "admin_all" on calendar_links for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin_all" on sync_log       for all to authenticated using (is_admin()) with check (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 6) 확인: 아래 세 줄의 결과를 눈으로 확인하세요
-- ─────────────────────────────────────────────────────────────

-- (가) 표 두 개와 칸이 제대로 생겼는지 — calendar_links 7칸 + sync_log 9칸 = 16줄이 나와야 정상
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name in ('calendar_links', 'sync_log')
order by table_name, ordinal_position;

-- (나) 거래 표에 금액 추정 칸이 붙었는지 — 1줄, default false
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'ledger' and column_name = 'amount_estimated';

-- (다) 슬롯 시각이 들어갔는지 — 4개 패키지가 보여야 정상
select key, jsonb_pretty(value) as 슬롯시각 from settings where key = 'slot_hours';
