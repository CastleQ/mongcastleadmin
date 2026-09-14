import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/** 첫 화면: 관리자는 예약현황, 그 외는 이용 가이드 */
export default async function Home() {
  const { isAdmin } = await getSession();
  redirect(isAdmin ? "/reservations" : "/guide");
}
