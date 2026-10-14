import { APP_ID, BACKUP_VERSION, TRANSFER_PREFIX, VIEWS } from "./config.js";
import { parseBackup } from "./model.js";
import { transferIds } from "./transfer-catalog.js";

const positions = new Map(transferIds.map((id, index) => [id, index]));
export class TransferUpdateRequiredError extends Error {
  constructor() {
    super("Update required for this transfer");
    this.name = "TransferUpdateRequiredError";
  }
}

// CRC detects accidental damage. A progress link is readable, not encrypted.
function checksum(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}
function positionOf(id) {
  const value = positions.get(id);
  if (value === undefined) throw Error("Unmapped progress ID");
  return value;
}

export function createTransferUrl(address, state) {
  if (
    !["en", "ru"].includes(state.language) ||
    !["light", "dark"].includes(state.theme) ||
    !VIEWS.includes(state.activeView)
  )
    throw Error("Invalid transfer preferences");
  if (state.currentItemId && !state.currentItemId.startsWith("vm-"))
    throw Error("Current selection must be a route action");
  const bytes = new Uint8Array(4 + Math.ceil(transferIds.length / 8));
  bytes[0] =
    (state.language === "en" ? 1 : 0) | (state.theme === "dark" ? 2 : 0);
  bytes[1] = VIEWS.indexOf(state.activeView);
  const current = state.currentItemId ? positionOf(state.currentItemId) + 1 : 0;
  bytes[2] = current >>> 8;
  bytes[3] = current & 255;
  for (const id of state.completed) {
    const position = positionOf(id);
    bytes[4 + (position >>> 3)] |= 1 << (position % 8);
  }
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const url = new URL(address);
  url.search = "";
  url.hash = `${TRANSFER_PREFIX}1.${hex}.${checksum(bytes)}`;
  return url.href;
}

export function parseTransferHash(hash, knownIds) {
  if (hash.startsWith("#progress=")) throw Error("Foreign game transfer");
  if (!hash.startsWith(TRANSFER_PREFIX)) return null;
  if (hash.length > 8192) throw Error("Transfer too large");
  const match = /^#vm-progress=1\.((?:[a-f0-9]{2})+)\.([a-f0-9]{8})$/.exec(
    hash,
  );
  if (!match) throw Error("Invalid transfer version or encoding");
  const bytes = Uint8Array.from(match[1].match(/.{2}/g), (pair) =>
    Number.parseInt(pair, 16),
  );
  if (
    bytes.length < 4 ||
    bytes[0] > 3 ||
    bytes[1] >= VIEWS.length ||
    checksum(bytes) !== match[2]
  )
    throw Error("Damaged transfer");
  const current = (bytes[2] << 8) | bytes[3];
  if (current > transferIds.length) throw new TransferUpdateRequiredError();
  if (current && !transferIds[current - 1].startsWith("vm-"))
    throw Error("Invalid current route position");
  const completed = [];
  for (let position = 0; position < (bytes.length - 4) * 8; position++) {
    if (!(bytes[4 + (position >>> 3)] & (1 << (position % 8)))) continue;
    if (position >= transferIds.length) throw new TransferUpdateRequiredError();
    completed.push(transferIds[position]);
  }
  return parseBackup(
    JSON.stringify({
      app: APP_ID,
      version: BACKUP_VERSION,
      completed,
      currentItemId: current ? transferIds[current - 1] : undefined,
      language: bytes[0] & 1 ? "en" : "ru",
      theme: bytes[0] & 2 ? "dark" : "light",
      activeView: VIEWS[bytes[1]],
    }),
    knownIds,
  );
}
