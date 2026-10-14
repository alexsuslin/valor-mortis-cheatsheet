# Valor Mortis Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver a local, bilingual Valor Mortis playthrough companion with the familiar Hell Is Us views, sourced game content, reliable progress, and portable saves.

**Architecture:** Adapt the reference HTML/CSS/ES-module application. Keep content in JSON, validate it before rendering, and retain one shared state across the five views. Isolate Valor Mortis identity and progress from the reference game.

**Tech Stack:** Browser JavaScript modules, static JSON, Node.js 22 or newer, Node test runner, Biome, and Playwright. Reuse the reference's locally bundled QR generator and preserve its license. No production package dependencies.

**Spec:** [Approved design](../specs/2026-10-14-valor-mortis-design.md). [Research and source audit](../../research.md).

## Global Constraints

- Preserve its five views: Current, Walkthrough, Achievements, My build, and Tips.
- Language and theme changes preserve all progress.
- Being optional does not imply being missable.
- Unknown locations and unresolved completion instructions must remain outside the actionable completion denominator.
- Checking linked prerequisites never claims the game awarded an achievement.
- Equipment selection remains manual.
- No external fonts, analytics, or backend are required.
- Preserve the MIT notice for reused reference code.
- Public repository creation, deployment, account integrations, and recurring source updates are outside this implementation scope.

## Review Focus

1. Both games hosted on one origin: opening or importing either game's data must not overwrite or reinterpret the other game's progress. Tested in Tasks 1 and 6.
2. A source correction changes ordering or removes a pickup: existing progress and transfer positions remain stable, and missing information does not become an impossible checkbox. Tested in Tasks 2 and 6.
3. Storage fails after several successful edits: subsequent edits remain visible in memory and can still be exported. Tested in Tasks 1 and 7.
4. A player follows a cross-link while search and warning filters hide the destination: the destination becomes visible without changing completion. Tested in Tasks 3 and 5.
5. A shared link is damaged, from a newer catalog, or too large for QR generation: the existing save survives and a usable error or JSON fallback appears. Tested in Task 6.

## Reference and file responsibilities

Reference checkout: `D:/work/hellisus-cheatsheet`. Its initial inspected revision is the commit titled `fix: make progress links safe to share through Telegram`. Record its exact hash before copying. Copy only the files needed below; do not copy its Git history, game data, generated output, dependencies, or save fixtures wholesale.

Use the current repository as the destination. At execution, follow the worktree skill to check isolation before code changes. Do not modify the reference checkout.

| Files | Responsibility |
| --- | --- |
| `index.html`, `assets/styles.css`, `assets/favicon.svg` | Shell, navigation, responsive presentation, Valor Mortis identity |
| `assets/config.js`, `assets/theme-init.js` | Application identity and initial theme |
| `assets/guide.js`, `assets/model.js` | Content validation, searchable/filterable route, progress and backup validation |
| `assets/storage.js` | Saved state, merging checkbox edits, degraded storage behavior |
| `assets/app.js`, `assets/route-view.js` | Startup/state/events and route rendering respectively |
| `assets/achievements.js`, `assets/achievement-view.js` | Platform eligibility, linked prerequisites, manual achievement tracking |
| `assets/build.js`, `assets/build-view.js`, `assets/current-view.js` | Build progress, Tips, manual equipment marks, and Current |
| `assets/i18n.js`, `assets/build-i18n.js`, `assets/current-i18n.js`, `assets/transfer-i18n.js` | Complete RU/EN interface wording |
| `assets/transfer.js`, `assets/transfer-catalog.js`, `assets/transfer-view.js`, `assets/vendor/*` | Local share encoding, stable ID positions, confirmation UI, QR rendering |
| `data/{guide,achievements,build,tips,terminology}.json` | Game records, evidence, and bilingual content |
| `scripts/{serve,build}.mjs`, `package.json`, `package-lock.json`, `biome.json`, `playwright.config.js` | Reproducible local development and static verification |
| `tests/*.test.mjs`, `tests/browser/*.spec.js`, `tests/fixtures/*` | Domain, persistence, transfer, serving, and browser checks |
| `README.md`, `README.en.md`, `LICENSE`, `.gitignore`, `.github/workflows/check.yml` | Usage, attribution, excluded build files, and checks without deployment |

Keep the reference view factories and callback contracts unless a task below specifies an extension. Extract route rendering because the reference application coordinator already owns substantial unrelated rendering logic; avoid a general renderer framework.

## Shared content contracts

`Text` means `{ en: string, ru: string }`. A `Source` is `{ id, name, url, kind, reviewed }`, where kind is `official`, `guide`, `platform-mirror`, or `community`; reviewed is an ISO calendar date. Source records live in each data file's `sources` array and resolve within that file.

`Evidence` is `{ status, sourceIds, reviewed }`, with status `corroborated`, `single-source`, or `conflicting`. A warning is `{ kind, text: Text, evidence: Evidence }`, with kind `achievement`, `quest`, `reward`, or `access`.

`guide` contains `version: 1`, `updated`, `sources`, `chapters`, `sections`, `quests`, and `coverageNotes`. Chapters have stable `chapter-01` through `chapter-11` IDs and bilingual titles. A section has `{ id, chapterId, title: Text, region: Text, lantern: Text, items }`. A route item has `{ id, title: Text, description: Text, categories, evidence, warnings, searchTerms }`. Optional `questId` and `amberId` link factual identities; `amberId` describes the unique item, not its duplicate pickup.

All section items are actionable. Unknown instructions live only in `coverageNotes`, whose records contain `{ id, title: Text, description: Text, evidence, chapterId? }` and have no checkbox. Quest records contain `{ id, title: Text, routeIds, coverage }`, with coverage `documented` or `partial`. Every one of the 20 researched quests has a record; partial quests also have a corresponding coverage note. No empty fictional completion steps.

Categories are `story`, `boss`, `quest`, `amber`, `weapon`, `transmutation`, `healing`, `material`, `key`, and `revisit`. New route IDs use `vm-` plus semantic context, for example `vm-battlefield-bottomless-well`; they never depend on source numbering or array position.

State retains the reference's shared `completed: Set<string>`, `currentItemId`, language, theme, and hide-completed preference. It adds `activeView` with the five view names. Save snapshots use arrays. Completion IDs cover route actions, achievements, build milestones, tip acknowledgements, and manually equipped items; route counters use route IDs only.

## Task 1: Establish isolated application state and reusable logic

**Files:** Create `assets/config.js`; adapt `assets/model.js`, `assets/storage.js`, `assets/theme-init.js`; create `tests/model.test.mjs`, `tests/storage.test.mjs`; copy/adapt package configuration, lockfile, Biome configuration, `.gitignore`, and `LICENSE`.

**Interfaces:**

- `config.js`: `APP_ID = "valor-mortis-cheatsheet"`, `STORAGE_KEY = "valor-mortis-checklist-v1"`, `BACKUP_VERSION = 1`, `MAX_BACKUP_BYTES = 262144`, `TRANSFER_PREFIX = "#vm-progress="`.
- Preserve `loadState(storage) -> {state, available}`, `saveState(storage, state) -> boolean`, `saveProgress(storage, state, change, deriveEdits) -> {state, available, derivedEdits}`, and `rebaseCompletion(savedIds, edits) -> string[]`.
- `parseBackup(text, knownIds) -> snapshot` rejects foreign app/version, oversized UTF-8 input, invalid completion arrays, and invalid preference values. It filters unknown IDs and deduplicates checks. Absent `activeView` defaults to `walkthrough`; absent language/theme remain omitted for browser/system defaults, and absent current selection remains unset. Accept only the five known `activeView` values. Current route-only validation is completed in Task 5.

- [x] Add tests first for foreign-game rejection, maximum input size, invalid preference types, unknown/duplicate IDs, cancelled replacement at the caller boundary, corrupted storage, and storage throwing on reads or writes. Use the reference's storage tests where portable.

  Core assertion for `rejects backups from the other game`:
  ```js
  assert.throws(() => parseBackup(JSON.stringify({
    app: "hellisus-cheatsheet", version: 1, completed: []
  }), new Set()));
  assert.equal(STORAGE_KEY, "valor-mortis-checklist-v1");
  ```
- [x] Run `node --test tests/model.test.mjs tests/storage.test.mjs`; confirm meaningful failures before implementation.
- [x] Adapt the state modules and identity constants. The initial theme script is a classic script: keep its literal storage key and add a test that it matches the exported constant instead of introducing module-loading flash.
- [x] Pin reference tool versions in the copied lockfile, updating only package identity. Run `npm ci`, the two test files, and `npm run check`; expect exit 0.
- [x] Commit as `feat: isolate Valor Mortis progress and backups`.

## Task 2: Build the sourced route catalog and coverage validation

**Files:** Create `assets/guide.js`, `data/guide.json`, `data/terminology.json`, `tests/guide.test.mjs`, and `tests/fixtures/guide.json`; update `docs/research.md` only when new evidence resolves or adds a conflict.

**Interfaces:**

- `validateGuide(guide) -> void` throws descriptive errors for duplicate IDs, invalid chapters/categories, missing translations, invalid HTTPS sources/review dates, broken quest links, or unactionable records in sections.
- `getRouteItems(guide) -> RouteItem[]` flattens in chapter/section order and adds `chapterId`, `sectionId`, region/lantern search terms without mutating JSON records.
- `getGuideCoverage(guide) -> { actionable, notes, documentedQuests, partialQuests }` counts records, not source headline totals.
- Terminology entries contain `{ en, ru, status, sourceIds }`; status is `platform-mirror`, `community`, or `unverified`. No automatic claim of official localization.

- [x] Write fixture tests that reject missing Russian instructions and broken quest links, accept a partial quest with a coverage note, and assert that one action plus one unknown-location note produces `{ actionable: 1, notes: 1 }`.

  For `unknown locations do not increase completion totals`, the fixture contains one documented quest, one actionable step, and one unrelated coverage note:
  ```js
  assert.deepEqual(getGuideCoverage(fixture), {
    actionable: 1, notes: 1, documentedQuests: 1, partialQuests: 0
  });
  assert.equal(getRouteItems(fixture).length, 1);
  ```
- [x] Run `node --test tests/guide.test.mjs`; confirm the missing-validator failure.
- [x] Implement the three guide functions and populate all 11 chapters from the research sources. Reopen source pages as necessary. Write original concise instructions, including ability-gated returns, with evidence beside each action. Include all 20 quest identities; explicitly mark incomplete successful routes such as Mummy and Daddy as partial until corroborated.
- [x] Add contract assertions for the Shield reservation, The Choir deadline, captives warning, conditional Laudanum duplicate, and unknown Glass Soldier duplicate. Put unknown content only in coverage notes. Verify these assertions against named IDs in the newly authored data, not a fixed assumed total of collectibles.
- [x] Run guide tests and formatting checks; require 11 chapter IDs, 20 quest IDs, valid evidence on every action, and no unresolved references. Commit as `feat: add sourced Valor Mortis route and coverage notes`.

## Task 3: Deliver the bilingual walkthrough and static shell

**Files:** Adapt `index.html`, `assets/styles.css`, `assets/favicon.svg`, `assets/app.js`, `assets/i18n.js`, `scripts/serve.mjs`, `scripts/build.mjs`, `playwright.config.js`; create `assets/route-view.js`, `tests/site.test.mjs`, `tests/browser/checklist.spec.js`, `tests/browser/coverage.spec.js`.

**Interfaces:**

- `filterItems(items, filters, completed) -> RouteItem[]` supports `query`, `chapterId`, `category`, `warningKind`, and `hideCompleted` with AND semantics. `warningKind` is `all`, `any`, or a warning kind.
- `getProgress(items, completed) -> {completed,total,percent}` only receives actionable records.
- `createRouteView({guide,state,t,onToggle,onSelect}) -> {render(),showItem(id)}` owns route/navigation DOM. `showItem` opens the section and clears obstructing filters without changing checks.
- `app.js` owns loading/validation, state transitions, preference application, and callbacks. HTTP/JSON/validation failure produces the localized load error plus retry control, without a false 100% indicator.

- [x] Add model assertions for combined bilingual search/chapter/warning filters. Add browser scenarios for chapter 11 navigation, one checkbox updating both counters, keyboard operation, RU/EN preservation, hidden completed items, and coverage notes having no checkboxes.

  In `coverage is informative rather than checkable`, render one fixture coverage note:
  ```js
  await expect(page.locator('[data-coverage-note]')).toHaveCount(1);
  await expect(page.locator('[data-coverage-note] input[type="checkbox"]')).toHaveCount(0);
  ```
- [x] Run the model tests to see the unsupported filters fail. Run browser tests after the smallest server/shell fixture exists; require failures caused by absent interactions rather than a missing executable.
- [x] Adapt the shell and route view. Generate chapter navigation from JSON, replace all three-act assumptions, and render warnings/evidence safely with text nodes. Include the spoiler notice and source/coverage explanation.
- [x] Adapt serving and building for both `/` and `/valor-mortis-cheatsheet/`. Preserve relative, versioned imports. Use development port 4174 and browser-test port 4181 to avoid the reference companion. Hide unfinished view controls until their tasks connect them.
- [x] Run `npm test`, `npm run check`, `npm run build`, and `npx playwright test checklist coverage`. Inspect a 390-pixel mobile layout and a 1440-pixel desktop layout. Commit as `feat: add bilingual Valor Mortis walkthrough`.

## Task 4: Add platform-aware achievement tracking

**Files:** Create `data/achievements.json`; adapt `assets/achievements.js`, `assets/achievement-view.js`, `assets/i18n.js`, `assets/app.js`, `index.html`; create `tests/achievements.test.mjs`, `tests/browser/achievements.spec.js`.

**Interfaces:**

- Each achievement has `{id,title:Text,description:Text,hint:Text,platforms,category,route:{itemIds},evidence,warnings}`; optional per-platform descriptions and PS5 trophy tier remain display metadata.
- `platforms` explicitly lists supported `steam`, `ps5`, and/or `xbox`. Do not add unverified Epic availability.
- Preserve `getRelatedItems(achievement, items)` and `filterAchievements(achievements, filters, completed)`, replacing PS5-only exclusion with explicit platform eligibility.
- Preserve `createAchievementTracker({achievements,items,state,t,onToggle,onRoute})` and its existing returned methods after inspecting callers. Include achievements in shared `knownIds`.

- [x] Test a completion achievement present on Steam and PS5, platform-specific wording, prerequisite checks not unlocking the achievement, and broken route references failing data validation.

  For `completion achievement is eligible on both platforms`, use an achievement fixture with both platform IDs and no prerequisite filters:
  ```js
  for (const platform of ["steam", "ps5"]) {
    assert.equal(filterAchievements([completion], { platform }, new Set()).length, 1);
  }
  ```
- [x] Run `node --test tests/achievements.test.mjs`; confirm the legacy platform assumption fails.
- [x] Author the 39-entry catalog from current platform lists, with mirrored wording labeled. Link explicit relevant route IDs; avoid category-wide links that imply an unrelated action is required. Add independently sourced hints without copying entire trophy guides.
- [x] Connect manual unlocks, platform filtering, route links, and independent totals. A filtered cross-link opens its route destination and preserves all checks.
- [x] Run achievement and guide tests, then `npm run build` and `npx playwright test achievements`. Commit as `feat: track Valor Mortis achievements by platform`.

## Task 5: Connect build, equipment, tips, and Current

**Files:** Create `data/build.json`, `data/tips.json`; adapt `assets/build.js`, `assets/build-view.js`, `assets/current-view.js`, their i18n modules, `assets/app.js`, `index.html`; create `tests/build.test.mjs`, `tests/current.test.mjs`, `tests/browser/current.spec.js`, `tests/browser/loadout.spec.js`.

**Interfaces:**

- Preserve stages `{id,title,obtain,apply,obtainRouteIds,routeIds,optional,chapterId,evidence}` with bilingual prose. Stage completion IDs remain `${id}-obtained`, `${id}-applied`, and optional `${id}-skipped`.
- Add `build.equipment` records `{id,title:Text,kind,evidence}`, using stable `equipment-` IDs. Their shared-state checks mean manually marked equipped; they do not alter acquisition or assert the game's slot capacity.
- Extend `getBuildIds(stages, equipment = []) -> string[]` with equipment IDs. Preserve `getAcquisitionEdits(stages,completed,changedId)`, `getBuildStatus(stage,completed)`, and `getNextBuildSteps(stages,completed)`.
- Tips use `{reminders,sources}`; each reminder has `{id,title:Text,description:Text,routeIds,evidence}`. Eliminate the reference's timeloop-specific schema and controls.
- `resolveCurrentItem(items, requestedId, completed) -> RouteItem | undefined` returns a known route item, then first incomplete, then first item. It never selects an achievement/build ID or coverage note.

- [x] Test ownership/application/equipment independence, one-way acquisition from an exact pickup, unchecking a route pickup preserving acquired gear, ready upgrades remaining visible after Current advances, and invalid/retired current IDs recovering safely.

  For `current selection never resolves to an achievement`, supply one route item and its completed state:
  ```js
  const item = { id: "vm-first-action" };
  assert.equal(resolveCurrentItem([item], "achievement-finish", new Set([item.id])), item);
  assert.equal(resolveCurrentItem([], undefined, new Set()), undefined);
  ```
- [x] Run `node --test tests/build.test.mjs tests/current.test.mjs`; confirm failures for absent contracts.
- [x] Populate the equipment progression, healing milestones, Shield reservation, and source-backed Amber tradeoffs. Mark suggestions as playstyle choices. Remove rage/grief, timeloop, and unverified numerical-demo assumptions.
- [x] Connect Current and all remaining view controls to shared state. Previous/Next changes selection only; checking an action keeps it selected. Persist `activeView`, while explicit navigation hashes take precedence on load. Both build renderers share acquisition logic; current equipment remains manually marked.
- [x] Run build/current unit tests, then `npm run build` and `npx playwright test current loadout`. Test invalid current IDs from both storage and import. Commit as `feat: add build workbook and current-step companion`.

## Task 6: Add safe JSON and QR/link transfer

**Files:** Adapt `assets/transfer.js`, `assets/transfer-view.js`, `assets/transfer-i18n.js`, `assets/app.js`; create `assets/transfer-catalog.js`, `tests/transfer.test.mjs`, `tests/fixtures/transfer-v1-ids.json`, `tests/browser/transfer.spec.js`; copy licensed QR assets into `assets/vendor/`.

**Interfaces:**

- Preserve `createTransferUrl(address,state) -> string` and `parseTransferHash(hash,knownIds) -> snapshot | null`.
- Use `#vm-progress=1.<hex-payload>.<crc32>`. Payload header: byte 0 language/theme bits, byte 1 view index (`walkthrough,current,achievements,build,tips`), bytes 2–3 current route position plus one (zero means none), followed by completion bits in permanent catalog order.
- Include equipment and all other progress IDs in the catalog. Reject reserved header bits, out-of-range view/current positions, checksum failures, unknown future set bits, nonhex or odd-length input, and hashes over 8192 characters. Ignore retired known positions after validation.
- Use a dedicated failure for foreign `#progress=` links rather than interpreting Hell Is Us bit positions. Unrelated navigation hashes return null.
- Preserve the reference transfer-view callbacks, adjusting consumed-prefix detection and snapshot preview for the new identity and active view.

- [x] Write tests for each language/theme/view combination, empty and fully checked state, Unicode-safe JSON size checks, equipped marks, retired IDs, malformed payloads, foreign links/backups, and catalog growth. Keep a frozen first-release catalog prefix fixture to prevent reorder regressions.

  In `foreign links never reuse catalog positions`:
  ```js
  assert.throws(() => parseTransferHash("#progress=2.000000.ff41d912", knownIds));
  assert.equal(parseTransferHash("#current", knownIds), null);
  assert.deepEqual(transferIds.slice(0, frozenIds.length), frozenIds);
  ```
- [x] Run `node --test tests/transfer.test.mjs`; confirm failure before adapting the encoder/parser.
- [x] Implement the new header and fragment marker, build the append-only catalog, and connect JSON and link import to the same validated replacement flow. Remove consumed fragments after processing; cancellation and errors preserve the save.
- [x] Add browser tests for preview/apply/cancel, clipboard unavailability, QR encoding/decoding, large payload QR failure with copy-link/JSON fallback, and links received by an older catalog. Check no progress request is sent to a server.
- [x] Run transfer tests and `npm run build` then `npx playwright test transfer`. Commit as `feat: transfer Valor Mortis saves with JSON and QR links`.

## Task 7: Verify the complete companion and document delivery

**Files:** Create/adapt `README.md`, `README.en.md`, `.github/workflows/check.yml`, `tests/browser/updates.spec.js`, `tests/browser/resilience.spec.js`; update prior files only to fix identified failures.

**Interfaces:** Existing `npm test`, `npm run check`, `npm run build`, `npm run test:browser`, and `npm run dev` commands. CI checks and builds only; publishing remains a documented manual next step.

- [x] Add browser scenarios for storage becoming unavailable after successful edits, malformed data with retry, overlapping tabs merging independent checks, a current-step deep link under active filters, and a new build retaining progress while loading newly versioned resources.

  In `malformed content never renders successful completion`, intercept the guide request with invalid JSON before navigation:
  ```js
  await page.route("**/data/guide.json*", route => route.fulfill({ body: "{" }));
  await page.goto(".");
  await expect(page.locator("#load-error")).toBeVisible();
  await expect(page.locator("#progress-count")).toHaveText("—");
  ```
- [x] Run the targeted tests and record any failures before fixing them. Check save export still includes in-memory edits when persistence fails.
- [x] Audit all content references, review dates, translations, chapter/quest coverage, and source-use limits. Clearly distinguish incomplete quest/duplicate coverage from tested app behavior. Inspect every view in both languages/themes at mobile and desktop widths, keyboard focus, overflow, and reduced motion.
- [x] Write bilingual run/backup/transfer/coverage documentation, source attribution, and manual static hosting instructions. Retain upstream license attribution. Add CI using Node 22, reproducible install, lint, unit checks, build, and Chromium browser checks without deployment permissions.
- [x] Run `npm run check`, `npm test`, `npm run build`, and `npm run test:browser`; require exit 0 for each. Run `git diff --check`. Verify the built site at `/valor-mortis-cheatsheet/` and record actual test counts in the handoff.
- [ ] Follow the execution skill's final independent review requirement, resolve substantive findings, rerun affected checks, and commit as `docs: verify and document Valor Mortis companion`.
- [ ] Deliver the local preview address, actual coverage, passed checks, and remaining content uncertainties. Do not claim deployment or in-game verification.

## Plan self-review

The seven tasks cover all five views, independent progress/equipment semantics, translation and evidence, unknown-content treatment, static serving, error handling, and transfer. Each Review Focus item has a corresponding test task. The shared schema and interfaces above override incompatible Hell Is Us assumptions; reusable mechanics retain their original contracts where possible.

Recommended execution: **Native**, implementing the tasks in this session with one independent review at the end. These tasks share the same content IDs and state contracts; keeping implementation context together should reduce repeated setup. Native execution was approved. Implementation and verification are complete; independent review and final delivery remain.
