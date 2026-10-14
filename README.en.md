# Valor Mortis field guide

**English** · [Русский](./README.md)

**Website:** [alexsuslin.com/valor-mortis-cheatsheet](https://alexsuslin.com/valor-mortis-cheatsheet/) · **Repository:** [alexsuslin/valor-mortis-cheatsheet](https://github.com/alexsuslin/valor-mortis-cheatsheet)

A browser-local companion to Valor Mortis, adapted from the [Hell Is Us checklist](https://github.com/alexsuslin/hellisus-cheatsheet). Follow a route, protect important choices, and keep your current step, equipment and achievements together.

## Included

- 152 actionable checks across 11 chapters and 61 location/return-visit sections.
- 20 named quest records, including one explicitly partial quest route.
- 39 manually tracked achievements with Steam, PS5 and Xbox eligibility.
- Current, Walkthrough, Achievements, My build, and Tips views.
- 12 build milestones, nine equipment marks, and nine reminders.
- English/Russian switching, light/dark themes, search, chapter/category/warning filters, and hide completed.
- Browser-local saves, JSON backup/import, and QR/link transfer without an account or server.

**Spoilers:** the route reveals story, boss, quest and pickup information. Russian wording is a convenience translation unless its provenance says otherwise. English names remain available for searching.

## Coverage

This is a launch companion reviewed on October 14, 2026, not a claim of independently verified 100% completion. Counters measure included actions, not unique collectibles. Some quest steps summarize several interactions; open the linked illustrated source for the full route.

Six coverage notes explain conflicting Amber totals, the unknown Glass Soldier duplicate, incomplete Mummy and Daddy outcome instructions, the disputed travel cutoff, a possible extra Oathbound flask, and patch-related chest changes. Unknown locations are not impossible checkboxes. Quest failure, lost reward, achievement lockout, and temporary access warnings are distinguished.

Use the **Sources & coverage** panel and contextual source links. [Research](./docs/research.md) records the initial audit and its source map. Demo statistics and invented locations are not used to fill gaps.

## Run locally

Install Node.js 22 or newer, then:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4174/**. Use the server: opening the HTML file directly restricts browser modules and JSON loading.

```sh
npm test
npm run check
npm run build
npm run test:browser
```

Browser tests use installed Microsoft Edge on Windows. On Linux/macOS, install Chromium once with `npx playwright install chromium`. Tests run their own server on port 4181. Development uses 4174, separate from the reference project's default port.

To preview the production build under a repository path:

```sh
node scripts/serve.mjs --dist --subpath
```

Open **http://127.0.0.1:4174/valor-mortis-cheatsheet/**. Stop another server using port 4174 first, or set the `PORT` environment variable to a free port.

## Progress and transfers

Save state uses `valor-mortis-checklist-v1`, separate from Hell Is Us. Achievement unlocks remain manual. Checking an exact weapon pickup can mark its build acquisition, but never its upgrade application or current equipment. Unchecking a route step does not remove already acquired gear.

JSON export preserves the checked records, selected step, language, theme and active view. Import previews the number of records and requires **Apply snapshot** before replacing existing progress. Cancelled, malformed, oversized and foreign-game imports leave the current save unchanged. Reset also requires confirmation.

**Transfer / QR** creates a snapshot link. Its progress is encoded in the fragment after `#`, which is not sent with the page request. QR generation is local. Anyone holding the link can read the snapshot; there is no automatic synchronization. Create a new link after making changes. The receiving page previews before applying and removes the consumed fragment so reload cannot repeat an import. Clipboard or QR failures leave a selectable link and JSON export available.

Local browser storage is tied to the exact origin. A different port, browser, hostname or device has a different save. Use a transfer or export before moving. If storage becomes unavailable, keep the tab open and export the in-memory progress.

## Static hosting

`npm run build` writes only public HTML, assets and data to [dist/](./dist/). The [GitHub Actions workflow](./.github/workflows/check.yml) runs formatting, unit/data tests and browser tests before publishing this directory to GitHub Pages. Pushes to `main` deploy automatically; pull requests and other branches run checks without deploying. Pages uses the account's existing `alexsuslin.com` domain. No separate DNS or CNAME change is needed for this project.

Each build versions local JavaScript, CSS and JSON references from their contents. Reloading after a release fetches matching assets without clearing progress.

## Content maintenance

- [Route and warnings](./data/guide.json): permanent IDs, sections, quest links, evidence and coverage notes.
- [Achievements](./data/achievements.json): platform availability and route prerequisites.
- [Build workbook](./data/build.json) and [tips](./data/tips.json): acquisition, application, equipment and reminders.
- [Terminology](./data/terminology.json): translation provenance.
- [Transfer catalog](./assets/transfer-catalog.js): append-only positions. Never reorder, remove, or reuse positions; [the baseline fixture](./tests/fixtures/transfer-v1-ids.json) protects old links.

Changing wording preserves an ID. Adding a genuinely different action requires a new ID. Retired checks are safely filtered when importing; future unknown transfer bits require an updated companion. Keep source review dates honest, keep unresolved locations outside the progress denominator, and rerun the data/link tests after content edits.

## Credits

The route and warnings use concise original summaries linked to PowerPyx, platform-list mirrors on Exophase, publisher advice on Xbox Wire, PC Gamer and Insider Gaming. Individual records contain their source URLs. Article text and screenshots are not redistributed wholesale.

Reusable state, QR-transfer concepts, static tooling and the field-journal presentation come from the MIT-licensed Hell Is Us companion, reference commit `413452643f544244146b4dad5c5faecc3bb20cc1`. Its copyright notice is preserved in [LICENSE](./LICENSE). The vendored QR generator has its own [MIT notice](./assets/vendor/LICENSE).

This fan project is unaffiliated with One More Level, Lyrical Games, or the guide publishers. Game names and characters belong to their respective owners.
