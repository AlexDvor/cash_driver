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
