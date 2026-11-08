-- 중복으로 보이는 거래 찾기 (2026-11-08) — **읽기만 합니다. 아무것도 바꾸거나 지우지 않습니다.**
--
-- 저장 버튼이 느려 여러 번 눌렀을 때 생긴 중복을 찾습니다.
-- 지우는 건 사장님이 보고 정하실 일이라 이 파일에는 지우는 문장을 넣지 않았습니다.
-- 지울 때는 **거래 화면에서 한 건씩 확인하고 지우시는 쪽**을 권합니다(되돌리기가 있습니다).

-- ① 같은 날짜·구분·항목·금액·고객명·패키지가 2건 이상인 묶음
--    '만든 시각'이 몇 초~몇 분 안으로 붙어 있으면 버튼을 여러 번 누른 것입니다.
select date                          as 날짜,
       kind                          as 구분,
       category                      as 항목,
       amount                        as 금액,
       coalesce(customer_name, '(이름없음)') as 고객명,
       coalesce(package, '-')        as 패키지,
       count(*)                      as 건수,
       array_agg(id order by id)     as 거래번호들,
       min(created_at)               as 처음_만든시각,
       max(created_at)               as 마지막_만든시각,
       round(extract(epoch from (max(created_at) - min(created_at))))::int as 간격_초
from ledger
group by date, kind, category, amount, customer_name, package
having count(*) > 1
order by date desc;

-- ② 그중 **1분 안에 몰아서 만들어진 것** = 버튼 여러 번 누른 것이 거의 확실
select date as 날짜, kind as 구분, amount as 금액,
       coalesce(customer_name, '(이름없음)') as 고객명,
       array_agg(id order by id) as 거래번호들,
       count(*) as 건수,
       round(extract(epoch from (max(created_at) - min(created_at))))::int as 간격_초
from ledger
group by date, kind, category, amount, customer_name, package
having count(*) > 1
   and max(created_at) - min(created_at) < interval '1 minute'
order by date desc;

-- ③ ②에 걸린 묶음에서 **나중에 들어온 것들**만 (= 지울 후보. 가장 먼저 만든 1건은 남깁니다)
--    번호를 적어 두셨다가 거래 화면에서 하나씩 열어 확인하고 지우시면 됩니다.
with 묶음 as (
  select array_agg(id order by created_at, id) as ids
  from ledger
  group by date, kind, category, amount, customer_name, package
  having count(*) > 1 and max(created_at) - min(created_at) < interval '1 minute'
)
select l.id as 지울후보_번호, l.date as 날짜, l.kind as 구분, l.category as 항목,
       l.amount as 금액, coalesce(l.customer_name,'(이름없음)') as 고객명,
       coalesce(l.package,'-') as 패키지, l.created_at as 만든시각
from 묶음 m
join ledger l on l.id = any(m.ids[2:])   -- 첫 건(m.ids[1])은 남기고 둘째부터
order by l.date desc, l.id;

-- ④ 구글캘린더에도 중복 일정이 올라갔는지 (지울 후보에 연결된 일정이 있으면 거래를 지울 때 같이 사라집니다)
with 묶음 as (
  select array_agg(id order by created_at, id) as ids
  from ledger
  group by date, kind, category, amount, customer_name, package
  having count(*) > 1 and max(created_at) - min(created_at) < interval '1 minute'
)
select count(*) as 구글일정_연결된_지울후보
from 묶음 m
join calendar_links c on c.ledger_id = any(m.ids[2:]);
