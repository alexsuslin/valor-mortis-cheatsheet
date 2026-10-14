export const CATEGORIES = [
  "story",
  "boss",
  "quest",
  "amber",
  "weapon",
  "transmutation",
  "healing",
  "material",
  "key",
  "revisit",
];
export const WARNING_KINDS = ["achievement", "quest", "reward", "access"];

function requireValue(condition, message) {
  if (!condition) throw new Error(`Invalid guide: ${message}`);
}

export function validateText(value, context) {
  requireValue(
    value &&
      ["en", "ru"].every(
        (language) =>
          typeof value[language] === "string" && value[language].trim(),
      ),
    `${context}: missing translation`,
  );
}

export function validateSources(sources) {
  requireValue(Array.isArray(sources), "missing sources");
  const ids = new Set();
  for (const source of sources) {
    requireValue(source.id && !ids.has(source.id), "duplicate source");
    requireValue(
      typeof source.url === "string" &&
        new URL(source.url).protocol === "https:",
      "unsafe source URL",
    );
    requireValue(/^\d{4}-\d{2}-\d{2}$/.test(source.reviewed), "source date");
    ids.add(source.id);
  }
  return ids;
}

export function validateEvidence(evidence, sourceIds) {
  requireValue(
    evidence &&
      ["corroborated", "single-source", "conflicting"].includes(
        evidence.status,
      ),
    "evidence status",
  );
  requireValue(
    Array.isArray(evidence.sourceIds) &&
      evidence.sourceIds.length > 0 &&
      evidence.sourceIds.every((id) => sourceIds.has(id)),
    "evidence source",
  );
  requireValue(/^\d{4}-\d{2}-\d{2}$/.test(evidence.reviewed), "review date");
}

export function validateGuide(guide) {
  requireValue(guide?.version === 1, "version");
  const sources = validateSources(guide.sources);
  const ids = new Set();
  const recordId = (id) => {
    requireValue(
      typeof id === "string" && /^[a-z0-9-]+$/.test(id) && !ids.has(id),
      `duplicate/invalid ID ${id}`,
    );
    ids.add(id);
  };
  const chapters = new Set();
  for (const chapter of guide.chapters) {
    recordId(chapter.id);
    validateText(chapter.title, chapter.id);
    chapters.add(chapter.id);
  }
  const routeIds = new Set();
  for (const section of guide.sections) {
    recordId(section.id);
    requireValue(chapters.has(section.chapterId), "section chapter");
    for (const key of ["title", "region", "lantern"])
      validateText(section[key], section.id);
    for (const item of section.items) {
      recordId(item.id);
      routeIds.add(item.id);
      validateText(item.title, item.id);
      validateText(item.description, item.id);
      requireValue(
        item.categories?.length &&
          item.categories.every((value) => CATEGORIES.includes(value)),
        "category",
      );
      validateEvidence(item.evidence, sources);
      requireValue(Array.isArray(item.warnings), "warnings");
      for (const warning of item.warnings) {
        requireValue(WARNING_KINDS.includes(warning.kind), "warning kind");
        validateText(warning.text, item.id);
        validateEvidence(warning.evidence, sources);
      }
    }
  }
  for (const note of guide.coverageNotes) {
    recordId(note.id);
    validateText(note.title, note.id);
    validateText(note.description, note.id);
    validateEvidence(note.evidence, sources);
  }
  const questIds = new Set();
  for (const quest of guide.quests) {
    recordId(quest.id);
    questIds.add(quest.id);
    validateText(quest.title, quest.id);
    requireValue(
      ["documented", "partial"].includes(quest.coverage),
      "quest coverage",
    );
    requireValue(
      quest.routeIds.length && quest.routeIds.every((id) => routeIds.has(id)),
      "quest route link",
    );
    if (quest.coverage === "partial")
      requireValue(
        guide.coverageNotes.some((note) => note.questId === quest.id),
        "partial quest explanation",
      );
  }
  for (const item of getRouteItems(guide)) {
    if (item.questId) requireValue(questIds.has(item.questId), "unknown quest");
  }
}

export function getRouteItems(guide) {
  return guide.sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      chapterId: section.chapterId,
      sectionId: section.id,
      region: section.region,
      lantern: section.lantern,
      searchTerms: [
        ...(item.searchTerms ?? []),
        ...Object.values(section.title),
        ...Object.values(section.region),
        ...Object.values(section.lantern),
      ],
    })),
  );
}

export function getGuideCoverage(guide) {
  return {
    actionable: getRouteItems(guide).length,
    notes: guide.coverageNotes.length,
    documentedQuests: guide.quests.filter(
      (quest) => quest.coverage === "documented",
    ).length,
    partialQuests: guide.quests.filter((quest) => quest.coverage === "partial")
      .length,
  };
}
