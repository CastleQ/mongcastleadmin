import { DAYS, PKGS, friendDiscountPct, type Prices } from "@/lib/prices";
import { PACKAGE_HOURS, hourlyRate, packageTime, timeRange } from "@/lib/hours";
import { savePrices } from "./actions";

const won = (n: number) => n.toLocaleString("ko-KR");
const DAY_LABEL = { 평일: "월~목", 금: "금 · 공휴일 전날", 주말: "토·일·공휴일" } as const;
/** 시간당 단가를 안내하는 패키지. 전일(하루종일)은 시간당으로 치지 않는다 */
const HOURLY_PKGS = ["낮", "밤"] as const;
const input = "w-28 rounded border border-zinc-300 px-2 py-1.5 text-right text-sm tabular-nums focus:border-zinc-900 focus:outline-none";

/** 📌 가격 정보: settings의 요금표를 표로 보여주고, 아래에서 숫자만 고쳐 저장 */
export function PriceCard({ prices }: { prices: Prices }) {
  return (
    <section id="prices" className="rounded-lg border border-zinc-200 bg-white">
      <header className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5">
        <h3 className="flex-1 font-bold">📌 가격 정보</h3>
        <span className="text-xs text-zinc-400">거래 추가 제안가 · 응대 템플릿이 이 값을 씀</span>
      </header>
      <div className="md px-4 py-3">
        <table>
          <thead><tr><th></th>{DAYS.map((d) => <th key={d}>{DAY_LABEL[d]}</th>)}</tr></thead>
          <tbody>
            {PKGS.map((pkg) => (
              <tr key={pkg}><td><strong>{pkg}</strong></td>{prices[pkg].map((v, i) => <td key={i} style={{ textAlign: "right" }}>{won(v)}</td>)}</tr>
            ))}
            <tr><td>밤샘 옵션</td><td colSpan={3}>밤 패키지 +{won(prices.밤샘)} · <strong>전일 대관은 밤샘 무료</strong></td></tr>
            <tr><td>청소보증금</td><td colSpan={3}>+{won(prices.보증금)} (입금액에 포함, 퇴실 확인 후 환급 · 지인·기타 채널은 없음)</td></tr>
            <tr><td>인원 추가</td><td colSpan={3}>기준 {prices.기준인원}인, 초과 1인당 +{won(prices.인원추가)} (전일은 무료)</td></tr>
            <tr><td>지인 할인</td><td colSpan={3}><strong>총 금액에서 {friendDiscountPct()}% 할인</strong> (청소보증금 없음)</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: "0.8rem", color: "#71717a" }}>개인 연락·계좌이체 기준(저가). 공휴일은 2026·2027 법정공휴일 기준.</p>

        {/* 시간당 단가: 위 표의 패키지 금액 ÷ 이용 시간. 따로 입력하는 값이 아니라 자동 계산이라 가격을 고치면 같이 바뀐다 */}
        <h4>시간당 단가</h4>
        <table>
          <thead>
            <tr>
              <th></th>
              {HOURLY_PKGS.map((pkg) => {
                const t = packageTime(pkg);
                return <th key={pkg}>{pkg}타임{t && <span style={{ fontWeight: 400 }}> ({timeRange(t.start, t.end)})</span>}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d, i) => (
              <tr key={d}>
                <td><strong>{DAY_LABEL[d]}</strong></td>
                {HOURLY_PKGS.map((pkg) => (
                  <td key={pkg} style={{ textAlign: "right" }}>{won(hourlyRate(prices[pkg][i], PACKAGE_HOURS[pkg]))}원/h</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: "0.8rem", color: "#71717a" }}>
          패키지 금액 ÷ 이용 시간을 <strong>천원 단위로 올림</strong>한 값(손님에게 안내할 기준 단가). 위 가격을 고치면 같이 바뀐다.
          하루종일(10:00~익일09:00)은 시간당으로 안내하지 않는다.
        </p>

        <details className="mt-3 rounded border border-zinc-200 not-prose">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm text-zinc-600">가격 수정</summary>
          <form action={savePrices} className="space-y-3 border-t border-zinc-200 p-3 text-sm">
            <table className="w-full">
              <thead><tr className="text-xs text-zinc-500"><th className="text-left font-medium">패키지</th>{DAYS.map((d) => <th key={d} className="text-right font-medium">{DAY_LABEL[d]}</th>)}</tr></thead>
              <tbody>
                {PKGS.map((pkg) => (
                  <tr key={pkg}>
                    <td className="py-1 pr-2">{pkg}</td>
                    {DAYS.map((_, i) => <td key={i} className="py-1 text-right"><input name={`${pkg}.${i}`} type="text" inputMode="numeric" defaultValue={prices[pkg][i]} className={input} /></td>)}
                  </tr>
                ))}
                <tr><td className="py-1 pr-2">밤샘 옵션</td><td className="py-1 text-right" colSpan={3}><input name="밤샘" type="text" inputMode="numeric" defaultValue={prices.밤샘} className={input} /></td></tr>
                <tr><td className="py-1 pr-2">청소보증금</td><td className="py-1 text-right" colSpan={3}><input name="보증금" type="text" inputMode="numeric" defaultValue={prices.보증금} className={input} /></td></tr>
                <tr><td className="py-1 pr-2">기준인원 / 초과 1인당</td><td className="py-1 text-right" colSpan={3}><input name="기준인원" type="text" inputMode="numeric" defaultValue={prices.기준인원} className={input + " mr-2 w-16"} /><input name="인원추가" type="text" inputMode="numeric" defaultValue={prices.인원추가} className={input} /></td></tr>
              </tbody>
            </table>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">저장하면 거래 추가 제안가와 템플릿의 {"{{평일 낮}} {{인원추가}}"} 같은 자리표가 바로 바뀌어요.</span>
              <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700">가격 저장</button>
            </div>
          </form>
        </details>
      </div>
    </section>
  );
}
