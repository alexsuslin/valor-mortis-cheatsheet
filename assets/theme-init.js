try {
  const preferences = JSON.parse(
    localStorage.getItem("valor-mortis-checklist-v1"),
  );
  if (preferences && ["light", "dark"].includes(preferences.theme)) {
    document.documentElement.dataset.theme = preferences.theme;
  }
} catch {
  // CSS follows the system preference when saved settings are inaccessible.
}
