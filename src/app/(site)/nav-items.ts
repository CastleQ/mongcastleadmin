export type NavItem = { href: string; label: string; sub?: true };

/** 로그인 없이 누구나 */
export const PUBLIC_NAV: NavItem[] = [
  { href: "/", label: "이용 가이드" },
  { href: "/games", label: "보유 게임" },
];

/** 관리자만 */
export const ADMIN_NAV: NavItem[] = [
  { href: "/reservations", label: "예약현황" },
  { href: "/ledger", label: "거래" },
  { href: "/sales", label: "매출현황" },
  { href: "/customers", label: "고객관리" },
  { href: "/templates", label: "고객 응대 템플릿" },
  { href: "/games/manage", label: "게임 관리", sub: true },
  { href: "/info", label: "몽캐슬파티룸 정보", sub: true },
  { href: "/admins", label: "관리자 관리", sub: true },
];

/** 주소가 관리자 구역인지 (proxy·layout 공용) */
export const isAdminPath = (path: string) => ADMIN_NAV.some((n) => path === n.href || path.startsWith(n.href + "/"));
