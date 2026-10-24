-- 예약현황 달력 전체 공개: 로그인 없이도 "어느 날짜에 어떤 패키지가 잡혔는지"만 볼 수 있게.
-- ledger 표 자체는 여전히 관리자만 읽을 수 있고(RLS), 이 창(view)은 날짜·패키지 두 칸만 내보냄.
-- 재실행 가능 (or replace / grant는 중복 실행돼도 무해)

create or replace view public_reservations as
  select date, package
  from ledger
  where kind = '매출' and category = '대여';

-- 창은 만든 사람(postgres) 권한으로 읽히므로 ledger의 RLS를 우회함. 그래서 두 칸만 select한 것이 핵심.
grant select on public_reservations to anon, authenticated;
