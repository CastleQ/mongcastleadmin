import Link from "next/link";
import { GameForm } from "../game-form";

export default function NewGamePage() {
  return (
    <>
      <div className="mb-1 text-sm text-zinc-500"><Link href="/games/manage" className="hover:underline">게임 관리</Link> ›</div>
      <h2 className="mb-5 text-xl font-bold">게임 추가</h2>
      <GameForm />
    </>
  );
}
