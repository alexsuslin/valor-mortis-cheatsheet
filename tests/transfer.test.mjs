import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createTransferUrl, parseTransferHash } from "../assets/transfer.js";
import { transferIds } from "../assets/transfer-catalog.js";

const known = new Set(transferIds);

test("valid checksums do not bypass header or future-position validation", () => {
  for (const hash of [
    "#vm-progress=1.0000ffff.9f62cde3",
    "#vm-progress=1.00000000000000000000000000000000000000000000000000000000000000000002.af7f0d06",
  ])
    assert.throws(() => parseTransferHash(hash, known), /Update required/);
  for (const hash of [
    "#vm-progress=1.04000000.ae26484b",
    "#vm-progress=1.00050000.278f1df7",
  ])
    assert.throws(() => parseTransferHash(hash, known), /Damaged transfer/);
});
test("snapshots round-trip all preferences, equipment and current step", () => {
  for (const language of ["en", "ru"])
    for (const theme of ["light", "dark"])
      for (const activeView of [
        "walkthrough",
        "current",
        "achievements",
        "build",
        "tips",
      ]) {
        const state = {
          completed: ["vm-saber", "equipment-saber", "achievement-all"],
          currentItemId: "vm-fire",
          language,
          theme,
          activeView,
        };
        const url = new URL(
          createTransferUrl("https://example.com/guide/?old=1#current", state),
        );
        assert.equal(url.pathname, "/guide/");
        assert.equal(url.search, "");
        const parsed = parseTransferHash(url.hash, known);
        assert.deepEqual(new Set(parsed.completed), new Set(state.completed));
        for (const key of ["currentItemId", "language", "theme", "activeView"])
          assert.equal(parsed[key], state[key]);
      }
});
test("foreign, damaged, oversized and unsupported transfers are rejected", () => {
  for (const hash of [
    "#progress=2.000000.ff41d912",
    "#vm-progress=2.00.12345678",
    "#vm-progress=1.0.12345678",
    "#vm-progress=1.zz.12345678",
    `#vm-progress=${"a".repeat(8193)}`,
  ])
    assert.throws(() => parseTransferHash(hash, known));
  const url = new URL(
    createTransferUrl("https://example.com", {
      completed: [],
      language: "en",
      theme: "dark",
      activeView: "tips",
    }),
  );
  assert.throws(() => parseTransferHash(url.hash.replace(/.$/, "x"), known));
  assert.equal(parseTransferHash("#current", known), null);
});
test("retired IDs disappear without shifting remaining progress", () => {
  const url = new URL(
    createTransferUrl("https://example.com", {
      completed: ["vm-saber", "vm-fire"],
      currentItemId: "vm-saber",
      language: "ru",
      theme: "light",
      activeView: "current",
    }),
  );
  const parsed = parseTransferHash(url.hash, new Set(["vm-fire"]));
  assert.deepEqual(parsed.completed, ["vm-fire"]);
  assert.equal(parsed.currentItemId, undefined);
});
test("first-release positions are immutable and all IDs remain unique", async () => {
  const frozen = JSON.parse(
    await readFile("tests/fixtures/transfer-v1-ids.json", "utf8"),
  );
  assert.deepEqual(transferIds.slice(0, frozen.length), frozen);
  assert.equal(new Set(transferIds).size, transferIds.length);
});
