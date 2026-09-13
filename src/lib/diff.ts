/** 두 글의 줄 단위 차이. 순서는 무시하고 "새로 생긴 줄 / 사라진 줄"만 (기록 요약용) */
export function lineDiff(before: string, after: string): { added: string[]; removed: string[] } {
  const a = new Set(before.split("\n").map((l) => l.trim()).filter(Boolean));
  const b = new Set(after.split("\n").map((l) => l.trim()).filter(Boolean));
  return { added: [...b].filter((l) => !a.has(l)), removed: [...a].filter((l) => !b.has(l)) };
}
