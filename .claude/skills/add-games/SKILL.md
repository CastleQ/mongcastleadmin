---
name: add-games
description: >
  몽캐슬 보유 게임(보드게임·머더미스터리·닌텐도 스위치)을 이름만 받아 조사하고,
  Supabase games 표에 바로 넣을 수 있는 재실행 안전 SQL 파일로 만들어 전달한다.
  "게임 추가", "보드게임 넣어줘", "스위치 게임 정리", 게임 이름만 줄줄이 적힌 목록,
  /add-games 일 때 쓴다. 오타 섞인 한글명만 있어도 된다.
---

# 보유 게임 추가 — 이름만 받아 SQL까지

## 받는 것 / 내는 것

**받는 것**: 게임 한글명 목록(오타 섞여도 됨). 종류를 안 적으면 조사해서 알아낸다.

**내는 것**
1. `supabase/games-<주제>-<YYYY-MM-DD>.sql` — 사장님이 Supabase SQL Editor에 붙여 실행할 파일
2. 채팅에 확인용 표(한글명·분류·인원·시간) + 내가 판단으로 채운 칸이 무엇인지
3. 커밋·푸시(`main-rgj31t` → `main` 체리픽). 코드 변경이 없으면 배포는 저절로 끝난다

별도 `.md` 정리 파일은 **요청할 때만** 만든다. 기본은 SQL + 채팅 표.

## 절차

### 0) 이미 있는 게임인지 먼저 확인 — 추측하지 말 것
운영 DB를 **읽을 수 있다**(games 표는 공개 읽기). 목록을 받으면 제일 먼저:

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/games?select=id,kind,name,category&order=name" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

이미 있으면 새로 넣지 말고 사장님께 알린다("이미 들어 있습니다 — 값을 고칠까요?").
`ledger`(거래)는 관리자 전용이라 anon으로 못 읽는다. 빈 배열이 와도 "없다"는 뜻이 아니다.

### 1) 조사
`references/research.md` 참고. 요약: 보드게임은 BGG JSON API, 머더미스터리는 그룹SNE,
스위치는 위키백과 + GameStop 이미지.

### 2) 칸 채우기 — games 표 규칙
`src/lib/games.ts`의 타입과 `supabase/done/schema.sql`이 원본. 바뀌면 그쪽을 믿는다.

| 칸 | 규칙 |
|---|---|
| `kind` | `보드게임` / `머더미스터리` / `스위치게임` 셋 중 하나 (표 제약 있음) |
| `name` | 한글명. **중복 판정 키다** — 기존 이름과 겹치지 않게 |
| `name_original` | 원제 + (출시연도). 스위치는 `영문 / 일문` |
| `category` | 공개 페이지 묶음을 가른다: `파티`→파티게임, `전략`→전략게임, 나머지 전부→그 외. 머더미스터리·스위치게임은 `kind`로 묶이므로 표시용 글자 |
| `expansion` | 확장명. 기본판이면 비움 |
| `players` | **`2~5인` 꼴** (물결 + '인'). 정리용 md의 `2–5`와 다르다 |
| `play_minutes` | 정수. 범위면 **긴 쪽**. 체감이 크게 다르면 사장님께 물어본다(달무티: BGG 60분, 실제 10분) |
| `qty` | 기본 1 |
| `language` | `한국어` 등. 모르면 비움 — 지어내지 않는다 |
| `gm_required` `translated` | 머더미스터리용 참/거짓. 나머지는 거짓 |
| `link` `bgg_id` | 실제로 열어본 주소만 |
| `synopsis` | **손님에게 보이는 소개**(공개 페이지 '소개 보기'). 인원·조이콘 개수처럼 고를 때 필요한 정보를 여기 |
| `note` | **관리자만 보는 메모**. 세이브 덮어쓰기 위험, 구독제 곡 수, 구매 주의 같은 것 |
| `image_url` | 3)에서 검사 통과한 주소만 |

공개 페이지 노출: 보드게임·스위치게임은 이미지가 없어도 보이고, **머더미스터리만 이미지가 있어야** 보인다.

### 3) 이미지 주소 검사 — curl로 한다
`curl`로 **referer 없이 / 다른 사이트 referer로** 두 번 받아 둘 다 `200` + `image/*`인 것만 쓴다.

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" --max-time 25 \
  -e "https://mongcastleadmin.vercel.app/games" \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0 Safari/537.36" "$URL"
```

- ✅ 쓸 수 있는 곳: `cf.geekdo-images.com`(BGG), `media.gamestop.com`, `m.media-amazon.com`, `groupsne.co.jp`, `img.boardlife.co.kr`
- ❌ `store.nintendo.co.kr` — 봇을 막아 202 빈 응답. 한국판 패키지라도 쓸 수 없다
- ⚠️ **Playwright로 `about:blank`에 `<img>`를 넣어 재는 방식은 쓰지 말 것.** 이 컨테이너 프록시 탓에
  멀쩡한 주소도 `net::ERR_TOO_MANY_RETRIES`로 깨진 것처럼 나온다 (2026-10-12에 이걸로 오판해 멀쩡한
  이미지를 바꿨다). 판정은 curl로 한다

### 4) SQL 쓰기
**틀·함정·전달 방법은 스킬 `write-sql` 에 다 있다. 그걸 따른다** (여기 베껴 두지 않는다 — 두 벌이 되면 어긋난다).
게임에만 해당하는 것만 아래에 적는다.

- 판정키는 `name`. `where not exists (select 1 from games g where g.name = v.name)`
- `kind` 에 새 값을 쓰려면 표 제약부터 넓힌다 (`supabase/done/switch-games.sql` 방식)
- 검증할 때 운영 게임 이름을 임시 DB 에 먼저 넣어 이름 충돌까지 재현한다

```sql
-- <주제> N종 추가 (출처: ..., YYYY-MM-DD)
-- 여러 번 실행해도 안전: 같은 이름이 이미 있으면 건너뜀. 기존 게임은 건드리지 않음.
-- (판단으로 채운 칸이 있으면 여기에 무엇을 왜 그렇게 했는지 적는다)

insert into games (kind, name, name_original, category, players, play_minutes, qty, link, bgg_id, image_url)
select v.kind, v.name, v.name_original, v.category, v.players, v.play_minutes, v.qty, v.link, v.bgg_id, v.image_url
from (values
  ('보드게임'::text, '이름'::text, '원제 (2020)'::text, '파티'::text, '2~5인'::text, 15::int, 1::int,
   'https://boardgamegeek.com/boardgame/337'::text, 337::int, 'https://cf.geekdo-images.com/...'::text),
  ('보드게임', '다음 게임', ...)
) as v(kind, name, name_original, category, players, play_minutes, qty, link, bgg_id, image_url)
where not exists (select 1 from games g where g.name = v.name);

-- 확인
select name, kind, category, players, play_minutes,
       case when image_url is null then '없음' else '있음' end as 이미지
from games where name in ('이름','다음 게임') order by category, name;
```

### 5) 검증
방법은 `write-sql` 의 검증 절차를 그대로 쓴다 (임시 Postgres 16, 운영 이름 먼저 넣고 두 번 실행).
게임 통과 기준: **1회차 N건 / 2회차 0건**, 분류·인원·시간이 의도대로, 이미지 전부 '있음'.

### 6) 넘기기
파일을 `SendUserFile`로 보내고, 채팅에 확인용 표와 **내가 판단으로 채운 칸**을 적는다.
커밋 → `main-rgj31t` 푸시 → `main` 체리픽 → 푸시 → `main-rgj31t` 리베이스.
게임 데이터는 개인정보가 아니라 git에 넣어도 된다(거래·고객이 든 SQL은 안 된다 — CLAUDE.md 규칙 6).

## 판단 규칙
- **오타는 고치되 알린다**: `sinpperclips`→Snipperclips, `flame raft`→Flamecraft. 고친 내역을 채팅에 적는다
- **못 찾으면 비운다**: 추측으로 채우지 않는다. `⚠️ 특정 실패`로 적고 박스 철자를 물어본다
- **URL은 열어본 것만.** 지어내지 않는다
- **풀확장**: 합본(Big Box)이 있으면 한 줄, 없으면 본판 + 주요 확장을 각 줄로
- **동명이작**: 평가 수가 많은 쪽으로 잡고 다른 후보를 채팅에 남긴다
- **목록의 허점을 짚는다**: 확장만 있고 본판이 없다, 인원이 비었다, 이미 있는 게임이다 — 시킨 것만 하지 않는다

## 답변 방식
한글, 두괄식(무엇을 만들었는지 먼저). 맨 끝에 `---` 긋고, 사장님이 아직 모를 법한
**실제로 필요한** 후속 제안이나 질문을 하나 붙인다. 형식만 채우는 제안은 쓰지 않는다.
