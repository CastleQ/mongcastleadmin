import { GAME_KINDS, type Game } from "@/lib/games";
import { saveGame } from "./actions";
import { DeleteGameButton } from "./delete-button";

const input = "w-full rounded border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none";
const label = "block text-sm text-zinc-600 mb-1";

export function GameForm({ row, back }: { row?: Game; back?: string }) {
  const mm = row?.kind === "머더미스터리";
  return (
    <form action={saveGame.bind(null, row?.id ?? null)} className="max-w-2xl space-y-4">
      {back && <input type="hidden" name="back" value={back} />}
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <div>
          <span className={label}>종류</span>
          <div className="inline-flex overflow-hidden rounded border border-zinc-900">
            {GAME_KINDS.map((k) => (
              <label key={k} className="relative cursor-pointer">
                <input type="radio" name="kind" value={k} defaultChecked={(row?.kind ?? "보드게임") === k} className="peer sr-only" />
                <span className="block px-4 py-2 text-sm peer-checked:bg-zinc-900 peer-checked:text-white">{k}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-400">공개 페이지엔 보드게임만 보여요</p>
        </div>
        <div>
          <label className={label} htmlFor="name">이름 <b className="text-red-500">*</b></label>
          <input id="name" name="name" required defaultValue={row?.name ?? ""} className={input} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={label} htmlFor="name_original">원제 (영어/일어 — 이미지 자동 검색에 씀)</label><input id="name_original" name="name_original" defaultValue={row?.name_original ?? ""} className={input} /></div>
        <div><label className={label} htmlFor="expansion">확장</label><input id="expansion" name="expansion" defaultValue={row?.expansion ?? ""} className={input} /></div>
        <div><label className={label} htmlFor="category">장르</label><input id="category" name="category" defaultValue={row?.category ?? ""} placeholder="전략게임 / 파티게임 / 공포…" className={input} /></div>
        <div><label className={label} htmlFor="players">인원</label><input id="players" name="players" defaultValue={row?.players ?? ""} placeholder="2~4인" className={input} /></div>
        <div><label className={label} htmlFor="play_minutes">플레이 시간(분)</label><input id="play_minutes" name="play_minutes" type="number" inputMode="numeric" defaultValue={row?.play_minutes ?? ""} className={input} /></div>
        <div><label className={label} htmlFor="qty">수량</label><input id="qty" name="qty" type="number" inputMode="numeric" defaultValue={row?.qty ?? 1} className={input} /></div>
        <div><label className={label} htmlFor="language">언어</label><input id="language" name="language" defaultValue={row?.language ?? ""} placeholder="KR / EN / JP" className={input} /></div>
        <div><label className={label} htmlFor="price">구매가(원)</label><input id="price" name="price" type="text" inputMode="numeric" defaultValue={row?.price ?? ""} className={input} /></div>
      </div>

      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="gm_required" defaultChecked={row?.gm_required ?? false} className="h-4 w-4" /> GM 필요{mm ? "" : " (머더미스터리)"}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="translated" defaultChecked={row?.translated ?? false} className="h-4 w-4" /> 번역 완료{mm ? "" : " (머더미스터리)"}</label>
      </div>

      <fieldset className="rounded border border-zinc-200 p-3">
        <legend className="px-1 text-sm text-zinc-600">이미지</legend>
        {row?.image_url && (
          <div className="mb-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.image_url} alt="" className="h-20 w-20 rounded object-cover" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="image_clear" className="h-4 w-4" /> 이미지 지우기</label>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="image_url">이미지 주소 붙여넣기</label>
            <input id="image_url" name="image_url" type="url" placeholder="https://…jpg" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="image_file">또는 파일 올리기</label>
            <input id="image_file" name="image_file" type="file" accept="image/*" className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm" />
          </div>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={label} htmlFor="link">링크</label><input id="link" name="link" type="url" defaultValue={row?.link ?? ""} className={input} /></div>
        <div><label className={label} htmlFor="bgg_id">BGG 번호</label><input id="bgg_id" name="bgg_id" type="number" inputMode="numeric" defaultValue={row?.bgg_id ?? ""} className={input} /></div>
      </div>
      <div><label className={label} htmlFor="synopsis">소개</label><textarea id="synopsis" name="synopsis" rows={4} defaultValue={row?.synopsis ?? ""} className={input} /></div>
      <div><label className={label} htmlFor="note">비고 (관리자만 봄)</label><input id="note" name="note" defaultValue={row?.note ?? ""} className={input} /></div>

      <div className="flex items-center justify-between pt-2">
        <button type="submit" className="rounded bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700">{row ? "변경 저장" : "게임 저장"}</button>
        {row && <DeleteGameButton id={row.id} name={row.name} back={back} />}
      </div>
    </form>
  );
}
