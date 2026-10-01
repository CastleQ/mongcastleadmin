import { DAYS, PKGS, type Prices } from "@/lib/prices";

const won = (n: number) => n.toLocaleString("ko-KR");
const DAY_LABEL = { 평일: "월~목", 금: "금 · 공휴일 전날", 주말: "토·일·공휴일" } as const;

/** 손님용 요금표. 관리자 "몽캐슬파티룸 정보 › 📌 가격 정보"에서 고친 값이 그대로 나옴 */
export function GuidePrices({ prices }: { prices: Prices }) {
  return (
    <section id="prices" className="rounded-lg border border-zinc-200">
      <h3 className="border-b border-zinc-100 px-4 py-2.5 font-bold">이용 요금</h3>
      <div className="overflow-x-auto px-4 py-3">
        <table className="w-full min-w-[22rem] text-sm">
          <thead>
            <tr className="text-xs text-zinc-500">
              <th className="py-1.5 text-left font-medium">패키지</th>
              {DAYS.map((d) => <th key={d} className="py-1.5 text-right font-medium">{DAY_LABEL[d]}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {PKGS.map((pkg) => (
              <tr key={pkg}>
                <td className="py-2 pr-2 font-semibold whitespace-nowrap">{pkg}</td>
                {prices[pkg].map((v, i) => <td key={i} className="py-2 text-right tabular-nums">{won(v)}원</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-1 text-sm text-zinc-600">
          <li>· 밤샘 옵션: 밤 패키지에 +{won(prices.밤샘)}원</li>
          <li>· 청소보증금 +{won(prices.보증금)}원 — 입금액에 포함되고, 퇴실 확인 후 환급해드려요.</li>
          <li>· 기준 {prices.기준인원}인, 초과 1인당 +{won(prices.인원추가)}원 (전일 패키지는 인원 추가 무료)</li>
        </ul>
      </div>
    </section>
  );
}
