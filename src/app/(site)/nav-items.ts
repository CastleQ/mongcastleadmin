export type NavItem = { href: string; label: string };

/** 로그인 없이 누구나 */
export const PUBLIC_NAV: NavItem[] = [
  { href: "/reservations", label: "예약현황" },
  { href: "/guide", label: "이용 가이드" },
  { href: "/games", label: "보유 게임" },
];

/** 관리자만 */
export const ADMIN_NAV: NavItem[] = [
  { href: "/ledger", label: "거래" },
  { href: "/templates", label: "고객 응대 템플릿" },
  { href: "/sales", label: "매출현황" },
  { href: "/customers", label: "고객관리" },
  { href: "/games/manage", label: "게임 관리" },
  { href: "/info", label: "몽캐슬파티룸 정보" },
  { href: "/admins", label: "관리자 관리" },
];

/** 주소가 관리자 구역인지 (proxy·layout 공용) */
export const isAdminPath = (path: string) => ADMIN_NAV.some((n) => path === n.href || path.startsWith(n.href + "/"));
