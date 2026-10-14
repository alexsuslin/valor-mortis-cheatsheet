import { STORAGE_KEY } from "./config.js";
export { STORAGE_KEY };

export function loadState(storage) {
  let saved;
  try {
    saved = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: {}, available: false };
  }

  if (saved === null || saved === undefined)
    return { state: {}, available: true };
  try {
    const state = JSON.parse(saved);
    if (!state || typeof state !== "object" || Array.isArray(state))
      return { state: {}, available: false };
    return { state, available: true };
  } catch {
    return { state: {}, available: false };
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function saveProgress(storage, state, change, deriveEdits) {
  const latest = loadState(storage).state;
  const savedCompletion = Array.isArray(latest.completed)
    ? latest.completed.filter((id) => typeof id === "string")
    : state.completed;
  const edits = change?.edits ?? (change?.id ? [change] : []);
  const completed = rebaseCompletion(
    change?.replace ? state.completed : savedCompletion,
    edits,
  );

  // Derive related checks from the same merged snapshot that will be persisted.
  const derivedEdits = deriveEdits?.(new Set(completed)) ?? [];
  // A checkbox edit merges with the latest save; import/reset intentionally replace it.
  const updated = {
    ...state,
    completed: rebaseCompletion(completed, derivedEdits),
  };
  const available = saveState(storage, updated);
  if (available) return { state: updated, available, derivedEdits };

  // Failed writes leave the browser's older save behind. Keep all unsaved edits in memory.
  return {
    state: {
      ...state,
      completed: rebaseCompletion(state.completed, [...edits, ...derivedEdits]),
    },
    available: false,
    derivedEdits,
  };
}

export function rebaseCompletion(savedIds, edits) {
  const completed = new Set(savedIds);
  for (const { id, checked } of edits) {
    if (checked) completed.add(id);
    else completed.delete(id);
  }
  return [...completed];
}
