import assert from "node:assert/strict";
import test from "node:test";
import { loadState, STORAGE_KEY, saveProgress } from "../assets/storage.js";

test("same-origin Hell Is Us progress is neither loaded nor overwritten", () => {
  const entries = new Map([
    ["hellisus-checklist-v1", JSON.stringify({ completed: ["old-game"] })],
  ]);
  const storage = {
    getItem: (key) => entries.get(key),
    setItem: (key, value) => entries.set(key, value),
  };
  assert.deepEqual(loadState(storage).state, {});
  saveProgress(storage, { completed: ["vm-new"] }, { replace: true });
  assert.deepEqual(JSON.parse(entries.get("hellisus-checklist-v1")).completed, [
    "old-game",
  ]);
  assert.deepEqual(JSON.parse(entries.get(STORAGE_KEY)).completed, ["vm-new"]);
});
test("blocked writes retain successive in-memory edits", () => {
  const storage = {
    getItem: () => JSON.stringify({ completed: [] }),
    setItem: () => {
      throw Error("blocked");
    },
  };
  let result = saveProgress(
    storage,
    { completed: [] },
    { id: "a", checked: true },
  );
  result = saveProgress(storage, result.state, { id: "b", checked: true });
  assert.equal(result.available, false);
  assert.deepEqual(result.state.completed, ["a", "b"]);
});
test("independent tab edits merge; explicit replacement replaces", () => {
  let saved = JSON.stringify({ completed: ["a"] });
  const storage = {
    getItem: () => saved,
    setItem: (_key, value) => {
      saved = value;
    },
  };
  assert.deepEqual(
    saveProgress(storage, { completed: [] }, { id: "b", checked: true }).state
      .completed,
    ["a", "b"],
  );
  assert.deepEqual(
    saveProgress(storage, { completed: ["c"] }, { replace: true }).state
      .completed,
    ["c"],
  );
});
test("unreadable and corrupt storage leave a usable state", () => {
  assert.deepEqual(
    loadState({
      getItem: () => {
        throw Error("blocked");
      },
    }),
    { state: {}, available: false },
  );
  assert.deepEqual(loadState({ getItem: () => "{" }).state, {});
});
