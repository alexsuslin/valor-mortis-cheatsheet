import assert from "node:assert/strict";
import test from "node:test";
import { filterItems, getProgress, parseBackup } from "../assets/model.js";

const snapshot = {
  app: "valor-mortis-cheatsheet",
  version: 1,
  completed: ["vm-first", "vm-first", "retired"],
  language: "en",
  theme: "dark",
};
test("own backups retain known progress and reject foreign saves", () => {
  const parsed = parseBackup(JSON.stringify(snapshot), new Set(["vm-first"]));
  assert.deepEqual(parsed.completed, ["vm-first"]);
  assert.equal(parsed.activeView, "walkthrough");
  assert.throws(() =>
    parseBackup(
      JSON.stringify({ ...snapshot, app: "hellisus-cheatsheet" }),
      new Set(),
    ),
  );
});
test("invalid preferences, sizes and completion entries are rejected", () => {
  for (const change of [
    { theme: [] },
    { language: "xx" },
    { activeView: "admin" },
    { completed: [12] },
    { version: 99 },
  ]) {
    assert.throws(() =>
      parseBackup(JSON.stringify({ ...snapshot, ...change }), new Set()),
    );
  }
  assert.throws(() => parseBackup(" ".repeat(262145), new Set()));
});
test("empty routes never imply completion", () => {
  assert.deepEqual(getProgress([], new Set()), {
    completed: 0,
    total: 0,
    percent: 0,
  });
});
test("search and category filters combine across languages", () => {
  const items = [
    {
      id: "a",
      categories: ["amber"],
      title: { en: "Well", ru: "Колодец" },
      description: { en: "Find it", ru: "Найти" },
    },
  ];
  assert.equal(
    filterItems(items, { query: "колодец", category: "amber" }, new Set())
      .length,
    1,
  );
  assert.equal(
    filterItems(items, { query: "колодец", category: "boss" }, new Set())
      .length,
    0,
  );
});
