import assert from "node:assert/strict";
import { test } from "node:test";
import { lineDiff } from "./diff.ts";

test("lineDiff: 바뀐 줄만", () => {
  assert.deepEqual(lineDiff("a\nb\nc", "a\nB\nc\nd"), { added: ["B", "d"], removed: ["b"] });
  assert.deepEqual(lineDiff("x", "x"), { added: [], removed: [] });
});
