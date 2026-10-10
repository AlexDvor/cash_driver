# Collapsible tips — temporary implementation plan

Created 2026-10-10. Phases 0–2 COMPLETE; hook lifecycle implemented and tested; shared collapsed UI/animation NOT STARTED (Phase 3). Execute only the separately assigned phase. This plan does not restart historical MVP/refactoring or partial-tip phases. Preserve PARTIAL_TIPS_PLAN.md and its unresolved native gates.

## Agreed behavior

| Trigger/state | Required outcome |
| --- | --- |
| New payment | Collapsed; + Add tip button; blank tip means zero |
| Expand | Show existing MoneyInput, All change as tip and Remove tip; no autofocus/keyboard opening |
| Positive valid amount | Locale-formatted tip amount stays in header, including when collapsed |
| Collapse | Preserve exact monetary draft and retry identity; explicitly blur focused tip |
| Focused 5, followed by collapse | Existing blurred parser normalizes to 5,00; do not broaden submit parsing |
| Malformed/negative/over-limit/excess tip | Keep section open and error visible; confirmation remains blocked |
| Remove tip | Clear to blank/zero and collapse; available during invalid draft, disabled during save |
| Fare/received edit, quick amount or Exacto | Existing tip reset; preserve current expanded state |
| Platform/language/theme change | Preserve raw draft and expanded state |
| Successful create | Clear monetary draft and collapse without animation |
| Failed create/edit | Preserve complete draft and expanded state |
| Edit initialization | Expand if stored T > 0, otherwise collapse |
| Successful edit | Retain committed amount and current expanded state; cancel never writes |

Collapse eligibility checks optional blank-zero and the existing parser in blurred phase independently of payment.status (underpayment can mask malformed T). Compare T to available change when that difference is known; null available change alone is not an excessive-tip error. Fare/received errors retain their existing result/confirmation rules. Blur must use the latest raw draft and retain post-commit protection. Opening/closing alone must not mark monetary input changed, clear save failure, permit duplicate edit commit, or replace pending UUID.

## Implementation decisions

- Reuse usePaymentForm: add local tipExpanded and guarded expand/collapse/remove actions; do not persist visibility. Existing MoneyInput/PaymentForm stay shared by Home and Edit.
- Header precedes change result: collapsed zero uses + Add tip; expanded zero uses Tip; valid positive T uses existing localized tipAmount. Header has button role, expanded/disabled accessibility state and localized expand/collapse hint. Use existing minimum 48-unit targets and wrapping styles.
- Remove the duplicate positive-tip line below the change result; success message keeps committed F/T. Remove tip replaces the existing No tip action in this shared form; do not delete translation keys until all usages are checked.
- Hidden content must be excluded from touch and accessibility immediately on collapse, even while visual closing is running. Dismiss native tip focus/keyboard when hiding; opening never requests focus.
- Add matching addTip/removeTip/expandTip/collapseTip keys in ES/EN/UK per UI_DESIGN.md. No new dependencies, database fields, migration, service/repository APIs or arithmetic policy.
- Animated measured natural-height and opacity transitions: 180 ms, Easing.inOut(Easing.ease), JS driver for height. Measure inner content independently of its clipping wrapper. Remeasure for language/text scale/width/errors; stop prior animation on rapid toggle and target the latest state.
- Initial display and successful-create reset apply instantly; distinguish user-toggle from reset without involving persistence. Keep exact calculations/confirmation independent of animation completion.
- AccessibilityInfo initial Reduce Motion query plus reduceMotionChanged listener: disable animation until result, on read failure and when preference enabled. Preference changes stop running animation and apply target immediately. Cleanup subscriptions, async responses and animations on unmount.

## Ordered phases and gates

| Phase | Work | Gate / status |
| --- | --- | --- |
| 0 | Read-only current source/docs, lifecycle/test/hooks/environment baseline | COMPLETE; report below |
| 1 | This plan; align PROJECT_SPEC, UI_DESIGN, DATA_AND_CALCULATIONS, active guidance and permanent acceptance requirements | COMPLETE documentation only; code NOT STARTED |
| 2 | Hook expansion state, collapse/blur/remove, init/reset/retry/save guards; meaningful hook tests | COMPLETE; typecheck/lint PASS, Jest 24 suites / 242 tests PASS; independent read-only review; stop before UI |
| 3 | Shared header/content, translations, Animated/Reduce Motion/accessibility; adapt existing tests to explicitly expand | Fresh checks and independent review; native layout NOT VERIFIED by Jest |
| 4 | Real SQLite create/edit/hidden-tip storage/history/summary/retry regressions | Correct sums, unchanged ID/date, no duplicate rows; fresh checks/review |
| 5 | Actual current-build acceptance on isolated DB, Android and available iOS | Record platform results independently; required unavailable checks NOT VERIFIED; phase not COMPLETE while gates open |
| 6 | Durable permanent handoff; remove this file/references only after gates pass or explicit owner deferral | Preserve historical records/older unresolved gates; fresh checks/doc links |

After each executed phase run npm run typecheck, npm run lint and full npm test -- --runInBand --no-cache --watch=false; record actual counts, failures/fixes and environment exceptions. Review diff and links; reuse actual Git hooks without installing/bypassing hooks. For coding phases obtain bounded independent read-only review, commit only successful phase files, and stop at its boundary. Do not mix unrelated Android script changes into this extension.

## Required verification

1. New form collapsed; hidden input/actions absent from available controls; no-tip payment works.
2. 20/50/5 -> change25, header5 after collapse; hidden T persists on save.
3. Full-change action -> T30/C0; collapse preserves it.
4. Remove -> T0/C30 and collapsed; blank/explicit zero never becomes positive tip.
5. Invalid/excess T stays visible and blocks collapse/confirm, including malformed T under underpayment.
6. Focused 5, normalizes on collapse; delayed blur after remove/commit cannot restore previous text.
7. Monetary/quick/Exacto reset preserves expanded state; platform/language/theme preserve state/raw text.
8. Successful create resets instantly; failed writes preserve state/draft; pending controls/queued callbacks cannot mutate it.
9. Edit positive/zero initialization, exact prefill, cancel and successful edit preserve correct ID/createdAt.
10. Collapse/expand on unchanged failed retry keeps pending ID; repeated confirmation never duplicates.
11. Measured height changes, rapid toggles, Reduce Motion query/listener/failure/races/unmount and animation cleanup.
12. Native ES/EN/UK x light/dark, narrow/large-text layouts, keyboard/reachable controls, focus traversal, Reduce Motion, real create/edit/retry on isolated DB. Never seed test payments into production history.

## Phase 0 handoff

Read-only review completed 2026-10-10 on clean baseline commit 8bba332. Home/Edit already share PaymentForm/usePaymentForm; current section always visible, no expansion/animation state. Exact tip draft, money resets, completed-save epoch and busy/retry guards are reusable. MoneyInput has no imperative ref; handled keyboard taps mean collapse must explicitly finish tip editing. RN 0.87.1 locally provides Animated, isReduceMotionEnabled and reduceMotionChanged. No custom Reduce Motion implementation exists. Current scripts are tracked; no unrelated pending Android files. Existing core.hooksPath unset; only sample Git hooks, none available/run/installed/bypassed.

Fresh typecheck/lint PASS; full Jest 23 suites / 227 tests PASS, 15.554 s, exit0. Approved execution used absolute docs TEMP/TMP, TZ=UTC, docs/.collapsible-phase0-cache due to known sandbox realpath restriction; experimental Node SQLite warning remains. Generated caches removed after path containment checks; diff whitespace PASS and working tree clean. Independent read-only subagent confirmed parser/blur/underpayment/retry and height-measurement prerequisites. No native builds/UI/device controls performed; adb executable available, xcodebuild unavailable on Windows; Android/iOS acceptance NOT VERIFIED in Phase0. Historical haptics FAIL and native/release gates remain open.

## Phase 1 handoff

COMPLETE documentation-only scope. Updated product/UI/data contracts, AGENTS, domain guidance, README and permanent implementation boundary; created this plan. Independent read-only review found status-wording ambiguities, corrected to distinguish implemented partial tips from unimplemented collapse; old No tip table marked historical. Fresh typecheck/lint PASS; full Jest23 suites/227 tests PASS11.417s, exit0. Approved command-scoped docs TEMP/TMP, TZ=UTC and docs/.collapsible-phase1-cache; experimental SQLite warning remains. Checks are existing-code regressions, not proof of new UI. Generated caches removed; diff/links reviewed. No application/test/configuration edits or native execution. No active Git hooks installed/run/bypassed. Stop before Phase2. Retain this file until Phase6 gates pass.

## Collapsible-tip Phase 2 handoff

Completed 2026-10-10 for usePaymentForm lifecycle only. Added local tipExpanded, guarded expandTip/collapseTip/removeTip and tipResetCount for the later instant successful-create reset. Positive stored tips initialize expanded; zero/new drafts initialize collapsed. Collapse uses the latest raw tip and existing blurred parser, rejects malformed/negative/over-limit/excess tips independently of underpayment feedback, and preserves monetary draft/retry identity. Remove clears and collapses. Monetary/quick/Exacto resets retain visibility; platform changes retain raw text and visibility. Success-create clears/collapses; failed writes preserve draft/visibility; successful edit retains committed T/current visibility. Pending-save, completed-save epoch and unmount guards apply to section actions. Existing clearTip remains for the unchanged shared UI until Phase3.

Added collapsibleTipHook.test.tsx with 15 behavioral tests, including actual SQLite failed-create retry preserving UUID and exact 20/50/5 ->25 amounts, initialization, invalid-underpaid draft, normalization/stale blur, monetary resets, pending actions, create/edit success and duplicate protection. Independent read-only code and test reviews found no remaining actionable issues; existing tests were not weakened. Initial typecheck errors in new-test callback access were corrected with guarded accessors before final checks.

Final fresh npm run typecheck PASS; npm run lint PASS; full Jest 24 suites / 242 tests PASS, 9.549 s, exit0. Approved execution used command-scoped absolute docs TEMP/TMP, TZ=UTC, --runInBand --no-cache --watch=false and docs/.collapsible-phase2-cache for the known sandbox Node realpath restriction. Experimental Node SQLite warning remains. No new hooks, dependencies, model/service/repository/schema/configuration changes. No active Git hooks were available; none installed or bypassed. Shared UI, localization, native focus dismissal, animation and Reduce Motion are Phase3 work, not verified by this hook phase. No native builds/device checks performed; prior native/haptics gates remain open. Stop before Phase3.
