import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  filterAchievements,
  getRelatedItems,
  validateAchievements,
} from "../assets/achievements.js";

const completion = {
  id: "achievement-all",
  title: { en: "All", ru: "Все" },
  description: { en: "Finish", ru: "Завершить" },
  category: "completion",
  platforms: ["steam", "ps5"],
  route: { itemIds: ["vm-first"] },
  warnings: [],
};
test("completion achievements are eligible on Steam and PS5", () => {
  for (const platform of ["steam", "ps5"])
    assert.equal(
      filterAchievements([completion], { platform }, new Set()).length,
      1,
    );
  assert.equal(
    filterAchievements([completion], { platform: "xbox" }, new Set()).length,
    0,
  );
});
test("prerequisite completion never implies an achievement unlock", () => {
  const completed = new Set(["vm-first"]);
  assert.equal(
    filterAchievements(
      [completion],
      { platform: "steam", hideCompleted: true },
      completed,
    ).length,
    1,
  );
  assert.deepEqual(
    getRelatedItems(completion, [{ id: "vm-first" }, { id: "other" }]),
    [{ id: "vm-first" }],
  );
});
test("catalog has 39 supported achievements and valid prerequisites", async () => {
  const g = JSON.parse(await readFile("data/guide.json", "utf8"));
  const catalog = JSON.parse(await readFile("data/achievements.json", "utf8"));
  const items = g.sections.flatMap((s) => s.items);
  validateAchievements(catalog, items);
  for (const platform of ["steam", "ps5", "xbox"])
    assert.equal(
      filterAchievements(catalog.achievements, { platform }, new Set()).length,
      39,
    );
  catalog.achievements[0].route.itemIds = ["missing"];
  assert.throws(() => validateAchievements(catalog, items));
});
