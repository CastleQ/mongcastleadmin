-- 예약 시작·종료 시각 칸 추가 (2026-10-24)
-- 거래 추가·수정 화면의 '예약 시간' 칸과 예약현황 팝오버의 ⏰ 줄이 이 두 칸을 씁니다.
-- 여러 번 실행해도 안전합니다 (if not exists · 이미 채워진 시간은 건드리지 않음).
-- ※ 실행한 뒤 거래·예약현황 화면을 새로고침해야 보입니다.
--
-- 종료가 시작보다 이르거나 같으면 '다음 날'로 봅니다. 그래서 '익일'을 따로 저장하지 않습니다.
--   밤+밤샘 18:00~09:00 → 18:00~익일09:00, 하루종일 10:00~09:00 → 10:00~익일09:00
--
-- 2) 에서 **이미 있는 대여 예약의 시간을 패키지 기본값으로 채웁니다.**
--    지금 예약현황 팝오버가 옛 예약에선 시간이 안 보이기 때문입니다.
--    실제로 다른 시간에 쓴 예약이 있으면 그 건만 화면에서 고치시면 됩니다.
--    전부 되돌리려면 맨 아래 주석을 쓰세요.

-- 1) 칸 추가
alter table ledger add column if not exists start_time time;
alter table ledger add column if not exists end_time   time;

comment on column ledger.start_time is '예약 시작 시각. 종료가 더 이르면 종료는 다음 날 (src/lib/hours.ts)';
comment on column ledger.end_time   is '예약 종료 시각. 시작보다 이르거나 같으면 다음 날';

-- 2) 옛 대여 예약에 패키지 기본 시간 채우기 (이미 시간이 있는 건은 그대로)
update ledger l set
  start_time = t.start_time,
  end_time   = t.end_time
from (values
  ('낮'::text,      '10:00'::time, '17:00'::time),
  ('밤',           '18:00',       '23:00'),
  ('밤+밤샘',       '18:00',       '09:00'),
  ('전일',          '10:00',       '09:00')
) as t(package, start_time, end_time)
where l.kind = '매출' and l.category = '대여'
  and l.package = t.package
  and l.start_time is null and l.end_time is null;

-- 확인 ① 칸이 생겼는지
select column_name, data_type
from information_schema.columns
where table_name = 'ledger' and column_name in ('start_time', 'end_time')
order by column_name;

-- 확인 ② 패키지별로 몇 건이 채워졌는지 ('기타' 패키지는 정해진 시간이 없어 비어 있어야 정상)
select package,
       count(*) as 예약수,
       count(start_time) as 시간있음,
       min(start_time)::text || '~' || min(end_time)::text as 시간
from ledger
where kind = '매출' and category = '대여'
group by package
order by package;

-- 되돌리기 (2)만 취소 — 칸은 남기고 채운 시간을 다시 비웁니다
-- update ledger set start_time = null, end_time = null where kind = '매출' and category = '대여';

-- 칸까지 없애기 (적어 둔 시간이 모두 사라집니다)
-- alter table ledger drop column if exists start_time;
-- alter table ledger drop column if exists end_time;
