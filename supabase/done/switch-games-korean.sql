-- 스위치 게임: 전부 한국어판으로 표시 + 깨지는 이미지 1건 교체 (2026-10-11)
-- 여러 번 실행해도 안전 (값을 덮어쓰기만 함).
--
-- ① 언어: 사장님 확인 — 매장 스위치 게임은 전부 한국어판
-- ② 모여봐요 동물의 숲 이미지: BestBuy 주소는 **브라우저에서 안 보인다**(핫링크 차단).
--    curl 로는 200 이 떠서 처음 검사를 통과했지만, 실제 크롬에서 0x0 으로 깨지는 것을 확인했다.
--    같은 게임의 GameStop 주소로 바꾼다 (크롬에서 768x768 로 보이는 것 확인).

update games set language = '한국어' where kind = '스위치게임';

update games
set image_url = 'https://media.gamestop.com/i/gamestop/10168434/Animal-Crossing-New-Horizons---Nintendo-Switch?w=768&h=768&fmt=auto'
where kind = '스위치게임' and name = '모여봐요 동물의 숲';

-- 확인: 14건 모두 한국어, 이미지 주소에 bbystatic 이 남아 있지 않아야 한다
select count(*) as 전체, count(*) filter (where language = '한국어') as 한국어,
       count(*) filter (where image_url like '%bbystatic%') as 깨지는주소
from games where kind = '스위치게임';
