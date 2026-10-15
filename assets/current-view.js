import { getBuildStatus } from "./build.js";
import { buildCard, tipCard } from "./build-view.js";
import { resolveCurrentItem } from "./current.js";
import { routeCard } from "./route-view.js";
import { button, byId, check, element } from "./ui.js";
export function createCurrentTracker({
  guide,
  items,
  build,
  tips,
  achievements,
  state,
  t,
  onToggle,
  onSelect,
  onRoute,
}) {
  const expanded = new Set();
  let renderedItemId;

  function disclosure(id, title, children) {
    const details = element("details", "current-related");
    details.id = id;
    details.open = expanded.has(id);
    details.append(element("summary", "", title), ...children);
    details.addEventListener("toggle", () => {
      if (!details.isConnected) return;
      if (details.open) expanded.add(id);
      else expanded.delete(id);
    });
    return details;
  }

  function render() {
    const root = byId("current");
    const focusedId = root.contains(document.activeElement)
      ? document.activeElement.id
      : undefined;
    root.replaceChildren(element("h2", "", t("current")));
    const item = resolveCurrentItem(
      items,
      state.currentItemId,
      state.completed,
    );
    if (!item) {
      root.append(element("p", "", t("currentEmpty")));
      return;
    }
    if (renderedItemId !== item.id) {
      for (const id of expanded) if (id !== "current-jump") expanded.delete(id);
    }
    renderedItemId = item.id;
    state.currentItemId = item.id;
    const select = element("select");
    select.id = "current-step";
    select.setAttribute("aria-label", t("current"));
    const chapterSelect = element("select");
    chapterSelect.id = "current-chapter";
    chapterSelect.setAttribute("aria-label", t("chapter"));
    for (const chapter of guide.chapters) {
      const option = element("option", "", chapter.title[state.language]);
      option.value = chapter.id;
      chapterSelect.append(option);
    }
    chapterSelect.value = item.chapterId;
    chapterSelect.addEventListener("change", () => {
      const nextItem = resolveCurrentItem(
        items.filter((row) => row.chapterId === chapterSelect.value),
        undefined,
        state.completed,
      );
      if (nextItem) onSelect(nextItem.id);
    });
    for (const row of items.filter((row) => row.chapterId === item.chapterId)) {
      const option = element(
        "option",
        "",
        `${state.completed.has(row.id) ? "✓ " : ""}${row.title[state.language]}`,
      );
      option.value = row.id;
      select.append(option);
    }
    select.value = item.id;
    select.addEventListener("change", () => onSelect(select.value));
    const controls = element("div", "current-controls");
    const index = items.indexOf(item);
    const previous = button(t("previous"), () => onSelect(items[index - 1].id));
    previous.id = "current-previous";
    previous.disabled = index === 0;
    const next = button(t("next"), () => onSelect(items[index + 1].id));
    next.id = "current-next";
    next.disabled = index === items.length - 1;
    controls.append(
      chapterSelect,
      select,
      button(t("firstIncomplete"), () =>
        onSelect(resolveCurrentItem(items, undefined, state.completed).id),
      ),
    );
    root.append(
      disclosure("current-jump", t("jumpToStep"), [controls]),
      element(
        "p",
        "current-location",
        `${guide.chapters.find((chapter) => chapter.id === item.chapterId).title[state.language]} · ${item.region[state.language]} / ${item.lantern[state.language]}`,
      ),
    );
    const current = element("div", "card current-card");
    current.append(
      routeCard(item, {
        state,
        t,
        onToggle,
        sources: guide.sources,
        prefix: "current",
      }),
      button(t("backRoute"), () => onRoute(item.id), "route-link"),
    );
    root.append(current);
    const relevant = build.stages.filter(
      (stage) =>
        stage.routeIds.includes(item.id) ||
        getBuildStatus(stage, state.completed) === "ready",
    );
    const cards = element("div", "card-grid");
    for (const stage of relevant)
      cards.append(
        buildCard(stage, {
          state,
          t,
          onToggle,
          onRoute,
          sources: build.sources,
          prefix: "current-build",
        }),
      );
    if (relevant.length)
      root.append(
        disclosure("current-build", `${t("build")} · ${relevant.length}`, [
          cards,
        ]),
      );
    const tipsGrid = element("div", "card-grid");
    const localTips = tips.reminders.filter((tip) =>
      tip.routeIds.includes(item.id),
    );
    for (const tip of localTips)
      tipsGrid.append(
        tipCard(tip, {
          state,
          t,
          onToggle,
          sources: tips.sources,
          prefix: "current-tip",
        }),
      );
    if (localTips.length)
      root.append(
        disclosure("current-tips", `${t("tips")} · ${localTips.length}`, [
          tipsGrid,
        ]),
      );
    const linked = achievements.filter((achievement) =>
      achievement.route.itemIds.includes(item.id),
    );
    if (linked.length) {
      const achievementList = element("div", "current-achievements");
      for (const achievement of linked)
        achievementList.append(
          check(
            achievement.id,
            `${achievement.title[state.language]} · ${t("unlock")}`,
            state.completed.has(achievement.id),
            onToggle,
            "current-achievement",
          ),
        );
      root.append(
        disclosure(
          "current-achievements",
          `${t("achievements")} · ${linked.length}`,
          [achievementList],
        ),
      );
    }

    const navigation = element("nav", "current-navigation");
    navigation.setAttribute("aria-label", t("stepNavigation"));
    const position = element(
      "span",
      "current-position",
      t("stepPosition", { index: index + 1, total: items.length }),
    );
    position.setAttribute("aria-live", "polite");
    navigation.append(previous, position, next);
    root.append(navigation);
    if (focusedId) byId(focusedId)?.focus({ preventScroll: true });
  }
  return { render };
}
