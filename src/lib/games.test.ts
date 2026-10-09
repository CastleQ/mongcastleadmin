import assert from "node:assert/strict";
import { test } from "node:test";
import { gameGroup } from "./games.ts";

test("공개 페이지 묶음: 머더미스터리는 장르와 상관없이 맨 끝 묶음", () => {
  assert.equal(gameGroup({ kind: "보드게임", category: "파티" }), "파티게임");
  assert.equal(gameGroup({ kind: "보드게임", category: "전략" }), "전략게임");
  assert.equal(gameGroup({ kind: "보드게임", category: "마피아" }), "그 외");
  assert.equal(gameGroup({ kind: "보드게임", category: null }), "그 외");
  assert.equal(gameGroup({ kind: "머더미스터리", category: "파티" }), "머더미스터리");
});
