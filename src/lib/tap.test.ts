import test from "node:test";
import assert from "node:assert/strict";
import { navigateOnTap } from "./tap.ts";

/**
 * 크롬에서 실제로 측정한 이벤트 순서를 그대로 흘려보내 본다.
 * 터치는 click 보다 pointerleave 가 먼저 온다 — 이것 때문에 폰에서 영원히 이동하지 않는 버그가 났다.
 */
const TOUCH_TAP = ["pointerover", "pointerenter", "pointerdown", "pointerup", "pointerout", "pointerleave", "mousedown", "mouseup", "click"];
const MOUSE_CLICK = ["pointerover", "pointerenter", "pointerdown", "mousedown", "pointerup", "mouseup", "click"];

/** 칩의 동작을 그대로 흉내 낸다. 한 번 누르는 동안 일어난 일을 돌려준다 */
function tap(events: string[], pointerType: string, state: { open: boolean }) {
  let go = true;
  let navigated = false;
  for (const ev of events) {
    if (ev === "pointerenter" && pointerType === "mouse") state.open = true;
    if (ev === "pointerdown") go = navigateOnTap(pointerType, state.open);
    if (ev === "pointerleave" && pointerType === "mouse") state.open = false; // 터치의 pointerleave 는 무시한다
    if (ev === "click") {
      if (go) navigated = true;
      else state.open = true;
    }
  }
  return { navigated, open: state.open };
}

test("폰: 첫 터치는 설명만, 두 번째 터치에 이동", () => {
  const state = { open: false };
  const first = tap(TOUCH_TAP, "touch", state);
  assert.equal(first.navigated, false, "첫 터치는 이동하지 않아야 한다");
  assert.equal(first.open, true, "첫 터치에 설명이 떠야 한다");

  const second = tap(TOUCH_TAP, "touch", state);
  assert.equal(second.navigated, true, "두 번째 터치에는 반드시 이동해야 한다 (전에 여기서 막혔다)");
});

test("폰: 세 번 눌러도 안 움직이는 일이 없어야 한다", () => {
  const state = { open: false };
  const results = [1, 2, 3].map(() => tap(TOUCH_TAP, "touch", state).navigated);
  assert.deepEqual(results, [false, true, true]);
});

test("PC: 마우스는 한 번 클릭에 바로 이동", () => {
  const state = { open: false };
  assert.equal(tap(MOUSE_CLICK, "mouse", state).navigated, true);
});

test("pointerType 을 모르는 브라우저(사파리 등)에서는 바로 이동 — 갇히지 않게", () => {
  assert.equal(navigateOnTap("", false), true);
  assert.equal(navigateOnTap("pen", false), true);
});

test("터치에서 pointerleave 로 팝오버가 닫히면 영원히 이동하지 못한다 (옛 버그 재현)", () => {
  // 옛 코드: pointerleave 를 터치에서도 받아 닫고, 판정을 click 시점에 했다
  const buggy = (state: { open: boolean }) => {
    let navigated = false;
    for (const ev of TOUCH_TAP) {
      if (ev === "pointerleave") state.open = false; // ← 터치에서도 닫았다
      if (ev === "click") {
        if (state.open) navigated = true;
        else state.open = true; // ← 판정을 여기서 했다
      }
    }
    return navigated;
  };
  const state = { open: false };
  assert.deepEqual([1, 2, 3].map(() => buggy(state)), [false, false, false], "옛 코드는 몇 번 눌러도 이동하지 않는다");
});
