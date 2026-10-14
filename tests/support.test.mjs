import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getBuildIds, validateSupport } from "../assets/build.js";
import { transferIds } from "../assets/transfer-catalog.js";

test("supporting catalogs have valid evidence and exact cross-links", async () => {
  const read = async (name) =>
    JSON.parse(await readFile(`data/${name}.json`, "utf8"));
  const [guide, build, tips, achievements] = await Promise.all(
    ["guide", "build", "tips", "achievements"].map(read),
  );
  const items = guide.sections.flatMap((s) => s.items);
  validateSupport(build, tips, items);
  const known = [
    ...items.map((i) => i.id),
    ...achievements.achievements.map((i) => i.id),
    ...tips.reminders.map((i) => i.id),
    ...getBuildIds(build.stages, build.equipment),
  ];
  assert.equal(new Set(known).size, known.length);
  for (const id of known) assert.ok(transferIds.includes(id), id);
  build.stages[0].obtainRouteIds = ["unknown"];
  assert.throws(() => validateSupport(build, tips, items));
});
