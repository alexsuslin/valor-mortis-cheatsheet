// Acquisition semantics retained from the MIT-licensed Hell Is Us companion.
import { validateEvidence, validateSources, validateText } from "./guide.js";

export function validateSupport(build, tips, items) {
  const routeIds = new Set(items.map((item) => item.id));
  const seen = new Set();
  for (const catalog of [build, tips]) {
    if (catalog.version !== 1) throw Error("Unsupported companion data");
    const sources = validateSources(catalog.sources);
    const records =
      catalog === build
        ? [...build.stages, ...build.equipment, ...build.loadouts]
        : tips.reminders;
    for (const record of records) {
      if (record.id) {
        if (seen.has(record.id)) throw Error("Duplicate companion ID");
        seen.add(record.id);
      }
      validateText(record.title, record.id ?? "Loadout");
      validateEvidence(record.evidence, sources);
      for (const field of ["description", "obtain", "apply"])
        if (record[field]) validateText(record[field], record.id);
      for (const field of ["routeIds", "obtainRouteIds"])
        if (record[field]?.some((id) => !routeIds.has(id)))
          throw Error("Broken companion route");
    }
  }
}
export function getBuildIds(stages, equipment = []) {
  return [
    ...stages.flatMap((stage) => [
      `${stage.id}-obtained`,
      `${stage.id}-applied`,
      ...(stage.optional ? [`${stage.id}-skipped`] : []),
    ]),
    ...equipment.map((item) => item.id),
  ];
}
export function getAcquisitionEdits(stages, completed, changedId) {
  return stages
    .filter(
      (stage) =>
        stage.obtainRouteIds.includes(changedId) &&
        stage.obtainRouteIds.every((id) => completed.has(id)) &&
        !completed.has(`${stage.id}-obtained`),
    )
    .map((stage) => ({ id: `${stage.id}-obtained`, checked: true }));
}
export function getBuildStatus(stage, completed) {
  if (stage.optional && completed.has(`${stage.id}-skipped`)) return "skipped";
  if (completed.has(`${stage.id}-obtained`))
    return completed.has(`${stage.id}-applied`) ? "done" : "ready";
  return "missing";
}
export function getNextBuildSteps(stages, completed) {
  const pending = stages.filter((stage) =>
    ["ready", "missing"].includes(getBuildStatus(stage, completed)),
  );
  return [
    ...pending.filter((stage) => getBuildStatus(stage, completed) === "ready"),
    ...pending.filter(
      (stage) => getBuildStatus(stage, completed) === "missing",
    ),
  ].slice(0, 3);
}
