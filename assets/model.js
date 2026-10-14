import { APP_ID, BACKUP_VERSION, MAX_BACKUP_BYTES, VIEWS } from "./config.js";

export function filterItems(items, filters, completed) {
  const query = (filters.query ?? "").trim().toLocaleLowerCase();

  return items.filter((item) => {
    const categories = item.categories ?? [item.category];
    if (
      filters.category &&
      filters.category !== "all" &&
      !categories.includes(filters.category)
    )
      return false;
    if (filters.missableOnly && !item.missable) return false;
    if (filters.hideCompleted && completed.has(item.id)) return false;
    if (!query) return true;

    const searchText = [
      ...Object.values(item.title),
      ...Object.values(item.description),
      ...(item.searchTerms ?? []),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return searchText.includes(query);
  });
}

export function getProgress(items, completed) {
  const count = items.filter((item) => completed.has(item.id)).length;
  return {
    completed: count,
    total: items.length,
    percent: items.length ? Math.round((count / items.length) * 100) : 0,
  };
}

export function parseBackup(text, knownIds) {
  if (
    typeof text !== "string" ||
    new TextEncoder().encode(text).length > MAX_BACKUP_BYTES
  )
    throw new Error("Backup too large");
  const backup = JSON.parse(text);
  if (
    !backup ||
    backup.app !== APP_ID ||
    backup.version !== BACKUP_VERSION ||
    !Array.isArray(backup.completed) ||
    !backup.completed.every((id) => typeof id === "string")
  ) {
    throw new Error("Invalid checklist backup");
  }
  if (backup.language !== undefined && !["ru", "en"].includes(backup.language))
    throw new Error("Invalid language");
  if (backup.theme !== undefined && !["light", "dark"].includes(backup.theme))
    throw new Error("Invalid theme");
  if (backup.activeView !== undefined && !VIEWS.includes(backup.activeView))
    throw new Error("Invalid view");

  return {
    activeView: backup.activeView ?? "walkthrough",
    completed: [...new Set(backup.completed)].filter((id) => knownIds.has(id)),
    ...(typeof backup.currentItemId === "string" &&
    knownIds.has(backup.currentItemId)
      ? { currentItemId: backup.currentItemId }
      : {}),
    ...(backup.language ? { language: backup.language } : {}),
    ...(backup.theme ? { theme: backup.theme } : {}),
  };
}
