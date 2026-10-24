-- 월세 선등록: 2026-11-01 ~ 2028-08-01 매월 1일, 매입 · 월세기타 · 775,000원
-- 2026년은 정산 완료(자동이체 확정), 2027-01부터는 정산 꺼둠 (매달 이체 확인 후 거래 표에서 체크)
-- 재실행 가능: 같은 날짜에 '매입 · 월세기타'가 이미 있으면 건너뜀 (10/1 기존 건도 그대로)

insert into ledger (date, kind, category, settled, amount, fee, other_expense, net, payment_method, note)
select d::date, '매입', '월세기타', d < '2027-01-01', 775000, 0, 0, -775000, '계좌이체', '월세 자동이체'
from generate_series('2026-11-01'::date, '2028-08-01'::date, interval '1 month') as d
where not exists (
  select 1 from ledger l where l.date = d::date and l.kind = '매입' and l.category = '월세기타'
);

-- 확인: 월세 줄 전부 (날짜·정산 여부)
select date, settled, amount from ledger where kind = '매입' and category = '월세기타' order by date;
