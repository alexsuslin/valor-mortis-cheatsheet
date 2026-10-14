export function resolveCurrentItem(items, requestedId, completed) {
  return (
    items.find((item) => item.id === requestedId) ??
    items.find((item) => !completed.has(item.id)) ??
    items[0]
  );
}
