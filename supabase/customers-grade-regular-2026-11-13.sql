-- 고객 등급에 '단골' 추가 (2026-11-13)
-- 지금은 등급이 일반·그레이·블랙만 들어가게 막혀 있어서, 이걸 돌려야 화면에서 '단골'을 고를 수 있다.
-- 기존 고객 기록은 하나도 바뀌지 않는다. 여러 번 실행해도 안전.

-- 등급 제약을 이름으로 찾아 지우고(이름이 다를 수 있어서) 넓혀서 다시 만든다
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'customers'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%grade%'
  loop
    execute format('alter table customers drop constraint %I', c);
  end loop;
end $$;

alter table customers add constraint customers_grade_check
  check (grade in ('일반', '단골', '그레이', '블랙'));

-- 확인: 등급별 고객 수 (기존 숫자 그대로여야 한다)
select grade, count(*) as 고객수 from customers group by grade order by grade;

-- 되돌리기 (단골 고객이 있으면 먼저 다른 등급으로 바꿔야 한다)
-- alter table customers drop constraint customers_grade_check;
-- alter table customers add constraint customers_grade_check check (grade in ('일반','그레이','블랙'));
