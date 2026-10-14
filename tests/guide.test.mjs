import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getGuideCoverage,
  getRouteItems,
  validateGuide,
} from "../assets/guide.js";

const text = { en: "Action", ru: "Действие" };
const evidence = {
  status: "single-source",
  sourceIds: ["p"],
  reviewed: "2026-10-14",
};
const fixture = () => ({
  version: 1,
  updated: "2026-10-14",
  sources: [
    {
      id: "p",
      name: "Guide",
      url: "https://example.com/guide",
      kind: "guide",
      reviewed: "2026-10-14",
    },
  ],
  chapters: [{ id: "chapter-01", title: text }],
  sections: [
    {
      id: "opening",
      chapterId: "chapter-01",
      title: text,
      region: text,
      lantern: text,
      items: [
        {
          id: "vm-first",
          title: text,
          description: text,
          categories: ["quest"],
          evidence,
          warnings: [],
          questId: "quest-first",
        },
      ],
    },
  ],
  quests: [
    {
      id: "quest-first",
      title: text,
      routeIds: ["vm-first"],
      coverage: "documented",
    },
  ],
  coverageNotes: [{ id: "unknown", title: text, description: text, evidence }],
});
test("coverage notes never become route actions or inflate progress", () => {
  const guide = fixture();
  validateGuide(guide);
  assert.deepEqual(getGuideCoverage(guide), {
    actionable: 1,
    notes: 1,
    documentedQuests: 1,
    partialQuests: 0,
  });
  assert.equal(getRouteItems(guide).length, 1);
  assert.equal(getRouteItems(guide)[0].chapterId, "chapter-01");
  assert.equal(guide.sections[0].items[0].chapterId, undefined);
});
test("invalid translations, IDs, categories and evidence fail validation", () => {
  for (const mutate of [
    (g) => {
      g.sections[0].items[0].title = { en: "Only English" };
    },
    (g) => {
      g.sections[0].items.push(g.sections[0].items[0]);
    },
    (g) => {
      g.quests[0].routeIds = ["missing"];
    },
    (g) => {
      g.sections[0].items[0].categories = ["cap"];
    },
    (g) => {
      g.sources[0].url = "javascript:alert(1)";
    },
    (g) => {
      g.sections[0].items[0].evidence = { ...evidence, sourceIds: ["missing"] };
    },
  ]) {
    const guide = fixture();
    mutate(guide);
    assert.throws(() => validateGuide(guide));
  }
});
test("partial quests need a visible coverage explanation", () => {
  const guide = fixture();
  guide.quests[0].coverage = "partial";
  assert.throws(() => validateGuide(guide));
  guide.coverageNotes[0].questId = "quest-first";
  validateGuide(guide);
});

test("published catalog covers the campaign and preserves consequential warnings", async () => {
  const guide = JSON.parse(
    await readFile(new URL("../data/guide.json", import.meta.url), "utf8"),
  );
  validateGuide(guide);
  assert.equal(guide.chapters.length, 11);
  assert.equal(guide.quests.length, 20);
  const items = getRouteItems(guide);
  for (const [id, kind] of [
    ["vm-shield", "achievement"],
    ["vm-mummy-start", "quest"],
    ["vm-choir-journal", "quest"],
    ["vm-laudanum", "reward"],
  ]) {
    assert.ok(
      items
        .find((item) => item.id === id)
        .warnings.some((warning) => warning.kind === kind),
    );
  }
  assert.ok(
    guide.coverageNotes.some((note) => note.id === "coverage-glass-duplicate"),
  );
  assert.ok(!items.some((item) => item.id.startsWith("coverage-")));
  assert.ok(
    items
      .find((item) => item.id === "vm-emissary-finish")
      .categories.includes("revisit"),
  );
});
