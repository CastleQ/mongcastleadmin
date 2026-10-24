-- 보드게임 4종 추가 + 2종 수량 올리기 + 매입 63,000원 (2026-10-13)
-- 여러 번 실행해도 안전: 새 게임은 같은 이름이 있으면 건너뛰고, 수량은 '목표값'으로 못박고,
--   매입도 같은 건이 있으면 건너뛴다. (수량을 +1 로 쓰면 다시 돌릴 때마다 늘어나므로 그렇게 쓰지 않았다)
-- ※ 실행한 뒤 보유 게임·거래 화면을 새로고침해야 보입니다.
--
-- 장르는 넷 다 '파티'로 넣었다(파티게임 탭).
--   ⚠️ 칠교놀이만 애매하다 — 여럿이 하는 파티 게임이 아니라 혼자·둘이 맞추는 전통 퍼즐이다.
--      '추상전략'으로 바꾸면 전략게임 탭으로 간다. 어느 쪽이 좋을지 말씀 주세요.
-- 칠교놀이는 특정 제품이 아닌 전통 놀이라 원제·BGG·이미지가 없다.

-- ① 새 게임 4종
insert into games (kind, name, name_original, category, players, play_minutes, qty, language, link, bgg_id, image_url, note)
select v.kind, v.name, v.name_original, v.category, v.players, v.play_minutes, v.qty, v.language, v.link, v.bgg_id, v.image_url, v.note
from (values
  ('보드게임'::text, '야단법석 달리기'::text, 'Magical Athlete (2025)'::text, '파티'::text, '2~6인'::text, 30::int, 1::int,
   '한국어'::text, 'https://boardgamegeek.com/boardgame/454103/magical-athlete'::text, 454103::int,
   'https://cf.geekdo-images.com/1uW8t9AkuqOF0xjv_sXKgw__itemrep/img/kX7nOOJnJ2XgkOEkFrev6Sxj7pA=/fit-in/246x300/filters:strip_icc()/pic9106864.png'::text,
   '코리아보드게임즈 한국판. 캐릭터마다 특수 능력이 달라 뽑기 운이 크다'::text),

  ('보드게임', '아브라카 왓?', 'Abracada...What? (2014)', '파티', '2~5인', 30, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/163930/abracadawhat', 163930,
   'https://cf.geekdo-images.com/ExKZ4I1R5sx-F65Gj-wDFA__itemrep/img/HqNNo6nbDxMSJWF5xfWbXQwRKkY=/fit-in/246x300/filters:strip_icc()/pic2428651.png',
   '한국 작가 Gary Kim 작. 7세 이상 추리 가족게임'),

  ('보드게임', '뱅', 'BANG! (2002)', '파티', '4~7인', 40, 1,
   '한국어', 'https://boardgamegeek.com/boardgame/3955/bang', 3955,
   'https://cf.geekdo-images.com/_04xA-d-rfygm0c49HE4vA__itemrep/img/odOgplfH-u2pzHgbhhDQF0aIsmA=/fit-in/246x300/filters:strip_icc()/pic1170986.jpg',
   '서부극 정체 숨기기. 4인부터 되고 인원이 많을수록 재미있다'),

  ('보드게임', '칠교놀이', null, '파티', null, null, 1,
   '한국어', null, null, null,
   '전통 퍼즐(탱그램). 특정 제품이 아니라 원제·BGG 없음. ⚠️ 인원·시간은 쓰기 나름이라 비워 둠')
) as v(kind, name, name_original, category, players, play_minutes, qty, language, link, bgg_id, image_url, note)
where not exists (select 1 from games g where g.name = v.name);

-- ② 수량만 올리기 (이미 있는 게임 2종). 목표값으로 못박아 재실행해도 2를 넘지 않는다
update games set qty = 2 where kind = '보드게임' and name = '할리갈리' and qty < 2;
update games set qty = 2 where kind = '보드게임' and name = '우노'     and qty < 2;

-- ③ 매입 63,000원. 파티룸에 남는 물건이라 집기구매 + 미정산(권리금 회수분) — docs/운영규칙.md 기준
insert into ledger (date, kind, category, channel, customer_name, payment_method, settled,
                    amount, fee, other_expense, net, note)
select '2026-10-13'::date, '매입', '집기구매', null, '보드게임 6종', '카드결제', false,
       63000, 0, 0, -63000,
       '야단법석 달리기, 아브라카 왓?, 뱅, 칠교놀이 (새로 추가) + 할리갈리·우노 (1개씩 더 구매) · 권리금 회수분이라 미정산'
where not exists (
  select 1 from ledger l
  where l.kind = '매입' and l.date = '2026-10-13'::date and l.customer_name = '보드게임 6종' and l.amount = 63000
);

-- 확인 ① 새 게임 4종 + 수량 올린 2종
select name, category, players, play_minutes, qty,
       case when image_url is null then '없음' else '있음' end as 이미지
from games
where kind = '보드게임' and name in ('야단법석 달리기','아브라카 왓?','뱅','칠교놀이','할리갈리','우노')
order by qty desc, name;

-- 확인 ② 매입 1건 (63,000원 / 미정산)
select date, category, customer_name, amount, net, settled
from ledger where kind = '매입' and customer_name = '보드게임 6종';

-- 확인 ③ 전체 게임 수 (92 + 4 = 96 이어야 함)
select count(*) as 전체게임 from games;
