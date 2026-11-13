-- 예약취소: 거래를 지우지 않고 '취소' 표시만 한다.
-- 취소된 건은 합계·매출 분석·달력(빈자리)에서 빠지고, 고객 정보는 그대로 남는다.
-- 재실행 가능 (if not exists / or replace)

-- 1) 칸 추가. 기존 거래는 전부 false(취소 아님)로 채워진다
alter table ledger add column if not exists cancelled boolean not null default false;

-- 2) 손님용 달력 창: 취소된 예약은 빈자리로 보이게 뺀다 (칸 구성은 그대로 date, package)
create or replace view public_reservations as
  select date, package
  from ledger
  where kind = '매출' and category = '대여' and not cancelled;

grant select on public_reservations to anon, authenticated;
