import { getBuildStatus } from "./build.js";
import { button, byId, check, element, evidenceLinks } from "./ui.js";
export function buildCard(stage, { state, t, onToggle, onRoute, sources }) {
  const card = element("article", "card");
  card.id = stage.id;
  card.append(
    element("span", "badge", t(getBuildStatus(stage, state.completed))),
    element("h3", "", stage.title[state.language]),
    element("p", "", stage.obtain[state.language]),
    check(
      `${stage.id}-obtained`,
      t("obtained"),
      state.completed.has(`${stage.id}-obtained`),
      onToggle,
      "build",
    ),
    element("p", "", stage.apply[state.language]),
    check(
      `${stage.id}-applied`,
      t("applied"),
      state.completed.has(`${stage.id}-applied`),
      onToggle,
      "build",
    ),
  );
  if (stage.optional)
    card.append(
      check(
        `${stage.id}-skipped`,
        t("skipped"),
        state.completed.has(`${stage.id}-skipped`),
        onToggle,
        "build",
      ),
    );
  for (const id of stage.routeIds)
    card.append(button(t("backRoute"), () => onRoute(id), "route-link"));
  card.append(evidenceLinks(stage.evidence, sources, t));
  return card;
}
export function tipCard(tip, { state, t, onToggle, sources }) {
  const card = element("article", "card");
  card.append(
    element("h3", "", tip.title[state.language]),
    element("p", "", tip.description[state.language]),
    check(
      tip.id,
      t("acknowledged"),
      state.completed.has(tip.id),
      onToggle,
      "tip",
    ),
    evidenceLinks(tip.evidence, sources, t),
  );
  return card;
}
export function createBuildTracker({
  build,
  tips,
  state,
  t,
  onToggle,
  onRoute,
}) {
  function render() {
    const root = byId("build");
    root.replaceChildren(
      element("h2", "", t("build")),
      element("p", "muted", t("buildIntro")),
    );
    const cards = element("div", "card-grid");
    for (const stage of build.stages)
      cards.append(
        buildCard(stage, {
          state,
          t,
          onToggle,
          onRoute,
          sources: build.sources,
        }),
      );
    root.append(cards, element("h2", "subheading", t("equipment")));
    const equipment = element("div", "card-grid");
    for (const item of build.equipment) {
      const card = element("article", "card");
      card.append(
        element("h3", "", item.title[state.language]),
        check(
          item.id,
          t("equipped"),
          state.completed.has(item.id),
          onToggle,
          "equipment",
        ),
      );
      equipment.append(card);
    }
    root.append(equipment);
    const loadouts = element("div", "card-grid");
    for (const item of build.loadouts) {
      const card = element("article", "card");
      card.append(
        element("h3", "", item.title[state.language]),
        element("p", "", item.description[state.language]),
        evidenceLinks(item.evidence, build.sources, t),
      );
      for (const id of item.routeIds)
        card.append(button(t("backRoute"), () => onRoute(id), "route-link"));
      loadouts.append(card);
    }
    root.append(element("h2", "subheading", t("tips")), loadouts);
  }
  function renderTips() {
    const root = byId("tips");
    root.replaceChildren(
      element("h2", "", t("tips")),
      element("p", "muted", t("tipsIntro")),
    );
    const cards = element("div", "card-grid");
    for (const tip of tips.reminders)
      cards.append(tipCard(tip, { state, t, onToggle, sources: tips.sources }));
    root.append(cards);
  }
  return { render, renderTips };
}
