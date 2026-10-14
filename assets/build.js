// Acquisition semantics retained from the MIT-licensed Hell Is Us companion.
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
