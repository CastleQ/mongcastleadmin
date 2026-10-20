-- 보드게임 10종 추가 (출처: 사장님 정리 문서 2026-10-12, BGG 기준)
-- 여러 번 실행해도 안전: 같은 이름이 이미 있으면 건너뜀. 기존 게임은 건드리지 않음.
--
-- 분류(사장님 지정): 윙스팬만 '전략', 나머지 9종은 '파티'.
--   → 공개 페이지에서 윙스팬은 전략게임 묶음, 나머지는 파티게임 묶음에 들어간다.
-- 시간: BGG 가 범위로 적은 것은 긴 쪽을 넣었다 (5초 준다 30, 워드 캡처 15, 카탄 120, 윙스팬 70).
--   달무티는 BGG 가 60분이라고 적지만 실제로는 한 판 10분 안팎이라 사장님 지시대로 10으로 넣는다.
-- 10종 모두 기본판이라 확장(expansion)은 비워 둔다.
-- 이미지는 BGG 박스 썸네일(246×300) — 이미 있는 보드게임 40종과 같은 곳이다.

insert into games (kind, name, name_original, category, players, play_minutes, qty, link, bgg_id, image_url)
select v.kind, v.name, v.name_original, v.category, v.players, v.play_minutes, v.qty, v.link, v.bgg_id, v.image_url
from (values
  ('보드게임'::text, '벼룩 서커스'::text, 'Circus Flohcati (1998)'::text, '파티'::text, '2~5인'::text, 15::int, 1::int,
   'https://boardgamegeek.com/boardgame/337'::text, 337::int,
   'https://cf.geekdo-images.com/h-HgnES2sJu6_j_L00HYxA__itemrep/img/8noJnLpU7fYw6BrvdC_O3Upokdw=/fit-in/246x300/filters:strip_icc()/pic7594785.jpg'::text),

  ('보드게임', '마헤', 'Mahé (1974)', '파티', '2~7인', 20, 1,
   'https://boardgamegeek.com/boardgame/3383', 3383,
   'https://cf.geekdo-images.com/MLs0CGP2Uoq0bK-xMpnNBg__itemrep/img/ofmgW6RKgIfGKISLmIIZnKHk8mE=/fit-in/246x300/filters:strip_icc()/pic2215153.jpg'),

  ('보드게임', '한밤의 늑대인간', 'One Night Ultimate Werewolf (2014)', '파티', '3~10인', 10, 1,
   'https://boardgamegeek.com/boardgame/147949', 147949,
   'https://cf.geekdo-images.com/rqLju4uaZq-G9z4g91aPPQ__itemrep/img/WJfvsbdiVZ-amU0a7sstTVZiEUk=/fit-in/246x300/filters:strip_icc()/pic8783294.png'),

  ('보드게임', '5초 준다!', '5 Second Rule (2010)', '파티', '3~6인', 30, 1,
   'https://boardgamegeek.com/boardgame/86073', 86073,
   'https://cf.geekdo-images.com/wtON3lcNAz66s-WJ0OVmGg__itemrep/img/xX_m4H1SaeirrVP_i4bhRFJyi-I=/fit-in/246x300/filters:strip_icc()/pic7476834.jpg'),

  ('보드게임', '워드 캡처', 'Word Capture (2021)', '파티', '2~6인', 15, 1,
   'https://boardgamegeek.com/boardgame/322204', 322204,
   'https://cf.geekdo-images.com/ak3IvEJL-DihkifEu-r5zw__itemrep/img/aiZ_Cgz5-S7lLaFhcwUwTwY63i0=/fit-in/246x300/filters:strip_icc()/pic6255299.png'),

  ('보드게임', '달무티', 'The Great Dalmuti (1995)', '파티', '4~8인', 10, 1,
   'https://boardgamegeek.com/boardgame/929', 929,
   'https://cf.geekdo-images.com/LVCXyZpkL6rPsouhWV3noA__itemrep/img/Up5zJVWnPlSAaWUrPzwZhT2pjo4=/fit-in/246x300/filters:strip_icc()/pic711236.jpg'),

  ('보드게임', '할리갈리', 'Halli Galli (1990)', '파티', '2~6인', 10, 1,
   'https://boardgamegeek.com/boardgame/2944', 2944,
   'https://cf.geekdo-images.com/gm-LiZvjkluOeKqPvuUjDg__itemrep/img/J8WiccTd8JRHlry8uCivEvLrflc=/fit-in/246x300/filters:strip_icc()/pic8223481.jpg'),

  ('보드게임', '라스베가스', 'Las Vegas (2012)', '파티', '2~5인', 30, 1,
   'https://boardgamegeek.com/boardgame/117959', 117959,
   'https://cf.geekdo-images.com/aQJ0HRKx2mobP0g3FCeR_Q__itemrep/img/9vJIc03rFs_bh6gBLHERw01s3Ds=/fit-in/246x300/filters:strip_icc()/pic1261796.jpg'),

  ('보드게임', '카탄', 'Catan (1995)', '파티', '3~4인', 120, 1,
   'https://boardgamegeek.com/boardgame/13', 13,
   'https://cf.geekdo-images.com/0XODRpReiZBFUffEcqT5-Q__itemrep/img/6Jf5G-bSvdOIMUSwxsJfZXl29B8=/fit-in/246x300/filters:strip_icc()/pic9156909.png'),

  ('보드게임', '윙스팬', 'Wingspan (2019)', '전략', '1~5인', 70, 1,
   'https://boardgamegeek.com/boardgame/266192', 266192,
   'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep/img/DR7181wU4sHT6gn6Q1XccpPxNHg=/fit-in/246x300/filters:strip_icc()/pic4458123.jpg')
) as v(kind, name, name_original, category, players, play_minutes, qty, link, bgg_id, image_url)
where not exists (select 1 from games g where g.name = v.name);

-- 확인: 10종이 들어왔는지, 분류가 맞는지
select name, category, players, play_minutes, case when image_url is null then '없음' else '있음' end as 이미지
from games
where name in ('벼룩 서커스','마헤','한밤의 늑대인간','5초 준다!','워드 캡처','달무티','할리갈리','라스베가스','카탄','윙스팬')
order by category, name;

select kind, category, count(*) from games group by kind, category order by kind, count(*) desc;
