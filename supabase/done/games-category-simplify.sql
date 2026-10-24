-- 장르 간소화: 전략 / 파티 / 마피아 / 머더미스터리 (+예외 테마게임, 추상전략)
-- 규칙: 플레이타임 60분 이상 = 전략 (예외: 광기의 저택·데드 바이 데이라이트 = 테마게임, 시계탑에 흐른 피·데드 오브 윈터 = 마피아)
-- 여러 번 실행해도 안전 (id 기준으로 값만 덮어씀)
-- 되돌리기: 이전 상세 장르는 games-update-2026-10.sql 의 category 값을 다시 실행하면 복원됨

update games set category = '머더미스터리' where kind = '머더미스터리';

-- 60분 이상: 도미넌트 스피시즈, 카네기, 테오티우아칸, 위대한 로렌초, 아르낙, 트라야누스,
--            태양 너머로, 오딘을 위하여, 콩코르디아, 촐킨, 광합성, 플레임크래프트, 하트 오브 크라운, 메나라
update games set category = '전략' where id in (53, 10, 32, 56, 26, 12, 14, 11, 58, 9, 44, 8, 6, 23);
-- 60분 미만 전략: 네이션스, 해녀, 캔버스, 스플렌더, 웰컴투, 딥씨 크루, 스페이스 크루, 판타지 왕국
update games set category = '전략' where id in (31, 25, 57, 7, 27, 45, 46, 28);

update games set category = '테마게임' where id in (4, 22);   -- 광기의 저택, 데드 바이 데이라이트
update games set category = '추상전략' where id = 42;         -- 아발론 (구슬게임)
update games set category = '마피아'   where id in (13, 55, 29); -- 어나니머스, 시계탑에 흐른 피, 데드 오브 윈터 (60분 이상 예외)

-- 우리들의 여름방학, 우노, 오리너구리, 5분 미스터리, 아베 시저, 피냐타 로카, 장난꾸러기 호박벌,
-- 타란툴라 탱고, 닉네임, 펭귄 얼음깨기, 후엠아이, 피자의 달인
update games set category = '파티' where id in (50, 33, 49, 30, 43, 48, 51, 52, 47, 54, 24, 2);

select category, count(*) from games group by category order by count(*) desc;
