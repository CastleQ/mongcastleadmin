# supabase 폴더 읽는 법

**규칙 하나만 기억하면 됩니다.**

| 어디 | 뜻 |
|---|---|
| `supabase/` 바로 아래 있는 `.sql` | **아직 안 돌린 것.** 지금 Supabase SQL Editor 에서 실행해야 할 파일 |
| `supabase/done/` 안의 `.sql` | **이미 돌린 것.** 무엇을 왜 넣었는지 남겨둔 기록. 다시 돌릴 필요 없다 |

바로 아래가 비어 있으면 = 돌릴 SQL이 없다는 뜻입니다.

## AI 에게 (새 세션에서 읽는 사람)

- 새 SQL 파일은 `supabase/` **바로 아래**에 만든다. 사장님이 실행했다고 하면 `supabase/done/` 으로 옮긴다
  (`git mv supabase/<파일>.sql supabase/done/`).
- **표 구조 원본은 `supabase/done/schema.sql`** 이다 (처음 표를 만든 파일이라 done/ 에 있지만, 지금도 구조를 확인할 땐 이걸 본다).
  권한·역할은 `supabase/done/roles.sql`.
- 비밀·개인정보가 든 SQL(`seed.sql`, `templates*.sql`, `info*.sql`)은 `.gitignore` 에 걸려 git 에 올라가지 않는다.
  그래서 그런 파일은 `done/` 으로 옮겨도 저장소엔 보이지 않는다 — 옮기지 않고 그냥 둬도 된다.
- 실행 여부를 추측하지 말 것. 표가 실제로 있는지는 anon 키로 확인할 수 있다
  (`curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/<표>?select=id&limit=1" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"`).
  HTTP 200 이면 표가 있는 것, 404 면 없는 것. 자세한 방법은 스킬 `write-sql`.
