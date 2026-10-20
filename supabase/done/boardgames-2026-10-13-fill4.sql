-- 보드게임 4종 빈칸 채우기 (사장님이 보드라이프에서 찾아주심, 2026-10-13)
-- 앞서 `boardgames-2026-10-12-photo.sql` 로 넣을 때 인원·시간·이미지를 못 찾아 비워 둔 것들이다.
-- 여러 번 실행해도 안전: 값을 덮어쓰기만 하고, 이름이 바뀐 뒤에도 찾도록 옛 이름·새 이름을 함께 본다.
-- ※ 실행한 뒤 보유 게임 화면을 새로고침해야 보입니다.
--
-- 이름 두 개를 사장님이 주신 대로 바꾼다:
--   '페이퍼 사파리'  → '페이퍼 사파리: 피카츄와 친구들'
--   'Hell''sLure'    → '헬스 루어'
--
-- 시간이 범위면 긴 쪽 (더블 매칭 15~30분 → 30).
-- 이미지는 보드라이프 주소다. 이 작업환경에서는 보드라이프가 403으로 막아 확인하지 못했는데,
--   **이미 사이트에서 잘 보이는 기존 보드라이프 이미지도 똑같이 403** 이라 주소 문제가 아니라
--   이 컨테이너가 막힌 것이다. 혹시 화면에서 깨져 보이면 알려주세요.

update games set
  name_original = 'CookieRun: Brave Party',
  players       = '2~6인',
  play_minutes  = 30,
  image_url     = 'https://img.boardlife.co.kr/wys2/swf_upload/2022/10/14/1665719241673529_lg_w300.jpg',
  note          = '보드라이프 기준 8세 이상'
where kind = '보드게임' and name = '쿠키런: 용감한 파티!';

update games set
  name          = '페이퍼 사파리: 피카츄와 친구들',
  name_original = 'Paper Safari: Korean Pokémon edition',
  players       = '2~5인',
  play_minutes  = 30,
  image_url     = 'https://img.boardlife.co.kr/wys2/swf_upload/2022/08/19/1660909382818764_lg_w300.jpg',
  note          = '포켓몬 한국판'
where kind = '보드게임' and name in ('페이퍼 사파리', '페이퍼 사파리: 피카츄와 친구들');

update games set
  name_original = 'Double Ditto',
  players       = '4~99인',
  play_minutes  = 30,
  image_url     = 'https://img.boardlife.co.kr/data/boardgame_strategy_reg/2021/12/20/1639933348-770963_w300.jpg',
  note          = '상자 표기 만 10세 이상·4명 이상. 보드라이프 기준 4~99인 15~30분 — 인원 제한이 사실상 없음'
where kind = '보드게임' and name = '더블 매칭';

update games set
  name          = '헬스 루어',
  name_original = 'Hell''sLure (TEAM Mono)',
  players       = '2~4인',
  play_minutes  = 20,
  image_url     = 'https://img.boardlife.co.kr/data/boardgame_strategy_reg/2019/05/20/1558331662-215888_w300.jpg',
  note          = '상자 표기는 Hell''sLure'
where kind = '보드게임' and name in ('Hell''sLure', '헬스 루어');

-- 확인: 4종 모두 인원·시간·이미지가 채워졌는지 ('없음' 이 하나도 없어야 함)
select name, name_original, players, play_minutes,
       case when image_url is null then '없음 ⚠️' else '있음' end as 이미지
from games
where kind = '보드게임'
  and name in ('쿠키런: 용감한 파티!', '페이퍼 사파리: 피카츄와 친구들', '더블 매칭', '헬스 루어')
order by name;

-- 확인: 이미지 없는 보드게임이 더 남아 있는지 (0 이면 전부 채워짐)
select count(*) as 이미지없는보드게임 from games where kind = '보드게임' and image_url is null;
