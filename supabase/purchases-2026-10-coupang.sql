-- 매입 5건 추가 (쿠팡 주문 내역 캡처, 2026-10-06 ~ 10-09)
-- 여러 번 실행해도 안전: 같은 날짜·품명·금액이 이미 있으면 건너뜀.
--
-- 전부 **미정산(settled = false)** 으로 넣는다 — 사장님 뜻:
--   나중에 사업을 접을 때 권리금으로 돌려받을 돈이라 매출 손익에 섞고 싶지 않다.
--   실제로 그렇게 동작한다(확인함): src/lib/sales.ts 의 모든 집계가 settled 인 행만 더하고,
--   '예약 포함' 보기가 끌어오는 미정산 행도 매출(kind='매출')뿐이라 매입은 어느 쪽에도 안 들어간다.
--   나중에 손익에 넣고 싶어지면 거래 표에서 정산 스위치만 켜면 된다.
--
-- 항목(category): 파티룸에 두고 쓰는 물건은 '집기구매', 손님께 내는 먹을거리는 '기타'.
-- 인입채널은 비움(매입이라 채널이 없음). 결제방식은 전부 카드결제.
-- 품명은 한눈에 보이도록 이름 칸(customer_name)에, 쿠팡에 적힌 전체 상품명은 메모에 둔다.

insert into ledger (date, kind, category, channel, customer_name, payment_method, settled,
                    amount, fee, other_expense, net, note)
select v.date::date, '매입', v.category, null, v.item, '카드결제', false,
       v.amount, 0, 0, -v.amount, v.note
from (values
  ('2026-10-09'::text, '집기구매'::text, '머리끈 50p'::text, 3900::int,
   '천사소녀 무매듭 머리끈 50p 세트 NHT-01-C01, 혼합색상 · 쿠팡 · 권리금 회수분이라 미정산'::text),

  ('2026-10-09', '기타', '라볶이 8개', 9670,
   '팔도 라볶이 봉지라면 145g, 8개 · 쿠팡 · 권리금 회수분이라 미정산'),

  ('2026-10-07', '집기구매', '펭귄 얼음 깨기', 6300,
   '스핀마스터 펭귄 얼음 깨기 균형잡기 게임, 1개, 혼합색상 · 쿠팡 · 권리금 회수분이라 미정산'),

  ('2026-10-06', '집기구매', '우노 카드게임', 11900,
   '코리아보드게임즈 우노 카드게임, 1개, 혼합색상 · 쿠팡 · 권리금 회수분이라 미정산'),

  ('2026-10-06', '집기구매', '카드 셔플러', 13790,
   'QUOKKA 듀얼 카드 셔플러 QM-01, 블랙, 1개 · 쿠팡 · 권리금 회수분이라 미정산')
) as v(date, category, item, amount, note)
where not exists (
  select 1 from ledger l
  where l.kind = '매입' and l.date = v.date::date and l.customer_name = v.item and l.amount = v.amount
);

-- 확인: 5건, 합계 45,560원, 전부 미정산이어야 한다
select date, category, customer_name, amount, net, payment_method, settled
from ledger
where kind = '매입' and date between '2026-10-06' and '2026-10-09'
order by date desc, customer_name;

select count(*) as 건수, sum(amount) as 합계, count(*) filter (where settled) as 정산완료
from ledger
where kind = '매입' and date between '2026-10-06' and '2026-10-09';
