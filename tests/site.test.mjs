import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("preview serves public assets at root and subpath, never private files", async () => {
  for (const flags of [[], ["--subpath"]]) {
    const server = spawn(process.execPath, ["scripts/serve.mjs", ...flags], {
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    try {
      const [chunk] = await once(server.stdout, "data");
      const address = chunk.toString().match(/http:\/\/\S+/)[0];
      assert.equal((await fetch(address)).status, 200);
      assert.equal(
        (await fetch(new URL("assets/app.js", address))).status,
        200,
      );
      assert.equal((await fetch(new URL(".git/config", address))).status, 404);
      assert.equal(
        (await fetch(new URL("docs/research.md", address))).status,
        404,
      );
    } finally {
      server.kill();
      await once(server, "exit");
    }
  }
});
test("a changed data file versions every published module reference", async () => {
  const folder = await mkdtemp(join(tmpdir(), "valor-build-test-"));
  await mkdir(join(folder, "assets"));
  await mkdir(join(folder, "data"));
  await writeFile(
    join(folder, "index.html"),
    '<script type="module" src="./assets/app.js"></script>',
  );
  await writeFile(
    join(folder, "assets/app.js"),
    'fetch(new URL("../data/guide.json", import.meta.url));',
  );
  await writeFile(join(folder, "data/guide.json"), "{}");
  const run = () =>
    execFileSync(process.execPath, [resolve("scripts/build.mjs")], {
      cwd: folder,
    });
  run();
  const first = await readFile(join(folder, "dist/index.html"), "utf8");
  assert.match(first, /app\.js\?v=[a-f0-9]{16}/);
  await writeFile(join(folder, "data/guide.json"), '{"updated":true}');
  run();
  const second = await readFile(join(folder, "dist/index.html"), "utf8");
  assert.notEqual(first, second);
  const module = await readFile(join(folder, "dist/assets/app.js"), "utf8");
  assert.match(module, /guide\.json\?v=[a-f0-9]{16}/);
});
