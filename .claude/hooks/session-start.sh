#!/bin/bash
# 클라우드(Claude Code on the web) 세션이 시작될 때 부품(node_modules)을 설치한다.
# 내 PC에서 쓰는 Claude Code에서는 아무 일도 하지 않는다 (거기선 이미 설치돼 있으므로).
#
# 선행 조건: 클라우드 환경의 네트워크 허용 목록에 registry.npmjs.org 가 있어야 함.
#            없으면 npm이 403 host_not_allowed 로 막힌다.
set -euo pipefail

# 웹(클라우드) 세션이 아니면 그냥 끝
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

echo "[session-start] npm install 시작"
# npm ci 대신 npm install: 이미 받아둔 node_modules를 재사용해 다음 세션이 빨라진다.
# --no-save: 컨테이너 npm 버전이 내 PC와 달라 package-lock.json의 메타데이터만 바뀌는 것을 막는다
#            (안 쓰면 세션마다 락파일이 수정돼 커밋할 것도 없는 변경이 쌓인다)
npm install --no-audit --no-fund --no-save
echo "[session-start] npm install 완료"

# 빌드에 필요한 환경변수 확인. 값은 환경 설정의 Secrets에 넣고, 여기엔 절대 적지 않는다.
missing=""
for v in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  if [ -z "${!v:-}" ]; then
    missing="$missing $v"
  fi
done
if [ -n "$missing" ]; then
  echo "[session-start] 주의: 환경변수가 비어 있어요 →$missing"
  echo "[session-start] 이 상태로도 npm test / npm run lint 는 되지만, npm run build 는 실패할 수 있어요."
fi
