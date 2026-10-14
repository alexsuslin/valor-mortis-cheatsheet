import { APP_ID, BACKUP_VERSION, MAX_BACKUP_BYTES } from "./config.js";
import { parseBackup } from "./model.js";
import {
  createTransferUrl,
  parseTransferHash,
  TransferUpdateRequiredError,
} from "./transfer.js";
import { button, byId, element } from "./ui.js";
import qrcode from "./vendor/qrcode.js";

export function bindProgressTransfer({
  snapshot,
  knownIds,
  t,
  onImport,
  onReset,
  toast,
}) {
  const dialog = byId("save-dialog");
  const content = byId("dialog-content");
  function open(title, description) {
    if (dialog.open) dialog.close();
    content.replaceChildren(
      element("h2", "", title),
      element("p", "", description),
    );
    dialog.showModal();
  }
  function exportSave() {
    const blob = new Blob(
      [
        JSON.stringify(
          { app: APP_ID, version: BACKUP_VERSION, ...snapshot() },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = element("a");
    link.href = url;
    link.download = `valor-mortis-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t("exported"));
  }
  function preview(backup) {
    open(
      t("importTitle"),
      t("importDescription", { count: backup.completed.length }),
    );
    const actions = element("div", "dialog-actions");
    const apply = button(t("apply"), () => {
      onImport(backup);
      dialog.close();
      toast(t("imported"));
    });
    apply.id = "apply-import";
    const cancel = button(t("cancel"), () => dialog.close());
    cancel.id = "cancel-import";
    actions.append(cancel, apply);
    content.append(actions);
    cancel.focus();
  }
  byId("export-save").addEventListener("click", exportSave);
  byId("import-save").addEventListener("click", () =>
    byId("import-file").click(),
  );
  byId("import-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw Error("File too large");
      preview(parseBackup(await file.text(), knownIds));
    } catch {
      toast(t("invalidSave"));
    } finally {
      event.target.value = "";
    }
  });
  byId("reset-save").addEventListener("click", () => {
    open(t("resetTitle"), t("resetDescription"));
    const actions = element("div", "dialog-actions");
    actions.append(
      button(t("cancel"), () => dialog.close()),
      button(t("resetConfirm"), () => {
        onReset();
        dialog.close();
      }),
    );
    content.append(actions);
  });
  byId("share-save").addEventListener("click", () => {
    try {
      const url = createTransferUrl(location.href, snapshot());
      open(t("transferTitle"), t("transferDescription"));
      const qrContainer = element("div");
      qrContainer.id = "transfer-qr";
      content.append(qrContainer);
      try {
        const qr = qrcode(0, "M");
        qr.addData(url);
        qr.make();
        const svg = new DOMParser().parseFromString(
          qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true }),
          "image/svg+xml",
        ).documentElement;
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", t("shareSave"));
        qrContainer.append(svg);
      } catch {
        qrContainer.append(element("p", "notice", t("qrFallback")));
      }
      const link = element("textarea");
      link.id = "transfer-link";
      link.readOnly = true;
      link.value = url;
      link.setAttribute("aria-label", t("shareSave"));
      const status = element("p", "muted");
      status.setAttribute("role", "status");
      content.append(link, status);
      const actions = element("div", "dialog-actions");
      actions.append(
        button(t("copy"), async () => {
          try {
            await navigator.clipboard.writeText(url);
            status.textContent = t("copied");
          } catch {
            link.focus();
            link.select();
            status.textContent = t("manualCopy");
          }
        }),
        button(t("exportSave"), exportSave),
      );
      content.append(actions);
    } catch {
      toast(t("invalidSave"));
    }
  });
  function consumeHash() {
    if (
      !location.hash.startsWith("#vm-progress=") &&
      !location.hash.startsWith("#progress=")
    )
      return;
    const hash = location.hash;
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    try {
      preview(parseTransferHash(hash, knownIds));
    } catch (error) {
      toast(
        t(
          error instanceof TransferUpdateRequiredError
            ? "updateRequired"
            : "invalidSave",
        ),
      );
    }
  }
  window.addEventListener("hashchange", consumeHash);
  byId("save-controls").hidden = false;
  return { consumeHash };
}
