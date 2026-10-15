export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export const byId = (id) => document.getElementById(id);
export function button(text, onClick, className) {
  const node = element("button", className, text);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}
export function check(id, text, checked, onToggle, prefix = "check") {
  const label = element("label");
  const input = element("input");
  input.type = "checkbox";
  input.id = `${prefix}-${id}`;
  input.dataset.progressId = id;
  input.checked = checked;
  input.addEventListener("change", () => onToggle(id, input.checked));
  label.append(input, element("span", "", text));
  return label;
}
export function evidenceLinks(evidence, sources, t, linkLabel = "source") {
  const footer = element("div", "evidence");
  const label =
    evidence.status === "single-source" ? "singleSource" : evidence.status;
  const details = element("details", "evidence-details");
  details.append(
    element(
      "summary",
      "",
      t(evidence.status === "conflicting" ? "conflicting" : "sourceDetails"),
    ),
    element(
      "p",
      "muted",
      `${t(label)} · ${t("reviewed")} ${evidence.reviewed}`,
    ),
  );
  for (const id of evidence.sourceIds) {
    const source = sources.find((source) => source.id === id);
    if (!source) continue;
    const link = element("a", "", `${t(linkLabel)} · ${source.name} ↗`);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = source.name;
    footer.append(link);
  }
  footer.append(details);
  return footer;
}
export function warningNodes(warnings, language, t, sources) {
  return warnings.map((warning) => {
    const node = element("aside", "warning");
    node.append(
      element("strong", "", t(warning.kind)),
      element("span", "", warning.text[language]),
      evidenceLinks(warning.evidence, sources, t),
    );
    return node;
  });
}
