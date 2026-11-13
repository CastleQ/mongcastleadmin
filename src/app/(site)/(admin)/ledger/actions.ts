"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseLedgerForm, sameLedgerRow } from "@/lib/ledger";
import { loadPrices } from "@/lib/settings";
import { pushLedgerRow, removeFromGoogle } from "@/lib/calendar-export";
import { isMissingColumn, TIME_COLUMNS, withoutKeys } from "@/lib/missing-column";

/** 저장/삭제 후 돌아갈 화면. 허용된 곳만 (ledger → 거래 탭, 그 외 → 달력) */
const backTo = (from: string | null, date: string) => `${from === "ledger" ? "/ledger" : "/reservations"}?m=${date.slice(0, 7)}`;

export async function saveLedger(id: number | null, formData: FormData) {
  const row = parseLedgerForm(formData, (await loadPrices()).보증금);
  if (!row.date) throw new Error("날짜를 입력하세요");
  const supabase = await createClient();

  // 두 번 눌렀을 때 거래가 두 건 생기지 않게. 저장이 느려 응답이 없으면 또 누르시기 때문에,
  // **방금(1분 안) 똑같은 내용이 들어왔으면** 새로 넣지 않고 그 건으로 넘어간다.
  // 버튼 비활성화(화면 쪽)만으로는 탭을 두 개 열거나 휴대폰이 요청을 두 번 보내는 경우를 못 막는다.
  if (id === null) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { data: recent } = await supabase.from("ledger").select("*").eq("date", row.date).gte("created_at", since);
    const twin = (recent ?? []).find((r) => sameLedgerRow(r, row));
    if (twin) {
      after(() => pushLedgerRow(twin.id as number));
      redirect(backTo(formData.get("from") as string | null, row.date));
    }
  }

  const save = (r: typeof row) => (id === null
    ? supabase.from("ledger").insert(r).select("id").single()
    : supabase.from("ledger").update(r).eq("id", id).select("id").single());
  let { data, error } = await save(row);
  // 예약 시간 칸이 아직 DB 에 없으면(SQL 미실행) 그 두 칸만 빼고 저장한다 — 저장이 막히면 안 된다
  if (isMissingColumn(error)) ({ data, error } = await save(withoutKeys(row, TIME_COLUMNS)));
  if (error) throw new Error(error.message);
  if (!data) throw new Error("저장은 됐지만 번호를 못 받았어요. 거래 목록에서 확인해 주세요");
  // 구글 반영은 **화면을 넘긴 뒤**에 한다 (after). 구글 왕복 2번이 저장 버튼의 기다림 대부분이었다.
  // 구글이 안 되더라도 저장은 이미 끝났고, 실패는 sync_log 에 남는다
  const newId = data.id as number;
  after(() => pushLedgerRow(newId));
  redirect(backTo(formData.get("from") as string | null, row.date));
}

export async function deleteLedger(id: number, date: string, from: string | null) {
  // 순서 중요: 거래를 먼저 지우면 짝 정보가 cascade 로 사라져 구글 일정이 고아로 남는다
  await removeFromGoogle(id);
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect(backTo(from, date));
}

/** 예약취소 / 취소 되돌리기. 거래는 남기고 표시만 바꾼다. 구글 일정은 취소 시 지워지고, 되돌리면 다시 만들어진다 */
export async function setCancelled(id: number, cancelled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").update({ cancelled }).eq("id", id);
  if (error) throw new Error(error.message);
  after(() => pushLedgerRow(id)); // 구글 반영은 화면을 넘긴 뒤에
}

export async function setSettled(id: number, settled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("ledger").update({ settled }).eq("id", id);
  if (error) throw new Error(error.message);
  after(() => pushLedgerRow(id)); // 설명란의 '정산: 완료' 표시가 바뀐다 — 화면을 막지 않는다
}
