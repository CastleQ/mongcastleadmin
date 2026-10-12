---
name: write-sql
description: >
  몽캐슬 Supabase 에 넣을 SQL 파일을 만들고 검증해 사장님께 전달한다.
  거래(매입·매출) 추가, 게임·설정·요금 고치기, 표 만들기·칸 추가 등 DB 를 바꾸는 일이면 무조건 이걸 먼저 읽는다.
  "SQL 만들어줘", "DB 에 넣어줘", "거래 추가", "표에 칸 추가" 일 때 쓴다.
  Supabase 편집기의 함정, 재실행 안전하게 쓰는 틀, 임시 Postgres 로 검증하는 방법이 들어 있다.
---

# Supabase SQL 만들기

## 큰 전제

- **실행은 사장님이 한다.** 나는 파일을 만들어 `SendUserFile` 로 전달하고, 채팅에 요약을 적는다.
  나에게는 쓰기 권한이 없다(읽기만 가능, 아래 참고). 키를 요구하지 않는다.
- **파일 위치**: `supabase/<주제>-<YYYY-MM-DD>.sql`. git 에 넣는다.
  단, **고객 이름·연락처가 들어가면 git 에 넣지 않고** scratchpad 에만 두고 전달한다 (CLAUDE.md 규칙 6).
- **반드시 Write/Edit 도구로 쓴다.** bash heredoc·sed 로 쓰면 `\`, `$`, 백틱이 깎인다 (규칙 1).

## 쓰기 전에 — 지금 DB 를 읽어본다

게임 목록은 공개라 **anon 키로 읽을 수 있다.** 중복·현재값 확인에 쓴다.

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/games?select=id,kind,name,category&order=name" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

`ledger`(거래)·`customers`·`settings`·`info_sections` 는 **관리자 전용**이라 못 읽는다.
빈 배열 `[]` 이 와도 "없다"는 뜻이 아니라 "못 본다"는 뜻이다. 거래는 사장님께 물어보거나
화면 캡처를 받아 확인한다.

## 함정 (여기서 당했다)

1. **Supabase SQL Editor 는 문장마다 따로 저장(커밋)한다.**
   `create temporary table ... ` 로 목록을 담으면 **다음 문장에서 사라진다.**
   넣기·고치기·지우기를 함께 해야 하면 **데이터 변경 CTE 한 문장**으로 묶는다 (아래 틀 B).
2. **VALUES 목록은 첫 줄에만 타입을 붙인다** (`'글'::text`, `1::int`).
   안 붙이면 타입 추론이 어긋나 `column is of type X but expression is of type Y` 가 난다.
3. **표 제약(check)에 없는 값은 안 들어간다.** 예: `games.kind` 에 `스위치게임` 을 넣으려면
   제약부터 넓혀야 한다. 제약 이름이 다를 수 있으니 이름으로 찾아 지우고 다시 만든다
   (`supabase/switch-games.sql` 의 `do $$ ... pg_constraint ...` 참고).
4. **잠금 순서.** 같은 표에 `alter table` 과 데이터 문장이 섞이면 `alter` 를 맨 앞에 둔다.
   `supabase/calendar-sync.sql` 에서 순서를 안 지켜 교착(deadlock 40P01)이 실제로 났다.
5. **앱을 거치지 않으므로 연동이 안 돈다.** SQL 로 거래를 직접 넣으면 구글캘린더 일정이
   자동으로 안 만들어진다. 필요하면 "구글캘린더 연동 → 내보내기"를 눌러야 한다고 알린다.
6. **화면이 옛 내용을 들고 있다.** SQL 로 직접 넣으면 앱은 바뀐 걸 모른다.
   전달할 때 **"실행한 뒤 화면 새로고침"** 을 반드시 함께 안내한다
   (2026-10-12 에 이것 때문에 "매입이 안 들어갔다"는 제보가 왔고, 새로고침으로 해결됐다).

## 틀 A — 새로 넣기만 할 때

```sql
-- <주제> N건 추가 (출처: ..., YYYY-MM-DD)
-- 여러 번 실행해도 안전: 같은 것이 이미 있으면 건너뜀.
-- (판단으로 채운 칸이 있으면 무엇을 왜 그렇게 했는지 여기 적는다)

insert into <표> (칸1, 칸2, ...)
select v.칸1, v.칸2, ...
from (values
  ('값'::text, 1::int, ...),
  ('값2', 2, ...)
) as v(칸1, 칸2, ...)
where not exists (select 1 from <표> t where t.<판정키> = v.<판정키>);

-- 확인: 건수·합계가 의도대로인지 바로 보이게
select ... from <표> where ... order by ...;
```

## 틀 B — 이미 넣은 것을 고쳐야 할 때

**"안 돌린 경우와 이미 돌린 경우가 같은 결과"** 가 되게 쓴다. 사장님이 앞 판을 돌렸는지
기억 못 할 수 있고, 물어보는 것보다 양쪽 다 되게 쓰는 편이 빠르다.

```sql
with b(키1, 키2, 값1, ...) as (values
  ('...'::date, '...'::text, 1::int)
),
넣기 as (
  insert into <표> (...) select ... from b
  where not exists (select 1 from <표> t where t.키1 = b.키1 and t.키2 = b.키2)
  returning 1
),
고치기 as (
  update <표> t set ... from b
  where t.키1 = b.키1 and t.키2 = b.키2
  returning 1
)
delete from <표> where <빼기로 한 것>;
```

세 가지는 서로의 결과를 보지 않고 **실행 전 상태**를 함께 본다. 넣기는 '없는 것'만,
고치기는 '있는 것'만 건드리므로 겹치지 않는다.

## 검증 — 넘기기 전에 반드시 (규칙 2·4)

임시 Postgres 16 을 띄워 **두 번** 실행한다. 통과 기준: **1회차 N건 / 2회차 0건**, 합계가 의도대로.

```bash
PG=/usr/lib/postgresql/16/bin
id pgtest >/dev/null 2>&1 || useradd -m pgtest
[ -d /home/pgtest/data ] || su pgtest -c "$PG/initdb -D /home/pgtest/data -U pgtest --auth=trust"
su pgtest -c "$PG/pg_ctl -D /home/pgtest/data -o '-k /tmp -p 5444 -c listen_addresses=' -l /home/pgtest/log start"
mkdir -p /home/pgtest/sql && cp <만든파일>.sql /home/pgtest/sql/ && chown -R pgtest:pgtest /home/pgtest/sql
# 대상 표만 schema.sql 에서 떼어 만든다
sed -n '/^create table <표> (/,/^);/p' supabase/schema.sql > /home/pgtest/sql/t.sql
# 나중에 추가된 칸·제약도 재현한다 (예: games 의 image_url·bgg_id, 넓힌 kind 제약)
su pgtest -c "$PG/psql -h /tmp -p 5444 -U pgtest -d postgres -v ON_ERROR_STOP=1 -f /home/pgtest/sql/<만든파일>.sql"
...
$PG/pg_ctl -D /home/pgtest/data stop -m immediate   # 끝나면 내린다
```

더 좋게 하려면 **운영의 실제 값을 먼저 넣고** 검증한다 — 게임이면 anon 키로 읽은 이름 69개를
임시 DB 에 먼저 넣으면 이름 충돌까지 똑같이 재현된다 (2026-10-11 에 이렇게 확인함).

고쳐 쓰는 SQL(틀 B)은 **세 경우**를 돌린다: (A) 앞 SQL 안 돌린 상태, (B) 이미 돌린 상태,
(B 에서 한 번 더). 셋 다 같은 결과여야 한다.

## 전달

1. `SendUserFile` 로 파일 전달
2. 채팅에 **표로 요약**(무엇이 몇 건, 합계) + **내가 판단으로 채운 칸**을 분명히 적는다
3. 커밋 → `main-rgj31t` 푸시 → `main` 체리픽 → 푸시 → `main-rgj31t` 리베이스
4. 날짜처럼 모르는 값을 임시로 채웠으면 메모에 "임시"라고 남기고 채팅에서도 말한다
