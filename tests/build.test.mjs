import assert from "node:assert/strict";
import test from "node:test";
import {
  getAcquisitionEdits,
  getBuildIds,
  getBuildStatus,
  getNextBuildSteps,
} from "../assets/build.js";

const stages = [
  { id: "build-saber", obtainRouteIds: ["vm-saber"] },
  { id: "build-shield", obtainRouteIds: ["vm-shield"], optional: true },
];
test("only an exact pickup grants acquisition; equipment remains independent", () => {
  const completed = new Set(["vm-saber", "equipment-shield"]);
  assert.deepEqual(getAcquisitionEdits(stages, completed, "vm-saber"), [
    { id: "build-saber-obtained", checked: true },
  ]);
  assert.deepEqual(
    getAcquisitionEdits(stages, new Set(["build-saber-obtained"]), "vm-saber"),
    [],
  );
  assert.equal(
    getBuildStatus(stages[0], new Set(["build-saber-obtained"])),
    "ready",
  );
  assert.equal(
    getBuildStatus(stages[0], new Set(["equipment-saber"])),
    "missing",
  );
  assert.ok(
    getBuildIds(stages, [{ id: "equipment-saber" }]).includes(
      "equipment-saber",
    ),
  );
});
test("ready applications stay ahead of future acquisitions", () => {
  const completed = new Set(["build-shield-obtained"]);
  assert.equal(getNextBuildSteps(stages, completed)[0].id, "build-shield");
  completed.add("build-shield-skipped");
  assert.equal(getBuildStatus(stages[1], completed), "skipped");
});
