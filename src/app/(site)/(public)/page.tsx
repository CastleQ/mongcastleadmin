import Link from "next/link";

/** 공개 첫 화면: 이용 가이드 (내용은 차차 채움) */
export default function GuidePage() {
  return (
    <>
      <h2 className="mb-2 text-xl font-bold">몽캐슬 파티룸 이용 가이드</h2>
      <p className="text-zinc-500">준비 중이에요. 곧 공간 이용 안내, 오시는 길, 주차, 유의사항을 여기에 정리할게요.</p>
      <p className="mt-6 text-sm text-zinc-500">
        그동안은 <Link href="/games" className="underline hover:text-zinc-900">보유 게임 목록</Link>을 둘러보세요.
      </p>
    </>
  );
}
