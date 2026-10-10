# Collapsible tips — native acceptance, 2026-10-10

Phase 5 status: **PARTIALLY VERIFIED / NOT COMPLETE**. Android emulator evidence below covers selected scenarios on the current implementation at baseline `8cd6614`. iOS and mandatory accessibility/motion scenarios remain **NOT VERIFIED**. The separately assigned Phase6 documentation handoff may proceed; do not close Phase6 or remove either temporary tip plan on this evidence alone.

## Environment and isolation

- Windows host; Android emulator `emulator-5554`, API34, x86_64. No connected physical device; no available macOS/Xcode environment.
- Native embedded JS bundle, React Native/Hermes and real op-sqlite. Build/install before UI evaluation; no Metro connection required for this bundle.
- Separate test application ID `com.tempapp.collapsibletest`, checked with `aapt dump badging` before the final isolated installations. Separate databases `cash-driver-inicio-test.sqlite` and `cash-driver-collapsible-test.sqlite`; test transactions entered manually, no production-history fixtures.
- Normal test bundle uses existing `__tests__/nativeInicioEntry.tsx`. Fault bundle used the local `__tests__/nativeCollapsibleTipsEntry.tsx` acceptance entry: real application/services/repository, first INSERT and first UPDATE per process rejected by a native query against a deliberately absent table. Subsequent attempts use normal persistence. This entry is currently untracked and is not included in this documentation-only handoff; reproducible committed fault-fixture delivery remains pending a separately authorized test-file change. Production `index.js`, application code and tracked native configuration were not changed by this verification.
- Temporary Gradle init/Metro configuration selected the test package/entry without editing tracked configuration. APKs, temporary build helpers and database copies are not delivery artifacts; retain the selected screenshots/XML, filtered write log and JSON row evidence instead.

## Observed Android results

`PASS` means only the observed scenario on this emulator, not every device, language/text-size combination or iOS.

| Scenario | Result | Evidence / scope |
| --- | --- | --- |
| Fresh form collapsed; expansion does not autofocus | PASS | Initial + Add tip; expanded inputs not focused. Collapsed tip input/actions absent from UIAutomator control tree. Screen-reader traversal separately unverified. |
| 20/50/5, followed by collapse | PASS | Blur normalizes to5,00; header retains T5 and result C25; tip controls hidden. [Screenshot](native-collapsible-tips-2026-10-10/03-es-collapsed-five.png), matching XML. |
| All change as tip, then collapse | PASS, UI only | T30/C0 remained visible in header/result. Native full-tip persistence not separately exercised in this phase. |
| Remove tip | PASS, UI only | T0/C30, collapsed. [Screenshot](native-collapsible-tips-2026-10-10/04-es-removed.png). |
| Excess trailing draft31, with F20/R50 | PASS | Error visible, collapse rejected, raw draft retained, confirm disabled. [Screenshot](native-collapsible-tips-2026-10-10/05-es-excess-open.png). Native malformed/negative variants not separately verified. |
| Successful collapsed create and reopen | PASS | One actual integer-cent row F2000/R5000/T500/C2500/N2500; form cleared/collapsed; history survives force-stop/reopen. [SQLite evidence](native-collapsible-tips-2026-10-10/sqlite-evidence.json). |
| Positive-tip edit, collapse, save | PASS | Starts expanded at T5; saved T700/C2300/N2700; original ID and createdAt unchanged, updatedAt set. JSON before/after rows. |
| Create failure, visibility-only toggles, retry | PASS | Native SQL error retains collapsed T5/C25 and retry action. Both INSERT attempts share UUID; one stored operation. [Failure](native-collapsible-tips-2026-10-10/19-native-insert-failed.png), [retry](native-collapsible-tips-2026-10-10/20-native-insert-retry.png), [write log](native-collapsible-tips-2026-10-10/native-write-attempts.log). |
| Edit failure, visibility-only toggles, retry | PASS | Native error retains collapsed T7/C23; both UPDATE attempts use original UUID. Successful row retains successful-create createdAt and uses successful-retry updatedAt. [Failure](native-collapsible-tips-2026-10-10/21-native-update-failed.png), [retry](native-collapsible-tips-2026-10-10/22-native-update-retry.png), log/JSON. No pre-retry native row snapshot: rollback-before-retry is covered by Phase4 tests, not separately proven here. |
| Cancel positive-tip edit | PASS | Changing T7 to9 then Cancel leaves the complete persisted row exactly equal, including timestamps; details retain T7. [Screenshot](native-collapsible-tips-2026-10-10/23-native-edit-cancel.png), retry/cancel JSON rows. |
| ES/EN/UK, light and dark, normal width | PASS, selected Home views | Six screenshots08–13, T5/C25 header/result; existing fare/received draft retained across preferences. UK native formatter displays EUR. This is not full-screen/all-error-state localization acceptance. |
| Narrow width320dp, fontScale1.5, keyboard/scrolling | PARTIAL; layout limitation | Tip field/actions reachable; focused input visible with keyboard. Edit result and save reached by scrolling. UK result wraps currency as E / UR; stack title ellipsizes. [Screenshot](native-collapsible-tips-2026-10-10/18-uk-narrow-large-edit-bottom.png). Do not mark full large-text layout gate passed. |
| System font/size change | LIMITATION | Activity recreation cleared an unsaved Home draft. Persisted transactions survived. This does not contradict the separately observed preservation during in-app language/theme changes; lifecycle improvement requires a separately scoped change. |

### Exact native storage evidence

Normal create UUID `665ea2e2-f039-46b6-ac3f-f4749c4c805d`, createdAt `2026-10-10T09:51:34.200Z`; edit retained both, updatedAt `2026-10-10T09:52:56.634Z`.

Fault/retry UUID `b04b4b64-bf6b-40d2-afc0-058cb42e1545` is shared by failed/successful INSERT and both UPDATE attempts. Persisted createdAt is successful INSERT time `2026-10-10T10:07:24.816Z`; updatedAt is successful UPDATE time `2026-10-10T10:08:31.866Z`. One row remains after retry and cancel. SQLite tip storage type is integer. JSON was extracted read-only from copies of the isolated native databases after force-stop; no production database was inspected.

## Open mandatory gates

| Gate | Android | iOS |
| --- | --- | --- |
| TalkBack/VoiceOver actual focus order, announcements, hidden-control traversal | NOT VERIFIED; no active TalkBack service | NOT VERIFIED |
| Reduce Motion initial setting/live change/failure behavior on device | NOT VERIFIED | NOT VERIFIED |
| Actual180ms motion, smooth interruption on rapid taps, native resize/error measurement | NOT VERIFIED; still images do not prove animation timing | NOT VERIFIED |
| Complete all-language/theme narrow/large-text keyboard matrix | NOT VERIFIED; selected UK scenarios only, observed wrapping limitation | NOT VERIFIED |
| Native no-tip/zero-edit, malformed/negative text, quick/Exacto resets, platform draft preservation, concurrent confirmation | NOT VERIFIED in this phase; existing automated coverage remains separate | NOT VERIFIED |
| Physical-device/haptics acceptance | NOT VERIFIED; historical physical haptics FAIL remains open | NOT VERIFIED |

No available iOS build/install/run was performed. Previous partial-tip/release/native gates remain open; these observations do not close unrelated acceptance criteria.

## Installation incident and cleanup

The first temporary init script set applicationId too early; app configuration overwrote it with `com.tempapp`. That APK was mistakenly installed over the emulator's production package before the failed attempt to launch the absent test package revealed the problem. The test entry was not launched under production; app storage was not cleared or uninstalled. The owner was informed immediately. A normal production debug APK was rebuilt and reinstalled without opening or reading production history. Preservation of every production row was not independently inspected or asserted.

The init script was corrected to apply after project evaluation. Subsequent test installations used the verified separate ID. At completion the new test package was uninstalled, its device capture files removed, display override reset to physical1344x2992 and fontScale restored to1.0. `com.tempapp` remains installed. A standard production release artifact was rebuilt without the temporary init/entry override (BUILD SUCCESSFUL42s,277 tasks; aapt package com.tempapp); it was not installed or launched. Production credentials/signing/release publication were not part of this phase.

## Automated checks and review

Fresh `npm run typecheck`: PASS. `npm run lint`: PASS. Full `npm test -- --runInBand --no-cache --watch=false --cacheDirectory=docs/.collapsible-phase5-cache`: **25 suites / 256 tests PASS, 11.851s**, exit0. Command-scoped docs TEMP/TMP and TZ=UTC used with approved execution for the known sandbox Node realpath restriction; experimental Node SQLite warning remains. These tests are not native accessibility/appearance evidence.

Independent read-only subagent reviewed the native fault entry and selected screenshots: no entry defects found; production initialization/entry unchanged, actual native-query failure and original IDs preserved. Final report reviewed separately. No active Git hooks (only sample hooks, core.hooksPath unset); none installed or bypassed.

Phase5 remains **NOT COMPLETE**. Minimum next step: address/accept the observed layout and activity-recreation limitations, authorize durable fault-fixture delivery if needed, then run the remaining Android accessibility/motion/native matrix and iOS acceptance in an available native environment. Phase6 documentation handoff was subsequently assigned and recorded in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md); no additional native evidence or owner deferral was supplied. Final closure and temporary-plan deletion remain pending until gates pass or the owner explicitly defers them.
