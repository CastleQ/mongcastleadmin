/**
 * "처음 누르면 설명, 다시 누르면 이동" 칩의 판정 한 줄.
 *
 * 왜 따로 떼어 뒀나: 이 판정을 click 시점에 하면 폰에서 **영원히 이동하지 않는다.**
 * 크롬이 터치에서 보내는 순서가 이렇기 때문이다 (실제 측정):
 *   pointerdown → pointerup → pointerout → **pointerleave** → mousedown → mouseup → click
 * pointerleave 가 click 보다 먼저 와서 팝오버를 닫아버리므로, click 은 매번 "아직 안 열렸네(=첫 터치)"로 본다.
 * 그래서 판정은 **pointerdown 시점**에 하고, 그 결과를 ref 에 담아 click 에서 그대로 쓴다.
 *
 * @param pointerType 브라우저가 준 pointerdown 의 pointerType ("mouse" | "touch" | "pen" | 모르면 "")
 * @param popoverOpen 지금 설명 팝오버가 떠 있는지
 * @returns true = 바로 이동, false = 이동을 막고 팝오버만 띄움
 */
export function navigateOnTap(pointerType: string, popoverOpen: boolean): boolean {
  // 터치가 아니면(마우스·펜·알 수 없음) 늘 이동 — 모를 때 이동하는 쪽이 안전하다(갇히지 않음)
  return pointerType !== "touch" || popoverOpen;
}
