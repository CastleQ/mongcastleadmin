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
      <h3 className="border-b border-zinc-100 px-4 py-2.5 font-bold">색 구분 — 구글캘린더에서 몽캐슬 예약만 눈에 띄게</h3>
      <div className="px-4 py-3 text-sm">
        <p className="mb-2 text-zinc-600">
          여기서 색을 하나 고르면, admin이 구글캘린더에 올리는 <b>몽캐슬 예약 일정 전부</b>가 그 색으로 칠해집니다
          (이미 올라간 것도 바로 다시 칠하고, 앞으로 만드는 것도 같은 색).
        </p>
        <p className="mb-3 text-xs text-zinc-500">
          구글은 색을 <b>이름이 아니라 번호(1~11)</b>로 저장합니다. 그래서 사장님이 ‘몽캐슬’이라고 이름 붙여둔 초록이
          몇 번인지는 admin에서 알 수 없습니다. 아래 동그라미를 눌러 구글캘린더를 보시면 바로 확인됩니다 —
          초록은 <b>세이지(2번)</b>와 <b>바질(10번)</b> 둘뿐이라 둘 중 하나입니다. 마음에 안 들면 다시 누르면 되고,
          <b>색 없음</b>을 누르면 원래대로 돌아갑니다.
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
