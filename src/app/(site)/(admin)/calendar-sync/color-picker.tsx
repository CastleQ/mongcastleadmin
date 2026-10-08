import { EVENT_COLORS } from "@/lib/calendar-push";
import { setEventColor } from "./actions";

/**
 * 구글 일정 색 고르기.
 * 구글의 색 11가지는 번호가 정해져 있다. 사장님이 이름을 바꿔 쓰셔도(예: '몽캐슬') 번호는 그대로다.
 * 어느 번호가 그 초록인지는 눌러보면 바로 보이므로, 추측하지 않고 직접 고르시게 한다.
 */
export function ColorPicker({ current }: { current: string | null }) {
  return (
    <section className="mb-5 rounded-lg border border-zinc-200">
      <h3 className="border-b border-zinc-100 px-4 py-2.5 font-bold">색 구분</h3>
      <div className="px-4 py-3 text-sm">
        <p className="mb-3 text-zinc-500">
          몽캐슬 예약 일정에 칠할 색입니다. 고르면 <b>앞으로 만들 일정은 물론 이미 올라간 일정도 함께</b> 다시 칠해집니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {EVENT_COLORS.map((c) => (
            <form key={c.id} action={setEventColor.bind(null, c.id)}>
              <button
                type="submit"
                title={`${c.name} (${c.id}번)`}
                aria-label={c.name}
                style={{ backgroundColor: c.hex }}
                className={`h-8 w-8 rounded-full ${current === c.id ? "ring-2 ring-zinc-900 ring-offset-2" : "hover:ring-2 hover:ring-zinc-300"}`}
              />
            </form>
          ))}
          <form action={setEventColor.bind(null, null)}>
            <button
              type="submit"
              className={`rounded border border-zinc-300 px-3 py-1.5 text-xs hover:border-zinc-900 ${current === null ? "ring-2 ring-zinc-900 ring-offset-2" : ""}`}
            >
              색 없음(기본)
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {current
            ? `지금: ${EVENT_COLORS.find((c) => c.id === current)?.name ?? current}번. 구글에서 색 이름을 '몽캐슬'로 바꿔두셨다면 그 이름으로 보입니다.`
            : "지금은 색을 지정하지 않아 캘린더 기본색으로 보입니다."}
        </p>
      </div>
    </section>
  );
}
