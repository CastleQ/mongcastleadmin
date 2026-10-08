import { buildSeed } from "@/lib/calendar-seed";
import { seedToGoogle, unlink } from "./actions";

const won = (n: number) => n.toLocaleString("ko-KR");

/**
 * 4. 장부 → 구글 내보내기.
 * 오늘 이후 예약만 올린다. 같은 날 구글에 이미 일정이 있으면 중복일 수 있으니 경고를 단다.
 */
export async function SeedSection() {
  let seed: Awaited<ReturnType<typeof buildSeed>>;
  try {
    seed = await buildSeed();
  } catch (e) {
    return (
      <section className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <b>내보낼 목록을 만들지 못했습니다:</b> {e instanceof Error ? e.message : String(e)}
      </section>
    );
  }

  const todo = seed.rows.filter((r) => !r.alreadyLinked);
  const ids = todo.map((r) => r.ledger.id);

  return (
    <section className="mb-5 rounded-lg border border-zinc-200">
      <h3 className="flex flex-wrap items-baseline gap-2 border-b border-zinc-100 px-4 py-2.5">
        <span className="font-bold">4. 장부 → 구글 내보내기</span>
        <span className="text-xs font-normal text-zinc-400">{seed.from} ~ {seed.to} · 오늘 이후만</span>
      </h3>
      <div className="px-4 py-3 text-sm">
        {!seed.started && (
          <p className="mb-3 rounded bg-amber-50 p-3 text-amber-800">
            연동이 꺼져 있어 내보내기가 동작하지 않습니다. 위 <b>2번</b>에서 먼저 켜주세요.
          </p>
        )}

        {seed.rows.length === 0 ? (
          <p className="py-8 text-center text-zinc-400">오늘 이후 예약이 없습니다.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-xs text-zinc-500">
                    <th className="px-2 py-1.5 text-left font-medium">날짜</th>
                    <th className="px-2 py-1.5 text-left font-medium">구글에 올릴 제목</th>
                    <th className="px-2 py-1.5 text-right font-medium">금액</th>
                    <th className="px-2 py-1.5 text-left font-medium">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {seed.rows.map((r) => (
                    <tr key={r.ledger.id}>
                      <td className="px-2 py-2 whitespace-nowrap">{r.ledger.date}</td>
                      <td className="px-2 py-2">
                        {r.title}
                        {r.sameDayInGoogle.length > 0 && !r.alreadyLinked && (
                          <div className="mt-1 rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
                            ⚠ 그날 구글에 이미 있습니다: {r.sameDayInGoogle.join(" · ")}
                            <div className="text-amber-700">같은 예약이면 올리지 마세요 — 같은 날에 두 개가 생깁니다.</div>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{won(r.ledger.amount)}원</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs">
                        {r.alreadyLinked ? (
                          <form action={unlink.bind(null, r.ledger.id)}>
                            <span className="text-emerald-700">연결됨</span>
                            <button type="submit" className="ml-2 text-zinc-400 underline hover:text-zinc-700">짝 풀기</button>
                          </form>
                        ) : (
                          <span className="text-zinc-400">아직 안 올림</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {todo.length > 0 && seed.started && (
              <form action={seedToGoogle.bind(null, ids)} className="mt-4 flex flex-wrap items-center gap-3">
                <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700">
                  {todo.length}건 구글에 올리기
                </button>
                <span className="text-xs text-zinc-500">
                  위 ⚠ 경고가 붙은 건이 있으면, 먼저 구글에서 그 일정을 지우거나 이 단추를 누르지 마세요.
                </span>
              </form>
            )}
          </>
        )}
      </div>
    </section>
  );
}
