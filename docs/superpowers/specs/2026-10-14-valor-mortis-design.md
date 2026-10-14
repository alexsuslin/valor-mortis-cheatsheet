# Valor Mortis companion design

Date: October 14, 2026

The user approved adapting the existing Hell Is Us companion after reviewing the research findings and proposed feature set. This specification records that scope for implementation. The written specification still requires review under the active brainstorming workflow.

## Purpose

Build a practical companion to use while playing Valor Mortis: follow a chronological route, remember return visits, protect important choices, and track equipment and achievements. Preserve the familiar Hell Is Us experience, including Russian and English, mobile support, and progress transfer.

The [research audit](../../research.md) supplies the initial evidence and identifies conflicting launch information. The companion must remain useful while those conflicts are unresolved. It must not present a partly documented route as independently verified 100% completion.

## Scope

Adapt the existing static companion rather than introduce a new application framework. Preserve its five views: Current, Walkthrough, Achievements, My build, and Tips. Add source information through an About section and contextual links.

Include all 11 campaign chapters, documented return visits, and the 20 named side quests. Represent weapons, Transmutations, Ambers, healing upgrades, maximum-level materials, story checkpoints, and bosses at their relevant route positions. Include the 39-entry achievement catalog after checking platform wording and availability.

Every named quest must have either a sourced completion route or an explicit incomplete-coverage notice. Unknown locations and unresolved completion instructions must remain outside the actionable completion denominator. A player must never be instructed to check off an invented step.

The deliverable is a working local website with tests, documentation, and static hosting support. Public repository creation, deployment, account integrations, and recurring source updates are outside this implementation scope.

## Experience

### Walkthrough

Organize route sections by chapter, region, and lantern. Preserve ability-gated revisits at appropriate progression points. Provide search across both languages, chapter and category filters, warning filters, hide completed, and section and overall progress.

Each actionable step contains a short instruction, recognizable English terminology, Russian wording, relevant warnings, and a source link. Detailed third-party directions and images remain on their original sites. Write concise original summaries within applicable source-use limits; add independent evidence where the route needs more detail.

Categories are story, boss, quest, Amber, weapon, Transmutation, healing, material, key item, and revisit. A step can have multiple categories. One checkbox may represent one action with several rewards; it must not inflate unique-item totals.

The full route contains spoilers, as in the reference companion. State that clearly near the route entry point. Current reduces the amount of future content visible without promising a separate spoiler-free mode.

### Current

Let the player select a chapter and step, move backward or forward, and return to the first unfinished step. Show relevant route instructions, warnings, upgrade opportunities, tips, and linked achievements together.

Checking a step leaves the current selection in place. Current and Walkthrough edit the same completion record. Route navigation from another view clears filters that would hide the destination.

### Achievements

Track unlocks manually and independently from route progress. Checking linked prerequisites never claims the game awarded an achievement. Show related route steps, requirements, source links, and warnings.

Use explicit platform availability rather than deriving Steam totals by subtracting the PS5 platinum. The research found a completion achievement on Steam as well. Preserve platform wording differences when supported, and identify mirrored or provisional descriptions.

### My build

Provide a progression workbook for weapons, powers, healing, and selected Amber combinations. Distinguish acquisition, upgrade application, and current equipment. Do not copy the Hell Is Us rage/grief build or its equipment rules.

Start with general progression and the documented Shield material reservation. Present Amber combinations as playstyle suggestions, not tested optimal builds. Surface the flask restriction when discussing Butcher's Carnage. Do not import numerical demo balance data as release-version facts.

Use route-linked acquisition only when completing that exact route action unambiguously grants the item. Never mark unrelated pickups complete through a build checkbox. Equipment selection remains manual.

### Tips and sources

Include short combat reminders, return-visit dependencies, resource decisions, and achievement preparation. Relevant tips appear in Current; general advice remains in Tips.

The source section explains review dates, coverage, translation provenance, and unresolved contradictions. Contextual links let a player inspect the evidence without hunting through a bibliography.

### Shared presentation

Retain the reference's restrained field-guide layout, light/dark themes, keyboard access, reduced-motion behavior, and touch-friendly controls. Use Valor Mortis branding and an appropriate muted accent palette. No external fonts, analytics, or backend are required.

Language and theme changes preserve all progress. Russian wording that has not been verified against localization remains identified as a convenience translation, with English names available for matching and search.

## Content and evidence model

Keep JSON as the content source. Separate route, achievement, build, tips, and terminology records, with shared source identifiers where appropriate.

Each route entry has a permanent semantic ID, bilingual title and instruction, chapter/region/lantern context, categories, source references, and reviewed date. Source numbering is display metadata only: corrections must not rename persistent IDs.

Warnings distinguish four consequences: achievement lockout, quest failure, lost reward, and temporary access restriction. Evidence status is a separate field: corroborated, single-source, or conflicting. Being optional does not imply being missable.

Known conflicts requiring explicit treatment:

- Reserve a Quintessential Transmutation Material for Shield level 5; qualify the available-material count as documented at launch.
- Place The Choir warning before leaving the prison. Its missability concerns quest completion rather than a trophy.
- Warn against shooting the captives in Mummy and Daddy; leave successful completion coverage provisional until supported.
- Flag Laudanum's conditional duplicate reward and the disagreement between guides.
- Separate unique Amber ownership from duplicate pickup/upgrades. Reconcile the 28/29-name discrepancy from records and retain the unknown Glass Soldier duplicate as a coverage note.
- Distinguish postgame cleanup from temporary travel restrictions and the nonreturnable prison. Do not assert the disputed travel cutoff as verified.

An unavailable or unknown entry must not become a permanently impossible checkbox. The interface displays coverage separately from progress. Progress means completed included actions, not proven completion of every possible game activity.

## Application structure

Use HTML, CSS, browser ES modules, and static JSON. Adapt the existing rendering, pure filtering/progress logic, storage, and transfer modules where they fit. Keep game-specific content out of generic progress and persistence functions.

Maintain one application state for route checks, achievement checks, build state, current step, language, theme, and saved view preferences. Derived counters and related-step displays read from that state. Separate renderers serve the five views.

Give Valor Mortis its own application identifier, localStorage keys, backup marker, transfer signature, and append-only transfer ID catalog. Hell Is Us state must neither load nor be overwritten, even when both sites share an origin. Preserve the MIT notice for reused reference code.

Keep exported progress as versioned JSON. Import validates structure, size, identifiers, preferences, and known record IDs before offering replacement. Cancelled or invalid imports leave existing state untouched. An older compatible backup can omit optional state and use documented defaults.

QR/link transfer encodes the same progress snapshot in the URL fragment and generates the QR locally. The receiver reviews and explicitly applies the snapshot. Remove the consumed fragment, and explain that anyone with the link can read that snapshot. Links are manual transfers, not synchronization.

## Failure behavior

If storage is unavailable or corrupt, preserve usable in-memory progress and show a clear persistence notice. If content fails to load or validate, show a retryable error rather than an empty checklist claiming completion.

Use text-safe rendering for content and strict validation for imported state. Reject foreign-game backups and invalid transfer versions. An unsupported clipboard API should leave a selectable transfer link and JSON export available.

Content updates retain stable IDs. New actions receive new IDs, and transfer positions are appended rather than reordered. Retired IDs are ignored safely on import; unknown future transfer positions produce an update-required message rather than silently changing checks.

## Verification and delivery

Automated data checks cover bilingual completeness, unique IDs, valid categories, review dates, source references, and cross-links among views. Count progress from included actionable records rather than published headline totals.

Behavioral tests cover combined filters, warning types, independent achievement progress, route/build acquisition semantics, rejected foreign-game saves, invalid imports, current-step restoration, and transfer round trips.

Browser checks cover route interactions, all views, language/theme switching, reload persistence, import confirmation/cancellation, transfer application, storage failure, keyboard use, mobile overflow, and hosting below a repository subpath. Inspect desktop and mobile presentation visually.

Provide local run, test, build, and static hosting instructions. Report any remaining game-content uncertainties separately from software verification results. No completion claim should imply that provisional launch information was verified through a personal playthrough.
