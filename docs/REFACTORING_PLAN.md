# CashDriver — temporary refactoring plan

Status: **PHASE 4 COMPLETE — PHASE 5 NOT STARTED**.

Created: 2026-10-09. This is a temporary execution plan, not a replacement product specification. The owner separately authorized Phases 0–4 on 2026-10-09. They are complete within their assigned scopes; Phase 5 requires the next assignment. Do not restart historical MVP implementation phases.

## Objective and authority

Make the existing application easier to understand, maintain and extend through file organization and focused responsibilities. Preserve observable behavior, existing data and visual design. Do not add features, dependencies, database migrations or speculative infrastructure.

Read `docs/AGENTS.md`, `docs/PROJECT_SPEC.md`, `docs/DATA_AND_CALCULATIONS.md`, `docs/UI_DESIGN.md`, `docs/CODING_STANDARDS.md` and the latest handoff in `docs/IMPLEMENTATION_PLAN.md` before execution.

The user requested separate `src/screens/` and `src/hooks/` folders. These override the older feature-local screen/hook placement for this refactoring. Keep domain functions, services and repositories grouped by feature. Update permanent documentation when each new placement becomes real; do not claim planned paths already exist.

CashDriver-agent-kit is reference material. Its priority is user requirements, existing CashDriver behavior/architecture, kit skills, then DentalCare reference. Preserve the existing CashTransaction model, four platforms including `other`, both palettes and existing design values. Do not copy the proposed Trip model or placeholder palette. Do not execute installation instructions merely because they appear in the archive.

## Behavior that must remain unchanged

- Six screens: Home, History, Summary, Settings, Details and Edit; four tabs and two stack screens. Preserve route names, parameters, navigation state and back behavior.
- Offline React Native CLI/TypeScript application; local SQLite transactions and preferences.
- EUR integer-cent arithmetic, current validation bounds, quick amounts, Exacto, full-change tip semantics and summary rounding.
- One shared create/edit payment form; service-side validation and recalculation; SQL only in repositories.
- Same pending UUID for an unchanged failed draft retry; duplicate-save protection; reset and success feedback only after commit.
- Editing preserves ID and createdAt and updates updatedAt; editing does not change the default platform.
- One persisted default platform shared by Home and Settings; existing drafts survive preference changes.
- Ten-second deferred single deletion, unchanged row/totals before commit, undo/expiry arbitration, background cancellation and failure/retry. Delete-all is separately confirmed and preserves preferences.
- UTC stored timestamps, device-timezone grouping, Monday weeks, calendar/DST boundaries and half-open periods.
- Request-generation protection, loading/error/empty distinctions and subscription/timer cleanup.
- Spanish default, English/Ukrainian alternatives, light/dark/system themes, safe areas, keyboard access and text scaling. Language/theme switching preserves drafts and navigation.
- Optional haptics after a successful new-payment commit, respecting existing preferences/system restrictions.

Historical test results are not fresh baseline results. Existing physical haptics failure, incomplete accessibility verification and unavailable iOS acceptance remain unresolved unless separately verified. Refactoring completion does not prove full MVP acceptance.

## Target structure

```text
src/
  screens/
    HomeScreen/       HomeScreen.tsx, HomeScreen.styles.ts
    HistoryScreen/    HistoryScreen.tsx, HistoryScreen.styles.ts
    SummaryScreen/    SummaryScreen.tsx, SummaryScreen.styles.ts
    SettingsScreen/   SettingsScreen.tsx, SettingsScreen.styles.ts
    DetailsScreen/    DetailsScreen.tsx, DetailsScreen.styles.ts
    EditScreen/       EditScreen.tsx, EditScreen.styles.ts
  hooks/
    app/             useLocalClock.ts, useDataChanges.ts
    transactions/    usePaymentForm.ts, useTransactions.ts, useCreatePayment.ts
    summary/         useDailySummary.ts, usePeriodSummary.ts
  components/        PaymentForm/, DailySummary/, DeletionNotice/,
                     TransactionLoadState/
  ui/                ActionButton/, AppText/, Card/, ChoiceGroup/,
                     MoneyInput/, ScreenContainer/, TabIcon/
  navigation/        AppNavigator.tsx, AppTabBar/, navigationTypes.ts, routes.ts
  providers/         PersistenceProvider/, LanguageProvider/,
                     ThemeProvider/, DeletionProvider/
  constants/         platforms.ts, theme/
  features/
    transactions/    domain types, calculations, service, repository,
                     deletionConstants.ts
    summary/         periods.ts, summary.ts
    settings/        preferences service/repository, defaults,
                     haptics adapter, installed-version adapter
  database/          connection, serialization, SQLite interfaces, migrations
  i18n/              translations.ts, formatting.ts
  app/               persistence.ts, changeNotifier.ts
```

This tree lists intended responsibility locations, not unused scaffolding to generate. Add a `.interface.ts` beside a component only for nontrivial public props. Keep static StyleSheet definitions beside components; runtime palette/inset/state styles remain dynamic. Preserve current token values and theme resolution; one Theme facade must not freeze runtime light/dark colors. Provider accessor hooks may remain beside their context to avoid circular dependencies.

## Subagent workflow

The main agent owns integration, scope, documentation, verification and commits. Use at most three subagents concurrently, within available limits:

| Role | Bounded assignment | Write access during a phase |
| --- | --- | --- |
| Structure implementer | Assigned screens/UI/navigation file moves, import updates and style extraction | Only explicitly assigned, disjoint files |
| Hooks implementer | Assigned hook/provider extraction and responsibility cleanup | Only explicitly assigned, disjoint files |
| Behavior reviewer | Read requirements and phase diff; inspect money, persistence, retry, lifecycle, navigation and behavioral coverage | Read-only |

These are task roles, not new application modules or persistent chat creation. Do not launch implementation subagents during planning. Use one implementer plus the reviewer when tasks share files; parallel implementation is allowed only with explicit nonoverlapping ownership. Reserve shared entry points, navigation wiring and documentation for the main agent unless ownership is reassigned.

Before dispatch, specify the current phase, exact files, preserved contracts, allowed test updates and stop condition. No agent may start a later phase, change business rules, install dependencies, commit, or edit another agent's files. Reviewers report concrete findings and coverage gaps; review is not evidence that tests or devices were run. Main agent fixes confirmed findings before the phase gate.

## Common phase gate and commit policy

For every implementation phase:

1. Inspect working-tree changes and preserve unrelated work. Confirm prerequisites and assign file ownership.
2. Make focused changes; update affected test imports and native test-entry imports without weakening assertions or mocking away real behavior.
3. Run typecheck, lint and the complete Jest suite. Reuse adequate coverage; add meaningful regression tests only for changed behavior or an uncovered extraction risk.
4. Obtain read-only subagent review; resolve confirmed regressions and run the checks affected by subsequent fixes.
5. Run relevant native/UI checks where the phase changes presentation, providers or navigation. Record unavailable checks as NOT VERIFIED. Do not install on a physical device, alter system settings or use production transaction data without appropriate authorization.
6. Review the diff, check whitespace and update this plan's progress with actual results, unresolved gates and changed files.
7. Commit only the phase's files after required available checks pass and no confirmed regression remains. Do not commit a failing phase or include unrelated changes. An unavailable mandatory phase check leaves the phase VERIFICATION PENDING, not COMPLETE; report the blocker.

Commands from the current project:

```text
npm run typecheck
npm run lint
npm test -- --runInBand --no-cache --watch=false
git diff --check
```

Use the documented command-scoped Windows TEMP/TMP workaround only if the existing environment restriction recurs, and report actual failures/retries. Do not suppress checks or patch the test runtime. After verification, stage explicit paths and commit; never use blanket staging. The current ignore rules exclude docs: explicitly force-add only intended documentation files when needed, without changing .gitignore. Do not push, publish or create releases as part of this plan.

Phase 0 has no source change: commit its verified documentation handoff if it passes. The planning request itself does not require application tests or an implementation commit.

## Phases

### Phase 0 — baseline and rules reconciliation

Scope: inspect the current tree, actual tests and latest acceptance handoff; run fresh baseline checks; map every existing file to its intended destination. Read the archive and reconcile applicable skills against CashDriver before installation.

Record pre-existing failures separately. Add/merge kit instructions and skills only when refactoring execution is authorized, preserving actual CashDriver requirements; do not copy kit source examples. Phase 0 integrates reconciled skills in docs/agent_skills/ and explicitly links them from docs/AGENTS.md to retain the documentation-only write scope. This is not automatic .agents/skills discovery. Update permanent documentation to explain the incremental placement transition and precedence. Missing archive access is a blocker to integrating its rules, not permission to invent their content.

Subagents: behavior reviewer inspects baseline coverage and protected contracts; main agent owns instructions/documentation. No source refactoring.

Gate: fresh baseline reported, conflicts resolved or explicitly recorded, migration map defined, existing owner/native gates retained.

Commit: `docs: establish CashDriver refactoring baseline and rules`.

### Phase 1 — six separate screen components

Move Home, History, Summary and Settings into `src/screens/<Name>Screen/`. Split OperationScreens into DetailsScreen and EditScreen, keeping LoadedEdit's lifecycle and stable record key intact. Remove the obsolete TransactionScreens re-export when consumers are migrated.

Extract static screen styles beside each screen. Update navigator, component tests and native acceptance-entry imports atomically. Preserve route keys, screen component identity, initial filters and all callbacks; do not redesign UI.

Subagents: structure implementer owns screen files; behavior reviewer checks navigation, edit-draft preservation and deletion interactions. Main agent owns navigation/test-entry integration.

Gate: common checks pass; six distinct screen entry components; navigation/back and create/edit/history/summary/settings tests retain behavior.

Commit: `refactor: separate CashDriver screens`.

### Phase 2 — dedicated hooks and focused orchestration

Move existing hooks into `src/hooks/` by responsibility. Update imports across source/tests. Preserve dependencies, refs, generation counters, cancellation, timers and cleanup.

Extract Home's pending-operation/save orchestration only if it meaningfully clarifies the screen. Preserve ID reuse, current haptics preference, commit timing and reset semantics. Keep pure money/date functions outside hooks. Do not merge daily/period/transaction loaders merely because their code looks similar: their refresh contracts differ.

Subagents: hooks implementer owns assigned hooks; behavior reviewer checks retries, stale responses, blur callbacks, defaults and subscription cleanup.

Gate: common checks pass; screens compose hooks; save/refresh behavior and draft preservation remain covered.

Commit: `refactor: organize hooks and screen orchestration`.

### Phase 3 — shared UI and feature components

Move universal primitives into `src/ui/<Name>/`; organize feature-facing components under `src/components/<Name>/`. Extract styles and nontrivial props. Extract coherent PaymentForm/history-row/summary UI sections only where readability or actual reuse warrants it.

Preserve one create/edit form, accessibility/test identifiers, touch targets, wrapping, safe areas, keyboard interactions and dynamic theme styles. Keep icon geometry local when it is not a reusable design token. Do not create a configurable universal component framework.

Subagents: structure implementer owns assigned component folders; behavior reviewer checks shared-form contracts, disabled/loading/error states and existing UI assertions.

Gate: common checks pass; focused visual checks of affected narrow/wide layouts, text scaling and keyboard; no intentional visual redesign.

Commit: `refactor: organize shared UI and feature components`.

### Phase 4 — navigation and providers

Move navigation into `src/navigation/`, centralize route constants while retaining exact route string values and typed params. Move Providers into `src/providers/` with accessor hooks beside their context where appropriate.

Keep App's provider order, initialization/retry behavior and persisted preferences before first main render. Preserve DeletionProvider lifetime and global notice placement. Keep app/persistence composition and changeNotifier responsibilities explicit. Avoid circular imports and ambiguous barrel exports.

Subagents: structure and hooks implementers may work only on explicitly disjoint folders; main agent owns App.tsx and cross-folder integration. Reviewer checks provider lifetime, bootstrap, deletion and route state preservation.

Gate: common checks pass; app boot, route/back, theme/language switching, undo across tabs and provider cleanup verified.

Commit: `refactor: isolate navigation and providers`.

### Phase 5 — constants and domain readability

Consolidate platform identifiers/display metadata into one typed module while retaining all four current IDs, labels and their existing language behavior. Move theme tokens into `src/constants/theme/` and expose consistent static tokens without replacing the reactive theme provider. Preserve values; do not apply DentalCare placeholders.

Keep domain calculations, service and repository contracts feature-grouped. Simplify nested conditions and give intermediate results descriptive names where useful. Preserve SQL constraints, schema version and historical migration literals; runtime constant consolidation must not rewrite existing migration semantics. Avoid moving every helper into a global utils folder or adding interfaces/factories without need.

Subagents: structure implementer owns constants/import migration; reviewer checks unchanged money invariants, platform handling, theme values and database semantics. Main agent owns shared integration.

Gate: common checks pass; one runtime platform metadata source; no changed calculations, stored fields, migrations, dependency versions or palette values.

Commit: `refactor: centralize constants and clarify domain code`.

### Phase 6 — final verification and permanent documentation

Inspect the complete refactoring diff for duplicated modules, obsolete paths, cycles, stale comments and unused compatibility exports. Update permanent docs to describe actual responsibilities and source-to-service-to-repository flow; retain truthful historical implementation handoffs rather than rewriting past results.

Run final common checks and an Android native build using existing configuration. Verify affected payment/history/edit/undo/delete-all/summary/settings flows and theme/language draft preservation through available native acceptance. Record iOS and physical/accessibility limitations honestly; do not waive existing gates. Keep fixtures isolated from production SQLite.

Subagents: read-only structure/UI reviewer and independent behavior reviewer, with the main agent resolving findings and recording actual executions.

Gate: all required available checks pass, no confirmed refactoring regression, permanent docs match the final tree. Refactoring code review may be finished with explicitly pending native acceptance; full cross-platform verification remains NOT COMPLETE until its required checks pass.

Commit: `docs: finalize CashDriver refactoring verification and architecture`.

### Phase 7 — remove the temporary plan

Prerequisites: Phase 6 handoff recorded; the authorized refactoring scope is finished and any remaining verification limitations are durably recorded in permanent documentation. Do not delete this plan while it contains the only record of unresolved work.

Move the concise final changelog, actual verification results, commits, remaining decisions and native limitations into docs/IMPLEMENTATION_PLAN.md. Delete only docs/REFACTORING_PLAN.md. No application change.

Gate: permanent record contains the useful handoff; review documentation diff/links and whitespace. Reuse Phase 6 code checks when source is unchanged; do not claim a new run.

Commit: `docs: remove completed temporary refactoring plan`.

## Progress and handoff template

| Phase | Status | Verification | Commit |
| --- | --- | --- | --- |
| 0 | COMPLETE | typecheck/lint PASS; Jest 20 suites / 196 tests PASS | 05f5a3a |
| 1 | COMPLETE | typecheck/lint PASS; Jest 20 suites / 196 tests PASS; Android bundle PASS | 867bcc2 |
| 2 | COMPLETE | typecheck/lint PASS; Jest 21 suites / 198 tests PASS | c50b5af |
| 3 | COMPLETE | typecheck/lint PASS; Jest 21 suites / 198 tests PASS; Android bundle PASS; selected emulator width/text/keyboard checks | 75205e6 |
| 4 | COMPLETE | typecheck/lint PASS; Jest 21 suites / 198 tests PASS; Android bundle PASS; selected emulator boot/back/preferences/cross-tab undo checks | Hash reported after commit |
| 5 | NOT STARTED | NOT RUN | — |
| 6 | NOT STARTED | NOT RUN | — |
| 7 | NOT STARTED | NOT RUN | — |

After each phase record: changed files/responsibilities; hooks/coverage reused or added; subagent ownership/findings/resolution; exact commands/results; native checks and limitations; unresolved decisions; commit hash after commit; prerequisites for the next phase. A commit hash need not be amended into its own commit; record it in the next handoff and user report.

Allowed statuses: NOT STARTED / IN PROGRESS / VERIFICATION PENDING / COMPLETE / BLOCKED. Do not mark tests PASS from old logs or mark unavailable checks successful. Stop at the assigned phase boundary unless the user's execution instruction authorizes multiple phases.

## Phase 0 handoff — 2026-10-09 (historical; commit 05f5a3a)

Baseline commit: 1d3a2bd; working tree was clean for tracked files before this phase. The pre-existing temporary plan and several documentation files were ignored/untracked, so git status alone did not inventory them. Only explicitly listed docs files are included in this phase commit; ignore rules remain unchanged.

Changed documentation: docs/AGENTS.md (correct product-spec path, phase authority, kit precedence and skill links); docs/CODING_STANDARDS.md (current-versus-target placement and hooks transition); docs/README.md (plan/skill index); three adapted docs/agent_skills/*/SKILL.md files; this temporary plan (status, migration map, actual results); docs/IMPLEMENTATION_PLAN.md (permanent concise handoff). No src, tests, native files, configs, dependencies, application code or production SQLite changes.

Archive reconciliation: read the actual CashDriver-agent-kit.zip instructions/skills/README. Its global Trip/utils/repositories examples are not adopted; CashTransaction and feature-local domain/service/repository contracts stay. The provisional Theme palette is not copied; reactive light/dark handling and current values remain. Existing es/en/uk localization and four platform IDs are authoritative. Local skills are documentation copies linked explicitly, not an automatic .agents installation.

| Fresh command | Actual result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0 |
| npm test -- --runInBand --no-cache --watch=false (sandbox default TEMP) | Did not run tests: Windows realpath EPERM |
| Same Jest with command-scoped workspace TEMP/TMP and TZ=UTC (sandbox) | Did not run tests: same realpath EPERM |
| Same Jest with those environment variables through approved execution | PASS: 20 suites / 196 tests, 12.599 s; standard experimental Node SQLite warning |

No test/runtime/config patches or suppressions were used. Existing coverage was reused because no application behavior changed; no hooks or tests added. Native builds/device/visual checks were not rerun for this documentation-only baseline.

Read-only baseline reviewer confirmed six screens and protected behavior coverage. Migration risks retained: LoadedEdit key and one-time edit loading; Home pending UUID/draft comparison and latest haptics ref; app-scoped DeletionProvider and global footer; distinct daily/period/transaction refresh contracts; original provider order; production/Jest/native entry import updates together. Reviewer did not execute tests. Final read-only documentation review independently compared the map against all 57 src files with no omissions/extras and found no blocking defect. git diff --cached --check passed for the intended documentation; existing LF/CRLF normalization notices do not indicate a whitespace failure.

Unchanged gates: physical SM-A528B tactile haptics FAIL (cause unresolved); complete accessibility/system-restriction and iOS native checks NOT VERIFIED; final identifiers/signing/release-version alignment remain owner decisions; historical dependency-audit limitation remains. Full MVP remains NOT COMPLETE. These gates do not block the documentation baseline and are not waived.

Next assignment: Phase 1 only, six screen components/styles and atomic imports; no hooks/provider/constants moves ahead of their phases. Commit this handoff only after final review/whitespace checks; stop before Phase 1.

## Phase 0 migration map — original src files

All paths below are relative to the repository. This records the Phase 0 baseline, not the current file inventory. Phase 1 screen moves/removal of the obsolete re-export and Phase 2 hook moves are now complete; other moves remain planned. Keep remaining original files until their phase updates all consumers atomically. New styles/props/constants files are created only when their phase needs them.

| Current file | Destination / action | Phase |
| --- | --- | --- |
| src/app/AppNavigator.tsx | src/navigation/AppNavigator.tsx | 4 |
| src/app/AppTabBar.tsx | src/navigation/AppTabBar/AppTabBar.tsx | 4 |
| src/app/changeNotifier.ts | src/app/changeNotifier.ts | Keep |
| src/app/navigationTypes.ts | src/navigation/navigationTypes.ts | 4 |
| src/app/persistence.ts | src/app/persistence.ts | Keep |
| src/app/PersistenceProvider.tsx | src/providers/PersistenceProvider/PersistenceProvider.tsx; keep context accessor beside provider | 4 |
| src/app/useDataChanges.ts | src/hooks/app/useDataChanges.ts | 2 |
| src/app/useLocalClock.ts | src/hooks/app/useLocalClock.ts | 2 |
| src/components/ActionButton.tsx | src/ui/ActionButton/ActionButton.tsx | 3 |
| src/components/AppText.tsx | src/ui/AppText/AppText.tsx | 3 |
| src/components/Card.tsx | src/ui/Card/Card.tsx | 3 |
| src/components/ChoiceGroup.tsx | src/ui/ChoiceGroup/ChoiceGroup.tsx | 3 |
| src/components/MoneyInput.tsx | src/ui/MoneyInput/MoneyInput.tsx | 3 |
| src/components/PendingFeature.tsx | src/components/PendingFeature/PendingFeature.tsx | 3 |
| src/components/ScreenContainer.tsx | src/ui/ScreenContainer/ScreenContainer.tsx | 3 |
| src/components/TabIcon.tsx | src/ui/TabIcon/TabIcon.tsx | 3 |
| src/database/connection.ts | src/database/connection.ts | Keep |
| src/database/migrations.ts | src/database/migrations.ts | Keep |
| src/database/README.md | src/database/README.md | Keep |
| src/database/serializedConnection.ts | src/database/serializedConnection.ts | Keep |
| src/database/sqlite.ts | src/database/sqlite.ts | Keep |
| src/features/settings/appVersion.ts | src/features/settings/appVersion.ts | Keep |
| src/features/settings/confirmationHaptics.ts | src/features/settings/confirmationHaptics.ts | Keep |
| src/features/settings/preferencesRepository.ts | src/features/settings/preferencesRepository.ts | Keep |
| src/features/settings/preferencesService.ts | src/features/settings/preferencesService.ts | Keep |
| src/features/settings/settingsDefaults.ts | src/features/settings/settingsDefaults.ts | Keep |
| src/features/settings/SettingsScreen.tsx | src/screens/SettingsScreen/SettingsScreen.tsx | 1 |
| src/features/summary/DailySummary.tsx | src/components/DailySummary/DailySummary.tsx | 3 |
| src/features/summary/periods.ts | src/features/summary/periods.ts | Keep |
| src/features/summary/summary.ts | src/features/summary/summary.ts | Keep |
| src/features/summary/SummaryScreen.tsx | src/screens/SummaryScreen/SummaryScreen.tsx | 1 |
| src/features/summary/useDailySummary.ts | src/hooks/summary/useDailySummary.ts | 2 |
| src/features/summary/usePeriodSummary.ts | src/hooks/summary/usePeriodSummary.ts | 2 |
| src/features/transactions/deletionConstants.ts | src/features/transactions/deletionConstants.ts | Keep |
| src/features/transactions/DeletionNotice.tsx | src/components/DeletionNotice/DeletionNotice.tsx | 3 |
| src/features/transactions/DeletionProvider.tsx | src/providers/DeletionProvider/DeletionProvider.tsx; keep context accessor beside provider | 4 |
| src/features/transactions/history.ts | src/features/transactions/history.ts; import platform labels from central metadata, retain filtering/grouping | 5 |
| src/features/transactions/HistoryScreen.tsx | src/screens/HistoryScreen/HistoryScreen.tsx | 1 |
| src/features/transactions/HomeScreen.tsx | src/screens/HomeScreen/HomeScreen.tsx | 1 |
| src/features/transactions/money.ts | src/features/transactions/money.ts | Keep |
| src/features/transactions/OperationScreens.tsx | src/screens/DetailsScreen/DetailsScreen.tsx + src/screens/EditScreen/EditScreen.tsx; retain LoadedEdit identity | 1 |
| src/features/transactions/payment.ts | src/features/transactions/payment.ts | Keep |
| src/features/transactions/PaymentForm.tsx | src/components/PaymentForm/PaymentForm.tsx | 3 |
| src/features/transactions/TransactionLoadState.tsx | src/components/TransactionLoadState/TransactionLoadState.tsx | 3 |
| src/features/transactions/transactionRepository.ts | src/features/transactions/transactionRepository.ts | Keep |
| src/features/transactions/TransactionScreens.tsx | Remove re-export after all screen imports migrate | 1 |
| src/features/transactions/transactionService.ts | src/features/transactions/transactionService.ts | Keep |
| src/features/transactions/types.ts | src/features/transactions/types.ts; runtime platform metadata moves to src/constants/platforms.ts, retain domain types | 5 |
| src/features/transactions/usePaymentForm.ts | src/hooks/transactions/usePaymentForm.ts | 2 |
| src/features/transactions/useTransactions.ts | src/hooks/transactions/useTransactions.ts | 2 |
| src/i18n/formatting.ts | src/i18n/formatting.ts | Keep |
| src/i18n/LanguageProvider.tsx | src/providers/LanguageProvider/LanguageProvider.tsx; keep context accessor beside provider | 4 |
| src/i18n/translations.ts | src/i18n/translations.ts | Keep |
| src/theme/resolveTheme.ts | src/theme/resolveTheme.ts | Keep |
| src/theme/systemBars.ts | src/theme/systemBars.ts | Keep |
| src/theme/ThemeProvider.tsx | src/providers/ThemeProvider/ThemeProvider.tsx; keep context accessor beside provider | 4 |
| src/theme/tokens.ts | src/constants/theme/; preserve values and Palette contract, expose static tokens | 5 |

Root App.tsx, index.js, __tests__/ (including native entries) and native bridge/config files keep their existing locations. Update only affected imports in their assigned phase. Configurations, package manifests/lockfile, native identifiers, dependencies and SQLite schema are not refactoring targets. PendingFeature is retained during component organization; deleting unused placeholders requires proving no consumers and no behavioral impact. src/theme/resolveTheme.ts and systemBars.ts retain their existing responsibilities/locations; only token placement migrates.

## Phase 1 handoff — 2026-10-09 (historical; commit 867bcc2)

Status: **COMPLETE for structural screen refactoring**; Phase 2 NOT STARTED. Baseline commit 05f5a3a; initial working tree clean.

- Four standalone screens moved into src/screens/HomeScreen/, HistoryScreen/, SummaryScreen/ and SettingsScreen/; OperationScreens split into DetailsScreen/ and EditScreen/. Each folder has one exported screen entry; Edit keeps its private LoadedEdit component and stable record key.
- Five static StyleSheet.create definitions moved unchanged into adjacent .styles.ts. Edit has no original static styles, so no unused EditScreen.styles.ts was created. Runtime palette/state styles remain in the existing JSX.
- AppNavigator imports all six entries directly. Old screen files and TransactionScreens re-export removed. Search found no direct old screen imports in tests/native entries: they already import App/AppNavigator, so test and native entry source changes were unnecessary. Typecheck includes native .tsx entries.
- Hooks, Providers, services, repositories, calculations, translations, theme tokens, routes and package/config/native files are unchanged. docs/CODING_STANDARDS.md and the permanent implementation handoff describe the actual screen placement.

Subagents: phase1_screens owned only screen/style creation and old-screen removal, including existing Prettier formatting. Main agent owned AppNavigator/import integration, verification, documentation and commit. Independent phase1_review inspected bodies/styles, imports, edit identity and deletion/navigation interactions; no confirmed regression. Reviewers did not execute checks.

| Actual fresh verification | Result |
| --- | --- |
| npm run typecheck | PASS |
| npm run lint | PASS |
| npm test -- --runInBand --no-cache --watch=false, command-scoped TEMP/TMP and TZ=UTC through approved execution | PASS: 20 suites / 196 tests, 9.111 s; standard Node SQLite experimental warning |
| One-off TypeScript AST comparison against HEAD baseline (7 screen/private function declarations; all 5 style initializers) | PASS: function/JSX bodies and static styles unchanged, including after formatting |
| node node_modules/react-native/cli.js bundle --platform android --dev false --entry-file index.js --bundle-output node_modules/.cache/cash-driver/phase1.android.bundle --assets-dest node_modules/.cache/cash-driver/assets --max-workers 2 | PASS: production entry and relocated screen/style graph resolve; 19 assets copied |

Existing coverage reused without assertion/mocking changes: payment retries and draft preservation, navigation/back/language/theme, edit immutable ID/date/default, deletion/undo, summaries and settings. No new behavior, hooks or tests introduced. Formatting only followed the test run; the AST check confirms function/style equivalence. Metro retained its known ReactNativeFeatureFlags export-resolution warning and NO_COLOR/FORCE_COLOR notices; no suppression or dependency change.

No native build/device/visual acceptance was rerun: this phase changes file placement/imports only, and all rendered JSX/style values match the baseline. Android bundle success is not native UI/build acceptance. Existing physical haptics FAIL, complete accessibility/system restrictions NOT VERIFIED, and iOS native NOT VERIFIED remain. Full MVP remains NOT COMPLETE.

Commit after final documentation review and git diff --cached --check: refactor: separate CashDriver screens. Next assignment is Phase 2 hooks only; do not move Providers/UI/constants ahead of schedule.

## Phase 2 handoff — 2026-10-09

Status: **COMPLETE for hook organization/orchestration refactoring**; Phase 3 NOT STARTED. Baseline commit 867bcc2; initial working tree clean.

- Moved useLocalClock/useDataChanges into src/hooks/app/, usePaymentForm/useTransactions into src/hooks/transactions/, and useDailySummary/usePeriodSummary into src/hooks/summary/. Removed the original files rather than leaving parallel implementations/re-exports. Imports resolve to the same existing domain functions, services and Providers.
- Extracted Home's pending-operation/save callback into src/hooks/transactions/useCreatePayment.ts with explicit services and hapticsEnabled inputs. Home now composes the hook and form. Keep an unchanged failed draft's pending UUID, reset pending only after save succeeds, read the latest haptics choice through a ref and retain callback dependency [services]. Pure arithmetic remains outside hooks.
- Updated five screen consumers, shared PaymentForm and DailySummary type consumers, and the two direct hook-test imports. Native acceptance entries already consume App and need no path changes; typecheck includes them. Edit preserves LoadedEdit identity and one-time loading. Daily/period/transaction loaders remain separate with unchanged refresh contracts.
- Existing Provider accessor hooks stay beside their context. No Providers/navigation/UI/constants moves, SQL/schema/dependency/native configuration changes or new product behavior.

Subagents: phase2_hooks owned only the six hook moves/internal imports; main agent owned useCreatePayment, consumer/test imports, tests, documentation and integration. Independent phase2_review compared bodies, retry/reset/feedback sequencing, edit contracts, stale imports and dependency graph: no confirmed issue. Reviewer did not execute tests.

Verification: npm run typecheck **PASS**; npm run lint **PASS**; full Jest with approved workspace TEMP/TMP and TZ=UTC **21 suites / 198 tests PASS**, 10.204 s. One-off TypeScript AST comparison confirms all six moved hooks unchanged apart from imports. New useCreatePayment.test.tsx covers haptics selection changing both ways during delayed save, no record/feedback before the gate and latest feedback after real SQLite commit. The adapter boundary is spied; storage/validation remain real. Reused existing Home/default/duplicate/failure-retry, edit, stale-request, blur, subscription, DST, summary and deletion tests; assertions were not weakened.

Production Android Metro bundle through index.js **PASS**, using node_modules/.cache/cash-driver/phase2.android.bundle and existing assets directory, max-workers 2. This checks the relocated module graph; known ReactNativeFeatureFlags export-resolution/color notices and Node SQLite experimental warning remain. No runtime/config patches or warning suppressions. Whitespace check and final documentation review precede the commit.

No native build/device/visual acceptance was rerun: no UI/style changes. Android bundle is not native acceptance. Physical tactile haptics FAIL, outstanding accessibility/system restrictions and iOS native NOT VERIFIED, existing owner identifiers/signing/version decisions and dependency-audit limitation remain. Full MVP remains NOT COMPLETE.

Commit: refactor: organize hooks and screen orchestration; hash reported after creation. Next assignment is Phase 3 shared UI/components only.

## Phase 3 handoff — 2026-10-09

Status: COMPLETE for assigned structural scope; baseline Phase 2 commit c50b5af. Seven primitives moved into src/ui/<Name>/ and five feature-facing components into src/components/<Name>/, including PendingFeature. Nine static style modules and six nontrivial props interfaces extracted; runtime theme/inset styles and simple inline props retained. Consumer/two test imports updated, obsolete component files removed. No additional UI sections or business changes. CODING_STANDARDS.md records actual current placements; the Phase 0 map remains historical.

Subagents phase3_ui and phase3_components owned disjoint component moves; main agent integrated consumers/tests/documentation and corrected missing spacing/sizing imports exposed by initial checks. Independent phase3_review confirmed unchanged bodies/styles/interfaces after import/format normalization and no remaining issue. Final typecheck/lint PASS; Jest 21 suites / 198 tests PASS, 10.742 s, approved workspace TEMP/TMP and TZ=UTC. Production Android Metro bundle PASS, 19 assets. Existing warnings remain; no test assertions weakened or dependencies/config changed.

Selected emulator observations: light Home/form at 320dp/font 1.0, keyboard opening/dismissal and reachable confirm; Home/form and Summary at 600dp/font 1.5; Home daily values and Summary wrapping at 320dp/font 1.5. No observed clipping in this scope. Used current nativeAjustesEntry via temporary Metro 8083 and isolated cash-driver-ajustes-test.sqlite; no payment saved. Restored original size/font, removed only temporary fixture/host/UI-dump files and own Metro/reverse; production database/Metro preserved. Full all-screen/language/theme/accessibility matrix, native rebuild, iOS and physical haptics were not verified by these checks. Existing tactile FAIL and other owner/native/audit gates remain; full MVP NOT COMPLETE.

Permanent handoff is in IMPLEMENTATION_PLAN.md. Commit: refactor: organize shared UI and feature components; hash reported after creation. Phase 4 requires the next assignment.

## Phase 4 handoff — 2026-10-09

Status: COMPLETE for assigned structural scope; baseline Phase 3 commit 75205e6. Navigation files moved to src/navigation/, exact seven strings centralized in routes with unchanged typed params, AppTabBar organized in its own folder. Static navigation styles and nontrivial AppNavigator props are adjacent. Four Providers/accessors moved to src/providers/<Name>/; Persistence bootstrap styles extracted. App/production/test consumer imports migrated. Provider order, global DeletionProvider outside NavigationContainer/footer after Stack, initialization/retry, async guards/cleanup, drafts and routes remain unchanged. No Phase 5 work, dependencies, configuration, SQL or business changes.

Subagents phase4_navigation and phase4_providers owned disjoint moves; root integrated consumers/docs/checks. Independent phase4_review confirmed function/style equivalence and no stale/missing imports/cycles across 82 src TS/TSX files. Existing behavioral coverage reused; tests import-only with independent route literals preserved. Fresh typecheck/lint PASS; full Jest 21 suites / 198 tests PASS, 10.658 s with approved workspace TEMP/TMP and TZ=UTC. Production Android bundle PASS, 19 assets; existing warnings remain.

Native selected checks used current nativeHistorialEntry and isolated fixture on Metro 8083: boot, English/Dark and draft preservation, Details/Edit/back, cross-tab Settings undo and row preservation, persisted preference restart. Two initial test-script navigation/timing attempts failed and fixture deletion expired normally; corrected script passed without source changes. No production transactions used. Fixture/temporary host/UI-dump removed, own Metro/reverse stopped, production database/Metro preserved. No responsive setting changes or native rebuild; full accessibility/iOS/physical haptics not verified. Historical tactile FAIL and other owner/native/audit gates remain; full MVP NOT COMPLETE.

Permanent handoff and current placements updated in IMPLEMENTATION_PLAN.md and CODING_STANDARDS.md. Commit: refactor: isolate navigation and providers; hash reported after creation. Phase 5 requires the next assignment.
