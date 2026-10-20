-- 보드게임 13종 추가 + 매입 1건 (사장님 사진, 2026-10-12)
-- 여러 번 실행해도 안전: 같은 이름이 이미 있으면 건너뜀. 기존 자료는 건드리지 않음.
-- ※ 실행한 뒤 보유 게임·거래 화면을 새로고침해야 보입니다.
--
-- 분류: 이번 13종은 전부 '파티'로 넣었다. 윙스팬만 전략이라는 지난 지시와 같은 기준이다.
--   (아르보레툼·보난자처럼 전략성 있는 것도 파티룸에서는 손님이 가볍게 집는 쪽이라 파티로 둠.
--    바꾸고 싶으면 게임 관리 화면에서 장르만 고치면 된다)
-- 인원·시간: BGG 박스 표기. 범위면 긴 쪽.
-- 이미지: BGG 썸네일 9개는 받아와 확인함(전부 200 image/webp).
--
-- ⚠️ 아래 4종은 BGG·보드라이프에서 못 찾아 인원·시간·이미지를 비워 뒀다. 지어내지 않았다.
--    쿠키런 용감한 파티(인원·시간만 보드라이프 확인), 페이퍼 사파리, 더블 매칭, Hell'sLure
--    → 상자 뒷면의 인원·시간을 알려주시면 채워 넣겠습니다.

insert into games (kind, name, name_original, category, players, play_minutes, qty, language, link, bgg_id, image_url, note)
select v.kind, v.name, v.name_original, v.category, v.players, v.play_minutes, v.qty, v.language, v.link, v.bgg_id, v.image_url, v.note
from (values
  -- ── BGG 에서 확인한 9종 ────────────────────────────────────────────────
  ('보드게임'::text, '캡틴 블랙잭'::text, 'Pirate 21 (2017)'::text, '파티'::text, '2~6인'::text, 15::int, 1::int,
   '한국어'::text, 'https://boardgamegeek.com/boardgame/225000/pirate-21'::text, 225000::int,
   'https://cf.geekdo-images.com/QTaCZbeI9x2_D9b3F5X50A__itemrep/img/cwx23kzi87p8xOlZH_iYGNt-_FI=/fit-in/246x300/filters:strip_icc()/pic3503995.jpg'::text,
   '코리아보드게임즈 한국어판'::text),

  ('보드게임', '미노 다이스', 'Mino Dice / Mythical Dice (2016)', '파티', '3~6인', 30, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/191071/mythical-dice', 191071,
   'https://cf.geekdo-images.com/RgAOz0_78OhnjASEVq-gTg__itemrep/img/V4oJv3u8Q1TXbCSZAInFQ2CTOCI=/fit-in/246x300/filters:strip_icc()/pic8715055.png',
   'BGG 등록명은 Mythical Dice, 상자 제목은 Mino Dice (Playte)'),

  ('보드게임', '픽토매니아', 'Pictomania (2011)', '파티', '3~6인', 25, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/98229/pictomania', 98229,
   'https://cf.geekdo-images.com/0m0X8qZxfARpz0lmzjxSEw__itemrep/img/oBmtn29Cc4SsCi3X5D2dnjo4-uU=/fit-in/246x300/filters:strip_icc()/pic2360788.png',
   '블라다 흐바틸 작. 동시에 그리고 동시에 맞히는 게임'),

  ('보드게임', '삼국살', 'Legends of the Three Kingdoms / 三國殺 (2007)', '파티', '2~10인', 40, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/35188/legends-of-the-three-kingdoms', 35188,
   'https://cf.geekdo-images.com/bCCX600ngCCFpJNO2JCLSA__itemrep/img/XQ2_Uj0QweA4xlIfI5igMhYh-H4=/fit-in/246x300/filters:strip_icc()/pic1599343.jpg',
   '기본판(標準版), YOKA GAMES. 인원이 많을 때 쓰기 좋음'),

  ('보드게임', '포인트 샐러드: 이브이 에디션', 'Point Salad: Eevee Edition (2019)', '파티', '2~6인', 30, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/274960/point-salad', 274960,
   'https://cf.geekdo-images.com/Xy0W9NtEpX0EVjwgxO3IEA__itemrep/img/_4tw4SHEg019t8839DKMAh6gs5M=/fit-in/246x300/filters:strip_icc()/pic4621571.png',
   '포켓몬 이브이 에디션(AEG). BGG 는 본판과 같은 항목으로 묶여 있어 이미지는 본판 것'),

  ('보드게임', '쿠키런 러브레터', 'Love Letter: CookieRun (2012 원작)', '파티', '2~4인', 20, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/129622/love-letter', 129622,
   'https://cf.geekdo-images.com/T1ltXwapFUtghS9A7_tf4g__itemrep/img/SJxpAXjBIPEj9m6hHZYeTbz9wzc=/fit-in/246x300/filters:strip_icc()/pic1401448.jpg',
   '러브레터 쿠키런 테마판(Z-Man·데브시스터즈). BGG 이미지는 원작 것'),

  ('보드게임', '보난자', 'Bohnanza (1997)', '파티', '3~7인', 45, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/11/bohnanza', 11,
   'https://cf.geekdo-images.com/8SADtu_4zBH_UJrCo935Iw__itemrep/img/Eg40fiS7D61bVhjp5qCnvEtfKfc=/fit-in/246x300/filters:strip_icc()/pic6348964.jpg',
   '우베 로젠베르크 작. 콩 거래·흥정 게임'),

  ('보드게임', '아르보레툼', 'Arboretum (2015)', '파티', '2~4인', 30, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/140934/arboretum', 140934,
   'https://cf.geekdo-images.com/XYOn10oXBrDqHySf0jvnyQ__itemrep/img/RRL2F2DBTNG4cO4c_oJIOlfGPes=/fit-in/246x300/filters:strip_icc()/pic4172124.png',
   null),

  ('보드게임', '갱 오브 포', 'Gang of Four (1990)', '파티', '3~4인', 40, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/3085/gang-of-four', 3085,
   'https://cf.geekdo-images.com/-naB4DfmUy8ER4kNRKmQPw__itemrep/img/GpPtudrP-ttNF389v29VxSiN0Hw=/fit-in/246x300/filters:strip_icc()/pic149652.jpg',
   'Days of Wonder. 카드 털어내기(클라이밍) 게임'),

  -- ── 못 찾아 비워 둔 4종 (사장님 확인 필요) ───────────────────────────
  ('보드게임', '쿠키런: 용감한 파티!', 'CookieRun: Brave Party', '파티', '2~6인', 30, 1,
   '한국어', 'https://boardlife.co.kr/game/16073', null, null,
   '보드라이프 기준 8세 이상 2~6인 30분. BGG 미등록이라 이미지 없음'),

  ('보드게임', '페이퍼 사파리', 'Paper Safari (포켓몬 피카츄와 친구들)', '파티', null, null, 1,
   '한국어', null, null, null,
   '⚠️ 인원·시간 확인 필요 — BGG·보드라이프에서 못 찾음'),

  ('보드게임', '더블 매칭', 'Double Matching (Goliath)', '파티', null, null, 1,
   '한국어', null, null, null,
   '⚠️ 상자 표기 만 10세 이상·4명 이상. 정확한 인원·시간 확인 필요 — BGG 미등록'),

  ('보드게임', 'Hell''sLure', 'Hell''sLure (TEAM Mono)', '파티', null, null, 1,
   '한국어', null, null, null,
   '⚠️ 인원·시간 확인 필요 — BGG·보드라이프에서 못 찾음. 소규모 창작 게임으로 보임')
) as v(kind, name, name_original, category, players, play_minutes, qty, language, link, bgg_id, image_url, note)
where not exists (select 1 from games g where g.name = v.name);


-- 매입 1건: 위 13종 묶음 구매 50,000원.
-- 파티룸에 남는 물건이라 '집기구매' + 미정산(권리금 회수분) — docs/운영규칙.md 기준.
insert into ledger (date, kind, category, channel, customer_name, payment_method, settled,
                    amount, fee, other_expense, net, note)
select '2026-10-12'::date, '매입', '집기구매', null, '보드게임 13종', '카드결제', false,
       50000, 0, 0, -50000,
       '사진으로 받은 보드게임 13종 묶음 구매 · 캡틴 블랙잭, 미노 다이스, 픽토매니아, 삼국살, 포인트 샐러드 이브이, 쿠키런 용감한 파티, 페이퍼 사파리, 쿠키런 러브레터, 보난자, 더블 매칭, 아르보레툼, 갱 오브 포, Hell''sLure · 권리금 회수분이라 미정산'
where not exists (
  select 1 from ledger l
  where l.kind = '매입' and l.date = '2026-10-12'::date and l.customer_name = '보드게임 13종' and l.amount = 50000
);


-- 확인 ① 게임 13종이 들어갔는지 (이미지 있음 9 / 없음 4 가 정상)
select name, category, players, play_minutes,
       case when image_url is null then '없음 ⚠️' else '있음' end as 이미지
from games
where name in ('캡틴 블랙잭','미노 다이스','픽토매니아','삼국살','포인트 샐러드: 이브이 에디션',
               '쿠키런 러브레터','보난자','아르보레툼','갱 오브 포','쿠키런: 용감한 파티!',
               '페이퍼 사파리','더블 매칭','Hell''sLure')
order by 이미지, name;

-- 확인 ② 매입 1건 (50,000원 / 미정산)
select date, category, customer_name, amount, net, settled
from ledger where kind = '매입' and customer_name = '보드게임 13종';

-- 확인 ③ 전체 게임 수 (79 + 13 = 92 여야 함)
select kind, count(*) from games group by kind order by kind;
