import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/** 관리자 구역 문지기: 로그인 안 했으면 로그인으로, 관리자가 아니면 공개 첫 화면으로 */
export default async function AdminGuard({ children }: LayoutProps<"/">) {
  const { email, isAdmin } = await getSession();
  if (!email) redirect("/login");
  if (!isAdmin) redirect("/");
  return <>{children}</>;
}
