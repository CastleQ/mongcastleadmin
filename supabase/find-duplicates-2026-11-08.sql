-- 중복으로 보이는 거래 찾기 (2026-11-08) — **읽기만 합니다. 아무것도 바꾸거나 지우지 않습니다.**
--
-- ⚠️ Supabase SQL 편집기는 **맨 마지막 문장의 결과만** 보여줍니다.
--    그래서 문장을 하나로 합쳤습니다. 통째로 붙여넣고 Run 하면 표 하나에 다 나옵니다.
--    (결과가 0줄이면 중복이 없다는 뜻입니다.)
--
-- 보는 법
--   · 간격_초 가 몇 초~몇 분이면 저장 버튼을 여러 번 누른 것입니다.
--   · 간격_초 가 몇 시간·며칠이면 다른 날 따로 넣으신 것일 수 있으니 내용을 꼭 확인하세요.
--   · 지울후보_번호 = 가장 먼저 만든 1건을 빼고 나머지. 거래 화면에서 그 번호를 열어
--     확인하고 지우시면 됩니다(구글 일정도 함께 정리됩니다).

with 묶음 as (
  select date, kind, category, amount, customer_name, package,
         count(*)                                as 건수,
         array_agg(id order by created_at, id)   as ids,
         min(created_at)                         as 처음,
         max(created_at)                         as 마지막
  from ledger
  group by date, kind, category, amount, customer_name, package
  having count(*) > 1
)
select
  case when 마지막 - 처음 < interval '1 minute' then '⚠️ 버튼 여러 번' else '확인 필요' end as 판정,
  date                                   as 날짜,
  kind                                   as 구분,
  category                               as 항목,
  amount                                 as 금액,
  coalesce(customer_name, '(이름없음)')   as 고객명,
  coalesce(package, '-')                 as 패키지,
  건수,
  round(extract(epoch from (마지막 - 처음)))::int as 간격_초,
  ids[1]                                 as 남길_번호,
  ids[2:]                                as 지울후보_번호,
  (select count(*) from calendar_links c where c.ledger_id = any(ids[2:])) as 구글일정_걸린수
from 묶음
order by (마지막 - 처음 < interval '1 minute') desc, date desc;
