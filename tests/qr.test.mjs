import assert from "node:assert/strict";
import test from "node:test";
import jsQR from "jsqr";
import { createTransferUrl, parseTransferHash } from "../assets/transfer.js";
import { transferIds } from "../assets/transfer-catalog.js";
import qrcode from "../assets/vendor/qrcode.js";

test("the actual QR encoder yields a scannable complete snapshot", () => {
  const link = createTransferUrl(
    "https://example.github.io/valor-mortis-cheatsheet/",
    {
      completed: transferIds,
      currentItemId: "vm-shield",
      language: "ru",
      theme: "dark",
      activeView: "current",
    },
  );
  const qr = qrcode(0, "M");
  qr.addData(link);
  qr.make();
  const count = qr.getModuleCount();
  const scale = 5,
    margin = 4,
    width = (count + margin * 2) * scale;
  const rgba = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let y = 0; y < count; y++)
    for (let x = 0; x < count; x++)
      if (qr.isDark(y, x))
        for (let py = 0; py < scale; py++)
          for (let px = 0; px < scale; px++) {
            const index =
              ((y + margin) * scale + py) * width * 4 +
              ((x + margin) * scale + px) * 4;
            rgba[index] = 0;
            rgba[index + 1] = 0;
            rgba[index + 2] = 0;
          }
  const decoded = jsQR(rgba, width, width);
  assert.equal(decoded.data, link);
  assert.equal(
    parseTransferHash(new URL(decoded.data).hash, new Set(transferIds))
      .completed.length,
    transferIds.length,
  );
});
