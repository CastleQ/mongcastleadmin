import { notFound } from "next/navigation";
import { NAV } from "../nav";

// ponytail: 아직 안 만든 메뉴의 임시 화면. 진짜 페이지가 생기면 그쪽이 우선됨
export default async function Stub({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const item = NAV.find((n) => n.href === `/${slug}`);
  if (!item) notFound();
  return (
    <>
      <h2 className="text-xl font-bold">{item.label}</h2>
      <p className="mt-4 text-zinc-500">준비 중입니다.</p>
    </>
  );
}
