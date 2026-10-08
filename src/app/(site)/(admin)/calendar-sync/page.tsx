import Link from "next/link";
import { buildPreview, type PreviewRow } from "@/lib/calendar-sync";
import { loadCalendarSync } from "@/lib/settings";
import { checkAccess } from "@/lib/google-calendar";
import { setSyncStart, syncNow } from "./actions";
import { SeedSection } from "./seed-section";

const won = (n: number) => n.toLocaleString("ko-KR");
const fmt = (iso: string) => new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" });

/**
 * 구글캘린더 연동 — 미리보기.
 * 읽기만 한다. 이 화면은 장부를 바꾸지 않는다 (가져오기는 다음 단계).
 */
export default async function CalendarSyncPage() {
  const cfg = await loadCalendarSync();

  // 연결부터 확인 — 공유가 안 걸렸으면 여기서 바로 드러난다
  const access = cfg ? await Promise.all(cfg.readCalendarIds.map(async (id) => ({ id, ...(await checkAccess(id)) }))) : [];
  const connected = access.filter((a) => a.ok).length;

  let preview: Awaited<ReturnType<typeof buildPreview>> | null = null;
  let error: string | null = null;
  if (connected > 0) {
    try {
      preview = await buildPreview();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <>
      <h2 className="mb-1 text-xl font-bold">구글캘린더 연동 — 미리보기</h2>
      <p className="mb-4 text-sm text-zinc-500">
        구글 일정이 예약현황에 <b>어떻게 들어올지</b>만 보여줍니다. 이 화면은 <b>아무것도 저장하지 않아요.</b>
      </p>

      {/* 1. 연결 상태 */}
      <section className="mb-5 rounded-lg border border-zinc-200">
        <h3 className="border-b border-zinc-100 px-4 py-2.5 font-bold">1. 연결 상태</h3>
        <div className="px-4 py-3 text-sm">
          {!cfg ? (
            <p className="text-red-600">연동 설정이 없습니다. <code>supabase/calendar-sync.sql</code>을 실행하세요.</p>
          ) : (
            <ul className="space-y-2">
              {access.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline gap-2">
                  <span className={a.ok ? "text-emerald-700" : "text-zinc-400"}>{a.ok ? "✅ 연결됨" : "⃠ 공유 안 됨"}</span>
                  <b className={a.ok ? "" : "text-zinc-400"}>{a.ok ? a.summary : a.id}</b>
                  {a.id === cfg.writeCalendarId && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">여기에 씁니다</span>}
                  {!a.ok && (
                    <span className="w-full text-xs text-zinc-400">
                      건너뜁니다. 이 캘린더도 쓰시려면 서비스 계정에 ‘일정 변경’ 권한으로 공유하세요.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {preview && preview.unread.length > 0 && (
            <p className="mt-3 text-xs text-zinc-400">
              읽지 못한 캘린더 {preview.unread.length}개는 건너뛰고 나머지로 아래 표를 만들었습니다.
            </p>
          )}
          {cfg && connected === 0 && (
            <p className="mt-3 rounded bg-red-50 p-3 text-red-700">
              한 곳도 열리지 않았습니다. 구글캘린더 → 해당 캘린더 <b>설정 및 공유</b> → <b>특정 사용자와 공유</b>에
              서비스 계정 주소를 <b>‘일정 변경’</b> 권한으로 추가했는지 확인해주세요.
            </p>
          )}
        </div>
      </section>

      {/* 2. 언제부터 가져올지 */}
      {cfg && (
        <section className="mb-5 rounded-lg border border-zinc-200">
          <h3 className="border-b border-zinc-100 px-4 py-2.5 font-bold">2. 언제부터 가져올지</h3>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            {cfg.startedAt ? (
              <>
                <span className="text-emerald-700">● 켜짐</span>
                <span>
                  <b>{fmt(cfg.startedAt)}</b> 이후에 <b>새로 만든</b> 구글 일정만 가져옵니다.
                  <span className="block text-xs text-zinc-500">그 전에 만들어둔 일정은 손대지 않습니다 (나중에 고쳐도 그대로).</span>
                </span>
                <form action={setSyncStart.bind(null, false)} className="ml-auto">
                  <button type="submit" className="rounded border border-zinc-300 px-3 py-1 text-xs hover:border-zinc-900">
                    시작 시점 지우기
                  </button>
                </form>
              </>
            ) : (
              <>
                <span className="text-amber-700">○ 꺼짐</span>
                <span>
                  기준 시점이 없어 <b>기존 일정까지 전부</b> 대상입니다.
                  <span className="block text-xs text-zinc-500">
                    지금 켜면 아래 목록이 비워지고, 앞으로 새로 만드는 일정부터 들어옵니다.
                  </span>
                </span>
                <form action={setSyncStart.bind(null, true)} className="ml-auto">
                  <button type="submit" className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-700">
                    지금부터 연동 시작
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      )}

      {error && (
        <section className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <b>읽는 중 오류:</b> {error}
        </section>
      )}

      {/* 2. 들어올 예약 */}
      {preview && (
        <>
          <section className="mb-5 rounded-lg border border-zinc-200">
            <h3 className="flex flex-wrap items-baseline gap-2 border-b border-zinc-100 px-4 py-2.5">
              <span className="font-bold">3. 들어올 예약 {preview.rows.length}건</span>
              <span className="text-xs font-normal text-zinc-400">{preview.from} ~ {preview.to}</span>
            </h3>
            <div className="px-4 py-3 text-sm">
              <p className="mb-3 text-zinc-500">
                가져오지 않은 일정: 제목이 조건에 안 맞음 <b>{preview.skipped.notOurs}건</b>
                {preview.startedAt && <> · 연동 시작 전에 만들어짐 <b>{preview.skipped.beforeStart}건</b></>}
                {preview.skipped.cancelled > 0 && <> · 취소됨 {preview.skipped.cancelled}건</>}
                {!preview.startedAt && (
                  <span className="ml-1 text-amber-700">
                    (아직 연동을 켜지 않아 <b>기존 일정도 전부</b> 대상입니다)
                  </span>
                )}
              </p>

              {preview.rows.length === 0 ? (
                <p className="py-8 text-center text-zinc-400">조건에 맞는 일정이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[46rem] text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-xs text-zinc-500">
                        <th className="px-2 py-1.5 text-left font-medium">날짜</th>
                        <th className="px-2 py-1.5 text-left font-medium">구글 일정</th>
                        <th className="px-2 py-1.5 text-left font-medium">패키지</th>
                        <th className="px-2 py-1.5 text-left font-medium">고객</th>
                        <th className="px-2 py-1.5 text-left font-medium">채널·인원</th>
                        <th className="px-2 py-1.5 text-right font-medium">금액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {preview.rows.map((r) => <Row key={`${r.calendarId}:${r.eventId}`} r={r} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {preview.rows.some((r) => !r.alreadyLinked) && preview.startedAt && (
            <form action={syncNow} className="mb-5 flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700">
                {preview.rows.filter((r) => !r.alreadyLinked).length}건 장부로 가져오기
              </button>
              <span className="text-xs text-zinc-500">
                금액은 추정으로 들어가고 <b>미정산</b>으로 표시됩니다. 구글에서 고친 일정도 함께 따라옵니다.
              </span>
            </form>
          )}
          <p className="mb-5 text-sm text-zinc-500">
            가져온 뒤에는 <Link href="/ledger" className="underline hover:text-zinc-900">거래</Link>에서 금액을 확인하고 고치시면 됩니다.
            모든 변경은 기록에 남습니다.
          </p>
        </>
      )}

      {connected > 0 && <SeedSection />}
    </>
  );
}

function Row({ r }: { r: PreviewRow }) {
  const bad = r.parsed.package === "기타";
  return (
    <tr className={r.alreadyLinked ? "opacity-40" : ""}>
      <td className="px-2 py-2 whitespace-nowrap">
        {r.date}
        <div className="text-xs text-zinc-400">{r.when}</div>
      </td>
      <td className="px-2 py-2">
        {r.title}
        {r.parsed.warnings.map((w) => (
          <div key={w} className="mt-0.5 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">⚠ {w}</div>
        ))}
        {r.alreadyLinked && <div className="text-xs text-zinc-400">이미 연결됨 — 건너뜁니다</div>}
      </td>
      <td className="px-2 py-2 whitespace-nowrap">
        <b className={bad ? "text-red-600" : ""}>{r.parsed.package}</b>
        <div className="text-xs text-zinc-400">{r.parsed.packageSource}에서 읽음</div>
      </td>
      <td className="px-2 py-2">
        {r.parsed.customer_name ?? <span className="text-zinc-300">—</span>}
        {r.parsed.customer_phone && <div className="text-xs text-zinc-400">{r.parsed.customer_phone}</div>}
      </td>
      <td className="px-2 py-2 whitespace-nowrap text-xs text-zinc-600">
        {r.parsed.channel ?? "—"}
        {r.parsed.headcount ? ` · ${r.parsed.headcount}명` : ""}
        {r.parsed.content ? ` · ${r.parsed.content}` : ""}
      </td>
      <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
        {won(r.amount)}원
        {r.amountEstimated && <div className="text-xs text-amber-700">추정</div>}
      </td>
    </tr>
  );
}
