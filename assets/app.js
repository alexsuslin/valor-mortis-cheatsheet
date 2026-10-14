import { VIEWS } from "./config.js";
import { getGuideCoverage, getRouteItems, validateGuide } from "./guide.js";
import { translate } from "./i18n.js";
import { getProgress } from "./model.js";
import { createRouteView } from "./route-view.js";
import {
  loadState,
  rebaseCompletion,
  STORAGE_KEY,
  saveProgress,
} from "./storage.js";
import { byId, element, evidenceLinks } from "./ui.js";

let storage;
try {
  storage = window.localStorage;
} catch {
  /* Privacy settings may deny the property itself. */
}
const saved = loadState(storage);
const state = {
  language: ["en", "ru"].includes(saved.state.language)
    ? saved.state.language
    : navigator.language.startsWith("ru")
      ? "ru"
      : "en",
  theme: ["light", "dark"].includes(saved.state.theme)
    ? saved.state.theme
    : matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  completed: new Set(
    Array.isArray(saved.state.completed) ? saved.state.completed : [],
  ),
  currentItemId: saved.state.currentItemId,
  activeView: VIEWS.includes(saved.state.activeView)
    ? saved.state.activeView
    : "walkthrough",
  storageAvailable: saved.available,
  filters: {
    chapterId: "all",
    category: "all",
    warningKind: "all",
    query: "",
    hideCompleted: saved.state.hideCompleted === true,
  },
};
const t = (key, values) => translate(state.language, key, values);
const pending = new Map();
let guide,
  items = [],
  knownIds = new Set(),
  routeView;
const renderers = new Map();

function snapshot() {
  return {
    completed: [...state.completed],
    language: state.language,
    theme: state.theme,
    currentItemId: state.currentItemId,
    activeView: state.activeView,
    hideCompleted: state.filters.hideCompleted,
  };
}
function persist(change) {
  if (change?.id) pending.set(change.id, change);
  const result = saveProgress(storage, snapshot(), {
    ...change,
    edits: [...pending.values()],
  });
  state.completed = new Set(
    result.state.completed.filter((id) => knownIds.has(id)),
  );
  state.storageAvailable = result.available;
  if (result.available) pending.clear();
  updateCounters();
}
function updateCounters() {
  const progress = getProgress(items, state.completed);
  byId("progress-percent").textContent = progress.percent;
  byId("overall-progress").value = progress.percent;
  byId("overall-progress").setAttribute("aria-label", t("yourProgress"));
  byId("progress-count").textContent = t("progress", {
    done: progress.completed,
    total: progress.total,
  });
  byId("save-status").textContent = t(
    state.storageAvailable ? "saved" : "unsaved",
  );
  if (guide) {
    const coverage = getGuideCoverage(guide);
    byId("coverage-summary").textContent = t("coverage", {
      chapters: guide.chapters.length,
      quests: guide.quests.length,
      notes: coverage.notes,
    });
  }
}
function toggle(id, checked) {
  if (!knownIds.has(id)) return;
  if (checked) state.completed.add(id);
  else state.completed.delete(id);
  persist({ id, checked });
  renderViews();
  const focus = document.querySelector(
    `#${state.activeView} [data-progress-id="${CSS.escape(id)}"]`,
  );
  focus?.focus({ preventScroll: true });
}
function selectView(view, push = true) {
  if (!VIEWS.includes(view)) return;
  state.activeView = view;
  for (const candidate of VIEWS) byId(candidate).hidden = candidate !== view;
  for (const control of document.querySelectorAll("[data-view]"))
    control.setAttribute("aria-pressed", String(control.dataset.view === view));
  if (push) history.replaceState(null, "", `#${view}`);
  persist();
  renderers.get(view)?.();
}
function selectCurrent(id) {
  state.currentItemId = id;
  selectView("current");
}
function navigateRoute(id) {
  selectView("walkthrough");
  routeView.showItem(id);
}
function renderViews() {
  routeView?.render();
  for (const render of renderers.values()) render();
}
function renderAbout() {
  if (!guide) return;
  const notes = guide.coverageNotes.map((note) => {
    const card = element("article", "card");
    card.dataset.coverageNote = note.id;
    card.append(
      element("h3", "", note.title[state.language]),
      element("p", "", note.description[state.language]),
      evidenceLinks(note.evidence, guide.sources, t),
    );
    return card;
  });
  byId("coverage-notes").replaceChildren(...notes);
  byId("source-list").replaceChildren(
    ...guide.sources.map((source) => {
      const link = element("a", "", source.name);
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      return link;
    }),
  );
}
function preferences() {
  document.documentElement.lang = state.language;
  document.documentElement.dataset.theme = state.theme;
  for (const node of document.querySelectorAll("[data-i18n]"))
    node.textContent = t(node.dataset.i18n);
  for (const button of document.querySelectorAll("[data-language]"))
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.language === state.language),
    );
  byId("theme-toggle").setAttribute(
    "aria-pressed",
    String(state.theme === "dark"),
  );
  routeView?.controls();
  renderAbout();
  renderViews();
  updateCounters();
}
for (const button of document.querySelectorAll("[data-language]"))
  button.addEventListener("click", () => {
    state.language = button.dataset.language;
    preferences();
    persist();
  });
byId("theme-toggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  preferences();
  persist();
});
for (const button of document.querySelectorAll("[data-view]"))
  button.addEventListener("click", () => selectView(button.dataset.view));
byId("about-toggle").addEventListener("click", () => {
  byId("about").hidden = !byId("about").hidden;
  byId("about-toggle").setAttribute(
    "aria-expanded",
    String(!byId("about").hidden),
  );
});
byId("retry").addEventListener("click", () => location.reload());
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  const incoming = loadState(storage);
  state.completed = new Set(
    rebaseCompletion(incoming.state.completed ?? [], [
      ...pending.values(),
    ]).filter((id) => knownIds.has(id)),
  );
  updateCounters();
  renderViews();
});

try {
  const response = await fetch(new URL("../data/guide.json", import.meta.url));
  if (!response.ok) throw Error("Guide request failed");
  guide = await response.json();
  validateGuide(guide);
  items = getRouteItems(guide);
  knownIds = new Set(items.map((item) => item.id));
  state.completed = new Set(
    [...state.completed].filter((id) => knownIds.has(id)),
  );
  routeView = createRouteView({
    guide,
    state,
    t,
    onToggle: toggle,
    onSelect: selectCurrent,
    onFilterChange: () => persist(),
  });
  preferences();
  selectView("walkthrough", false);
} catch (error) {
  console.error("Unable to load guide", error);
  byId("load-error").textContent = t("loadError");
  byId("load-error").hidden = false;
  byId("retry").hidden = false;
  byId("progress-count").textContent = "—";
}
