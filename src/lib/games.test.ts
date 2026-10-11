import test from "node:test";
import assert from "node:assert/strict";
import { gameGroup, groupGames, GAME_GROUPS, type Game } from "./games.ts";

const g = (p: Partial<Game>): Game => ({
  id: 1, kind: "보드게임", name: "", name_original: null, category: null, expansion: null,
  qty: 1, language: null, players: null, play_minutes: null, gm_required: false, translated: false,
  price: null, link: null, synopsis: null, note: null, image_url: null, bgg_id: null, ...p,
});

test("스위치 게임은 장르가 '파티'여도 닌텐도 스위치 묶음으로 간다", () => {
  // 슈퍼 마리오 파티가 보드게임 파티 묶음으로 새던 것을 막는다
  assert.equal(gameGroup(g({ kind: "스위치게임", category: "파티" })), "닌텐도 스위치");
  assert.equal(gameGroup(g({ kind: "스위치게임", category: "레이싱" })), "닌텐도 스위치");
});

test("보드게임·머더미스터리 묶음은 그대로 (머더미스터리는 장르와 상관없이)", () => {
  assert.equal(gameGroup({ kind: "보드게임", category: "파티" }), "파티게임");
  assert.equal(gameGroup({ kind: "보드게임", category: "전략" }), "전략게임");
  assert.equal(gameGroup({ kind: "보드게임", category: "마피아" }), "그 외");
  assert.equal(gameGroup({ kind: "보드게임", category: null }), "그 외");
  assert.equal(gameGroup({ kind: "머더미스터리", category: "파티" }), "머더미스터리");
  assert.equal(gameGroup({ kind: "머더미스터리", category: "머더미스터리" }), "머더미스터리");
});

test("묶음 순서는 GAME_GROUPS 대로, 빈 묶음은 빠진다", () => {
  const list = [
    g({ id: 1, kind: "스위치게임", name: "마리오카트8 디럭스" }),
    g({ id: 2, kind: "보드게임", category: "파티", name: "우노" }),
  ];
  assert.deepEqual(groupGames(list).map((s) => s.group), ["파티게임", "닌텐도 스위치"]);
  assert.equal(GAME_GROUPS.at(-1), "닌텐도 스위치");
});
