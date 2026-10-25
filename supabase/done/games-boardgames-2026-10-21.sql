-- 보드게임 15종 추가 (2026-10-21)
-- 여러 번 실행해도 안전: 같은 이름이 이미 있으면 건너뜁니다. 기존 게임은 건드리지 않습니다.
-- ※ 실행한 뒤 보유 게임 화면을 새로고침해야 보입니다.
--
-- ■ 받은 20개 중 이미 들어 있어 넣지 않은 것 4개
--     캡틴 블랙잭 / 딥씨 크루: 심해에서의 임무 / 야단법석 달리기 / 아브라카 왓?
-- ■ 못 찾아서 빠진 것 1개 — '머메이드 비치'
--     보드라이프·BGG·웹 검색 모두에서 같은 이름의 게임을 찾지 못했습니다.
--     상자에 적힌 영문 이름을 알려주시면 바로 넣겠습니다.
--
-- ■ 제가 판단으로 정한 것 (틀리면 말씀 주세요)
--   1) '루비큐브' → **루미큐브(Rummikub)** 로 넣었습니다. BGG 에 한글 별칭이 '루미큐브'로 등록돼
--      있어 이쪽으로 봤습니다. 혹시 루빅큐브(맞추는 큐브 장난감)라면 알려주세요.
--   2) 이름을 정식 제품명으로 맞춘 것: '토네이도6'→'토네이도 6',
--      '폭탄대소동 엔트리봇'→'엔트리봇 폭탄대소동'
--   3) '우리 게임으로 결혼했어요' 는 텀블벅으로 나온 커플 대화게임으로 보이는데,
--      인원·시간이 어디에도 적혀 있지 않아 **비워 뒀습니다**(지어내지 않음).
--   4) 시간은 **실제 체감 시간**으로 낮췄습니다 (사장님 지시, 10-22). 근거가 갈리니 구분해 둡니다.
--      · 출처 있음 — 타코 캣 10분(보드라이프 '10-30분'의 짧은 쪽), 스택버거 15분(보드라이프 표기)
--      · 제 판단 — 젝스님트 20분, 룩 30분, 루미큐브 40분
--        (이 셋은 BGG·보드라이프 모두 45/45/60분으로 적어 둬서, 낮춘 숫자에 출처가 없습니다.
--         한 판 돌려 보시고 다르면 보유 게임 화면에서 바로 고치실 수 있습니다)
--      · 안 건드린 것 — 우노 겨울왕국 30분. 이미 있는 '우노' 행과 같은 값으로 뒀습니다
--   5) 장르: 마라케시는 '전략', 루미큐브는 '추상전략'(둘 다 전략게임 탭), 나머지 13종은 '파티'.
--   6) language: BGG·보드라이프에 한국어판이 확인된 것만 '한국어'. 룩 카드게임은 확인 못 해 비움.
--
-- ■ 이미지: 12종은 BGG 이미지를 curl 로 두 번(리퍼러 없이/우리 사이트 리퍼러로) 받아
--   200 + image/* 를 확인했습니다. 엔트리봇은 보드라이프 이미지인데 이 작업환경에서는 403 이 뜨는데,
--   이미 사이트에서 잘 보이는 보드라이프 이미지 18개도 똑같이 403 이라 환경 탓입니다(CLAUDE.md 규칙 11).
--   우노 겨울왕국·우리 게임으로 결혼했어요는 이미지가 없습니다 — 실물을 찍어 올리시면 됩니다.

insert into games (kind, name, name_original, category, players, play_minutes, qty, language, link, bgg_id, image_url, note)
select v.kind, v.name, v.name_original, v.category, v.players, v.play_minutes, v.qty, v.language, v.link, v.bgg_id, v.image_url, v.note
from (values
  ('보드게임'::text, '토네이도 6'::text, '6th Sense (2021)'::text, '파티'::text, '2~6인'::text, 30::int, 1::int,
   '한국어'::text, 'https://boardgamegeek.com/boardgame/335857/6th-sense'::text, 335857::int,
   'https://cf.geekdo-images.com/olHL4zeLplDzjGgl3o942A__itemrep/img/yIQkbpvh5b39CGhA_SsIk0NsbUQ=/fit-in/246x300/filters:strip_icc()/pic6329985.png'::text,
   '트릭테이킹. 내가 몇 번 이길지 먼저 선언하고 그만큼 맞히면 점수. 4~6라운드'::text),

  ('보드게임', '타코 캣 고트 치즈 피자', 'Taco Cat Goat Cheese Pizza (2018)', '파티', '2~8인', 10, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/253664/taco-cat-goat-cheese-pizza', 253664,
   'https://cf.geekdo-images.com/GHrnr-Khb0LvBU_QkrC_qA__itemrep/img/cWh2D89fj4HLBkLT71g7JYWiM1s=/fit-in/246x300/filters:strip_icc()/pic7192024.png',
   '말과 그림이 맞으면 손바닥 내려치기. 10분(보드라이프 10-30분의 짧은 쪽)'),

  ('보드게임', '듀오 미니', 'Duo (1986)', '파티', '2~6인', 20, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/1464/duo', 1464,
   'https://cf.geekdo-images.com/XnBebdhxxTREP7nr8Dgo9g__itemrep/img/jF6RVXcK44hmF4ne7EY0EuzpltI=/fit-in/246x300/filters:strip_icc()/pic290418.jpg',
   '우노와 비슷한 색·숫자 내려놓기. 7세 이상'),

  ('보드게임', '캔트스탑', 'Can''t Stop (1980)', '파티', '2~4인', 30, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/41/cant-stop', 41,
   'https://cf.geekdo-images.com/nMitZr9Lu4Ux7LLqBy7Z8A__itemrep/img/VTp3Is-x92JR0IcHJIG8QDL22EQ=/fit-in/246x300/filters:strip_icc()/pic6875169.png',
   '주사위 운 밀어붙이기. 멈출지 더 굴릴지 고르는 게 전부라 규칙 설명 1분'),

  ('보드게임', '우노 겨울왕국', 'UNO: Frozen', '파티', '2~10인', 30, 1,
   '한국어', null, null, null,
   '겨울왕국 그림의 우노. 규칙은 기본 우노와 같다(우노는 따로 2개 있음)'),

  ('보드게임', '젝스님트', '6 nimmt! / Take 5 (1994)', '파티', '2~10인', 20, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/432/take-5', 432,
   'https://cf.geekdo-images.com/WuOY1XAIJQ-RGAmT_apW_w__itemrep/img/6Ed-INTd8Hitxi6gOJugeSBFHQE=/fit-in/246x300/filters:strip_icc()/pic8632998.jpg',
   '소머리 안 받기. 인원이 많아도 되고 설명이 짧아 첫 게임으로 좋다. ⚠️ BGG·보드라이프는 45분인데 체감 20분으로 넣음(출처 없는 판단)'),

  ('보드게임', '룩 카드게임', 'Rook (1906)', '파티', '2~6인', 30, 1,
   null, 'https://boardgamegeek.com/boardgame/1260/rook', 1260,
   'https://cf.geekdo-images.com/lKJgntNaJAa8A7QStjRvzA__itemrep/img/bLFO86V7E4n7LXOmDcJPwT1lETc=/fit-in/246x300/filters:strip_icc()/pic394433.jpg',
   '편 나눠 하는 트릭테이킹(미국 고전). 한국어판 여부는 확인 못 했다. ⚠️ BGG 45분인데 체감 30분으로 넣음(출처 없는 판단)'),

  ('보드게임', '로보77', 'Lobo 77 / Double Down (1993)', '파티', '2~8인', 30, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/3337/lobo-77', 3337,
   'https://cf.geekdo-images.com/3BBUXNm-ft9dPlK2JNdrcQ__itemrep/img/KhqEMv82Eqd56_wzeRSSEdIarw8=/fit-in/246x300/filters:strip_icc()/pic3989549.png',
   '합이 77을 넘거나 11의 배수가 되면 칩을 잃는 덧셈 카드게임'),

  ('보드게임', '우리 게임으로 결혼했어요', null, '파티', null, null, 1,
   '한국어', null, null, null,
   '커플용 가상결혼 대화게임(텀블벅 펀딩 제품으로 보임). ⚠️ 인원·시간이 어디에도 안 적혀 있어 비워 둠'),

  ('보드게임', '스컬킹', 'Skull King (2013)', '파티', '2~8인', 30, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/150145/skull-king', 150145,
   'https://cf.geekdo-images.com/1qvA21HdRaPYwrn4tGDNaQ__itemrep/img/duwIufYC4mHrAqmv9Wp2qCg_jVI=/fit-in/246x300/filters:strip_icc()/pic8689185.jpg',
   '해적 트릭테이킹. 몇 번 이길지 선언하고 맞히는 방식, 토네이도 6과 비슷한 계열'),

  ('보드게임', '엔트리봇 폭탄대소동', 'Entrybot Bomb Mayhem (2015)', '파티', '2~4인', 20, 1,
   '한국어', 'https://boardlife.co.kr/game/21135', null,
   'https://img.boardlife.co.kr/data/photo/2025/07/16/1752666074-675340.jpg',
   '엔트리(코딩 교육) 캐릭터 게임. 8세 이상. BGG 에는 없어 보드라이프 정보로 넣음'),

  ('보드게임', '숲 속의 음악대', 'Concerto Grosso / Panda Monium (1994)', '파티', '3~6인', 20, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/999/panda-monium', 999,
   'https://cf.geekdo-images.com/x4ls1E4Y7KMlCnPeRTbIew__itemrep/img/nIHbtAItG7LUmMr7ogupfq7nXtw=/fit-in/246x300/filters:strip_icc()/pic3031803.jpg',
   '카드에 나온 악기 동작을 몸으로 하는 어린이 동작게임. 6세 이상, 3인부터'),

  ('보드게임', '스택버거', 'Stack Burger (2017)', '파티', '2~4인', 15, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/261069/stack-burger', 261069,
   'https://cf.geekdo-images.com/Ok8kMcPfPxHAIEeIXfphhg__itemrep/img/LV4DZAriJiwTpXgIzITLFRjLDQM=/fit-in/246x300/filters:strip_icc()/pic5689929.jpg',
   '주문대로 버거 쌓기(기억력). 8세 이상. 15분(보드라이프 표기, BGG는 20-30분)'),

  ('보드게임', '마라케시', 'Marrakech (2007)', '전략', '2~4인', 30, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/29223/marrakech', 29223,
   'https://cf.geekdo-images.com/JFE29MODWOFXreEmM-xhyQ__itemrep/img/hO2TUcU1O4X4xt9q3eAvoNwFKDc=/fit-in/246x300/filters:strip_icc()/pic8594649.jpg',
   '양탄자 깔아 상대 자리 덮기. 가벼운 전략이라 전략게임 탭에 넣었다'),

  ('보드게임', '루미큐브', 'Rummikub (1950)', '추상전략', '2~4인', 40, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/811/rummikub', 811,
   'https://cf.geekdo-images.com/LeaLDlTTmeN639MfuflcMw__itemrep/img/x4GW0OJaN-pV8-K_b4RTSFioW6U=/fit-in/246x300/filters:strip_icc()/pic2286966.jpg',
   '⚠️ 사장님이 적어주신 이름은 ''루비큐브''였다. BGG 한글 별칭이 ''루미큐브''라 이쪽으로 판단. 루빅큐브면 고칠 것. ⚠️ BGG·보드라이프 60분인데 체감 40분으로 넣음(출처 없는 판단)')
) as v(kind, name, name_original, category, players, play_minutes, qty, language, link, bgg_id, image_url, note)
where not exists (select 1 from games g where g.name = v.name);

-- 확인 ① 새로 들어간 15종 (1회차 15건, 다시 돌리면 0건)
select name, category, players, play_minutes, language,
       case when image_url is null then '없음' else '있음' end as 이미지,
       case when bgg_id is null then '-' else bgg_id::text end as bgg
from games
where name in ('토네이도 6','타코 캣 고트 치즈 피자','듀오 미니','캔트스탑','우노 겨울왕국','젝스님트',
               '룩 카드게임','로보77','우리 게임으로 결혼했어요','스컬킹','엔트리봇 폭탄대소동',
               '숲 속의 음악대','스택버거','마라케시','루미큐브')
order by category, name;

-- 확인 ② 이미 있어서 건너뛴 4종이 그대로인지 (각각 1건씩, 값이 바뀌지 않아야 함)
select name, category, players, play_minutes, qty
from games
where name in ('캡틴 블랙잭','딥씨 크루: 심해에서의 임무','야단법석 달리기','아브라카 왓?')
order by name;

-- 확인 ③ 묶음별 개수 (파티게임이 13 늘고, 전략게임이 2 늘어야 함)
select kind, category, count(*) as 개수 from games group by kind, category order by kind, category;

-- 확인 ④ 전체 게임 수 (95 + 15 = 110 이어야 함)
select count(*) as 전체게임 from games;
