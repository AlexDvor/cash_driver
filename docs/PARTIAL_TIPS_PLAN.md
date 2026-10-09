# Partial tips — temporary change plan

## Status and authority

Created: 2026-10-09. Status: Phases 0–4 COMPLETE within assigned scopes; Phase 5 native acceptance pending.

The owner approved planning a partial-tip flow: fare EUR 20, cash received EUR 50, tip EUR 5, change returned EUR 25. This temporary plan records the proposed behavior and ordered work. Creating it does not authorize starting application implementation or restart historical MVP/refactoring phases. Execute only the next explicitly assigned phase and stop at its boundary.

Phase 1 reconciles PROJECT_SPEC.md, DATA_AND_CALCULATIONS.md and UI_DESIGN.md with the partial-tip target. Phases 2–3 implement exact-tip domain/persistence, v4 migration and the shared raw tip input/actions with automated verification; the old full-change switch is removed. Documentation requirements and automated tests do not prove native acceptance. Existing project instructions and unaffected behavior remain applicable. Remove this plan only in Phase 6 after its durable requirements, results and remaining gates have been transferred to permanent docs.

## Proposed payment behavior

- Preserve offline EUR payments, integer-cent arithmetic, existing input limits/parser, four platforms, languages, themes and shared create/edit form.
- Place a compact optional tip block after received cash and quick-value controls, before the prominent change result. Use one money input and two compact actions: No tip and All change as tip. Translate visible and accessibility strings into Spanish, English and Ukrainian; Spanish remains default.
- A blank tip means zero. An entered amount selects a partial tip; All change as tip fills the available difference; No tip clears the input. These are actions, not a second independent toggle controlling another tip amount.
- Let F = fare, R = received, T = tip, C = returned change, N = retained cash. Require F > 0, R >= F and 0 <= T <= R - F. Derive C = R - F - T and N = F + T = R - C. Persist only non-negative safe integer cents.
- For F=2000, R=5000, T=500: C=2500, N=2500. With no tip: C=3000, N=2000. With all change as tip: T=3000, C=0, N=5000.
- Incomplete/invalid fare or received cash cannot produce a valid change result. Empty tip is valid zero; malformed or excessive tip shows an inline error and disables confirmation. Never silently clamp an excessive tip or accept underpayment.
- Apply the existing money-parser draft/blur rules to tips too: a focused unfinished value such as `5,` is distinct from empty zero, normalizes to 500 cents on blur, and must not be saved through a separate permissive parser. Phase 1 must specify confirm/blur ordering consistently with the existing form. Preserve the 999,999-cent input maximum.
- Changing fare or received cash, including quick values and Exacto, clears the tip to zero. Platform, language and theme changes preserve the tip draft. Exacto sets R=F, T=C=0.
- Recalculate immediately; prominently display change to return and separately identify a positive tip. Keep existing success/reset-after-commit, failed-draft preservation, pending-ID retry and duplicate-save protection.
- Editing loads the actual saved tip amount, including legacy full-change tips, preserves ID/createdAt, and updates updatedAt only on success. Cancelling changes nothing. Use the same calculation and validation as creation.
- Daily/history/summary displays separate fare, tip and retained cash. Never treat received cash as revenue or double-count tips. Existing summary formulas remain applicable.

## Ordered phases

### Phase 0 — read-only implementation inspection

Scope: after explicit authorization to inspect beyond docs, read the actual calculations, service/repository, migration chain, shared PaymentForm, transaction hooks, translations and relevant tests. Identify existing React hooks, Git hooks and available checks. Inspect current draft/retry/edit behavior and database constraints; do not infer them from historical docs alone. No code or configuration edits.

Deliverable: concise mapping of reusable files/hooks, current schema version, affected checks and blockers recorded here. Run the existing baseline typecheck, lint and full Jest suite; record actual outcomes and environment limitations. Do not install a hook framework or bypass existing failing Git hooks. Gate: affected implementation is mapped and baseline failures are resolved within separately authorized scope or explicitly reported as blockers.

### Phase 1 — permanent documentation contracts

Scope: update PROJECT_SPEC.md (partial-tip scope), DATA_AND_CALCULATIONS.md (input, arithmetic, edit and migration requirements), UI_DESIGN.md (block/actions/errors), and relevant acceptance requirements in IMPLEMENTATION_PLAN.md. Reconcile active instructions/local domain guidance, explicitly docs/agent_skills/cashdriver-domain/SKILL.md, that would otherwise require full-change-only behavior; preserve historical handoffs as historical. Do not overwrite old validation records or restart completed phases.

Describe a non-destructive migration removing the full-change-only constraint while preserving all other invariants, rows, IDs, timestamps, indexes and preferences. Determine its concrete version from Phase 0; do not assume it from historical handoffs. No new CashTransaction monetary fields are planned; verify this against implementation first.

Gate: no conflicting active partial/full-change-only requirements, documented scenarios and clear code-phase acceptance criteria. Verify Markdown links, references and diff. Run the existing typecheck/lint/Jest commands after this phase as requested by the owner, but identify them as baseline regression checks rather than evidence that the feature works. No application code changes.

### Phase 2 — domain calculations and persistence

Scope: extend existing pure calculations, service-side validation, repository decoding and summary validation for explicit T; keep SQL in repositories/database migrations. Add the verified next schema migration using existing transactional migration mechanisms. Include exact T in pending-input comparisons in service and useCreatePayment; adapt existing form input at its boundary so the old full-change UI remains functional until Phase 3. Preserve retry identity, duplicate guards, original creation time and commit-only notifications; avoid a second money-policy implementation.

Checks: no/partial/full tips, exact payment, underpayment, excessive/negative/malformed amounts, cent precision and money invariants; service rejects invalid writes independently of UI. Use existing real-SQLite integration coverage for upgrade from supported prior schemas, legacy rows with/without tips, indexes/preferences, idempotent initialization, rollback/failure behavior and partial-tip create/read/edit. Do not wipe or fabricate records.

Gate: typecheck, lint and full Jest pass; migration/data-preservation behavior is covered. Native migration/restart checks that cannot yet run stay NOT VERIFIED and remain required in Phase 5.

### Phase 3 — shared form and React hooks

Scope: implement the agreed block once in shared PaymentForm for Home and Edit. Reuse the actual payment/create/edit hooks identified in Phase 0; hooks coordinate drafts/lifecycle/services, while pure functions own arithmetic. Add a focused hook only when an existing one cannot cover a cohesive responsibility. Preserve raw input, stale-response guards, cleanup, save state, accessibility, keyboard access, tokens and reactive theme. Do not introduce a state framework or new dependencies without a demonstrated need.

Checks: enter 5 on 20/50 -> change 25; all-change and no-tip actions; invalid-tip errors; amount changes reset tip; Exacto; legacy and partial-tip edit prefill; cancellation; language/theme/platform draft preservation; successful save reset; failed save preserves tip; retries/repeated taps do not duplicate. Verify matching translation keys and localized messages.

Gate: typecheck, lint and full Jest pass; shared create/edit behavioral checks pass. Record native/visual observations separately from component tests.

### Phase 4 — history and summaries integration

Scope: verify existing detail/history/success/daily/period displays can show simultaneous nonzero tip and change. Change only confirmed incompatibilities. Reuse current summary calculations and refresh hooks; do not add new statistics or change fare averages/calendar rules.

Checks: stored 20/50/5 operation shows fare 20, received 50, change 25, tip 5, retained 25; totals include tip once; edit refreshes totals without a duplicate row or date change; existing deletion/undo and empty-period behavior remains intact. Reuse coverage where sufficient.

Gate: typecheck, lint and full Jest pass; persisted-to-display and refresh behavior verified.

### Phase 5 — native acceptance and final review

Scope: verify affected create/edit/history/summary flows offline on available Android/iOS devices, both themes and all languages, narrow layout, large text, keyboard and accessibility. Check upgrade with existing history, persisted partial tips after app/device restart, error/retry, exact/no/full-tip regressions and repeated confirmation. Build affected native targets through existing project commands/configuration.

Gate: fresh typecheck/lint/full Jest and actual native build/acceptance results recorded separately by platform. Unavailable checks stay NOT VERIFIED; failed checks stay FAIL. Existing unresolved physical haptics, iOS, signing/release and other acceptance gates remain open unless independently verified. Do not claim complete feature/native acceptance when required scenarios remain unverified. If blocked, preserve this plan and report the remaining work.

### Phase 6 — durable handoff and temporary-plan removal

Prerequisite: implementation phases passed and required acceptance gates resolved; any deferred gate requires explicit owner agreement and a permanent record, without a false readiness claim.

Scope: transfer final behavior, architecture impact, actual test/build results, React/Git hooks used, review findings, decisions and remaining limitations into permanent docs, principally IMPLEMENTATION_PLAN.md. Check active docs agree. Remove links to this temporary plan and delete only docs/PARTIAL_TIPS_PLAN.md once nothing necessary exists exclusively here. Preserve historical MVP/refactoring records.

Checks: documentation diff, links and stale references; run typecheck/lint/full Jest after this phase as requested. Record these final checks in permanent docs because this file will be deleted. Gate: durable handoff is complete and no active reference requires the removed file.

## Review, verification and phase boundaries

- Use bounded subagents as requested: read-only review of this plan and each phase's changed docs/code/tests. Main agent owns edits and integration; reviewers do not start later phases or modify shared files.
- For each phase, review requirements and meaningful failure/regression coverage. Resolve confirmed findings before completion; rerun affected checks after fixes. Do not mark a phase complete merely because files changed.
- Execute the project's existing npm run typecheck, npm run lint and npm test -- --runInBand --no-cache --watch=false after every executed phase, verifying actual scripts/environment in Phase 0. Record commands, counts and results actually obtained. Never copy historical PASS as a fresh result.
- React hooks are application orchestration; Git hooks are automated checks; review subagents are reviewers. Report each separately. Use existing Git hooks when applicable; do not create or bypass hooks merely to satisfy this plan.
- A failure blocks dependent phases. Report unavailable checks and preserve remaining gates. Tests do not prove native storage, visual layout, screen-reader or tactile behavior.
- This planning-only creation does not run application tests or inspect implementation outside docs. Its verification is documentation review. Code phases require explicit assignment under docs/AGENTS.md.

## Progress / phase handoff

| Phase | Status |
| --- | --- |
| Plan creation | COMPLETE — read-only subagent review; parser draft/blur and local domain-guidance clarifications incorporated. Documentation inspected; application checks not run. |
| 0 — Inspection | COMPLETE — read-only implementation inspection and fresh baseline checks; handoff below |
| 1 — Contracts | COMPLETE — permanent contracts aligned, read-only subagent review and fresh baseline checks passed |
| 2 — Domain/persistence | COMPLETE — exact T, transactional v4, existing-form adapter; typecheck/lint and 22 suites / 219 tests PASS |
| 3 — Form/hooks | COMPLETE — shared raw input/actions, translations and review; typecheck/lint and 23 suites / 226 tests PASS; native acceptance pending Phase 5 |
| 4 — History/summaries | COMPLETE — persisted display/edit refresh and partial-tip deletion regression; 23 suites / 227 tests PASS |
| 5 — Native acceptance | IN PROGRESS — Android builds/typecheck/lint/23 suites 227 tests PASS; device controls clarification pending; iOS NOT VERIFIED |
| 6 — Handoff/removal | NOT STARTED |

After each executed phase record: authorized scope; changed files and responsibilities; tests added/reused; React hooks reused/introduced; Git hooks actually run; subagent findings and resolutions; commands/results; native checks per platform; blockers/owner decisions; next phase prerequisites. Stop before the next phase.

### Phase 0 handoff — 2026-10-09

Authorized scope: inspect actual implementation read-only, run baseline checks and record findings. No application, test, dependency, script or configuration changes. Only this temporary documentation plan was updated; temporary Jest artifacts under docs were removed. No implementation phase started.

#### Actual reuse map

| Files | Existing responsibility / reuse |
| --- | --- |
| src/features/transactions/types.ts, money.ts, payment.ts | CashTransaction already has tip/change/net fields; PaymentAmounts currently has boolean changeAsTip. Reuse integer-cent parser, validation, pure arithmetic and quick/Exacto functions. |
| src/features/transactions/transactionService.ts | Service recalculation, write validation, pending-write concurrency guard and commit-only notifications. |
| src/features/transactions/transactionRepository.ts | SQL, transactional writes, row decoding, persisted pending-ID conflict protection, original createdAt preservation during edit. |
| src/database/migrations.ts, sqlite.ts | Current SCHEMA_VERSION is 3. Transactional migration chain, quick_check, integer/bound constraints, indexes/preferences and future-version rejection. Next proposed migration is v4 if baseline remains unchanged; recheck before implementation. |
| src/components/PaymentForm/PaymentForm.tsx, PaymentForm.interface.ts, PaymentForm.styles.ts | Shared Home/Edit form, reusable MoneyInput, theme tokens, errors, saving/retry/success. Existing tip switch is after result; proposed block moves before result. |
| src/hooks/transactions/usePaymentForm.ts | Raw draft, parser focus/blur, quick values, defaults, submit guards, failed-draft retention, committed reset and stale native-blur protection. Extend this hook; no second form-state owner is needed. |
| src/hooks/transactions/useCreatePayment.ts | Stable pending operation on unchanged retry, replacement for changed input, post-commit haptics. |
| src/hooks/transactions/useTransactions.ts, src/hooks/app/useDataChanges.ts | Existing record refresh/subscriptions; preserve for history/edit integration. |
| src/hooks/summary/useDailySummary.ts, usePeriodSummary.ts | Refresh on transactions/resume and period/date changes, stale-response protection and cleanup. Reuse rather than add a parallel summary hook. |
| src/screens/HomeScreen/HomeScreen.tsx, src/screens/EditScreen/EditScreen.tsx | Compose the shared form/hooks; Edit supplies initial values and edit callback. |
| src/features/summary/summary.ts, src/screens/DetailsScreen/DetailsScreen.tsx, src/i18n/translations.ts | Separate monetary totals/details and existing three-language success/tip text. Summary validation also currently assumes full-change-only tips. Add only necessary new translation keys. |

#### Confirmed dependencies for later phases

1. SQL CHECK in migrations.ts forbids positive tip and change together. Phase 2 needs a non-destructive migration, preserving historical migration semantics, records, indexes and preferences.
2. Repository decodeTransaction recalculates with changeAsTip: tipCents > 0 and rejects partial-tip rows even after a SQL-only change. Update decoding/validation to use actual T in Phase 2.
3. summarizeTransactions in summary.ts makes the same boolean conversion. This is a domain validation dependency: update it in Phase 2 alongside calculatePayment, including summary regression tests. Phase 4 remains responsible for display/refresh integration; do not leave a knowingly incompatible summary until then.
4. useCreatePayment and transactionService pending-input comparisons must include actual T so a changed tip cannot reuse the wrong operation or join a different in-flight write. Repository already compares persisted tipCents.
5. Edit initial values and usePaymentForm post-save state reconstruct tip as boolean. Phase 3 must preserve exact saved T, including partial amounts, through load/save/retry.
6. parseMoneyInput returns incomplete for blank; optional tip needs blank-only zero interpretation. Focused `5,` is draft, blurred is valid 500 cents. Current form submits before dismissing the keyboard and rejects focused unfinished drafts. Phase 1 must document the same explicit focus/blur boundary for the new tip input; do not silently accept unfinished text. Preserve delayed-blur guards after quick taps and commits.
7. Existing raw fare/received edits clear the tip; quick/Exacto route through that reset. Platform changes preserve the monetary draft. Maintain these behaviors.

These are feature dependencies, not newly discovered failures of the current full-change-only implementation. No new monetary model fields or dependencies are required by the inspected scope.

#### Fresh baseline verification

| Command / check | Actual result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0 |
| npm test -- --runInBand --no-cache --watch=false | Initial sandbox run could not start: EPERM in Node realpath of sandbox TEMP. Redirecting TEMP/TMP to the allowed visualization directory also failed. |
| npm test -- --runInBand --no-cache --watch=false --cacheDirectory=docs/.phase0-test-cache | PASS, 21 suites / 199 tests, 13.688 s, exit 0; command-scoped TEMP/TMP set to absolute docs path, TZ=UTC, approved execution outside sandbox after realpath also failed for docs. No configuration edits. Temporary cache removed afterward. |
| Git hooks inspection | core.hooksPath unset; .git/hooks contains only .sample files; no .husky/custom hook configuration found. No active Git hook available or executed; no hook installed or bypassed. |
| Subagent review | Read-only implementation review completed; confirmed repository decoder, edit prefill, pending-input equality and parser/native-blur dependencies. Findings incorporated into this handoff. Main agent additionally confirmed summary validator dependency. |

Jest emitted Node's experimental SQLite warning; tests passed. Existing real-SQLite coverage was reused for baseline verification, not extended: persistence.test.ts covers migrations, preservation, rollback, future-version rejection, corrupt storage, create/edit/retry/concurrency and constraints. Existing payment/money/summary, usePaymentForm/useCreatePayment, Inicio/history/summary and translation suites cover the current feature. No new tests or React hooks were introduced in this inspection.

Git reported no tracked changes at inspection start or after the handoff. However, git check-ignore confirms .gitignore line 67 ignores docs, so git status/diff does not capture this plan's changes. The plan exists locally; no ignore rule was modified and no force-add/commit performed. Final edited-file scope is this plan only; generated Jest and Node compile caches under docs were removed. Baseline checks prove existing behavior passes the automated suite; they do not validate partial tips, which remain unimplemented.

#### Remaining gates and next boundary

No baseline code failures remain. Native builds/device flows, upgrade/restart, visual/keyboard/accessibility and tactile behavior were not exercised in Phase 0. Android native acceptance: NOT VERIFIED in this phase. iOS native acceptance: NOT VERIFIED in this phase. Historical haptics FAIL and other release/native gates are not resolved by these automated checks.

Phase 0 is COMPLETE. Phase 1 prerequisites are available: actual schema v3 and reuse/dependency map, passing baseline, proposed behavior and independent review. Next permitted work requires explicit Phase 1 assignment and changes only permanent documentation contracts; application implementation remains NOT STARTED. Stop here.

### Phase 1 handoff — 2026-10-09

Status: COMPLETE for documentation-only scope. No application/test/configuration/dependency changes, no new hooks, no native build or device acceptance. Partial-tip implementation and v4 migration remain NOT STARTED; the inspected app schema is still v3.

File-by-file changes:

- PROJECT_SPEC.md: optional exact tip input/actions, shared edit flow, partial/full-tip scope and 20/50/5 -> 25 example; explicit unimplemented-target notice.
- DATA_AND_CALCULATIONS.md: exact T input authority; blank-zero versus draft/blur; invalid/excess/underpayment results; actions/reset and delayed-blur protection; target schema preserving integer/input constraints; transactional v4 requirements; exact T in decoder/summary/retry/edit; pending UUID comment corrected.
- UI_DESIGN.md: compact block before result, replaces old switch, availability/error/keyboard rules, ES/EN/UK texts and exact edit prefill/post-save behavior; reference switch marked historical.
- IMPLEMENTATION_PLAN.md: current extension boundary above historical material, implementation ordering and expanded automated/manual acceptance scenarios. Historical results remain unchanged.
- AGENTS.md and agent_skills/cashdriver-domain/SKILL.md: current exact-tip contracts take precedence over historical full-only descriptions; phase/review/hooks/test requirements retained.
- README.md: extension status and temporary-plan entry, without claiming implementation readiness.
- PARTIAL_TIPS_PLAN.md: updated Phase 1 status and Phase 2 dependency ordering; this handoff.

Independent read-only subagent review found no blocking active full-only conflict. Its minor delayed-blur clarification for No tip/All change actions was incorporated into the input contract. Existing React hooks are documented for reuse; no active Git hooks were available in Phase 0, and none installed/bypassed here.

Fresh checks: npm run typecheck PASS (exit 0); npm run lint PASS (exit 0); npm test -- --runInBand --no-cache --watch=false --cacheDirectory=docs/.phase1-test-cache PASS, 21 suites / 199 tests, 8.825 s, exit 0. Jest used command-scoped absolute docs TEMP/TMP and TZ=UTC with approved execution outside sandbox due to Phase 0 realpath restriction; emitted the experimental SQLite warning. Temporary Jest/Node compile caches removed. Local Markdown file links checked successfully; active full-only statements searched and reconciled, historical handoffs retained. These are existing-code baseline checks, not validation of partial tips. No new tests were added for documentation-only work.

Android/iOS native feature acceptance remains NOT VERIFIED in this phase; historical haptics/native/release gates remain open. Phase 2 prerequisites are now documented: explicit-T contracts, migration v4 target subject to baseline recheck, legacy-form boundary adaptation, decoder/summary/retry dependencies and acceptance criteria. Stop before Phase 2; start only on its explicit assignment.

Final Git/reference check: git diff --check PASS; Git reports six tracked documentation files changed. PROJECT_SPEC.md and this temporary plan are ignored by .gitignore line 67 and exist only locally; the other edited docs are already tracked despite that ignore rule. This clarifies the broader ignore observation in the Phase 0 handoff. No ignore rules, staging or commits changed. No application files appear in git status. Local Markdown links PASS; Git's LF/CRLF notices are line-ending conversion notices, not failed checks.

### Phase 2 handoff — 2026-10-09

Status: COMPLETE within the assigned domain/persistence phase. Permanent detailed handoff is recorded in IMPLEMENTATION_PLAN.md under Partial-tip Phase 2 handoff. Rechecked baseline v3 and implemented SCHEMA_VERSION=4; new input/actions UI, native build/device acceptance and Phase 3 remain NOT STARTED/NOT VERIFIED as applicable.

Changed responsibilities:

- types.ts, money.ts, payment.ts: explicit numeric T, integer/bound/available-change validation and reset helpers. No CashTransaction columns added.
- transactionService.ts, transactionRepository.ts, summary.ts: exact T write/retry/concurrency/row/summary validation and derived values; no boolean reconstruction or double counting.
- migrations.ts and src/database/README.md: transactional v4 table replacement, historical v1 schema unchanged, indexes/rows/preferences preserved; documented native-verification limits.
- useCreatePayment.ts: exact T determines unchanged versus changed pending input.
- usePaymentForm.ts, EditScreen.tsx: numeric T at the legacy form boundary and exact edit prefill/commit state; old full-change switch remains derived UI compatibility, not separate monetary authority. No new UI block implemented.
- Tests: new partialTips.test.ts; updated payment/persistence/summary/useCreatePayment/usePaymentForm suites and existing shared fixtures/history/deletion/summary/native acceptance entries for exact T. Native fixture edits are compatibility changes, not fresh native verification.
- Documentation: current status notices and durable handoff updated; historical verification remains historical.

Subagents: one implementation subagent owned only the new real-SQLite test file (17 targeted tests PASS); a separate read-only reviewer inspected changes and rereviewed requested hook regressions after addition. Confirmed findings resolved; no remaining blocking code-review issues. Main agent owns integration. React hooks reused: usePaymentForm/useCreatePayment; refresh hooks retained. No active Git hooks, no new dependencies/hooks/framework or configuration changes.

Final fresh checks: typecheck PASS; lint PASS; full Jest **22 suites / 219 tests PASS**, 8.819 s, exit 0, after correcting 7 outdated Resumen fixture failures without weakening assertions. Approved outside-sandbox Jest used absolute docs TEMP/TMP, TZ=UTC, --runInBand --no-cache --watch=false --cacheDirectory=docs/.phase2-test-cache. Experimental SQLite warning remains. Generated docs caches and the subagent-generated workspace node-compile-cache were removed after verified workspace-contained path checks. Native migration/restart/build/visual/accessibility remains NOT VERIFIED in this phase, historical haptics/release gates remain open.

Next prerequisite: Phase 3 can build the raw tip input/actions on the verified exact-T contract and existing hooks; its parser/action/draft/translation/native UI acceptance is still required. Stop before Phase 3. PROJECT_SPEC.md and this temporary plan remain ignored local docs; ignore rules are unchanged.

Implementation commit: `4a1d1d9` (24 source/test files including database README). Only Phase 2 implementation files were staged; earlier documentation changes and phase handoffs remain uncommitted/local. No push, no hook bypass; approved Git execution overcame sandbox index.lock denial. Staged diff whitespace check PASS.

### Phase 3 handoff — 2026-10-09

Local implementation commit: `3f20d77`; nine source/test files only. Documentation updates remain uncommitted; this temporary plan remains a local ignored file. No push performed.

Status: COMPLETE for the assigned shared-form/hooks/automated scope; detailed durable handoff in IMPLEMENTATION_PLAN.md. Phase 4, native acceptance and temporary-plan removal not started.

File-by-file changes:

- src/hooks/transactions/usePaymentForm.ts: one raw tip string and parsed cents, blank-zero/focus/blur, independent available change, action setters, monetary reset, raw failure preservation and exact edit commit. Removed legacy boolean/switch API; kept save/retry/default/stale-blur guards.
- src/components/PaymentForm/PaymentForm.tsx and PaymentForm.styles.ts: optional MoneyInput and two wrapped accessible small actions before change; inline localized errors, disabled writes, old switch/styles removed; shared Home/Edit flow retained.
- src/i18n/translations.ts: matching five tip keys in ES/EN/UK; obsolete changeIsTip removed.
- __tests__/partialTipForm.test.tsx: seven real UI/SQLite integration cases including partial payment, validation/action availability, blur/reset/Exacto, raw language/theme preservation, failed create/edit retry and cancellation.
- __tests__/Inicio.test.tsx, Historial.test.tsx, Ajustes.test.tsx, usePaymentForm.test.tsx: old switch assertions updated to input/actions; pending save additionally tests disabled tip controls and ignored direct queued callbacks.
- Permanent docs: current implementation notices and Phase 3 handoff updated, historical handoffs preserved.

Reused hooks: usePaymentForm/useCreatePayment; no new hooks/dependencies/configuration. Subagent implementation restricted to new test file; independent read-only review findings resolved and rereviewed. No active Git hooks existed; none installed/bypassed. Final fresh typecheck/lint PASS; full Jest **23 suites / 226 tests PASS**, 9.5 s, exit 0, approved outside-sandbox execution with docs TEMP/TMP, TZ=UTC and docs/.phase3-test-cache. Experimental SQLite warning remains. Earlier three type errors in new test act callbacks were corrected without suppressions; final full checks rerun. Generated temporary caches removed.

Source layout/reference review completed; no native build/install/device/UI automation, visual/keyboard/text-scale/screen-reader or tactile acceptance performed. Android/iOS native acceptance remains NOT VERIFIED; existing historical haptics/release gates remain open. Phase 4 can now review persisted-to-display/summary refresh integration on this verified shared form; do not start it without assignment. Ignored PROJECT_SPEC.md and this plan remain local; ignore rules unchanged.

### Phase 4 handoff — 2026-10-09

Local verification commit: `7186c66`, two test files only; documentation handoffs remain outside this commit. No push.

Status: COMPLETE for assigned history/summary integration scope. No confirmed production incompatibility; application source unchanged. Durable file-by-file handoff is in IMPLEMENTATION_PLAN.md. partialTipForm.test.tsx now checks actual 20/50/5 success/history/five detail amounts/daily/all period totals, then partial edit refresh without duplicate or ID/date change; next-day exclusion preserves calendar behavior. Resumen.test.tsx reuses deletion/undo/failure/retry with partial tip and nonzero change, preserved failure totals and zero post-delete totals. Existing empty-period/calendar/deletion-race coverage reused.

Independent read-only review/rereview: no remaining actionable defects. Existing useTransactions/useDailySummary/usePeriodSummary/useDataChanges/useLocalClock reused; no new React hooks. No active Git hooks (core.hooksPath unset; samples only), none installed/bypassed. Initial test-only detail lookup and fake-clock timing failures corrected. Final fresh typecheck/lint PASS; full Jest 23 suites / 227 tests PASS, 9.522 s, exit 0. Approved execution used docs TEMP/TMP, TZ=UTC and docs/.phase4-test-cache; experimental SQLite warning remains. Temporary caches removed, whitespace checked. Native Android/iOS acceptance/build/restart/visual/accessibility NOT VERIFIED; historical haptics/release gates remain open. Stop before Phase 5; separate assignment required. Temporary plan retained; ignored docs remain local, no ignore changes/push.

### Phase 5 handoff — in progress, 2026-10-09

Fresh Android production-entry :app:assembleDebug :app:assembleRelease PASS, 25s, 459 tasks (55 executed / 404 up-to-date). Typecheck/lint PASS; full Jest 23 suites / 227 tests PASS, 9.92s, exit0, approved docs TEMP/TMP/TZ=UTC/cache. Existing warnings and debug release signing remain. Read-only adb inventory: emulator-5554 API34 x86_64, existing com.tempapp; no physical device. xcodebuild unavailable, iOS NOT VERIFIED. No installation/UI/device controls or production data change. Subagent read-only review completed; existing native persistence fixture tests full tip/v1, not current partial restart/v3 migration. Source review cannot establish native UI/accessibility.

Previous owner computer-use/device-control exclusion documented in historical handoff; clarification requested before dependent emulator controls. Required offline/UI/language/theme/large-text/keyboard/accessibility/migration/process-and-device-restart/retry/regression checks remain pending. Phase5 NOT COMPLETE; preserve temporary plan. Physical haptics historical FAIL unresolved. Phase6 not started. Detailed permanent handoff: IMPLEMENTATION_PLAN.md.