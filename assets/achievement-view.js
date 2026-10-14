import { filterAchievements, getRelatedItems } from "./achievements.js";
import { getProgress } from "./model.js";
import {
  button,
  byId,
  check,
  element,
  evidenceLinks,
  warningNodes,
} from "./ui.js";
export function createAchievementTracker({
  achievements,
  sources,
  items,
  state,
  t,
  onToggle,
  onRoute,
}) {
  const filters = {
    platform: "steam",
    query: "",
    category: "all",
    hideCompleted: false,
  };
  function renderCards() {
    const list = byId("achievement-cards");
    list.replaceChildren();
    const eligible = achievements.filter((item) =>
      item.platforms.includes(filters.platform),
    );
    const progress = getProgress(eligible, state.completed);
    byId("achievement-count").textContent = t("unlockedCount", {
      done: progress.completed,
      total: progress.total,
    });
    for (const achievement of filterAchievements(
      achievements,
      filters,
      state.completed,
    )) {
      const card = element("article", "card");
      card.id = achievement.id;
      card.append(
        element("span", "eyebrow", t(achievement.category)),
        element("h3", "", achievement.title[state.language]),
      );
      if (state.language === "ru")
        card.append(element("span", "muted", achievement.title.en));
      card.append(
        element("p", "", achievement.description[state.language]),
        check(
          achievement.id,
          t("unlock"),
          state.completed.has(achievement.id),
          onToggle,
          "achievement",
        ),
        ...warningNodes(achievement.warnings, state.language, t, sources),
      );
      const platformDescription =
        achievement.platformDescriptions?.[filters.platform];
      if (platformDescription)
        card.append(element("p", "muted", platformDescription[state.language]));
      const related = getRelatedItems(achievement, items);
      if (related.length) {
        const details = element("details");
        details.append(element("summary", "", t("related")));
        for (const item of related) {
          const link = button(
            `${state.completed.has(item.id) ? "✓" : "○"} ${item.title[state.language]}`,
            () => onRoute(item.id),
            "route-link",
          );
          link.dataset.routeId = item.id;
          details.append(link);
        }
        card.append(details);
      }
      card.append(evidenceLinks(achievement.evidence, sources, t));
      list.append(card);
    }
    if (!list.children.length)
      list.append(element("p", "empty", t("noResults")));
  }
  function render() {
    const root = byId("achievements");
    root.replaceChildren(
      element("h2", "", t("achievements")),
      element("p", "muted", t("achievementIntro")),
    );
    const controls = element("div", "filters");
    const search = element("input");
    search.type = "search";
    search.id = "achievement-search";
    search.value = filters.query;
    search.placeholder = t("searchLabel");
    search.setAttribute("aria-label", t("searchLabel"));
    search.addEventListener("input", () => {
      filters.query = search.value;
      renderCards();
    });
    const platform = element("select");
    platform.setAttribute("aria-label", t("platform"));
    for (const name of ["steam", "ps5", "xbox"]) {
      const option = element("option", "", name.toUpperCase());
      option.value = name;
      platform.append(option);
    }
    platform.value = filters.platform;
    platform.addEventListener("change", () => {
      filters.platform = platform.value;
      renderCards();
    });
    controls.append(search, platform);
    root.append(controls);
    const count = element("p", "muted");
    count.id = "achievement-count";
    root.append(count, element("p", "muted", t("platformNote")));
    const list = element("div", "card-grid");
    list.id = "achievement-cards";
    root.append(list);
    renderCards();
  }
  return { render };
}
