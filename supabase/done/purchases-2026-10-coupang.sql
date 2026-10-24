-- 매입 8건 (쿠팡 주문 캡처 + 사장님이 불러주신 보드게임 구매분), 2026-10-12 수정판
--
-- 앞서 드린 판을 **이미 실행하셨어도 그대로 다시 돌리면 됩니다.**
--   · 빠진 행은 새로 넣고, 이미 들어간 행은 항목·정산·메모를 지금 값으로 맞추고,
--     빼기로 한 라볶이는 지웁니다. 아직 안 돌리셨어도 결과는 똑같습니다.
--   · 여러 번 돌려도 안전합니다.
--
-- 왜 한 문장(with ... )으로 묶었나 (구조를 바꾸지 말 것):
--   Supabase SQL 편집기는 문장마다 따로 커밋해서, 임시 표를 만들어 쓰면 다음 문장에서 사라진다.
--   넣기·고치기·지우기를 한 문장 안에 두면 목록을 한 번만 적어도 되고 중간에 끊길 일이 없다.
--   세 가지는 서로의 결과를 보지 않고 '실행 전 상태'를 함께 본다 — 겹치는 행이 없으니 그래도 된다
--   (넣기는 '없는 것'만, 고치기는 '있는 것'만 건드린다).
--
-- 정산 표시 기준 (사장님 뜻):
--   · 미정산 = 사업 접을 때 권리금으로 돌려받을 물건(보드게임·셔플러). 매출 손익에 섞이지 않는다 —
--     sales.ts 의 모든 집계가 settled 인 행만 더하고, '예약 포함' 보기가 끌어오는 미정산 행도
--     매출뿐이라 매입은 어느 쪽에도 안 들어간다.
--   · 정산완료 = 써서 없어지는 소모품(머리끈·생수). 그달 비용으로 잡힌다.
--
-- 항목: 소모품은 '기타', 파티룸에 남는 물건은 '집기구매'.
-- 인입채널은 비움(매입이라 채널 없음). 결제방식은 전부 카드결제.
--
-- ※ 날짜: 쿠팡 캡처에 있던 4건은 주문일 그대로. 사장님이 불러주신 4건(생수·시크릿 히틀러·
--   고스트 블리츠·기타 보드게임)은 날짜를 못 받아 2026-10-12(오늘)로 넣었습니다.
--   실제 구매일이 다르면 거래 표에서 날짜만 고치시면 됩니다.

with b(date, category, item, amount, settled, note) as (values
  ('2026-10-09'::date, '기타'::text,     '머리끈 50p'::text,         3900::int,   true,  '천사소녀 무매듭 머리끈 50p 세트 NHT-01-C01, 혼합색상 · 쿠팡 · 소모품이라 정산완료'::text),
  ('2026-10-07',       '집기구매',       '펭귄 얼음 깨기',           6300,        false, '스핀마스터 펭귄 얼음 깨기 균형잡기 게임, 1개, 혼합색상 · 쿠팡 · 권리금 회수분이라 미정산'),
  ('2026-10-06',       '집기구매',       '우노 카드게임',            11900,       false, '코리아보드게임즈 우노 카드게임, 1개, 혼합색상 · 쿠팡 · 권리금 회수분이라 미정산'),
  ('2026-10-06',       '집기구매',       '카드 셔플러',              13790,       false, 'QUOKKA 듀얼 카드 셔플러 QM-01, 블랙, 1개 · 쿠팡 · 권리금 회수분이라 미정산'),
  ('2026-10-12',       '기타',           '생수',                     45960,       true,  '생수 11,490원 × 4 · 소모품이라 정산완료 · 날짜는 임시(오늘)'),
  ('2026-10-12',       '집기구매',       '시크릿 히틀러',            12824,       false, '시크릿 히틀러 보드게임 · 권리금 회수분이라 미정산 · 날짜는 임시(오늘)'),
  ('2026-10-12',       '집기구매',       '고스트 블리츠',            7581,        false, '고스트 블리츠 보드게임 · 권리금 회수분이라 미정산 · 날짜는 임시(오늘)'),
  ('2026-10-12',       '집기구매',       '기타 보드게임 구매',       349462,      false, '여러 건 합산: 39,522 + 10,000 + 10,000 + 24,440 + 95,000 + 60,000 + 68,242 + 42,258 · 권리금 회수분이라 미정산 · 날짜는 임시(오늘)')
),
넣기 as (
  insert into ledger (date, kind, category, channel, customer_name, payment_method, settled,
                      amount, fee, other_expense, net, note)
  select b.date, '매입', b.category, null, b.item, '카드결제', b.settled,
         b.amount, 0, 0, -b.amount, b.note
  from b
  where not exists (
    select 1 from ledger l
    where l.kind = '매입' and l.date = b.date and l.customer_name = b.item and l.amount = b.amount
  )
  returning 1
),
고치기 as (
  update ledger l
  set category = b.category, settled = b.settled, note = b.note,
      channel = null, payment_method = '카드결제', fee = 0, other_expense = 0, net = -b.amount
  from b
  where l.kind = '매입' and l.date = b.date and l.customer_name = b.item and l.amount = b.amount
  returning 1
)
delete from ledger
where kind = '매입' and date = '2026-10-09' and customer_name = '라볶이 8개' and amount = 9670;

-- 확인 ① 8건이 이렇게 들어갔는지
select date, category, customer_name, amount, net, settled
from ledger
where kind = '매입' and customer_name in
  ('머리끈 50p','펭귄 얼음 깨기','우노 카드게임','카드 셔플러','생수','시크릿 히틀러','고스트 블리츠','기타 보드게임 구매')
order by date desc, customer_name;

-- 확인 ② 건수 8 / 합계 451,717 / 정산완료 49,860 / 미정산 401,857
select count(*) as 건수, sum(amount) as 합계,
       coalesce(sum(amount) filter (where settled), 0) as 정산완료,
       coalesce(sum(amount) filter (where not settled), 0) as 미정산
from ledger
where kind = '매입' and customer_name in
  ('머리끈 50p','펭귄 얼음 깨기','우노 카드게임','카드 셔플러','생수','시크릿 히틀러','고스트 블리츠','기타 보드게임 구매');

-- 확인 ③ 라볶이가 지워졌는지 (0 이어야 함)
select count(*) as 라볶이남은것 from ledger where kind = '매입' and customer_name = '라볶이 8개';
