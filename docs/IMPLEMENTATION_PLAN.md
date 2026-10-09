# Implementation plan and acceptance checks

## Architecture

```text
src/
  app/                 # bootstrap and navigation
  theme/               # design tokens
  i18n/                # Spanish, English, and Ukrainian UI strings
  components/          # shared primitives
  features/
    transactions/      # types, pure calculations, repository, service, hooks, screens
    summary/           # period boundaries, aggregation, screen
    settings/          # persisted preferences, screen
  database/            # connection and versioned migrations
```

Screens call hooks/services; services validate and derive values; repositories own SQL. Keep form draft local to Inicio. Use a small shared refresh mechanism for mutations and persistent preferences. Choose a SQLite library compatible with the actual React Native version and native architecture; document that choice before adding it. Do not hard-code a stale dependency version from this specification.

## Minimal v1 dependencies

This is a planned stack, not a claim that packages are installed or native compatibility has been verified. Inspect existing dependencies before adding anything; reuse compatible equivalents. Select versions against the actual React Native version, native architecture, and Android/iOS deployment settings, and record the resolved versions in the project lockfile during implementation.

| Purpose | Planned choice | Rule |
| --- | --- | --- |
| Tabs and details/editing stack | `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack` | Reuse existing compatible navigation |
| Native navigation and safe areas | `react-native-screens`, `react-native-safe-area-context` | Follow navigator native setup for both platforms |
| Transactions and preferences | `@op-engineering/op-sqlite` | Preferred SQLite candidate; verify builds, integer bindings, transactions, and migrations before adoption; document an alternative if incompatible |
| UUIDs | `uuid` plus `react-native-get-random-values` when the runtime lacks the required random source | Reuse a verified existing UUID provider; initialize any required polyfill before UUID use |
| Confirmation haptics | `react-native-haptic-feedback` | Use only for supported confirmation feedback; wrap behind a small adapter with safe no-op fallback |

Use React Native built-ins for styles, inputs, lists, switches, dialogs, keyboard handling, and system appearance. Use React state/context for the small shared state; no additional state framework or theme/UI framework is required. Dates and Hoy/Semana/Mes boundaries use built-in Date/Intl with the documented DST tests: no calendar/date-picker or date library is needed because v1 has no date-entry screen. Store preferences alongside transactions in SQLite; do not add a second storage library for them. Use the project's existing Jest, TypeScript, and ESLint setup for checks. Add icon or component-test packages only if an actual implementation need remains; do not install a speculative bundle of libraries.

Official setup references: [React Navigation](https://reactnavigation.org/docs/getting-started/), [safe areas](https://reactnavigation.org/docs/handling-safe-area/), [OP-SQLite](https://op-engineering.github.io/op-sqlite/docs/installation/), [UUID](https://github.com/uuidjs/uuid), [haptic feedback](https://github.com/mkuczera/react-native-haptic-feedback), and [React Native appearance](https://reactnative.dev/docs/appearance).

## Optional visual dependencies

For optional motion, start with existing navigator transitions and React Native animation APIs. If a concrete interaction needs more, `react-native-reanimated` is an optional candidate, with its version-specific supporting dependencies such as `react-native-worklets` only when required. Follow the chosen release's [official setup](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) and compatibility guidance; do not install it automatically or upgrade the app solely for an effect. No additional styling framework is mandatory; optional choices follow CODING_STANDARDS.md. Plan visual foundations in Phase 1, add purposeful feedback with each feature phase, and verify motion and visual consistency in Phase 8.

## Implementation phases

Assign one phase at a time. Read all scope/rule documents before starting; apply CODING_STANDARDS.md in every phase. Inspect completed work and prerequisites rather than recreate it. Install only dependencies needed by the assigned phase. Stop after the phase report; do not start the next phase without a user request. No phases are claimed complete by this document.

| Phase | Scope | Completion gate |
| --- | --- | --- |
| 0 — Project inspection | Inspect existing structure, dependencies, native setup, and checks; map reusable work and missing prerequisites. No implementation changes | Report actual project state, proposed compatible dependencies, Android/iOS verification access, and unresolved decisions |
| 1 — App foundation | Establish native bootstrap, tabs and details/editing routes, Spanish/English/Ukrainian dictionaries and translation accessor, light/dark tokens, system-theme resolution, safe-area containers, reusable UI primitives | Navigation and theme foundation work; type/lint checks pass; native build status recorded separately for Android/iOS. No payment persistence yet |
| 2 — Pure domain logic | Transaction types, money parser, validation, change/tip and quick-value calculations, calendar boundaries and summary arithmetic | Relevant money, invariant, summary, and DST tests pass independently of React Native; no SQL or completed screen flows |
| 3 — Local persistence | SQLite initialization/migrations, repositories/services, UUIDs, transaction writes, theme/language/platform preferences, duplicate protection, refresh mechanism | Create/read/edit/delete and preference tests pass; failures preserve data; native restart persistence is checked per platform. Connect saved theme mode to the foundation |
| 4 — Inicio | Shared payment form, platform selection, change/tip display, confirmation/retry, labeled daily totals | Main payment scenarios pass; one operation per repeated save attempt; draft preserved on failure; success message uses committed amounts |
| 5 — Historial | Filters/grouping, details, edit using shared form, confirmed single deletion and Deshacer | Edit preserves original date; filters work; undo/expiry/background/write-failure checks pass. Owner must define the undo window before implementing deletion |
| 6 — Resumen | Period/platform totals, averages, empty/loading/error states, refresh on mutations/resume/date changes | Aggregates match persisted operations; no double-counted tips; calendar boundaries and refresh behavior verified |
| 7 — Ajustes | Persisted language and theme selectors, shared default platform, haptic setting/adapter, version, storage explanation, confirmed delete-all | Settings survive restart; theme changes preserve drafts; deletion cancel/confirm works; unsupported haptics are safe no-op |
| 8 — Cross-platform acceptance | Run complete acceptance matrix on Android/iOS, visual review against reference, both themes, keyboard, text scaling, accessibility, offline/restart checks; fix defects within scope | Report actual results per platform. Unavailable checks remain NOT VERIFIED; no full MVP completion claim until required checks pass |

Phases 1–7 include checks for their own changes; testing is not deferred to Phase 8. During incomplete phases, unfinished routes must be clearly identified, with no fabricated operations or successful writes. An unavailable iOS environment can leave iOS verification pending while platform-independent work continues; it cannot count as passing iOS acceptance. Failed prerequisites block dependent work until fixed within authorized scope or reported to the user.

At each phase boundary, update a concise progress section in this document with: phase/status, changed files, dependency choices, commands/results, Android/iOS checks, blockers/decisions, and the next phase's prerequisites. Preserve unresolved checks for the next agent. Use NOT STARTED / IN PROGRESS / IMPLEMENTED — VERIFICATION PENDING / COMPLETE / BLOCKED accurately; do not mark a phase complete merely because code was written.

## Progress

For each coding-phase handoff, list tests added/updated or existing coverage reused, custom hooks reused/introduced, and any requested subagent review findings and their resolution. Apply the testing and review rules in CODING_STANDARDS.md; Phase 0 remains read-only inspection.

### Phase 1 — App foundation (2026-10-08)

Status: **IMPLEMENTED — VERIFICATION PENDING**. Phase 0 was rechecked before changes. The results below describe the Phase 1 handoff; current Phase 2 status is recorded separately. Android build and automated foundation checks pass; iOS and the complete native visual/accessibility matrix remain pending.

- `App.tsx` wires the existing SafeAreaProvider to LanguageProvider, ThemeProvider, and AppNavigator. `src/app/` defines four tabs plus native-stack Details/Edit routes. These routes contain explicit unfinished notices, no sample transactions or successful writes. Transaction route parameters are deferred to the real history flow.
- `src/theme/` centralizes the documented light/dark semantic palettes, typography, spacing, radii, and sizing. The additional `contentMaxWidth` token is 640 logical units to constrain readable content on wider screens. `useAppTheme` resolves a session-only mode against the existing reactive React Native `useColorScheme` hook; system/null resolves to light. Status bar text and navigator surfaces use the resolved theme. Foundation transitions are static, including when Reduce Motion is enabled.
- `src/i18n/` provides typed es/en/uk dictionaries, locale mapping, LanguageProvider, and `useTranslation`. Spanish is the initial language independently of device language. Settings provides language/theme foundation previews with an explicit session-only notice; there is no persistence or restart restoration.
- `src/components/` contains themed text, cards, action buttons, wrapping choice groups, safe-area/scroll containers, pending-feature notices, and outline tab symbols drawn with native Views. The custom tab bar lets labels wrap and retains system font scaling. Feature folders hold only foundation screens. `src/database/README.md` reserves Phase 3 responsibilities without initializing storage.
- `tsconfig.json` extends the installed React Native TypeScript config with strict settings inherited and no emit; `package.json` adds `typecheck`. Existing Babel, Metro, ESLint, Jest, React, React Native, and safe-area packages are retained. Android MainActivity initializes RNScreensFragmentFactory; the manifest disables predictive back as required by the navigation setup. Application/bundle identifiers and native naming remain unchanged pending concrete owner values.

Dependencies added (exact versions in package.json/lockfile): `@react-navigation/native` 7.5.0, `@react-navigation/bottom-tabs` 7.20.0, `@react-navigation/native-stack` 7.20.0, `react-native-screens` 4.28.0. Existing safe-area-context remains resolved to 5.10.1. Registry peer requirements and the installed screens Fabric compatibility table were checked against RN 0.87.1 / React 19.2.3 / TypeScript 6.0.3 / New Architecture. No SQLite, UUID, haptics, icon, state, or theme frameworks were added. Android native compilation verifies this dependency set there; iOS compatibility is not a build result.

Verification:

| Check | Actual result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` (`npm run typecheck`) | PASS |
| `node node_modules/eslint/bin/eslint.js . --no-cache` | PASS |
| `node node_modules/jest/bin/jest.js --runInBand --no-cache --watch=false` | PASS: 4 suites, 10 tests |
| `git diff --check` | PASS |
| `android/gradlew.bat -p android :app:assembleDebug --no-daemon --console=plain` | PASS: Gradle 9.4.1, JDK 17.0.18, SDK/build-tools 37, NDK 27.1.12297006; all four configured ABIs; debug APK generated |
| `node node_modules/react-native/cli.js bundle --platform android --dev false --entry-file index.js --bundle-output node_modules/.cache/cash-driver/index.android.bundle --assets-dest node_modules/.cache/cash-driver/assets --max-workers 2` | PASS; dependency warning about the non-exported ReactNativeFeatureFlags subpath remains |
| Android emulator `emulator-5554` | Debug APK installed and launched with project Metro on port 8082; Spanish Inicio and Settings navigation, dark palette, and Ukrainian language selection checked through UI hierarchy and screenshots |
| iOS | **iOS NOT VERIFIED**: Windows host has no Xcode; pods/build/simulator/swipe/back remain pending |

Jest EPERM investigation: the preset computes its default cache directory using native Windows realpath on TEMP. Default sandbox TEMP failed; a workspace-local `node_modules/.cache/cash-driver/tmp` also failed, and a diagnostic confirmed sandbox realpath failed even for the repository root. The same unmodified Jest runtime passed through the approved execution mechanism with TEMP/TMP set to that local folder. No realpath monkey-patch, permission bypass, test suppression, or forced exit was used. npm/Gradle also needed approved network access after sandbox DNS failures; command-scoped caches are under node_modules/.cache. `java` on PATH used an unresponsive Oracle launcher; direct JAVA_HOME/bin/java and Gradle with that bin prepended worked.

Tests added/updated: matching translation keys/nonempty values and localized labels; automatic theme resolution/fallback and explicit overrides; real useColorScheme subscriptions, reactive changes, explicit override after system changes, and cleanup; initial Spanish/four accessible tabs; tab presses, Details/Edit navigation/back state; language/theme changes preserving the current route key. Navigator implementations are not mocked; the Jest safe-area native boundary is mocked. Renderers and pending timers are cleaned up after tests. Existing template smoke test was replaced with these behavior checks. Custom hooks introduced only as provider accessors: `useTranslation`, `useAppTheme`; existing `useColorScheme` and `useSafeAreaInsets` were reused.

One read-only subagent reviewed changed code/tests against the documentation. No blocking defect was found; its reactive Appearance coverage request was addressed. Native Android hardware back/activity restoration, iOS gestures, narrow/wide layouts, increased text size, landscape, keyboard, contrast/accessibility, and system appearance changes on a device remain **NOT VERIFIED** beyond the limited emulator checks above. `ref.goBack()` tests prove navigator state behavior, not native back handling. Gradle/third-party deprecation warnings remain and were not suppressed.

Outstanding decisions/limitations: final bundle/application identifiers are not agreed; keep existing identifiers. The undo window remains `MUST_BE_DEFINED_BEFORE_IMPLEMENTATION` for Phase 5. The repository ignore rules include `docs/`. This handoff is explicitly included in the Phase 1 commit at the user's request; ignore rules were not changed. Persisted theme/language/default-platform preferences remain Phase 3 work.

Phase 2 prerequisites: a separate user assignment; preserve this foundation and its passing checks; implement only pure transaction types, parsing/validation, change/tip/quick-value calculations, calendar boundaries, and summary arithmetic with meaningful money/invariant/DST tests. Do not introduce SQL, payment screens, or persistence. Carry forward iOS/native acceptance limitations; no full cross-platform completion claim until the required checks pass.

### Phase 2 — Pure domain logic (2026-10-08)

Status: **COMPLETE** for the assigned pure-domain scope. Phase 3 is **NOT STARTED**. Phase 1 native acceptance limitations remain pending; this status does not imply full MVP or cross-platform acceptance. The working tree was clean at the start, on Phase 1 commit `28599c8`; no prerequisite blocked independent domain work.

Implemented files and flow:

- `src/features/transactions/types.ts`: documented Platform and CashTransaction types, stable platform list, and explicit numeric payment inputs. No IDs or timestamps are generated here; Phase 3 owns pending-operation ID reuse and persistence.
- `src/features/transactions/money.ts`: comma/period parser with incomplete/invalid/focused-draft/valid results, trailing separator handling after blur, integer-cent conversion, safe-integer validation, positive fare rule, and the documented 999,999-cent input maximum. A `draft` result is not confirmation-ready even though it includes parsed cents. No display formatting is passed back to the parser.
- `src/features/transactions/payment.ts`: validation and derived change/tip/retained cash, separate insufficient-payment results without clamping, pure monetary edit handling that clears tip when amounts change, the documented ascending quick candidates (up to three), quick replacement with tip reset, and Exacto for any valid fare. Invalid quick selections throw; Exacto returns null for an invalid fare. All inputs are explicit and are not mutated.
- `src/features/summary/periods.ts`: explicit reference Date, period, and IANA timeZone inputs; caller will pass the current device zone during later integration. Gregorian calendar construction uses Date/Intl and resolves each boundary independently to UTC, including DST offsets, midnight gaps, and repeated midnights. Fixed internal locale/numbering prevents UI language from changing calendar arithmetic. No Date.now, default current date, process timezone mutation, UI, or state is used. `isWithinPeriod` implements start-inclusive/end-exclusive membership. Invalid dates/zones/bounds fail visibly.
- `src/features/summary/summary.ts`: aggregates explicitly supplied records (already selected for the requested period/platform) into count, fare, tip, retained cash, rounded fare average, and fare by platform. It reuses payment validation to reject inconsistent monetary rows; summaries do not count received cash as revenue or add tips twice. Empty input returns zeros. Average uses integer quotient/remainder rounding; half-cent ties round upward. Safe-integer addition is guarded.
- `__tests__/money.test.ts`, `payment.test.ts`, `summary.test.ts`, `periods.test.ts`: documented parser examples and malformed/boundary input; exact/change/insufficient/full-tip cases; monetary invariants; quick/Exacto and immutable edits; empty/mixed summaries, all platforms, rounding and corrupt arithmetic; Monday/Sunday weeks, year/month/leap-day transitions, half-open membership, explicit zones, DST 23/25-hour days, DST week/month changes, midnight gap and repeated midnight.

Dependencies: none added or changed. Custom hooks: none added; the calculations are ordinary TypeScript functions. Existing UI, navigation, providers, configurations, and Phase 1 tests were preserved. No SQLite, services/repositories, saved settings, payment/history screen flows, or native changes were introduced.

Verification:

| Check | Actual result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | PASS |
| `node node_modules/eslint/bin/eslint.js . --no-cache` | PASS |
| Full existing Jest command: `node node_modules/jest/bin/jest.js --runInBand --no-cache --watch=false`, command-scoped `TZ=UTC` | PASS: 8 suites, 100 tests, including Phase 1 regression coverage |
| Domain-only Jest run with command-scoped `TZ=America/Los_Angeles` and a temporary config under ignored `node_modules/.cache/cash-driver/domain-jest.json` | PASS: 4 suites, 90 tests; Node test environment, Babel transform, no React Native preset or setup. Date tests themselves pass explicit zones and fixed ISO references, independently of the host zone/time |
| `git diff --check` and source review | PASS; domain sources have no React Native/UI/storage imports or current-time/global-state reads |
| Android/iOS native checks | No new native build or device acceptance run in this pure phase. Phase 1 Android build/emulator results stand; **iOS NOT VERIFIED** and broader native acceptance remain pending |

Jest used the previously verified command-scoped workspace TEMP/TMP and approved execution mechanism for the sandbox Windows realpath restriction. No runtime patches, test suppressions, forced exits, or changes to shared test configuration were needed. The temporary domain-only test config is not a project configuration change and is not tracked.

One subagent performed a read-only calculation/test review against the documentation. No confirmed defect was found. Its repeated-midnight coverage gap was addressed with the America/Havana fixed-date case and both relevant and full tests were rerun successfully. Pure tests validate domain results, not native Intl behavior; device calendar/formatting integration remains part of later native acceptance.

Blockers: none for Phase 2. Carry-forward decisions: final app identifiers remain unagreed; undo duration remains a Phase 5 owner decision. Do not reinterpret Phase 2 completion as Phase 1 iOS acceptance or full MVP completion.

Phase 3 prerequisites: a separate user assignment; verify a SQLite candidate against the installed RN/native architecture on Android/iOS before adoption; define versioned non-destructive transaction/preference migrations; reuse these pure validators/calculations in services; verify integer bindings, atomic writes, duplicate-ID retries, failure preservation, preference restoration, refresh behavior, and native restart persistence. The model comment requires one ID per pending operation, reused on retries. Do not silently reset corrupt storage or move SQL into screens. Phase 3 has not begun.

### Phase 3 — Local persistence — IMPLEMENTED / VERIFICATION PENDING

Status: **not COMPLETE**. Android build, native SQLite behavior and process-restart persistence passed. **iOS NOT VERIFIED**: this Windows environment has no macOS/Xcode or iOS runtime. Initial confirmation-haptics behavior is **NOT DOCUMENTED / OWNER DECISION REQUIRED**; the owner question remains unanswered. Phase 4 has not begun.

Prerequisite inspection: Phase 2 commit `b1716e8` and its domain calculations/tests were present; the working tree was clean before this phase. Existing providers, navigation, theme tokens, dictionaries, validators, payment calculations and transaction types were reused. The historical Phase 1/2 entries above describe their own delivery state; this entry supersedes their session-only / not-yet-started persistence statements.

Dependency selection: retained the documented SQLite candidate, exact `@op-engineering/op-sqlite@18.2.5`, plus `uuid@14.0.2` and `react-native-get-random-values@2.0.0`. Verified installed package APIs, TurboModule/codegen setup, RN compatibility (project RN 0.87.1; OP-SQLite package development RN 0.87.0; random-values peer RN >=0.81), Android native compilation and the podspec's supported iOS minimum against this project's iOS 15.1 configuration. Source/config compatibility is not an iOS build result. The random polyfill loads before UUID generation. No second preference-storage library, haptics adapter, date library or state framework was added. Versions are recorded in `package.json` / `package-lock.json`.

Changed files and behavior:

- `src/database/connection.ts`, `sqlite.ts`, `serializedConnection.ts`, `migrations.ts`, `README.md`: one named local connection and initialization promise; a shared queue for public reads/transactions prevents reads of uncommitted values. Integrity checks, rejection of unsupported schema versions, transactional v1 transaction table/indexes and v2 singleton preferences. Integer storage, input bounds, platforms and monetary invariants are schema constraints. Initialization failures surface and can retry against the same file; there is no delete/reset/empty-database fallback.
- `src/features/transactions/transactionRepository.ts`, `transactionService.ts`: parameterized CRUD; service-side UUID/platform/amount validation and derivation from Phase 2. UTC ISO timestamps; edits preserve `createdAt` and persist `updatedAt` atomically. A pending UUID is generated once; simultaneous identical saves share a promise, retries read the existing commit, and a different committed/concurrent draft under the same ID is rejected. Failed creates/edits/deletes roll back and emit no success notification. Delete-all affects operations only; no deletion UI or Deshacer was implemented.
- `src/features/settings/preferencesRepository.ts`, `preferencesService.ts`: preferences share SQLite with transactions; defaults es/system/uber follow documentation. Partial updates are serialized, validate enums/boolean values and read the latest committed settings. Haptics is explicitly unset (`NULL`, TypeScript `boolean | null`) until the owner chooses an initial value; true/false selections can be stored/restored without choosing a default or triggering feedback.
- `src/app/persistence.ts`, `PersistenceProvider.tsx`, `changeNotifier.ts`, `useDataChanges.ts`: shared initialized services, bootstrap loading/retry error and restoration before main screens render; React state retains the previous committed settings on failed writes. Successful changes emit transactions/preferences notifications; a throwing subscriber is reported without turning a committed write into a failed save. Subscriptions have cleanup.
- `App.tsx`, `src/theme/ThemeProvider.tsx`, `src/i18n/LanguageProvider.tsx`, `translations.ts`, `src/components/ChoiceGroup.tsx`, `src/features/settings/SettingsScreen.tsx`: connected existing language/theme foundation to persisted preferences; selectors disabled during write, translated failure messages, retained system-theme response and navigation identity. Updated obsolete placeholder copy. Full feature screens remain explicitly unfinished.
- `__tests__/persistence.test.ts`, `sqliteTestDatabase.ts`, `PersistenceProvider.test.tsx`, `nativePersistenceEntry.tsx`, updated `App.test.tsx`, `ThemeProvider.test.tsx`, `setup.js`, `jest.config.js`: real Node SQLite integration through the production queue, bootstrap/preferences failures and restoration, foundation regression tests and an isolated device-only entry. Jest transforms UUID ESM; the native module mock rejects opening it in Jest, so integration tests must inject actual SQLite rather than mocked SQL methods. Node SQLite requires the existing Node 24 runtime; no additional test dependency was installed.

Verification:

| Check | Actual result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | PASS |
| `node node_modules/eslint/bin/eslint.js . --no-cache` | PASS, no warnings |
| Full Jest: `node node_modules/jest/bin/jest.js --runInBand --no-cache --watch=false`, command-scoped `TZ=UTC` | PASS: 10 suites, 122 tests; Node SQLite issues its standard experimental-feature warning |
| Real SQLite integration | PASS: once-only initialization, close/reopen file persistence, v1-to-v2 data preservation, rollback of failed DDL/version updates, future-version rejection, corrupt-file preservation, CRUD/timestamps, invalid input/preferences, native-shaped integer bindings/constraints, pending-ID retries, write-failure preservation, notification timing and cleanup, gated concurrent-read/rollback isolation |
| Android `android/gradlew.bat -p android assembleDebug --console=plain` | PASS with JDK 17.0.18, SDK/build-tools 37, NDK 27.1.12297006, Gradle 9.4.1; all four configured ABIs; debug APK installed with `adb install -r` without wiping data |
| Android OP-SQLite / Hermes / Fabric emulator test | PASS: separately recorded `NATIVE FIRST PASS` and `NATIVE RESTART PASS`; integer storage for all five monetary columns, rejection of fractional values, migration retaining 999,999 cents, duplicate protection, rollback without notifications, retry, force-stop/relaunch restoring an operation and all four preferences, edit preserving original date and delete |
| Production Android foundation | PASS: language/theme changed through Ajustes, then force-stop/relaunch restored Ukrainian/dark; observed actual UI and screenshot. Navigation resets to its initial tab on process restart as before; preference changes while mounted preserve the route |
| iOS build/native persistence/restart | **iOS NOT VERIFIED** — macOS/Xcode unavailable |
| Physical-device haptics, device reboot, exhaustive narrow/wide/text-scale/loading-failure visual acceptance | **NOT VERIFIED**; full acceptance belongs to later phases; no haptics behavior was implemented |
| `git diff --check` | PASS |

Environment notes: initial Android attempts failed because the long Gradle cache path exceeded Ninja's Windows 260-character path limit. Using command-scoped `GRADLE_USER_HOME=<repository>/.gradle` and regenerating only verified in-workspace CMake caches resolved it; no application/native source changes or identifiers were needed. Existing AGP deprecation and dependency C++ warnings remain. Tests used the command-scoped workspace TEMP/TMP and approved execution mechanism for the already documented Windows sandbox EPERM; no permission bypass, runtime patch or forced test exit.

Native verification used `__tests__/nativePersistenceEntry.tsx` through an ignored temporary Metro configuration on port 8083. Production `index.js` never imports the harness. It used only `cash-driver-native-test.sqlite` and `cash-driver-native-migration-test.sqlite`; fixture files were removed after verification, the temporary Metro was stopped and debug host restored. No sample transaction was written to `cash-driver.sqlite`. To repeat, serve this entry with a temporary Metro middleware mapping `index.bundle` to `__tests__/nativePersistenceEntry.bundle`, allow that entry in the temporary resolver blockList, launch twice with force-stop between launches, and record both PASS messages. The second step clears the fixture operation and resets fixture preferences for a fresh run; never reset the production DB.

One subagent performed a read-only review of persistence, migrations, retries and tests. It found that raw OP-SQLite reads were not transaction-isolated like the initial test adapter; the production queue and shared test adapter were added, with a gated rollback regression test. The reviewer confirmed the fix and found no further blocking defect. Its native-harness repeatability/sentinel-order findings were also corrected before the successful native run. Review did not substitute for the test/build/device checks above.

Remaining questions / Phase 4 prerequisites: a separate assignment; owner selection of initial confirmation haptics before feedback default is implemented, with explicit handling of the unset preference (do not interpret the screenshot as approval); iOS installation/build/restart checks on macOS/Xcode remain mandatory before cross-platform completion. Reuse the pending operation object for retries, update the shared default platform on explicit Inicio selection, keep drafts intact on write failure, subscribe/unsubscribe to committed changes for daily totals and show committed success values. The Phase 5 undo duration and final bundle/application identifiers still need owner decisions; they do not block this persistence implementation and were not changed. No full Inicio/Historial/Resumen/Ajustes, Deshacer, backup or Phase 4 work was added.

### Phase 4 — Inicio — IMPLEMENTED / VERIFICATION PENDING

Status: **not COMPLETE**. Inicio is implemented and automated checks pass. Android build and selected native payment/layout scenarios passed; the exhaustive native language/theme/keyboard/text-scale matrix remains **NOT VERIFIED**. **iOS NOT VERIFIED**: Windows has no macOS/Xcode or iOS runtime. Phase 5 has not begun.

Prerequisites: reread the project documents and screenshot, inspected the existing Phase 3 providers, services, repositories, pending-ID behavior and Progress. Phase 3 changes were already uncommitted and were preserved. Reused integer-cent domain validation/calculations, SQLite services, notifications, persistence providers, theme tokens, dictionaries and UI foundation. No dependencies or identifiers were added/changed in this phase. No compatible haptics adapter exists; feedback was omitted as explicitly allowed by the Phase 4 assignment. The unset initial haptics preference remains an owner decision for later work, not an invented default.

Changes:

- `src/features/transactions/HomeScreen.tsx`, `PaymentForm.tsx`, `usePaymentForm.ts`, `TransactionScreens.tsx`: real Inicio with local date/time, persistent shared default platform, raw money drafts, domain-derived quick amounts/Exacto/change/insufficient cash and full-change tip. Monetary changes clear the tip choice. The reusable form receives submission/platform callbacks; no editing screen was implemented. Save guards repeated presses, disables controls while writing, retains failed drafts and reuses the same pending UUID for unchanged retries. The service recalculates before commit. Only successful commit clears fields/tip and displays committed fare/tip values; keyboard dismissal and stale native blur protection prevent old input from returning after success. External defaults affect pristine/next drafts without replacing an active draft. Preference failures retain the previous platform and draft.
- `src/app/useLocalClock.ts`, `src/features/summary/useDailySummary.ts`, `DailySummary.tsx`: device-zone clock and separately labeled operation count, trip fares, tips and retained cash. Refresh after committed transaction notifications, local date/time-zone changes and foreground entry; subscriptions/timers clean up. Request generation prevents stale results/errors overwriting newer totals. Loading/error states carry no fabricated zero summary and offer retry.
- `src/components/MoneyInput.tsx`, `ActionButton.tsx`, `ChoiceGroup.tsx`, `src/theme/tokens.ts`: decimal keyboard, accessible errors, inline loading, responsive platform layout and at least 48 dp tip-switch target. Reused safe-area/keyboard-aware scroll container, cards and palettes; quick amounts wrap on narrow screens. Keyboard can be dismissed explicitly or by scrolling to confirmation.
- `src/i18n/formatting.ts`, `translations.ts`, `LanguageProvider.tsx`: matching es/en/uk messages with interpolation, locale date/24-hour time and EUR display; input normalization stays ungrouped and all money arithmetic remains integer cents. Native Hermes Ukrainian Intl displays EUR while Node Intl may display the euro symbol; both preserve EUR currency and exact values.
- `__tests__/Inicio.test.tsx`, `usePaymentForm.test.tsx`, `formatting.test.ts`, updated `App.test.tsx`: meaningful real-SQLite application/hook tests for ordinary/exact/insufficient payments, invalid bounds, focused draft normalization, quick replacements/tip reset, tip invariants, duplicate presses, rollback/draft retention/same-ID retry, commit/reset/totals, preference write failures, latest default versus active draft, stale blur/read/error protection, theme/language draft preservation and daily loading/error/retry/midnight/resume behavior. Fixed dates and explicit device zone mocks are used. `nativeInicioEntry.tsx` is an isolated device entry using actual OP-SQLite and production services; production `index.js` never imports it.

Verification:

| Check | Actual result |
| --- | --- |
| TypeScript `node node_modules/typescript/bin/tsc --noEmit` | PASS |
| ESLint `node node_modules/eslint/bin/eslint.js . --no-cache` | PASS, no warnings |
| Full Jest `node node_modules/jest/bin/jest.js --runInBand --no-cache --watch=false`, command-scoped `TZ=UTC` | PASS: 13 suites, 136 tests; standard Node SQLite experimental warning only |
| `git diff --check` | PASS; Git reports existing Windows LF/CRLF normalization warnings |
| Android `android/gradlew.bat -p android assembleDebug --console=plain` | PASS: 214 tasks; existing four-ABI configuration, JDK 17 and repository-local Gradle cache |
| Android emulator native payment | PASS: 20/50 shows 30 change; full-change tip shows zero change and 30 tip; two confirmation taps added one record; fields cleared, committed success message displayed, totals increased by fare 20 / tip 30 / retained 50. Exact fills received 20 and yields zero change. 20/10 displays missing 10. Actual native decimal keyboard opened; scrolling dismissed it and exposed confirmation |
| Android selected visual checks | PASS: observed es/en/uk, both palettes, 360 dp width with 130% text, wrapped platform/quick controls, readable separately labeled totals and reachable inputs/confirmation. Ukrainian long tab captions wrap at this text scale |
| Exhaustive Android combination matrix, native injected write failure/loading errors, midnight/time-zone change on device, physical-device acceptance | **NOT VERIFIED**; automated tests cover relevant state/failure/calendar behavior but do not substitute for these native checks |
| iOS build and native acceptance | **iOS NOT VERIFIED** — macOS/Xcode unavailable |

Tests used command-scoped workspace TEMP/TMP and approved execution for the documented Windows sandbox EPERM. No runtime patch, permission bypass, test suppression or forced test exit was introduced. Native checks used a temporary ignored Metro configuration on port 8083 and only `cash-driver-inicio-test.sqlite`; the existing production database was not used for test payments. Temporary display/text settings and debug host were restored and the isolated fixture removed after checks. During initial device inspection the owner was interacting with the emulator; only subsequent observed scenarios after coordination are counted as verification.

One subagent reviewed code/tests read-only. Confirmed findings were corrected: tip switch touch target, missing stale-summary/default-platform coverage and native keyboard dismissal after success. Tests were rerun after fixes. Review is separate from native verification.

Phase 5 prerequisites: a separate assignment; reuse this callback-based form with historical initial values and repository/service edit validation while preserving createdAt, without changing the shared default on historical edits. **OWNER DECISION REQUIRED** for the undo window duration before Deshacer implementation. Final identifiers remain unagreed. Complete pending native/iOS acceptance before claiming cross-platform completion. No Historial, edit screen, Deshacer, full Resumen/Ajustes, backup or Phase 5 behavior was implemented.

### Phase 5 — Historial — IMPLEMENTED / VERIFICATION PENDING

Status: **not COMPLETE**. History/details/edit/deferred single deletion are implemented. Automated checks and Android build pass; selected Android native scenarios were verified below. **iOS NOT VERIFIED**: Windows has no macOS/Xcode or iOS runtime. Exhaustive native acceptance remains pending. Phase 6 has not begun.

Prerequisites: inspected clean Phase 4 commit `bd3a952` and Phase 3 commit `46c9d16`, reread the project docs and screenshot, and reused existing domain rules, form, repositories/services, providers, notification mechanism and tokens. The owner supplied **10 seconds** for Deshacer during this phase; it is centralized in `src/features/transactions/deletionConstants.ts` as `DELETION_UNDO_SECONDS`, and DATA_AND_CALCULATIONS.md now records the decision. Earlier historical handoff entries retaining an unresolved duration / not-yet-started Phase 5 do not supersede this decision. No dependencies, schema changes or application identifiers were added.

Changes and flow:

- `src/features/transactions/history.ts`, `HistoryScreen.tsx`, `useTransactions.ts`, `TransactionLoadState.tsx`: combined Hoy/Semana/Mes/Todo and platform filters, newest-first grouping by current device-zone date, stable descending ID tie-breaker consistent with the existing repository, labeled rows with optional tips. Reused domain period boundaries. Initial filter is Hoy / Todas. Loading, genuine empty, filtered empty, read failure/retry and missing-operation states are distinct; no sample rows or zero totals stand in for failed reads. Refresh on focus, successful notifications and resume; local clock changes recompute filter membership/grouping. Request generations discard stale results and subscriptions clean up.
- `OperationScreens.tsx`, `TransactionScreens.tsx`, `src/app/navigationTypes.ts`: typed ID-based details/edit routes; full local date/time and all five monetary values in details. Edit preloads the same payment form with stored platform, fare, received and tip state, and calls the existing edit service to recalculate/update the original record. ID/createdAt remain unchanged; updatedAt changes on commit. Historical platform choices never update default preferences. Cancel/back do not write; failed edits preserve their draft for retry. The edit parent does not refresh/remount its draft on mutation notifications. After commit the form shows saved values and translated fare/tip success; further save is disabled until an explicit draft change.
- `usePaymentForm.ts`, `PaymentForm.tsx`: small explicit edit options (`clearAfterSave: false`, `mode: edit`) retain shared parsing/quick amounts/tip-reset behavior. Synchronous write and committed-draft guards prevent repeated edit saves. Inicio still clears only after a successful create. No duplicated SQL or monetary arithmetic was introduced.
- `DeletionProvider.tsx`, `deletionConstants.ts`, `DeletionNotice.tsx`, `src/app/AppNavigator.tsx`: one application-scoped, in-memory pending deletion after explicit native confirmation. Its row stays in SQLite/history/totals for 10 seconds; editing that row and all further destructive actions are disabled. A synchronous pending-to-writing transition serializes undo/expiry before awaiting persistence. Undo only clears memory; active expiry calls the existing remove service once. Inactive/background/unmount before expiry cancels; nothing is restored on restart. Undo is absent after write starts. Failed delete retains the row, exposes retry/cancel and emits no successful mutation. A global safe-area footer keeps Undo/error/retry accessible on every route, including later-feature placeholders, without implementing those features.
- `src/components/ActionButton.tsx`, `src/i18n/translations.ts`: reused palette tokens for secondary/destructive actions, matching es/en/uk filters, states, dialogs, accessibility labels and committed edit messages. Safe footer reserves layout space rather than covering fields/buttons and accounts for bottom and lateral insets.
- `__tests__/history.test.ts`, `Historial.test.tsx`, `deletion.test.tsx`, updated `App.test.tsx`: fixed-reference/explicit-zone grouping, Monday/month/DST/tie-order tests; actual SQLite component integration for filters/loading/empty/error/retry/stale read protection, edit ID/date/default preservation, duplicate save, tip derivation, actual UPDATE/DELETE trigger rollback, preserved drafts, cancel/back and consumer refresh. Deterministic timers cover unchanged undo, single expiry, background/remount, unmount subscription cleanup, both callback orders at the same undo/expiry deadline, undo disabled during a gated write and failed-delete retry. Global Undo/retry is tested after tab changes. `nativeHistorialEntry.tsx` uses actual App/services/OP-SQLite with a separate disposable database; production index never imports the test entry.

Verification:

| Check | Actual result |
| --- | --- |
| TypeScript `node node_modules/typescript/bin/tsc --noEmit` | PASS |
| ESLint `node node_modules/eslint/bin/eslint.js . --no-cache` | PASS, no warnings |
| Full Jest `node node_modules/jest/bin/jest.js --runInBand --no-cache --watch=false`, command-scoped `TZ=UTC` | PASS: 16 suites, 154 tests; standard Node SQLite experimental warning only |
| `git diff --check` | PASS; existing Windows LF/CRLF normalization warnings |
| Android `android/gradlew.bat -p android assembleDebug --console=plain` | PASS: 214 tasks, four configured ABIs; JDK 17.0.18, existing SDK/NDK and repository-local Gradle cache. Existing AGP/dependency native warnings remain |
| Android emulator history/details/edit | PASS: actual isolated rows grouped newest-first, optional tip, complete labeled details; prefilled edit tip, changed fare clears tip, Android back retains original row, committed edit updates fare/change/tip and success message/details. Copy of fixture SQLite confirms one edited row, preserved createdAt, UTC updatedAt and integer cents |
| Android emulator deletion | PASS: explicit native confirmation, pending/Undo display, Undo retains row, background cancels before expiry and return after the window retains row; active expiry removes selected row and refreshes history while other rows remain. Force-stop during pending followed by relaunch retained the remaining two rows and their 3,600-cent fare/retained totals, without restoring pending state |
| Android selected visual checks | PASS: observed three languages and both palettes with wrapping filter labels, readable monetary details and reachable scrollable edit controls. This is not exhaustive native acceptance |
| iOS build/back gesture/native scenarios | **iOS NOT VERIFIED** — macOS/Xcode unavailable |
| Native fault injection, exhaustive narrow/large-text/landscape keyboard combinations, physical-device and device-reboot acceptance | **NOT VERIFIED**; automated SQLite/state tests do not substitute for native acceptance |

Checks used the existing command-scoped workspace TEMP/TMP and approved execution for the documented Windows EPERM restriction, without permission bypasses, runtime patches or suppressions. Device checks used an ignored temporary Metro config on port 8083 and only `cash-driver-historial-test.sqlite`; seeded examples are confined to that acceptance entry/database. The production database was not used for test edits/deletions. Temporary fixture files and debug host were removed/restored after checks; the existing production Metro was preserved.

One subagent reviewed docs/code/tests read-only. It found Undo/error notice inaccessible on other routes; the notice was moved to a global footer and covered by tab-change tests. Its lateral-safe-inset finding was fixed. Cleanup and exact-deadline race coverage were added; final review found no further confirmed defect. Review does not substitute for execution/native verification. A pre-existing/concurrent whitespace-only change in `src/theme/resolveTheme.ts` was preserved outside the Phase 5 commit; it adds no Phase 5 functionality. DATA_AND_CALCULATIONS.md is explicitly included in the Phase 5 commit at the owner's request to commit these changes; the existing docs ignore rule is unchanged. The approved duration is also recorded in this handoff and the source constant.

Remaining blockers: no unresolved duration or domain decision blocks this implementation. iOS/exhaustive native verification prevents COMPLETE. Initial haptics choice and final identifiers remain carry-forward owner decisions for their assigned scope. Phase 6 prerequisites: a separate assignment; reuse persisted transactions, existing period/summary calculations and successful-mutation subscriptions, keeping pending rows included until delete commit; implement summary loading/error/empty/refresh without double-counting tips. No full Resumen/Ajustes, delete-all, backup or Phase 6 work was added.

### Phase 6 — Resumen (2026-10-08)

Status: **IMPLEMENTED / VERIFICATION PENDING — not COMPLETE**. Resumen and its automated checks are implemented; Android build and selected native scenarios pass. **iOS NOT VERIFIED** because this Windows host has no macOS/Xcode or iOS runtime. Phase 7 is **NOT STARTED**.

Prerequisites: reread AGENTS and its linked specifications/standards, inspected screen.png and current Phase 5 code/Progress on commit `9100411`. No unresolved domain rule blocks Resumen. Reused persisted transaction services/repositories, successful-commit notifications, existing integer-cent summary and DST-aware calendar functions, local clock, translations, navigation and themed primitives. The unrelated whitespace-only `src/theme/resolveTheme.ts` change present before this phase was preserved. No dependencies, identifiers, schema, SQL repositories, monetary formulas or completed payment/history infrastructure were changed.

Changed files:

- `src/features/summary/SummaryScreen.tsx`: Hoy/Semana/Mes, visible local date range, saved operation count, trip fares, tips, retained cash, fare-only average and fare totals for Uber/Cabify/Bolt/Otro. Primary/onPrimary hero card, wrapping metric rows and scrollable safe-area layout; loading/error/retry show no fabricated totals, genuine empty periods show zero metrics and an empty explanation.
- `src/features/summary/usePeriodSummary.ts`: focused period loading through the existing transaction service and pure calculations. Refresh on successful transaction notifications, focus, foreground entry, local date and device timezone changes. Request generation and period/date/zone keys reject stale successes/errors and hide the previous period before the next effect runs. Subscriptions and outstanding response acceptance are cleaned up on unmount. Pending deletion/Undo never subtract a row; only successful delete commit refreshes the stored totals.
- `src/i18n/formatting.ts`, `translations.ts`: inclusive visible date ranges derived from the existing half-open bounds, explicit locale/device zone, and matching new es/en/uk labels. Subtracting one millisecond from the exclusive end is only for the last included date's display, not boundary arithmetic. Platform names remain unchanged in every language.
- `src/components/Card.tsx`: optional style support for the existing reusable card, used by the summary hero; existing callers retain their default behavior.
- `__tests__/Resumen.test.tsx`, `formatting.test.ts`: real SQLite/service/navigation integration with fixed times and controlled zones. Cover empty/mixed platforms, distinct fares/tips/retained cash, half-cent average rounding, half-open inclusions/exclusions, Monday/year/month and short/long DST boundaries, focused week/month rollover, create/edit/delete refresh, original-date membership after edit, pending/Undo/delete failure/retry, loading/error without zeros, obsolete success/error after rapid period switching, locale/theme independence, focus/resume/local midnight/timezone refresh and subscription cleanup.
- `__tests__/nativeResumenEntry.tsx`: device acceptance entry with an isolated `cash-driver-resumen-test.sqlite` database and saved fixture operations; production `index.js` never imports it. Test data is not installed in the production database.
- `docs/IMPLEMENTATION_PLAN.md`: this handoff only.

Verification:

| Check | Actual result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | PASS |
| `node node_modules/eslint/bin/eslint.js . --no-cache` | PASS |
| Final full Jest run, `--runInBand --no-cache --watch=false`, `TZ=UTC` | PASS: **17 suites, 170 tests**; includes 15 Resumen tests and 3 formatting tests. SQLite is the actual Node SQLite engine, not mocked repository SQL |
| `git diff --check` | PASS |
| `android/gradlew.bat -p android assembleDebug --console=plain` | PASS: **214 tasks**, JDK 17.0.18, existing SDK/NDK and all configured ABIs. Existing AGP/dependency deprecation warnings remain |
| Android emulator Resumen periods | PASS: fixture Hoy has 4 operations, fares 4,501 cents, tips 499, retained 5,000 and average fare 1,125; Semana has 5 operations/fares 5,001, Mes has 6/fares 5,501/average 917. Visible day/week/month date ranges and four platform totals match the saved fixture rows |
| Android selected visual acceptance | PASS: all **six combinations of es/en/uk and light/dark**, on a **360 × 800 logical screen with font scale 1.3**; period chips/long metric labels wrap and all amounts/platform rows remain reachable by scrolling. Original 448 × 997 size/text scale 1.0 also checked. Hermes Ukrainian EUR notation remains EUR currency |
| Android pending/Undo/committed delete/resume | PASS: pending Cabify remains in the 4-operation summary with its 499-cent tip; Undo preserves the totals. Active expiry successfully deletes only Cabify and refreshes to 3 operations, fares/retained 3,000, tips 0, average 1,000 and Cabify fare 0. Returning from background retains these actual totals |
| iOS build/native acceptance | **iOS NOT VERIFIED** — no macOS/Xcode |
| Native read/write fault injection, device timezone/DST rollover, physical-device, extreme text/landscape and complete accessibility acceptance | **NOT VERIFIED**; deterministic integration tests and selected emulator observations do not replace these checks |

Checks reused command-scoped workspace TEMP/TMP through approved execution for the existing Windows EPERM issue, without permission bypasses or test/runtime patches. Device acceptance used a temporary ignored Metro config on port 8083. The disposable database/debug host were removed, original screen/font settings restored, and production Metro on 8081 preserved after verification; production SQLite was not edited for acceptance.

One subagent reviewed documentation, calculations, refresh guards, tests and the isolated native entry read-only. Two confirmed presentation issues were corrected: Otro now uses the shared platform labels in all languages, and the retained-cash hero uses primary/onPrimary tokens. Follow-up review found no further confirmed defect; the reviewer did not claim independently executed checks or native acceptance.

Remaining blockers: no domain/owner decision blocks Phase 6 code; unavailable iOS and the explicitly unverified native acceptance prevent COMPLETE. Phase 7 prerequisites: a separate owner assignment; reuse the existing preference service/provider, preserve active payment drafts and transaction notifications, resolve the initial haptics choice (**OWNER DECISION REQUIRED**) before implementing its default/feedback, and verify any haptics adapter against the actual native setup. Final bundle/application identifiers still require concrete owner values. No charts, export, arbitrary calendar, profit/expense metrics, full Ajustes, backup or Phase 7 behavior were added.

### Phase 7 — Ajustes (2026-10-08)

Status: **IMPLEMENTED / VERIFICATION PENDING — not COMPLETE**. Automated checks and Android build pass. **iOS NOT VERIFIED** on this Windows host without macOS/Xcode. Physical-device haptics are **NOT VERIFIED**; emulator execution does not prove tactile feedback. Phase 8 is **NOT STARTED**.

Prerequisites: inspected Phase 6 commit `df60fe9`, current code/Progress, AGENTS and linked documents, and screen.png. Reused SQLite preferences/service/provider, successful-commit notifications, shared deletion lifecycle, existing theme/i18n/navigation and adaptive components. The owner delegated the previously undefined initial haptics choice; feedback is opt-in, initially disabled through `DEFAULT_HAPTICS_ENABLED`. Schema version 3 resolves only former NULL choices and preserves explicit enabled/disabled settings and transaction rows. No remaining domain decision blocks this scope. The unrelated pre-existing whitespace-only change in `src/theme/resolveTheme.ts` was preserved.

Changed files:

- `src/features/settings/SettingsScreen.tsx`: fixed EUR, Spanish/English/Ukrainian, explicit/system theme, shared default platform, confirmation-haptics switch, actual native version, local-only storage/uninstall warning and absence of backup/restore. Localized loading/save failure/retry and disabled states; confirmed delete-all with failure/retry and success only after commit. Preference changes retain committed values until successful persistence and preserve existing drafts/navigation.
- `src/app/PersistenceProvider.tsx`: retain the failed preference patch for explicit retry through the existing service; no second storage mechanism.
- `src/features/settings/settingsDefaults.ts`, `preferencesRepository.ts`, `src/database/migrations.ts`, `src/database/README.md`: boolean haptics preference, centralized false default, non-destructive v3 migration and updated persistence documentation. Existing schema type checks and integer bindings remain in use.
- `src/features/settings/confirmationHaptics.ts`, `src/features/transactions/HomeScreen.tsx`: optional safe feedback after successful payment commit using the latest saved preference. Disabled/unsupported devices and native errors do not affect a committed payment. Android uses system-respecting view feedback; iOS uses notification success without vibration fallback.
- `src/features/transactions/DeletionProvider.tsx`, `OperationScreens.tsx`: shared synchronous lock for single/all destructive actions, atomic existing removeAll service/repository, pending-single exclusion, stale confirmation recheck, unmount guards and timer cleanup. Cancel never writes; delete-all has no Undo, preserves preferences, and refreshes existing consumers after commit.
- `src/features/settings/appVersion.ts`, `android/app/src/main/java/com/tempapp/AppVersionPackage.kt`, `MainApplication.kt`, `ios/TempApp/AppVersion.mm`, `ios/TempApp.xcodeproj/project.pbxproj`: small native metadata bridge reading the installed version/build. Android and iOS native metadata are currently 1.0/build 1, while JavaScript package metadata is 0.0.1. Ajustes displays installed metadata and explains the difference; no release version or identifier was invented or changed. iOS bridge/build remain unverified.
- `src/i18n/translations.ts`: matching settings/error/confirmation/storage/version keys in all three languages.
- `__tests__/Ajustes.test.tsx`, `haptics.test.ts`, `persistence.test.ts`, `deletion.test.tsx`, `Inicio.test.tsx`, `App.test.tsx`, `nativePersistenceEntry.tsx`: real SQLite/service/navigation behavior, read/restart, v2-to-v3 NULL/false/true migration with preserved data, preference-write trigger failures/retry, drafts/platform priority/historical edits, feedback only after commit, disabled/unsupported/failing feedback, rejected payment without feedback, cancel/confirmed delete-all, atomic rollback on delete trigger failure, preserved preferences, pending/stale confirmation exclusion, duplicate-action guards, consumer refresh, unmount safety and updated existing assertions. Native persistence fixture now expects the resolved boolean default; that older fixture was not rerun in this phase.
- `__tests__/nativeAjustesEntry.tsx`: isolated native acceptance database with no seeded operations; payments used for verification are entered through the actual UI. Production entry does not import this fixture.
- `package.json`, `package-lock.json`: only new dependency `react-native-haptic-feedback@3.0.0`. Official package/source compatibility checked against the actual React Native/New Architecture and native deployment settings before installation; actual Android compilation passes. iOS compatibility is source-inspected, not build-verified. npm installation reported 55 audit findings; their provenance/security remediation was not investigated in this phase and no audit fix was applied.
- `docs/DATA_AND_CALCULATIONS.md`, `docs/IMPLEMENTATION_PLAN.md`: default decision and this handoff.

Verification:

| Check | Actual result |
| --- | --- |
| TypeScript `tsc --noEmit` | PASS |
| ESLint `. --no-cache` | PASS |
| Full Jest `--runInBand --no-cache --watch=false`, controlled `TZ=UTC` | PASS: **19 suites, 193 tests**, including actual Node SQLite constraints, triggers, bindings and rollback; native haptics boundary is mocked in automated tests |
| Android `assembleDebug --console=plain` | PASS: **245 tasks**, JDK 17.0.18, actual New Architecture and all configured ABIs; existing native deprecation warnings remain |
| Android settings/payment/delete-all selected native acceptance | PASS: initial Spanish/Uber/system/haptics-off; Bolt/haptics-on survive force-stop. UI payment fare 1,740 cents, received 2,000, full-change tip 260 produces one saved operation and correct Summary. Delete-all Cancel retains it; confirmed commit empties history and both summaries while preserving preferences. Actual installed version 1.0 (1) and package discrepancy explanation displayed |
| Android narrow/large-text visual acceptance and final restart | PASS: all six es/en/uk × light/dark combinations on a 360 × 800 logical screen with font scale 1.3; controls, version, storage explanation and delete-all remain reachable by scrolling. Force-stop/relaunch restores Ukrainian/dark/Bolt/haptics-on and zero operations after committed clearing |
| `git diff --check` | PASS |
| iOS build/acceptance | **iOS NOT VERIFIED** — no macOS/Xcode |
| Haptics on supported physical device | **NOT VERIFIED** — only an emulator is available |
| Complete native accessibility, fault injection, system haptics restrictions, device reboot and exhaustive acceptance matrix | **NOT VERIFIED**; automated tests and selected emulator scenarios do not substitute for these checks |

Windows checks use a command-scoped accessible workspace TEMP/TMP with approved execution for the existing EPERM limitation, without runtime/test permission bypasses. One subagent reviewed settings, destructive actions, haptics and tests read-only. Confirmed touch-target and stale-after-unmount callback issues were fixed and regression-tested; final review found no further confirmed defect. The reviewer did not independently execute checks.

Native acceptance used a temporary ignored Metro configuration on port 8083 and the isolated, initially empty `cash-driver-ajustes-test.sqlite`. After verification the fixture database/debug-host preference were removed, original 1344 × 2992 physical screen/font scale 1.0 restored, own Metro stopped and existing production Metro/reverse on 8081 preserved. Production SQLite was not edited for acceptance.

Remaining blockers/Phase 8 prerequisites: a separate phase assignment; unavailable iOS/physical feedback and outstanding native acceptance prevent COMPLETE. Final identifiers and any release-version alignment still require concrete owner values (**OWNER DECISION REQUIRED**), with no guessed changes in this phase. Phase 8 should validate the remaining cross-platform/device acceptance before release conclusions. No backup/restore, accounts, new settings outside MVP or Phase 8 behavior was added.

### Phase 8 — cross-platform acceptance (2026-10-08–09)

Status: **AVAILABLE-SCOPE ACCEPTANCE REVIEW FINISHED — FULL VERIFICATION PENDING; not COMPLETE**. The owner instructed continuation without an unlocked physical phone or an iOS environment on 2026-10-09. Available automated, code-review and Android emulator acceptance work has concluded; no phone unlock or iOS setup is required to finish this bounded review. Confirmed code defects listed below are fixed, but the physical tactile acceptance failure has no proven cause or verified resolution. Required physical-device/accessibility and iOS checks remain outstanding; neither platform meets all MVP completion gates. This entry supersedes earlier NOT STARTED statements for Phase 8, but does not retrospectively convert unavailable checks in earlier phases into PASS.

Prerequisites: reread AGENTS and linked specifications, coding/design/data requirements, all prior Progress entries and screen.png. Inspected current implementation, including uncommitted Phase 7 work, without rewriting its architecture. Written requirements take precedence over screenshot examples. Undo remains the approved **10 seconds**. No dependency, identifier, version or business-rule change was added in Phase 8. Unrelated whitespace in `src/theme/resolveTheme.ts` was preserved.

Confirmed defects and targeted changes:

- `src/features/transactions/usePaymentForm.ts`, `__tests__/usePaymentForm.test.tsx`: a stale blur callback could overwrite a newer quick amount, Exacto or manual draft. A failing behavioral regression reproduced it; normalization now uses the latest state, and only the currently focused field is cleared.
- `src/app/AppNavigator.tsx`, `__tests__/App.test.tsx`: native-stack back accessibility text remained English in Spanish. A stable localized back control now uses the shared dictionary and preserves native/hardware navigation behavior. Spanish/English/Ukrainian labels and return navigation are tested; iOS gestures remain unverified.
- `src/theme/tokens.ts`, `docs/UI_DESIGN.md`: light secondary text changed from #6B7280 to #626975 after measured contrast failures on background/soft green. New opaque-color ratios are 5.14:1 and 4.93:1; this is not a claim of complete accessibility certification. UI_DESIGN.md is locally ignored by the existing Git rules; its actual file was updated, without changing ignore rules.
- `src/components/ScreenContainer.tsx`, `__tests__/ScreenContainer.test.tsx`: reserve the top safe inset on the non-scrolling viewport rather than only in scroll content, preventing controls from scrolling under the status bar. Native stack headers avoid a duplicate top inset; side/bottom insets and keyboard handling are retained.
- `src/theme/ThemeProvider.tsx`, `src/theme/systemBars.ts`, `android/app/src/main/java/com/tempapp/SystemBarsModule.kt`, `AppVersionPackage.kt`, `__tests__/ThemeProvider.test.tsx`: an explicit app theme could leave Android three-button navigation icons with the system theme and poor contrast. A small Android adapter applies the resolved appearance/background, including resume, with subscription cleanup; stack status-bar appearance also follows the theme. Actual API 34 three-button dark appearance was visually rechecked. Other Android API levels are not native-verified.
- `src/components/ActionButton.tsx`, `src/components/ChoiceGroup.tsx`: continuation review confirmed that whole-control opacity 0.7 lowered active pressed text contrast (light primary 3.05:1, secondary 2.82:1, destructive 3.61:1 over a white card). Press feedback now uses an opaque border; existing palette foreground/background contrast is preserved, with no animation or layout-size change between pressed/resting states. Disabled-button dimming remains; inactive controls are not claimed to violate the active-text contrast threshold.
- `__tests__/nativeAcceptanceEntry.tsx`: isolated native fault-injection entry using actual SQLite operations and deliberately invalid SQL for controlled read/write failures, plus fixed Hermes calendar/integer-binding checks. It is never imported by the production entry. The existing native Ajustes fixture was reused for ordinary acceptance and starts with no seeded operations.

Final commands/results (Windows, Node 24.3.0, React Native 0.87.1, React 19.2.3, TypeScript 6.0.3, JDK 17.0.18, Android SDK/API 34 emulator, Gradle 9.4.1, New Architecture/Hermes):

| Check | Actual result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | PASS |
| `node node_modules/eslint/bin/eslint.js . --no-cache` | PASS, no errors or warnings after the final safe-inset cleanup |
| `node node_modules/jest/bin/jest.js --runInBand --no-cache --watch=false`, `TZ=UTC` | PASS: **20 suites / 196 tests**; latest continuation run 8.448 s. Includes actual Node SQLite constraints, integer bindings, migrations, rollback, retry IDs, lifecycle races, fixed-time-zone DST and consumer refresh checks |
| `android/gradlew.bat -p android assembleDebug --console=plain` | PASS: **245 tasks**, including native dependency compilation; existing native/Gradle deprecation warnings remain |
| `android/gradlew.bat -p android assembleDebug assembleRelease -PreactNativeArchitectures=x86_64 --console=plain` with normal production entry | PASS: **490 tasks**, 45 s. A locally built release artifact is not a store release or production signing approval |
| Separate embedded acceptance `assembleRelease`, `ENTRY_FILE=__tests__/nativeAjustesEntry.tsx`, temporary ignored bundle configuration/init script | PASS: **292 tasks**, 58 s. Used only on the test emulator/database, allowing offline cold starts without Metro |
| iOS build and native dependencies | **NOT VERIFIED**: Windows host has no macOS/Xcode, simulator or device. Android/TypeScript success does not prove iOS |
| `git diff --check` | PASS before this documentation-only handoff; line-ending conversion notices are not whitespace failures |

Checks used command-scoped accessible workspace TEMP/TMP for the prior Windows EPERM issue. Native dependencies compile together on Android: OP-SQLite, screens/safe areas/navigation, UUID random source and haptic-feedback. There was no new installation in this phase. The existing npm audit findings from Phase 7 remain uninvestigated; no security remediation or clean-audit claim is made.

Acceptance matrix: PASS below means the described scenario was observed on **emulator-5554 / API 34**, not all Android versions/devices. Automated coverage is named separately where native coverage is incomplete. Every iOS native cell remains NOT VERIFIED.

| Scenario | Android | iOS |
| --- | --- | --- |
| Ordinary change: fare 20 / received 50 | PASS: change 30, committed fare/retained 20 | NOT VERIFIED |
| Exacto and insufficient cash | PASS: edit 24.50 / 20 blocked with 4.50 deficit; Exacto gives zero change | NOT VERIFIED |
| All change as tip; no double counting | PASS: 24.50 / 50 -> tip 25.50, retained 50; offline 18 / 20 -> tip 2, retained 20 | NOT VERIFIED |
| Invalid input, quick amounts and tip reset | PASS: native invalid 20.555 disables save; quick 50 and monetary edit reset tested/observed. Stale-blur regression automated | NOT VERIFIED |
| Repeated confirm and pending-ID retry deduplication | PASS automated service/form integration and native 20-tap stress: one history row and exactly one actual SQLite record | NOT VERIFIED |
| Save failure, retained draft/tip/platform and retry | PASS: real native INSERT failure retains 18/20/tip draft; retry creates one operation and clears fields only after commit | NOT VERIFIED |
| History filters/grouping/details, newest-first order | PASS: combined platform/period filters, filtered-empty state and saved detail values observed; equal-timestamp ordering automated | NOT VERIFIED |
| Edit / cancel / Android back | PASS: cancelled edit leaves data unchanged; committed edit recalculates values; failed UPDATE retains draft for retry | NOT VERIFIED |
| Edit preserves ID/createdAt, changes updatedAt | PASS: actual SQLite before/after comparison; historical edit leaves default platform unchanged | NOT VERIFIED |
| Single-delete confirmation / Cancel / Undo | PASS: original record remains, no reinsertion; approved 10-second window unchanged | NOT VERIFIED |
| Active expiry, background cancellation, failed delete/retry | PASS: background beyond 10 seconds cancels; native DELETE failure retains data, retry commits once. Undo/expiry race additionally automated | NOT VERIFIED |
| Summary / daily totals after create/edit/delete | PASS: separately labelled fare, tips and retained cash; mixed Uber/Cabify 42.50 fare / 27.50 tip / 70 retained / 21.25 average observed; delete refresh observed | NOT VERIFIED |
| Pending deletion stays in totals; undo unchanged | PASS native retained record/summary checks plus deterministic automated lifecycle/consumer tests | NOT VERIFIED |
| Storage read errors, loading/empty/error/retry | PASS: initialization and totals query errors are visible, not fabricated zero totals; empty summaries after successful clearing are valid. Loading races covered automatically | NOT VERIFIED |
| Calendar boundaries, DST and language-independent membership | PASS automated fixed Europe/Madrid dates and actual Hermes checks: 23/25-hour days, Monday/year boundary and leap month. Native UI boundary inclusion on every date is **NOT VERIFIED** | NOT VERIFIED |
| Local midnight and timezone/resume refresh | PASS: controlled 23:59 -> 00:00 changed local date/count 1 -> 0 without restart; reboot timezone change updated displayed operation time. Real clock restored | NOT VERIFIED |
| Language/theme changes retain draft/navigation/filters | PASS: six es/en/uk × light/dark combinations with draft 17.40/20 and tip 2.60; automated navigation/filter preservation | NOT VERIFIED |
| Automatic follows system, including resume | PASS: automatic dark observed after system night=yes; light after night=no/resume; override/resume/subscription cleanup additionally automated | NOT VERIFIED |
| Preferences save failure/retry and shared default platform | PASS: failed language write retains persisted selection with localized error; retry succeeds. Platform priority/historical isolation also automated | NOT VERIFIED |
| Confirmed delete-all / Cancel / failure / preserved preferences | PASS: native Cancel retains records; failed DELETE reports failure and retains totals; retry clears only operations, preferences remain. Pending-single/write locking automated | NOT VERIFIED |
| App restart and force-stop persistence | PASS: operation and preferences restored | NOT VERIFIED |
| Device restart persistence | PASS: full emulator reboot in airplane mode restores fare 18 / tip 2 and Ukrainian/dark preferences | NOT VERIFIED |
| Offline operation | PASS: embedded acceptance APK, airplane mode, own Metro stopped; payment/history/summary/settings and cold restart/device reboot work | NOT VERIFIED |
| Non-destructive native migration and integer storage | PASS: copied isolated v2 database with NULL haptics, removed only its old WAL/SHM while stopped, native launch migrates to v3/false preserving operation ID/date/amounts. Native integer types checked; constraints/rollback also exercised with real Node SQLite | NOT VERIFIED |
| Safe areas, native back, narrow/wider layout | PASS selected API 34 scenarios at 448 × 997 and 360 × 800 logical sizes; fixed status-bar overlap and three-button contrast. Other cutouts/OS versions **NOT VERIFIED** | NOT VERIFIED |
| Large text and keyboard | PASS 12 combinations es/en/uk × light/dark × 360 × 800 / 448 × 997 at each font scale **1.3 and 2.0**: native keyboard shown, content scrolling dismisses it, enabled confirm reachable, draft preserved during language/theme switches. Native action screenshots inspected. Coverage is the payment flow; every screen/OS/text-scale combination is **NOT VERIFIED** | NOT VERIFIED |
| Labels/readability/contrast | PASS localized back and selected labels/amounts/controls checked; all six language/theme layouts reachable by scrolling. Complete TalkBack traversal, disabled-state contrast and maximum supported text scale **NOT VERIFIED** | NOT VERIFIED |
| Reduce Motion / immediate monetary results | PASS selected native interactions with system animation scales zero; transitions remain static and amounts update immediately. Dedicated assistive-setting coverage across OS versions **NOT VERIFIED** | NOT VERIFIED |
| Haptics enabled/disabled/unsupported/failure | PASS automated adapter/save-outcome tests. Physical SM-A528B: **FAIL tactile acceptance** — owner felt no vibration with feedback enabled, including repeated diagnostic virtualKey. Native call accepted; cause unresolved. System-restriction cases **NOT VERIFIED** | NOT VERIFIED |

Two subagents performed independent read-only reviews: domain/persistence/tests and UI/localization/accessibility/platform behavior. The former reproduced the stale-blur defect; the latter identified contrast and system-bar concerns. Main agent fixed confirmed findings and reran checks. Final UI reviewer found no further confirmed issue. Reviewers did not independently run tests/native builds. Code review retained repository SQL, pure money rules, shared payment form/hooks and timer/subscription cleanup; no new architecture or hidden production test writes were introduced.

Test isolation/cleanup: all destructive/fault/migration scenarios used `cash-driver-ajustes-test.sqlite`, with real payments entered through UI; production `cash-driver.sqlite` was not edited for acceptance. The temporary fixture DB/WAL/SHM, device transfer files and temporary debug host preference were removed. Original physical size/font 1.0, gesture navigation, GMT/system night=no, animation settings, automatic clock/timezone and airplane mode off were restored. Normal debug APK restored; own port-8083 Metro/reverse stopped/removed. Port 8081 was already occupied when normal Metro restart was attempted, so the existing process was preserved and reverse 8081 restored. Debug bundle loading immediately after swapping offline release/debug binaries needed the local bundler; it was not counted as an offline production defect. Offline acceptance used the embedded bundle explicitly.

Remaining gates/minimal next steps: diagnose the unresolved physical tactile acceptance failure without bypassing system restrictions; run outstanding screen-reader/accessibility checks and haptics/system-restriction cases; build and run the full acceptance matrix on macOS/Xcode/iOS, including back gesture, keyboard, persistence, native version bridge and haptics. Final identifiers and release-version/signing alignment still require concrete owner decisions; existing 1.0 (1) native versus 0.0.1 package distinction is unchanged. Preserve the existing dependency-audit limitation for a separate review. **Android MVP completion: NOT CONFIRMED. iOS MVP completion: NOT CONFIRMED.** The tactile FAIL and remaining NOT VERIFIED cells prevent COMPLETE; a native accepted haptic call does not prove perceptible feedback or establish the failure's cause. No publication, store release or additional feature phase was started.

Continuation on 2026-10-09 (owner requested completion):

- Closed native repeated-confirm verification: entered fare 20 / received 50 in the isolated UI, sent 20 taps to the observed enabled Confirm button. History and actual SQLite both contained exactly one operation (`fbe2ac24-26cf-457a-b8a3-916437cd23de`, 2,000 / 5,000 / 3,000 / 0 / 2,000 integer cents).
- Closed the remaining language/theme/width keyboard matrix at font scale 1.3: all **12 combinations PASS**. Captured native keyboard and resulting reachable action screenshots; inspected all twelve action screenshots. Inputs 20/50 survive language/theme changes and produce immediately visible change 30. On narrow Ukrainian layouts the EUR text wraps with all characters visible; no claim of a single-line layout or verification at every possible amount/text scale is made.
- An ignored one-off UI script initially swiped over the IME and later failed when another USB target appeared. These testing errors were corrected by swiping within visible content and explicitly selecting `emulator-5554`; successful reruns above are the evidence. No application code change was needed.
- Prepared ARM64 embedded acceptance APK using the existing isolated fixture: `assembleRelease -PreactNativeArchitectures=arm64-v8a`, `ENTRY_FILE=__tests__/nativeAjustesEntry.tsx`, temporary acceptance init/config, **PASS: 292 tasks, 53 s**. After removing temporary native diagnostics, clean rebuild **PASS: 292 tasks, 11 s** (28 executed / 264 up-to-date). Both are test artifacts, not published releases.
- Owner authorized physical Android **SM-A528B / API 34 / ARM64**, adb `R5CR91WB3HN`. Package inventory proved `com.tempapp` absent before test installation. Installed isolated acceptance APK; actual UI payments with feedback disabled (fare 1 / received 2) and enabled (fare 2 / received 2) committed and appeared in history. Reopening restored saved preferences and test operations. These selected physical checks do not replace the full emulator matrix or prove physical device-restart persistence.
- Physical haptic diagnostics: supported=true, normal ringer mode, system vibration enabled, active Activity and attached haptic-enabled View; `performHapticFeedback(virtualKey)` returned true. Nevertheless owner reported no felt vibration for enabled payment and repeated diagnostic pulse: **FAIL tactile acceptance; cause unresolved**. System touch intensity was LOW (`VIB_FEEDBACK_MAGNITUDE=1`); causality is not proven. Owner declined the proposed system-intensity/Back check. No intensity change, forced vibration or system-setting bypass was performed; restriction scenarios remain **NOT VERIFIED**.
- Added test-only status logging to `__tests__/nativeAjustesEntry.tsx`; production entry does not import it. Temporary startup pulse was removed. Temporary logging in the installed dependency's Java implementation was restored byte-for-byte before the clean build (SHA256 `1CF1B87B6B64B3EB371EADCBF226207C96EF011A2DD59D4DE2D65285744CDD96`). No speculative production haptics change was made.
- Emulator has no TalkBack package. Physical Samsung TalkBack is installed but disabled; no accessibility setting was changed. Selected native labels were inspected, but final four-tab physical traversal was interrupted by the phone locking; **NOT VERIFIED**. Complete spoken-focus traversal, maximum text scale and disabled-state contrast remain **NOT VERIFIED**. `xcodebuild` is unavailable on Windows; all iOS native acceptance remains **NOT VERIFIED**.
- Independent read-only reviewer checked residual acceptance gates; no edits or independently claimed native test runs. Final typecheck and lint **PASS**; latest full Jest **20 suites / 196 tests PASS**, 8.653 s; `git diff --check` **PASS** (existing LF/CRLF notices only).
- Cleanup: restored normal debug APK on emulator, removed isolated DB/WAL/SHM and temporary captures, restored emulator screen size/font 1.0. Uninstalled only the newly installed physical test `com.tempapp` and removed its temporary captures; other phone data and system settings were untouched. Production SQLite was not modified. Phase 8 remains **VERIFICATION PENDING**, not COMPLETE: physical tactile failure/accessibility and unavailable iOS gates are preserved explicitly.

Additional completion attempt (2026-10-09):

- Independent read-only reviewer confirmed the active pressed contrast defect described above, then reviewed the targeted fix and found no new confirmed issue. No independent native execution was claimed.
- After the fix, typecheck and lint **PASS**; full Jest **20 suites / 196 tests PASS**, 8.448 s. Initial sandbox run again failed with EPERM resolving the workspace temporary directory; approved execution with the same accessible TEMP/TMP and tests unchanged passed. No checks were disabled.
- Isolated x86_64 embedded acceptance build **PASS: 292 tasks, 11 s** (31 executed). Normal production-entry `assembleDebug assembleRelease -PreactNativeArchitectures=x86_64` **PASS: 490 tasks, 10 s** (19 executed). Existing Gradle/native deprecation notices remain; no publication/signing approval is implied.
- Extended the keyboard/payment matrix to font scale **2.0**: all **12 combinations PASS**, with retained 20/50 draft during theme/language switching and reachable enabled confirmation. Inspected all twelve native action screenshots. Long navigation labels wrap; narrow Ukrainian EUR wraps across lines but all characters remain visible. This does not claim all-screen TalkBack or all-amount/max-text accessibility certification. Final held-confirm capture in the light palette also retained opaque readable text/background after the pressed fix.
- Physical Android is adb-authorized, but an unlocked phone and owner tactile observation are still needed for the remaining manual checks. Requested that prerequisite; system vibration intensity remains unchanged. iOS still requires macOS/Xcode and a simulator/device. These prerequisites are not satisfied by repeating successful automated checks.
- After this attempt, restored normal debug APK, emulator font 1.0 and original 1344 × 2992 physical size. Release APK correctly rejected `run-as` cleanup as non-debuggable; after installing normal debug, removed only the isolated SQLite/WAL/SHM successfully and verified production `cash-driver.sqlite` remained. Temporary device captures were removed. No physical-phone settings or production transaction rows were changed.

Final bounded handoff (2026-10-09, owner-directed continuation without phone unlock or iOS environment):

- The latest instruction supersedes waiting for the previous phone-unlock question. No further phone interaction, system-setting change, physical feedback claim or iOS build was attempted in this handoff. It limits the current execution scope; it does not turn unavailable checks into PASS or change the MVP completion criteria.
- Rechecked current code, test coverage and saved execution evidence after the pressed-state fix. Tests exercise real Node SQLite constraints, migrations, rollback and integer bindings; pending-ID deduplication; failure-preserved drafts; deterministic undo/expiry ordering and background cancellation; half-open calendar/DST boundaries; consumer refresh and stale-response rejection. Native evidence and automated coverage remain distinguished in the matrix above. No new confirmed defect was found in this bounded review, so no additional application change, test mirroring visual constants, installation or redundant build/test rerun was added.
- Latest code checks remain **typecheck PASS / lint PASS / 20 suites, 196 tests PASS**. Latest normal-entry Android debug/release build remains **PASS: 490 tasks, 10 s**; acceptance build **PASS: 292 tasks, 11 s**. At each text scale 1.3 and 2.0, all twelve payment-flow language/theme/width combinations passed. These are earlier actual executions retained as evidence, not new executions claimed by this handoff.
- Disabled-button contrast was examined numerically: over card, opacity 0.7 gives light primary/secondary/destructive text ratios approximately 3.05/2.82/3.61:1 and dark 5.37/4.34/4.86:1. Inactive controls are exempt from the active-text contrast requirement; these values document the existing dimmed appearance and are not a complete native accessibility certification. Active pressed controls now preserve their opaque palette contrast. No unsupported disabled-state defect or accessibility PASS is inferred.

| Final acceptance area | Android | iOS |
| --- | --- | --- |
| Payment, validation, Exacto, tips, repeated confirm, failed save/retry | PASS for documented emulator observations and selected physical payments; scope detailed above | NOT VERIFIED native |
| History, combined filters, details, edit/cancel, immutable ID/createdAt | PASS for documented emulator observations plus behavioral coverage | NOT VERIFIED native |
| Confirmed single deletion, 10-second undo, expiry/background, failure/retry | PASS for emulator observations and deterministic lifecycle tests | NOT VERIFIED native |
| Summary totals, mutation refresh, calendar/DST, midnight/resume | PASS within the explicitly documented native/automated coverage; every possible calendar/device combination not claimed | NOT VERIFIED native |
| Preferences, theme/language draft preservation, confirmed delete-all | PASS for emulator observations and real-SQLite behavioral tests | NOT VERIFIED native |
| Offline, app force-stop/restart, device restart, non-destructive migration | PASS on the isolated emulator/database; full physical-device restart acceptance not claimed | NOT VERIFIED native |
| Keyboard, widths, large text, selected labels, safe areas/back/system bars | PASS for selected API 34 observations; complete screen-reader/all-screen accessibility NOT VERIFIED | NOT VERIFIED native |
| Haptics and system restrictions | FAIL tactile acceptance on SM-A528B, cause unresolved; automated save isolation PASS; remaining system-restriction cases NOT VERIFIED | NOT VERIFIED native |
| Native build | PASS Windows Android debug/release; no store publication | NOT VERIFIED: macOS/Xcode unavailable |
| All mandatory MVP completion gates | NOT SATISFIED | NOT SATISFIED |

Final outcome: the **available-scope Phase 8 review is finished**, with remaining gates recorded rather than silently waived. **Full Phase 8 / Android MVP / iOS MVP: NOT COMPLETE**. Future verification requires a supported physical-device tactile diagnosis and full accessibility traversal, then a macOS/Xcode iOS build and acceptance matrix. The existing dependency-audit limitation and owner decisions about final identifiers/release versions/signing remain recorded; none was invented or resolved by this scope restriction. No new feature, next-version work, publication or Git commit was performed in this handoff.

## Refactoring Phase 0 — baseline and rules reconciliation (2026-10-09)

Status: **COMPLETE for documentation/baseline scope**. The first phase in the temporary docs/REFACTORING_PLAN.md is Phase 0; screen moves are Phase 1 and have not started. Existing full MVP/Phase 8 acceptance status above remains NOT COMPLETE.

Read the actual CashDriver-agent-kit.zip and reconciled its instructions with current CashDriver behavior. docs/AGENTS.md and CODING_STANDARDS.md describe the incremental screens/hooks/UI/navigation/providers/constants transition while preserving CashTransaction, feature-local domain/services/repositories, four platforms, existing localization and reactive theme values. Three adapted local skills are stored inside docs/agent_skills/ and linked explicitly; automatic .agents discovery was not installed. docs/README.md indexes them and the temporary plan. The plan records all 57 existing src files and their intended destinations/actions; no source moves, new dependencies or database changes occurred.

Fresh checks: npm run typecheck **PASS**; npm run lint **PASS**; npm test -- --runInBand --no-cache --watch=false **PASS: 20 suites / 196 tests**, 12.599 s, with command-scoped workspace TEMP/TMP and TZ=UTC through approved execution. Two preceding sandbox attempts failed before tests with the known Windows realpath EPERM (default TEMP and workspace TEMP). No test/config/runtime modification or suppression; standard Node SQLite experimental warning remains. Existing coverage reused; no tests/hooks added. Native/device checks were not rerun for this documentation-only phase.

Read-only subagent baseline review confirmed protected contracts and migration risks: edit identity/one-time loading, retry UUIDs, latest haptics preference, global deletion lifetime/footer, distinct refresh/stale-response behavior and all native-entry imports. Main agent owns final documentation review and the phase commit. Preserve physical haptics FAIL, outstanding accessibility/iOS NOT VERIFIED, owner identifiers/signing/version decisions and historical dependency-audit limitation. Next prerequisite is a separate Phase 1 assignment. Phase commit message: docs: establish CashDriver refactoring baseline and rules; its hash is reported after committing, not invented here.

## Refactoring Phase 1 — separate screens (2026-10-09)

Status: **COMPLETE for structural screen refactoring**. Phase 0 commit: 05f5a3a. Six screen entries now live in src/screens/<Name>Screen/: Home, History, Summary, Settings, Details and Edit. Each consumes the existing feature hooks/components/services; screen-local static styles live beside their entry in five .styles.ts files. Edit needs no static stylesheet and retains LoadedEdit with key={record.id} and one-time useTransactions(id,false). AppNavigator imports six entries directly; obsolete feature screen files and TransactionScreens re-export removed. Route names, hooks, Providers, form, SQL, money, translations, palettes and configuration are unchanged.

Subagent phase1_screens owned screen/style files and removal only; main agent integrated navigator and documentation. Independent read-only phase1_review checked unchanged bodies/styles, edit draft identity, Home UUID refs, deletion lifetime and stale imports, with no confirmed issue. Tests/native entries already use App/AppNavigator and have no direct old screen imports, so no test/native-entry edits were required. Existing behavioral coverage reused; no new tests/hooks added or assertions weakened.

Fresh verification: npm run typecheck **PASS**; npm run lint **PASS**; full Jest with approved command-scoped workspace TEMP/TMP and TZ=UTC **20 suites / 196 tests PASS**, 9.111 s. One-off TypeScript AST comparison found all seven function declarations and five static styles identical to baseline after formatting. Production Android Metro bundle **PASS**, 19 assets, through index.js and relocated imports. The known ReactNativeFeatureFlags export-resolution and color-environment warnings remain; no dependency/config changes. Whitespace/review gates checked before phase commit, whose hash is reported after creation.

No native build/device/visual rerun: component JSX and style values are unchanged; bundle is graph verification, not native acceptance. Physical haptics FAIL, accessibility/system-restriction and iOS native NOT VERIFIED, owner identifiers/signing/version decisions and audit limitation remain. Full MVP acceptance is still NOT COMPLETE. Phase 2 is NOT STARTED and requires the next assignment. Phase commit message: refactor: separate CashDriver screens.

## Refactoring Phase 2 — hooks and creation orchestration (2026-10-09)

Status: **COMPLETE for the assigned structural scope**. Baseline Phase 1 commit: 867bcc2. Six existing hooks now live in src/hooks/app/, transactions/ and summary/, with unchanged bodies/effects/cleanup and updated imports. Home creation coordination moved into useCreatePayment(services,hapticsEnabled), preserving pending UUID/draft comparison, failed retry, commit-only reset/feedback, latest preference ref and [services] callback dependency. Screens/shared components/tests use the new paths. Daily/period/transaction loaders remain separate; provider accessors stay beside their context. No navigation/UI/style/provider/domain/SQL/schema/dependency changes.

Subagent phase2_hooks owned only moves/internal imports; main agent owned Home extraction, consumers/tests and integration. Independent read-only phase2_review found no regression or stale imports/cycles. AST comparison confirmed all six moved hooks unchanged apart from imports. Existing behavior tests reused, two direct hook test imports updated and new useCreatePayment.test.tsx adds two cases for the latest haptics selection changing during delayed real-SQLite save; no assertion weakening. Typecheck also covers unchanged native entries through their existing App imports.

Fresh npm run typecheck **PASS**, npm run lint **PASS**, full Jest with approved workspace TEMP/TMP and TZ=UTC **21 suites / 198 tests PASS**, 10.204 s. Production Android Metro bundle through index.js **PASS**; known export-resolution/color notices and experimental Node SQLite warning remain. No native build/device/visual rerun or tactile/iOS claims. Physical haptics FAIL, accessibility/iOS NOT VERIFIED, owner identifiers/signing/version and audit limitations remain; full MVP still NOT COMPLETE. Documentation and whitespace reviewed before the phase commit: refactor: organize hooks and screen orchestration (hash reported after creation). Phase 3 NOT STARTED; next assignment required.

## Required automated checks

- Language: matching translation keys for es/en/uk; initial Spanish, persistence/restart, localized date/money displays, unchanged integer-cent values and period boundaries, draft preservation, and preference write failure.

- Theme: explicit light/dark override system appearance; automatic follows it with light fallback; the selected mode survives restart; write failure restores the persisted choice without losing drafts.

- Money parsing: all valid/invalid examples in DATA_AND_CALCULATIONS.md; input upper bound.
- Calculation: exact payment, ordinary change, insufficient cash, full-change tip, and clearing the toggle after changes.
- Invariants: net = fare + tip; received = change + net; all saved amounts are integer cents.
- Summary: empty period, multiple platforms, tips excluded from fare average, tips included once in retained cash.
- Calendar boundaries: Monday week, month/year transition, and daylight saving dates using a supported test time zone.
- Persistence/service integration: create/read, edit preserving createdAt, delete, and two attempts for the same pending ID resulting in one record.
- Default platform: initial Uber; latest Inicio/Ajustes selection wins and survives restart; historical edits and settings changes do not overwrite an existing payment draft.
- Deferred deletion: undo leaves the record unchanged; expiry commits once; background before expiry cancels; failed deletion preserves the record and totals.

Run project type checks, lint, and the relevant tests. Do not claim native behavior was verified only from unit tests.

## Manual acceptance matrix

| Scenario | Expected result |
| --- | --- |
| Uber fare 20, received 50 | Change 30; retained 20 |
| Cabify fare 18, received 20, tip on | Change 0; tip 2; retained 20 |
| Bolt fare 24,50, received 20 | Insufficient message; cannot confirm |
| Otro fare 20, received Exacto | Change 0; no tip |
| Tap confirm repeatedly | One stored operation |
| Simulated save failure | Inputs preserved; retry possible |
| Restart/force-stop app | Previously saved operations remain |
| Restart device | Previously saved operations remain |
| Airplane mode | All core functions continue working |
| Edit fare/received/platform | Derived values and totals update; original date stays |
| Cancel deletion | Record remains |
| Confirm single deletion, then Deshacer | Pending deletion cancelled; original record and totals unchanged |
| Single deletion window expires while active | Record removed after successful commit; period totals update |
| Background/close before deletion window expires | Pending deletion cancelled; record remains after return/restart |
| Simulated deletion failure | Record and totals preserved; visible error and retry |
| Successful create/edit with tip | Message shows saved fare and tip separately, after commit |
| Inicio daily totals | Fare, tips, and retained cash have separate labels; no double counting |
| Edit an operation with tip | Payment form prefilled; monetary changes clear tip toggle; failed save keeps draft |
| Change platform in Inicio, then Ajustes, then restart | Latest explicit selection is the new default |
| Ajustes storage explanation | Device-only storage and potential data loss are explained; no backup promise |
| Change period/platform filter | Only matching operations appear |
| Empty history/summary | Helpful empty state and valid zero totals |
| App resumes after midnight | Current date and daily totals refresh |
| Keyboard open on narrow device | Input and actions remain reachable |
| Larger system text | Labels and monetary values remain readable |
| Delete-all cancelled/confirmed | Cancel preserves records; confirm removes operations |
| Select Claro/Oscuro | All screens, dialogs, inputs, and system bars where supported update; draft and navigation remain intact |
| Automático and system appearance change, including on resume | Palette follows the device; no app-specific schedule or permissions |
| Restart after selecting a theme | Saved mode restored before main screens; no wrong-theme flash |
| Both themes with larger text and keyboard open | Readable text, controls, error states, and monetary values; no clipping |
| Select Español/English/Українська, then restart | All labels/messages update and selection persists; EUR and transaction data stay unchanged |
| Switch language with a payment draft | Raw inputs, tip choice, navigation, and filters preserved |
| All languages on narrow screens with larger text | No clipped labels, amounts, or confirmation actions |

## Delivery report

Report implemented features, checks actually run, and unresolved issues separately for Android and iOS. Run the manual acceptance matrix on both platforms, including native builds, persistence/restart, keyboard, back navigation, safe areas, accessibility, and both themes. Verify haptics on supported physical devices. If iOS cannot be built in the environment, report `iOS NOT VERIFIED`; compatibility alone does not complete iOS delivery. Neither platform is complete when its core persistence or arithmetic checks fail.
