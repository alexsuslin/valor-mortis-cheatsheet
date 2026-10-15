import { getRouteItems } from "./guide.js";
import { categories } from "./i18n.js";
import { filterItems, getProgress } from "./model.js";
import { button, byId, element, evidenceLinks, warningNodes } from "./ui.js";

export function routeCard(
  item,
  { state, t, onToggle, onSelect, sources, prefix = "route" },
) {
  const node = element(
    "article",
    `route-item${state.completed.has(item.id) ? " completed" : ""}`,
  );
  node.id = `${prefix}-${item.id}`;
  node.tabIndex = -1;
  const input = element("input");
  input.type = "checkbox";
  input.id = `${prefix}-check-${item.id}`;
  input.dataset.progressId = item.id;
  input.checked = state.completed.has(item.id);
  input.addEventListener("change", () => onToggle(item.id, input.checked));
  const body = element("div");
  const label = element("label", "route-title", item.title[state.language]);
  label.htmlFor = input.id;
  body.append(
    label,
    element("p", "", item.description[state.language]),
    ...warningNodes(item.warnings, state.language, t, sources),
  );
  const meta = element("div", "item-meta");
  for (const category of item.categories)
    meta.append(element("span", "badge", categories[state.language][category]));
  if (onSelect)
    meta.append(button(t("selectCurrent"), () => onSelect(item.id)));
  body.append(meta, evidenceLinks(item.evidence, sources, t, "directions"));
  node.append(input, body);
  return node;
}

export function createRouteView({
  guide,
  state,
  t,
  onToggle,
  onSelect,
  onFilterChange,
}) {
  const items = getRouteItems(guide);
  const open = new Set([guide.chapters[0].id]);
  function options(id, entries) {
    const select = byId(id);
    select.replaceChildren(
      ...entries.map(([value, label]) => {
        const option = element("option", "", label);
        option.value = value;
        return option;
      }),
    );
  }
  function controls() {
    options("chapter-filter", [
      ["all", t("all")],
      ...guide.chapters.map((ch) => [ch.id, ch.title[state.language]]),
    ]);
    options("category-filter", [
      ["all", t("all")],
      ...Object.entries(categories[state.language]),
    ]);
    options(
      "warning-filter",
      ["all", "any", "achievement", "quest", "reward", "access"].map(
        (value) => [value, t(value)],
      ),
    );
    for (const [id, key] of [
      ["chapter-filter", "chapterId"],
      ["category-filter", "category"],
      ["warning-filter", "warningKind"],
    ])
      byId(id).value = state.filters[key];
    byId("search").value = state.filters.query;
    byId("search").placeholder = t("searchLabel");
    byId("hide-completed").checked = state.filters.hideCompleted;
  }
  function render() {
    const visible = filterItems(items, state.filters, state.completed);
    const visibleIds = new Set(visible.map((item) => item.id));
    const container = byId("checklist-sections");
    container.replaceChildren();
    for (const chapter of guide.chapters) {
      const chapterItems = items.filter(
        (item) => item.chapterId === chapter.id,
      );
      if (!chapterItems.some((item) => visibleIds.has(item.id))) continue;
      const details = element("details", "chapter");
      details.dataset.chapter = chapter.id;
      details.open =
        open.has(chapter.id) ||
        Boolean(state.filters.query) ||
        state.filters.chapterId !== "all" ||
        state.filters.warningKind !== "all";
      details.addEventListener("toggle", () => {
        if (details.isConnected) {
          if (details.open) open.add(chapter.id);
          else open.delete(chapter.id);
        }
      });
      const progress = getProgress(chapterItems, state.completed);
      const summary = element("summary");
      summary.append(
        element(
          "span",
          "",
          `${chapter.id.slice(-2)} / ${chapter.title[state.language]}`,
        ),
        element(
          "span",
          "chapter-count",
          `${progress.completed} / ${progress.total}`,
        ),
      );
      details.append(summary);
      for (const section of guide.sections.filter(
        (section) => section.chapterId === chapter.id,
      )) {
        const rows = visible.filter((item) => item.sectionId === section.id);
        if (!rows.length) continue;
        details.append(
          element(
            "div",
            "location-title",
            `${section.region[state.language]} / ${section.lantern[state.language]}`,
          ),
        );
        for (const item of rows)
          details.append(
            routeCard(item, {
              state,
              t,
              onToggle,
              onSelect,
              sources: guide.sources,
            }),
          );
      }
      container.append(details);
    }
    if (!visible.length)
      container.append(element("p", "empty", t("noResults")));
    byId("result-count").textContent = t("results", { count: visible.length });
  }
  function clear() {
    Object.assign(state.filters, {
      query: "",
      chapterId: "all",
      category: "all",
      warningKind: "all",
      hideCompleted: false,
    });
    controls();
    render();
    onFilterChange?.();
  }
  function showItem(id) {
    const item = items.find((item) => item.id === id);
    if (!item) return;
    clear();
    open.add(item.chapterId);
    render();
    const node = byId(`route-${id}`);
    node?.scrollIntoView({ block: "center" });
    node?.focus({ preventScroll: true });
  }
  for (const [id, key] of [
    ["chapter-filter", "chapterId"],
    ["category-filter", "category"],
    ["warning-filter", "warningKind"],
  ])
    byId(id).addEventListener("change", (event) => {
      state.filters[key] = event.target.value;
      render();
    });
  byId("search").addEventListener("input", (event) => {
    state.filters.query = event.target.value;
    render();
  });
  byId("hide-completed").addEventListener("change", (event) => {
    state.filters.hideCompleted = event.target.checked;
    render();
    onFilterChange?.();
  });
  byId("clear-filters").addEventListener("click", clear);
  byId("expand-all").addEventListener("click", () => {
    for (const chapter of guide.chapters) open.add(chapter.id);
    render();
  });
  return { render, controls, showItem };
}
