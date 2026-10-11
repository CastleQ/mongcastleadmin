-- 닌텐도 스위치 게임 14종 추가 (출처: 사장님 정리 문서 2026-10-11)
-- 여러 번 실행해도 안전: 같은 이름이 이미 있으면 건너뜀. 기존 게임은 건드리지 않음.
--
-- 순서가 중요하다(옮기지 말 것): games.kind 제약을 먼저 넓혀야 '스위치게임' 행이 들어간다.
-- 인원(players)은 "본체 1대 + TV 1대" 기준 동시 플레이 인원이다. 로컬통신·온라인 인원은 소개(synopsis)에 적었다.
-- 이미지는 북미 GameStop·BestBuy·Kroger, 일본 Amazon 패키지 주소를 그대로 가리킨다(기존 게임들과 같은 방식).
--   한국판 패키지와 로고·문구가 다를 수 있고, 저쪽 사이트가 주소를 바꾸면 깨진다.
--   깨지면 게임 관리 화면에서 사진을 직접 올려 덮어쓰면 된다.

-- 1) kind 제약 넓히기 — 이름이 다를 수도 있어 kind 를 쓰는 검사 제약을 모두 떼고 다시 만든다
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'games'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table games drop constraint %I', c);
  end loop;
end $$;

alter table games add constraint games_kind_check
  check (kind in ('보드게임', '머더미스터리', '스위치게임'));

-- 2) 게임 넣기
insert into games (kind, name, name_original, category, players, play_minutes, qty, synopsis, note, image_url)
select v.kind, v.name, v.name_original, v.category, v.players, v.play_minutes, v.qty, v.synopsis, v.note, v.image_url
from (values
  ('스위치게임'::text, '마리오카트8 디럭스'::text,
   'Mario Kart 8 Deluxe / マリオカート8 デラックス'::text, '레이싱'::text, '1~4인'::text, 12::int, 1::int,
   '화면을 나눠 4인까지 함께 달려요. 1레이스 약 3분, 그랑프리 약 12분. 핸들 보조 기능이 있어 처음 하는 분도 괜찮아요. 본체를 여러 대 쓰면 로컬통신 8인·온라인 12인까지 가능해요.'::text,
   null::text,
   'https://media.gamestop.com/i/gamestop/10141928/Mario-Kart-8-Deluxe?w=768&h=768&fmt=auto'::text),

  ('스위치게임', '슈퍼 마리오 파티',
   'Super Mario Party / スーパー マリオパーティ', '파티', '1~4인', 60, 1,
   '주사위를 굴려 말을 옮기는 보드 모드는 약 60분, 미니게임만 골라 하면 1~2분이에요. 조이콘을 한 사람이 1개씩 들고 하는 방식만 지원해서 4인이면 조이콘 4개가 필요해요(프로콘으로는 못 해요).',
   '조이콘 4개 필요 — 프로콘 불가. 매장 조이콘 수량 확인',
   'https://www.kroger.com/product/images/large/front/0004549659430'),

  ('스위치게임', '저스트댄스 2022',
   'Just Dance 2022', '댄스', '1~6인', 4, 1,
   '1곡 3~4분. 조이콘 1개가 1명이라 6명이 하려면 조이콘 6개가 필요해요. 매장에 있는 게임 중 유일하게 5명 이상이 한 번에 할 수 있어요.',
   '조이콘 6개 필요',
   'https://media.gamestop.com/i/gamestop/11148896/Just-Dance-2022---Nintendo-Switch?w=768&h=768&fmt=auto'),

  ('스위치게임', '뉴 슈퍼 마리오 브라더스 U 디럭스',
   'New Super Mario Bros. U Deluxe / New スーパーマリオブラザーズ U デラックス', '플랫포머', '1~4인', 5, 1,
   '4명이 같은 화면에서 동시에 뛰어요. 서로 밟고 방해하게 되는 ''우정 파괴'' 재미가 있어요. 코스 하나에 3~5분.',
   null,
   'https://media.gamestop.com/i/gamestop/10162381/New-Super-Mario-Bros-U-Deluxe---Nintendo-Switch'),

  ('스위치게임', '뿌이뿌이 모루카 모두함께! 모루카 파티!',
   'PUI PUI Molcar Let''s! Molcar Party! / PUI PUI モルカー Let''s! モルカーパーティー!', '파티', '1~4인', 3, 1,
   '미니게임 10종. 조이콘을 나눠 들고 4인 대전. 한 판 2~3분이라 짧게 끊어 하기 좋아요.',
   null,
   'https://m.media-amazon.com/images/I/81t7G+d4vfL.jpg'),

  ('스위치게임', '스니퍼클립스',
   'Snipperclips (Plus) / いっしょにチョキッと スニッパーズ', '협력 퍼즐', '1~4인', 5, 1,
   '서로의 몸을 잘라 모양을 맞추는 협력 퍼즐이에요. 본편은 2인 협력, 파티 모드는 4인. 퍼즐 하나에 2~5분.',
   '실물 패키지는 Plus 판',
   'https://media.gamestop.com/i/gamestop/10153461/together'),

  ('스위치게임', '별의 커비 스타 얼라이즈',
   'Kirby Star Allies / 星のカービィ スターアライズ', '액션', '1~4인', 10, 1,
   '4인 협력 액션. 난이도가 낮아 게임을 안 해본 분이나 아이가 섞여도 무난해요. 스테이지 한 판 5~10분.',
   null,
   'https://media.gamestop.com/i/gamestop/10157825/Kirby-Star-Allies---Nintendo-Switch'),

  ('스위치게임', '별의 커비 디스커버리',
   'Kirby and the Forgotten Land / 星のカービィ ディスカバリー', '3D 액션', '1~2인', 15, 1,
   '2P는 반다나 와들디로 거드는 협력이에요. 스테이지 10~15분.',
   null,
   'https://media.gamestop.com/i/gamestop/11164162/Kirby-and-the-Forgotten-Land---Nintendo-Switch?w=768&h=768&fmt=auto'),

  ('스위치게임', '태고의 달인 쿵딱! 원더풀 페스티벌',
   'Taiko no Tatsujin: Rhythm Festival / 太鼓の達人 ドンダフルフェスティバル', '리듬', '연주 2인 / 파티 4인', 2, 1,
   '1곡 약 2분. 둘이 연주로 겨루거나, 넷이 파티 모드로 할 수 있어요. 기본 수록 76곡이고 그 밖의 곡은 유료 구독이 필요해요.',
   null,
   'https://media.gamestop.com/i/gamestop/11207114/Taiko-no-Tatsujin-Rhythm-Festival'),

  ('스위치게임', '태고의 달인 닌텐도 스위치 버~전!',
   'Taiko no Tatsujin: Drum ''n'' Fun! / 太鼓の達人 Nintendo Switchば～じょん!', '리듬', '연주 2인 / 파티 4인', 2, 1,
   '1곡 약 2분. 70곡 이상 들어 있어요. 둘이 연주, 넷이 파티 모드.',
   '본편 디지털 판매는 2023년 11월 종료 — 실물 패키지는 그대로 사용 가능',
   'https://m.media-amazon.com/images/I/91WEN5hnQLL.jpg'),

  ('스위치게임', '1-2-Switch',
   '1-2-Switch', '파티', '2인', 1, 1,
   '화면이 아니라 상대 얼굴을 보고 하는 대면 게임이에요. 한 판 1분 내외라 구경하는 사람이 많을 때 더 재미있어요.',
   null,
   'https://media.gamestop.com/i/gamestop/10141905/1-2-Switch?w=768&h=768&fmt=auto'),

  ('스위치게임', '모여봐요 동물의 숲',
   'Animal Crossing: New Horizons / あつまれ どうぶつの森', '시뮬레이션', '1~4인', null, 1,
   '끝이 정해져 있지 않은 느긋한 섬 생활 게임이에요. 한 화면에서 4명까지 돌아다닐 수 있고, 본체를 여러 대 쓰면 8명까지 모일 수 있어요. 섬은 본체에 하나뿐이라 대표 한 분을 중심으로 진행돼요.',
   '섬은 본체당 1개 — 손님이 바뀌면 같은 섬을 이어서 쓰게 되니 세이브 주의',
   'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/dc24f3dc-d74e-460e-b0ff-842fbd7b9d1c.jpg;maxHeight=750;maxWidth=345?format=webp'),

  ('스위치게임', '포켓몬스터 레츠고! 이브이',
   'Pokémon: Let''s Go, Eevee! / ポケットモンスター Let''s Go! イーブイ', 'RPG', '1~2인', null, 1,
   '혼자 쭉 진행하는 모험 게임이고, 2P는 거드는 역할만 할 수 있어요.',
   '세이브 파일 1개 — 손님이 바뀌면 이어서 하게 되니 주의',
   'https://media.gamestop.com/i/gamestop/10162386/Eevee?w=768&h=768&fmt=auto'),

  ('스위치게임', '젤다의 전설 야생의 숨결',
   'The Legend of Zelda: Breath of the Wild / ゼルダの伝説 ブレス オブ ザ ワイルド', '액션 어드벤처', '1인', null, 1,
   '혼자 하는 오픈월드 게임이에요. 여러 명이 모인 자리에서는 돌아가며 하거나 함께 구경하는 쪽이 맞아요.',
   null,
   'https://media.gamestop.com/i/gamestop/10141904/The-Legend-of-Zelda-Breath-of-the-Wild---Nintendo-Switch?w=768&h=768&fmt=auto')
) as v(kind, name, name_original, category, players, play_minutes, qty, synopsis, note, image_url)
where not exists (select 1 from games g where g.name = v.name);

-- 3) 확인: 스위치게임 14개가 들어왔는지, 이미지가 빠진 것이 없는지
select kind, count(*) as 개수, count(image_url) as 이미지있음
from games group by kind order by kind;

select name, players, play_minutes, case when image_url is null then '없음' else '있음' end as 이미지
from games where kind = '스위치게임' order by name;
