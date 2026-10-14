import assert from "node:assert/strict";
import test from "node:test";
import { resolveCurrentItem } from "../assets/current.js";

test("only real route actions can become current", () => {
  const items = [{ id: "vm-a" }, { id: "vm-b" }];
  assert.equal(
    resolveCurrentItem(items, "achievement-a", new Set(["vm-a"])).id,
    "vm-b",
  );
  assert.equal(resolveCurrentItem(items, "vm-a", new Set(["vm-a"])).id, "vm-a");
  assert.equal(
    resolveCurrentItem(items, undefined, new Set(["vm-a", "vm-b"])).id,
    "vm-a",
  );
  assert.equal(resolveCurrentItem([], undefined, new Set()), undefined);
});
