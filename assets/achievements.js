import { validateEvidence, validateSources, validateText } from "./guide.js";
import { filterItems } from "./model.js";
export function getRelatedItems(achievement, items) {
  const ids = new Set(achievement.route.itemIds);
  return items.filter((item) => ids.has(item.id));
}
export function filterAchievements(achievements, filters, completed) {
  return filterItems(
    achievements.filter((item) => item.platforms.includes(filters.platform)),
    filters,
    completed,
  );
}
export function validateAchievements(catalog, items) {
  const sourceIds = validateSources(catalog.sources);
  const routes = new Set(items.map((item) => item.id));
  const seen = new Set();
  for (const achievement of catalog.achievements) {
    if (seen.has(achievement.id) || !achievement.id.startsWith("achievement-"))
      throw Error("Invalid achievement ID");
    seen.add(achievement.id);
    validateText(achievement.title, achievement.id);
    validateText(achievement.description, achievement.id);
    validateEvidence(achievement.evidence, sourceIds);
    if (
      !achievement.platforms.length ||
      achievement.platforms.some(
        (platform) => !["steam", "ps5", "xbox"].includes(platform),
      )
    )
      throw Error("Invalid achievement platform");
    if (achievement.route.itemIds.some((id) => !routes.has(id)))
      throw Error("Broken achievement route");
  }
}
