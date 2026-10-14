# Verification and implementation decisions

Verified locally on Windows with Node.js 24.20.0 and installed Microsoft Edge, October 14, 2026. The project supports Node.js 22 or newer; the Linux CI workflow has been added but has not run on a hosted repository.

## Results

- `npm run check`: clean Biome check.
- `npm test`: 28 passing unit/data tests.
- `npm run build`: production static build succeeds with versioned relative assets.
- `npm run test:browser`: 24 passing Edge browser tests.
- `git diff --check`: no whitespace errors.
- Visual inspection: desktop light theme, Current with the Shield warning, and mobile Russian dark theme.

The checks cover data references and translations, same-origin separation from Hell Is Us, independent achievements, build acquisition history, Current selection, filters, reload persistence, invalid input, cross-tab edits, failed storage recovery, JSON replacement consent, actual QR decoding, clipboard/QR fallback, future transfer positions, root/subpath serving, and asset version changes.

## Independent review

A separate reviewer inspected the branch from `55e5129` through `f0fefb6` without changing the checkout. The review found two Important persistence defects and three lower-severity interface/data discrepancies. All were reproduced and fixed in one pass:

1. Invalid or unreadable cross-tab saves now preserve usable in-memory progress and show the persistence notice. The regression also exports and checks the preserved snapshot.
2. Automatically acquired build marks are now retained as pending edits until successfully saved. Unchecking the route pickup does not erase acquisition; later explicit edits to the acquisition mark take precedence.
3. Future catalog entries produce a specific instruction to update the companion, while preserving the current save.
4. Quest achievement categories use ordinary quest wording, separately from quest-failure warnings.
5. The Monster Hunt reward is included in the material filter without changing its stable action ID.

The last three findings were treated as required completion fixes because they affected specified recovery guidance, the meaning of risk labels, and discovery of a scarce upgrade reward. The final full suite passed after the fixes. There was no second independent review; regression tests verified the changes. No review findings were deferred.

The reviewer declined to certify independent in-game accuracy, official localization, or unresolved launch-source conflicts. These remain explicit limitations: neither this review nor the test suite substitutes for a complete playthrough. See [research](./research.md) and the website's six coverage notes.

## Decisions made during implementation

- Worked on `feat/valor-mortis-companion` in the shared project folder. No extra worktree was created without a user preference. This protects the main branch but does not isolate the working directory from concurrent edits.
- Used PowerShell equivalents for execution bookkeeping because the available Bash entry was a launcher and the sandbox process helper failed. The task sequence, regressions and decisions were kept in a scoped ledger; the costs are reduced portability of that temporary bookkeeping and reliance on committed tests/history for later audit.
- Reused state semantics, static tooling, QR concepts, licensing and visual conventions from Hell Is Us. Focused renderers use the new evidence schema rather than retaining game-specific DOM assumptions. Browser tests cover the resulting interaction changes.
- Added an exact-path Git `safe.directory` entry for `D:/work/vallor-mortis-cheatsheet`. The initial sandbox account owned the newly initialized repository metadata, and Windows denied changing that owner. The exception trusts only this known project and lets the user's ordinary Git commands work; no wildcard trust was added.

There was one corrected checkpoint mistake: fixture tests passed, but the first real catalog validation caught a duplicate church return-visit ID. The ID was fixed and the full catalog rerun before UI work proceeded. Subsequent commit steps were explicitly gated on test exit status.

## Delivery state

After the local implementation review, the user authorized creating a new GitHub repository, pushing the project and connecting GitHub Pages. The publishing workflow checks and builds before deploying `main`; other branches and pull requests do not deploy. The account already uses `alexsuslin.com` for project Pages sites.

Repository: [alexsuslin/valor-mortis-cheatsheet](https://github.com/alexsuslin/valor-mortis-cheatsheet). Website: [Valor Mortis field guide](https://alexsuslin.com/valor-mortis-cheatsheet/).

The production preview can still be served with `node scripts/serve.mjs --dist --subpath` at `http://127.0.0.1:4174/valor-mortis-cheatsheet/`. See [English usage](../README.en.md) or [Russian usage](../README.md).
