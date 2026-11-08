-- 느슨한 중복 찾기 (2026-11-08) — **읽기만 합니다.**
-- 엄격한 판(날짜·구분·항목·금액·고객명·패키지가 모두 같은 것)에서 0건이 나와서,
-- **날짜·구분·금액 세 가지만 같으면** 모두 보여주도록 느슨하게 했습니다.
-- 한 번은 고객명을 비우고 저장하는 등 한 칸이라도 다르면 엄격한 판에는 안 걸립니다.
--
-- 통째로 붙여넣고 Run 하세요. 표 하나에 나옵니다. 0줄이면 이쪽으로도 중복이 없다는 뜻입니다.
-- 묶음 안의 줄들을 나란히 보여주니, 어느 칸이 다른지 눈으로 비교하시면 됩니다.

with 묶음 as (
  select date, kind, amount, count(*) as 건수,
         min(created_at) as 처음, max(created_at) as 마지막
  from ledger
  group by date, kind, amount
  having count(*) > 1
)
select
  case when m.마지막 - m.처음 < interval '5 minutes' then '⚠️ 몰아서 생김' else '확인 필요' end as 판정,
  l.date                                as 날짜,
  l.kind                                as 구분,
  l.amount                              as 금액,
  l.id                                  as 거래번호,
  l.category                            as 항목,
  coalesce(l.customer_name, '(비어있음)') as 고객명,
  coalesce(l.package, '-')              as 패키지,
  coalesce(l.channel, '-')              as 채널,
  l.created_at                          as 만든시각,
  m.건수                                 as 묶음_건수,
  round(extract(epoch from (m.마지막 - m.처음)))::int as 묶음_간격_초
from 묶음 m
join ledger l on l.date = m.date and l.kind = m.kind and l.amount = m.amount
order by (m.마지막 - m.처음 < interval '5 minutes') desc, l.date desc, l.amount, l.created_at;
