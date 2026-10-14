import { getBuildStatus, getNextBuildSteps } from "./build.js";
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
  function render() {
    const root = byId("current");
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
        `${row.chapterId.slice(-2)} · ${row.title[state.language]}`,
      );
      option.value = row.id;
      select.append(option);
    }
    select.value = item.id;
    select.addEventListener("change", () => onSelect(select.value));
    const controls = element("div", "current-controls");
    const index = items.indexOf(item);
    const previous = button(t("previous"), () => onSelect(items[index - 1].id));
    previous.disabled = index === 0;
    const next = button(t("next"), () => onSelect(items[index + 1].id));
    next.id = "current-next";
    next.disabled = index === items.length - 1;
    controls.append(
      previous,
      chapterSelect,
      select,
      next,
      button(t("firstIncomplete"), () =>
        onSelect(resolveCurrentItem(items, undefined, state.completed).id),
      ),
    );
    root.append(
      controls,
      element(
        "p",
        "muted",
        `${item.region[state.language]} / ${item.lantern[state.language]}`,
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
    const upcoming = relevant.length
      ? relevant
      : getNextBuildSteps(build.stages, state.completed);
    const cards = element("div", "card-grid");
    for (const stage of upcoming)
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
    root.append(cards);
    const tipsGrid = element("div", "card-grid");
    for (const tip of tips.reminders.filter((tip) =>
      tip.routeIds.includes(item.id),
    ))
      tipsGrid.append(
        tipCard(tip, {
          state,
          t,
          onToggle,
          sources: tips.sources,
          prefix: "current-tip",
        }),
      );
    root.append(tipsGrid);
    const linked = achievements.filter((achievement) =>
      achievement.route.itemIds.includes(item.id),
    );
    if (linked.length) {
      root.append(element("h3", "subheading", t("achievements")));
      for (const achievement of linked)
        root.append(
          check(
            achievement.id,
            `${achievement.title[state.language]} · ${t("unlock")}`,
            state.completed.has(achievement.id),
            onToggle,
            "current-achievement",
          ),
        );
    }
    const general = element("details", "card");
    general.append(element("summary", "", t("general")));
    for (const tip of tips.reminders.filter((tip) => !tip.routeIds.length))
      general.append(
        tipCard(tip, {
          state,
          t,
          onToggle,
          sources: tips.sources,
          prefix: "current-tip",
        }),
      );
    root.append(general);
  }
  return { render };
}
