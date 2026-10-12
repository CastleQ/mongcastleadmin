# 게임 정보 찾는 길 (검증된 경로만)

## 보드게임 — BGG 가 1순위

1. **BGG ID 찾기**
   - 영문 원제를 알면: `site:boardgamegeek.com/boardgame "<영문 원제>"` 웹 검색 → URL 끝 숫자가 ID
   - 한글명만 알면: 먼저 `site:boardlife.co.kr/game <한글명>` → 검색 결과 제목에 `한글명(영문 원제)`와 인원·시간이 같이 나온다

2. **상세 정보** (JSON)
   ```
   https://api.geekdo.com/api/geekitems?objectid=<ID>&objecttype=thing&nosession=1
   ```
   쓰는 칸: `name`, `yearpublished`, `minplayers`, `maxplayers`, `minplaytime`, `maxplaytime`,
   `links.boardgamecategory`, `links.boardgamesubdomain`,
   `links.expandsboardgame`(값이 있으면 그 게임은 확장), `links.boardgameexpansion`(확장 목록과 ID), `imageurl`

   ⚠️ `imageurl` 에 `\/`, `**`, `_fit-in`, `?fit-in`, `=fit-in` 같은 깨진 문자가 섞여 나올 때가 있다.
   항상 이 꼴로 정규화한다:
   `https://cf.geekdo-images.com/<해시>__itemrep/img/<해시>=/fit-in/246x300/filters:strip_icc()/picNNNN.jpg`

3. **확장**: 본판 페이지의 `links.boardgameexpansion` 에 확장 ID가 다 들어 있다. 따로 검색하지 않는다.

### 막히는 길 (시도하지 말 것)
- `boardgamegeek.com/xmlapi2/...` → 401
- `boardgamegeek.com/geeksearch.php` 스크래핑 → 검색 결과 대신 핫니스 목록
- 보드라이프 WebFetch → robots 차단. 필요하면 Firecrawl 스크래핑으로 `og:image` 와 메타 description(인원·시간·원제 포함)을 가져온다

## 머더미스터리

- **그룹SNE 「미스터리 파티 인 더 박스」**: `https://www.groupsne.co.jp/products/bg/index.html`
  한 페이지에 전 작품의 일본어 원제·인원·시간·이미지(`.../mpb/img/mpbNN_top.png`)가 있다.
  한국어판 대부분(구두룡 저택, 늑대인간 마을의 축제, 다크 율, 게놈의 탑, 죄와 벌의 도서관)이 여기 해당한다.
- **그 외**: 보드라이프 게임 페이지. 한국 원작이거나 BGG 에 없으면 이미지는 비우고,
  인원·시간은 보드라이프 글에서 확인한다.
- 공개 페이지는 **이미지가 있는 머더미스터리만** 보여준다. 이미지를 못 찾으면 사장님께 알린다.

## 닌텐도 스위치

- **원제·출시연도·장르**: 영문 위키백과 인포박스. 일본어 원제는 각주의 "Known in Japan as ..."
- **동시 인원**: 반드시 **본체 1대 + TV 1대 기준**으로 적는다. "최대 N인"이 온라인 인원인지 구분한다.
  로컬통신·온라인 인원은 `synopsis` 에 따로 적는다
- 리듬 게임처럼 모드별로 다르면 `연주 2인 / 파티 4인`
- **이미지**: `gamestop <영문명> Nintendo Switch` 로 찾은 `media.gamestop.com/i/gamestop/<번호>/...`.
  일본 전용(모루카, 태고 스위치판)은 `m.media-amazon.com/images/I/...`
- ❌ `store.nintendo.co.kr` 은 한국판 패키지가 있어도 **봇을 막아** 쓸 수 없다(202 빈 응답).
  한국판 사진이 꼭 필요하면 사장님이 실물을 찍어 게임 관리 화면에서 올리는 쪽이 확실하다
- `synopsis` 에 꼭 넣을 것: 조이콘 몇 개 필요한지, 한 판 몇 분인지
- `note`(관리자만 봄)에 넣을 것: 세이브 파일 1개라 손님이 바뀌면 덮어쓰는 게임,
  구독제라 기본 수록곡이 적은 게임, 디지털 판매 종료 같은 것

## 운영 팁

- Firecrawl 은 분당 한도가 있다(429). 한 번에 3~4개씩 묶어 요청하고, 막히면 30~45초 쉰 뒤 다시 한다
- 진행 중에 모은 값은 scratchpad 임시 파일(`ID|이름|연도|인원|시간|이미지`)에 계속 적어 둔다.
  중간에 끊겨도 다시 검색하지 않아도 된다
- 이 컨테이너는 프록시를 거쳐야 밖으로 나간다. curl 은 그냥 되고, Playwright 는 `proxy: { server: process.env.HTTPS_PROXY }` 가 필요하다
