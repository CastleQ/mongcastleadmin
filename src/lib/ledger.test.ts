import assert from "node:assert/strict";
import { test } from "node:test";
import { calcMoney, parseLedgerForm } from "./ledger.ts";

test("calcMoney: 채널·결제방식별 수수료/실수령", () => {
  // 지인: 보증금 없음, 실수령 = 입금액
  assert.deepEqual(calcMoney("매출", 200000, "지인", "계좌이체"), { deposit: 0, fee: 0, net: 200000 });
  // 별도컨택: 보증금만
  assert.deepEqual(calcMoney("매출", 120000, "별도컨택", "계좌이체"), { deposit: 50000, fee: 0, net: 70000 });
  // 네이버 플랫폼결제: (150000-50000)*3.19% = 3190
  assert.deepEqual(calcMoney("매출", 150000, "네이버플레이스", "플랫폼결제"), { deposit: 50000, fee: 3190, net: 96810 });
  // 네이버인데 계좌이체면 수수료 0
  assert.equal(calcMoney("매출", 150000, "네이버플레이스", "계좌이체").fee, 0);
  // 스페이스클라우드 10%
  assert.equal(calcMoney("매출", 150000, "스페이스클라우드", "플랫폼결제").fee, 10000);
  // 기타지출 차감
  assert.equal(calcMoney("매출", 150000, "별도컨택", "계좌이체", 5000).net, 95000);
  // 매입
  assert.deepEqual(calcMoney("매입", 24000, "쿠팡", "카드결제"), { deposit: 0, fee: 0, net: -24000 });
});

test("parseLedgerForm: 기타(직접입력), 매출 기본값, 매입은 예약항목 null", () => {
  const f = new FormData();
  f.set("date", "2026-09-14"); f.set("kind", "매출"); f.set("package", "밤");
  f.set("channel", "기타"); f.set("channel_other", " 인스타 ");
  f.set("customer_name", "홍길동"); f.set("amount", "120,000"); f.set("payment_method", "계좌이체"); f.set("settled", "on");
  const r = parseLedgerForm(f);
  assert.equal(r.channel, "인스타");
  assert.equal(r.category, "대여");
  assert.equal(r.amount, 120000);
  assert.equal(r.net, 120000); // 기타 채널은 보증금 없음 → 실수령 = 입금액
  assert.equal(r.settled, true);

  const b = new FormData();
  b.set("date", "2026-09-01"); b.set("kind", "매입"); b.set("category", "월세기타"); b.set("amount", "775000"); b.set("package", "밤");
  const m = parseLedgerForm(b);
  assert.equal(m.net, -775000);
  assert.equal(m.package, null);
  assert.equal(m.payment_method, "계좌이체");
});
