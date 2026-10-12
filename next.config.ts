import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // npm run dev 가 CLAUDE.md 끝에 Next.js 안내 블록을 자동으로 덧붙이는 것을 끈다.
  // 켜 두면 개발 서버를 켤 때마다 CLAUDE.md 가 바뀌어 커밋이 지저분해진다 (2026-10-12).
  agentRules: false,
};

export default nextConfig;
