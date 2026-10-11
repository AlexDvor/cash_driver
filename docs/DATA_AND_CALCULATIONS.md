# Data, arithmetic, and persistence

## Types

Partial-tip contract documented 2026-10-09. Phases 2–3 implement exact-tip domain/persistence, migration v4 and optional raw tip input/actions, verified by automated tests; native acceptance remains pending Phase 5. Phase 0's historical baseline was schema v3 and boolean changeAsTip input. The stored CashTransaction fields remain unchanged; PaymentAmounts/service input now carries fareAmountCents, cashReceivedCents and explicit tipCents. The exact T is authoritative; a UI shortcut must not create a second independent boolean authority. Phase 3 replaces the temporary full-change switch adapter with one raw tip draft in usePaymentForm; its parsed cents feed the shared calculation and write input.

```ts
type Platform = 'uber' | 'cabify' | 'bolt' | 'other';

interface CashTransaction {
  id: string; // UUID generated once per pending operation; unchanged retries reuse it
  platform: Platform;
  fareAmountCents: number;
  cashReceivedCents: number;
  changeGivenCents: number;
  tipCents: number;
  netCashCents: number;
  createdAt: string; // UTC ISO 8601, original confirmation time
  updatedAt: string | null;
}
```

Every monetary field is a non-negative safe integer in cents. Fare must be positive. The v1 maximum input is 999,999 cents (`9.999,99 €`), providing a clear validation limit rather than an unlimited field. Platform identifiers are stable; `other` displays as `Otro`.

## Input parser

Trim surrounding whitespace. Accept digits with an optional single comma or period and zero to two fractional digits. Parse the whole and fractional strings separately; multiply only the integer whole-euro part by 100. Never use `parseFloat(value) * 100`.

| Input | Result |
| --- | --- |
| `20` | 2000 cents |
| `20,5` | 2050 cents |
| `20,50` | 2050 cents |
| `20.50` | 2050 cents |
| `0,10` | 10 cents |
| Empty fare/received | Incomplete; cannot confirm |
| `20,` | Draft while focused; normalize to 2000 on blur |
| `20,555`, `1,2.3`, `-5`, letters | Invalid; cannot confirm |

Do not accept grouping separators in editable inputs. A formatted displayed value must not be passed back to the raw parser. Keep raw input strings during editing; format amounts on blur or in read-only displays. `20` displays as `20,00 €`, not `20,50 €`.

Optional tip uses the same parser and maximum. Only trimmed empty tip is interpreted by the form as zero; do not change empty fare/received semantics. Explicit `0` is also valid. Focused `5,` is an unfinished draft: show change as `—` and disable confirmation; blur normalizes it to 500 cents and then recalculates. Submit requires already valid parsed amounts and never implicitly parses unfinished drafts as blurred values. Keep accessible keyboard dismissal so the user can blur and then confirm. Invalid tip format or excess tip similarly produces `—`, an inline error and disabled confirmation. Underpayment keeps its existing insufficient-cash result rather than being converted to zero change. Preserve latest-draft and post-commit guards against delayed native blur for the tip field too.

In the existing 2026-10-09 implementation, No tip and All change as tip replace the latest raw tip draft. The new target replaces No tip with Remove tip (clear and collapse), preserving latest-draft and busy guards. A queued native blur after either action must use that latest value and cannot restore the previous tip text or amount.

## Arithmetic

Let F = fare, R = received, T = tip, C = change given, N = retained cash.

- Require R >= F before confirming.
- Normal payment: T = 0; C = R - F; N = F.
- Full change as tip: T = R - F; C = 0; N = F + T.
- Partial tip: 0 < T < R - F; C > 0; N = F + T. Require 0 <= T <= R - F, safe integer cents and the existing input maximum. Never clamp T to fit.
- Always enforce C = R - F - T and N = R - C = F + T.
- Tip input is optional exact T; Remove tip clears it and collapses the section, All change as tip fills R - F. The latter is enabled only for valid fare/received and a positive difference, independently of a currently invalid tip, allowing correction. Remove tip remains available to clear invalid text. Both actions and all inputs are disabled while saving. Historical No tip wording does not override the current shared form.
- Editing either raw fare or received text clears tip to blank (zero), including quick/Exacto taps even if the numeric received value is unchanged. Platform/language/theme changes preserve raw tip. New forms and successful create reset start blank; failed writes preserve the complete raw draft.
- Exact payment uses R = F and T = C = 0.

Never clamp an underpayment to a valid zero change. Return an invalid/insufficient result and disable confirmation. Recalculate all derived fields on create and edit; do not trust cached UI results.

## Collapsible-tip lifecycle target — 2026-10-10

Hook lifecycle and shared collapsed UI/animation implemented in collapsible-tip Phases2–3; Phase4 verifies hidden-tip create/edit/retry/history/summary through real test SQLite. Phase5 selected native Android storage/retry checks are recorded in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#native-tip-acceptance); full native acceptance remains NOT VERIFIED. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) contains the permanent Phase6 handoff and open gates. Visibility is local form state, never SQLite/model/service input or pending-operation equality. Raw tip remains monetary authority when hidden. Collapse preserves T and must not clear failed state, replace retry UUID, unlock an already committed edit, or write anything. Remove tip clears to blank and collapses. New form starts collapsed; edit starts expanded iff saved T>0. Successful create clears/collapses without animation; failure preserves draft/visibility; successful edit retains committed T/current visibility.

Collapse explicitly finishes focused tip editing with the existing blurred parser and latest-draft/post-commit guards. Focused 5, normalizes to 500 cents. Empty remains blank-zero; invalid/negative/over-limit/excess T cannot be hidden. Validate T independently of payment.status, since underpayment intentionally preserves insufficient feedback even with malformed tip. Check excess against available change when known; unknown difference alone does not make T excessive. Do not alter parser or submit semantics.

Existing fare/received/quick/Exacto reset clears T while preserving visibility. Platform/language/theme changes preserve raw T/visibility. All section actions obey busy guard. The keyboard/touch/accessibility/180ms Reduce Motion contract is in UI_DESIGN.md; animation is never a source of money, write permission or lifecycle success. No migration or new monetary fields.

## Quick values

Use candidate received amounts 500, 1000, 2000, 5000, 10000, and 20000 cents. Show up to three ascending candidates greater than or equal to the fare. For 1740 cents show 2000, 5000, and 10000. Show `Exacto` for every valid fare. Hide unavailable suggestions; do not invent an insufficient banknote value. A quick-value tap replaces R and clears the tip input.

## Database

The following is the v4 transaction schema. Phase 2 automated real-SQLite tests verify migration; this is not evidence of migration on an installed native app. Preserve the integer type and input-bound checks already enforced by the implementation.

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('uber','cabify','bolt','other')),
  fare_amount_cents INTEGER NOT NULL CHECK (typeof(fare_amount_cents) = 'integer' AND fare_amount_cents BETWEEN 1 AND 999999),
  cash_received_cents INTEGER NOT NULL CHECK (typeof(cash_received_cents) = 'integer' AND cash_received_cents BETWEEN 0 AND 999999),
  change_given_cents INTEGER NOT NULL CHECK (typeof(change_given_cents) = 'integer' AND change_given_cents >= 0),
  tip_cents INTEGER NOT NULL DEFAULT 0 CHECK (typeof(tip_cents) = 'integer' AND tip_cents >= 0),
  net_cash_cents INTEGER NOT NULL CHECK (typeof(net_cash_cents) = 'integer' AND net_cash_cents >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  CHECK (cash_received_cents >= fare_amount_cents),
  CHECK (change_given_cents = cash_received_cents - fare_amount_cents - tip_cents),
  CHECK (net_cash_cents = fare_amount_cents + tip_cents)
);
CREATE INDEX transactions_created_at_idx ON transactions(created_at);
CREATE INDEX transactions_platform_created_at_idx
  ON transactions(platform, created_at);
```

Use bound SQL parameters. Validate safe integers and input limits in the service before writes. SQLite bindings must preserve integer monetary values. Persist settings locally. Initialize once, use schema versioning and migrations, and do not wipe data on app upgrades. Handle unavailable/corrupt storage with a visible retryable error; do not silently replace it with an empty database.

### Partial-tip migration and validation requirements

Phase 0 verified SCHEMA_VERSION = 3. Target v4 must remove only the legacy full-change-only CHECK (`tip_cents = 0 OR change_given_cents = 0`) by a transactional table replacement/copy using the existing migration mechanism. Preserve v1-v3 historical semantics; new installs traverse the chain to v4. Recheck the baseline version before implementation. Preserve every row, ID, timestamp, monetary value, both transaction indexes and preferences; do not infer/rewrite legacy tips. Update user_version only with successful migration, roll back DDL/data/version on failure, retain integrity/future-version/missing-table guards and make repeated initialization safe. Nonnegative C plus C=R-F-T enforces the upper tip bound at storage level.

Service writes, repository decoding and summary validation must all use exact stored/input tipCents with the shared pure calculation, not tipCents > 0 as a full-change selector. Update summary validation during the domain/persistence phase before partial rows can be stored. Reject inconsistent rows; do not repair corrupt values silently. No new transaction columns are needed.

Create retry identity includes platform, fare, received and exact tip. Unchanged failed input reuses its pending UUID; changed T creates a new pending operation; differing T cannot join an in-flight write or be accepted under a committed ID. Edit loads and retains exact T, including legacy full-change tips, preserves ID/createdAt and uses commit-derived values for post-save state. Tests must cover these paths independently of the UI.

Generate a UUID once for a pending operation. Disable repeated confirm taps and guard the write in the service. A retry of the same draft reuses its ID; a duplicate insert must not produce a second record. Clear the draft only after successful commit. Keep creation time unchanged on edit; set updatedAt on successful correction. Refresh totals after mutations.

## Language preference

Persist `language` as `es`, `en`, or `uk`, initially `es`. Use formatting locales `es-ES`, `en-GB`, and `uk-UA` respectively. Currency stays EUR and the clock stays 24-hour in every language; display separators, currency placement, and date names follow the selected locale. Format from integer cents without changing arithmetic or stored values. Keep comma and period accepted by the raw money parser in every language; do not reformat or reparse focused drafts during switching. Period boundaries still use the device time zone, not language or locale.

Restore the saved language during initialization. A failed language write displays a localized retryable error and restores the last persisted language without losing drafts. Switching language preserves navigation, filters, tip choice, and pending operations; it does not modify transaction rows. Device-language changes do not override the user's selection.

## Theme preference

Persist `themeMode` as `light`, `dark`, or `system` in local preferences, initially `system`. Store the user's mode, not the currently resolved system appearance. Resolve the effective palette centrally; a missing system appearance falls back to light. Restore the preference during initialization before presenting the main screens to avoid flashing the wrong palette. A failed preference read follows the documented storage error/retry behavior. A failed theme write shows `No se pudo guardar el tema. Inténtalo de nuevo.` and restores the last persisted mode without changing transaction drafts. Theme switching must not write transaction data or restart the application.

## Default platform preference

Persist a single default platform, initially Uber. Explicit platform selection in Inicio or Ajustes updates the same preference; the most recent selection wins. A new form uses this value, and resetting after successful save retains it. A settings change must not overwrite an existing payment draft. Historical edits do not update the preference. Keep the displayed setting synchronized with the persisted value and expose persistence failure rather than claiming it was saved.

## Confirmation haptics preference

Phase 7 owner-delegated decision (2026-10-08): confirmation haptics are initially disabled, centralized in `DEFAULT_HAPTICS_ENABLED`. Schema version 3 resolves only the former unset NULL preference; explicit stored choices are preserved. Persist enabled/disabled through the existing preferences mechanism. Feedback occurs only after a successful payment commit, respects device/system support and never determines persistence success.

## Single-operation deletion and undo

After deletion confirmation, hold a pending deletion in memory during a brief `Deshacer` window. The owner-approved duration is 10 seconds, centralized as `DELETION_UNDO_SECONDS` in `src/features/transactions/deletionConstants.ts` (Phase 5 decision, 2026-10-08). Do not remove the SQLite row or exclude it from history or totals during this window. Undo cancels the pending action; no restore insert is needed, and ID, timestamps, and monetary fields remain unchanged.

Commit deletion only when the window expires while the app is active. If the app backgrounds or closes before the window expires, cancel the pending action; it must not resume after restart. Serialize undo and expiry so only one outcome occurs. Allow one pending deletion at a time and disable further destructive actions until it resolves. After expiry, disable undo during the write. Refresh views only after successful commit; on failure retain the record and offer retry. Delete-all remains a separately confirmed immediate write without undo.

## Dates and summaries

Store UTC timestamps. v1 periods use the current device time zone, consistently for list grouping and summaries. When the device zone changes, period membership can change; this is intentional. Display dates in the selected language and a 24-hour clock. Update periods when the app resumes or the local date changes.

- Hoy: local midnight to next local midnight.
- Semana: Monday local midnight to the following Monday.
- Mes: first day local midnight to first day of the next month.
- Queries use start inclusive, end exclusive; convert local boundaries to UTC.
- Use calendar boundary construction, not fixed 24-hour arithmetic, to handle daylight saving changes.
- History ordering: createdAt descending, then ID descending as a stable tie-breaker.

Summary formulas:

| UI label | Formula |
| --- | --- |
| Operaciones | Record count |
| Importe de viajes | Sum fareAmountCents |
| Propinas | Sum tipCents |
| Efectivo retenido | Sum netCashCents |
| Promedio por operación | Sum fareAmountCents / count, rounded to nearest cent |
| Por plataforma | Fare totals grouped by platform |

For zero records the average is zero. Perform average rounding with integer quotient/remainder logic. Never treat received cash as revenue, and never add tips again to net cash. Cash retained describes recorded cash after change, not salary or profit.

## Calendar selection and bounded reads

Calendar/history extension dated 2026-10-10: **Phases 2–5 data APIs/hooks/shared UI/screen integration IMPLEMENTED; native visual/accessibility NOT VERIFIED**. Existing schema v4 and monetary rules remain authoritative; no migration or payment policy changes. [UI_DESIGN.md](UI_DESIGN.md#shared-calendar-and-period-navigation) defines apply/cancel/presentation; the contracts below define their data meaning. Actual phase maps/tests/limitations are in IMPLEMENTATION_PLAN.md.

### Applied selection and boundaries

Each screen owns its period/platform selection and a remembered session calendar selection. Mes has an automatic-current-month state until an explicit external arrow, modal Show month, day selection or Return to month applies an explicit calendar selection. Automatic state follows local month rollover, including while another period is active. Explicit state stores calendar year/month, and day when selected, rather than a UTC midnight instant. It remains pinned when the clock/date/time zone changes; recompute its UTC bounds in the new device zone. Returning to Mes restores that screen's remembered automatic or explicit state. Hoy/Semana remain relative; Historial Todo has no date bounds. Restart does not restore calendar filters.

Modal draft is separate from applied selection. Draft browsing triggers only displayed-month activity reads; it does not fetch a new applied history/summary period. Day tap or Show month applies and closes; cancel/dismiss/Back leaves applied state unchanged. Language/theme changes preserve both states and do not write transactions/preferences. A time-zone change preserves draft calendar coordinates while invalidating their activity query. Returning from day applies its full month, without editing any createdAt.

For a selected month, construct local midnight on its first day and the first day of the next month. For a selected day, construct that day's and the next calendar day's local boundary. Convert through the existing explicit-time-zone calendar resolution rules: earliest repeated midnight, forward through a midnight gap. Start is inclusive; end is exclusive. Do not use the calendar library's UTC timestamp as a device-local boundary, parse date-only strings as instants, add a fixed 24 hours or reuse one DST offset. Validate calendar coordinates and supported date representation; do not invent a limited history window. Relative Hoy/Semana follow local date/resume/zone changes.

### Repository read contracts and ordering

| Read | Selection and result |
| --- | --- |
| History page | Applied UTC range (or unbounded Todo), platform or all, optional cursor and positive bounded page size; validated records, next cursor/end state |
| Period summary | Applied UTC range, all platforms; validated count/fare/tip/net/average/platform aggregates covering the whole range, not only a loaded history page |
| Calendar activity | Draft/displayed month UTC range, all platforms; validated occupied local-date keys only, no full transaction transfer |
| Global existence | Compact successful existence check across all operations only when needed to distinguish a genuinely empty database from an empty filter |
| Single operation | Existing ID-based get/edit loading; no cursor or page semantics |

SQL belongs in existing repositories behind services; hooks coordinate reads/lifecycle and screens display them. Use bound parameters and indexed raw range predicates where compatible with representation. Preserve serialized connection behavior; a multi-query aggregate/validation or activity result must represent one consistent committed snapshot, not mixed revisions. Never hold a database transaction open across scrolling or user interaction.

Use keyset ordering **createdAt DESC, ID DESC**, with cursor identifying the last returned record's timestamp and ID. The next page contains only keys strictly older/lower than that pair under the same range/platform. Cursor is opaque to the UI and invalid when applied range/platform/time-zone bounds or data generation changes. No growing OFFSET. Deduplicate merged IDs, combine adjacent page groups for the same local date, stop at end and avoid concurrent load-more. A committed mutation invalidates the page generation and reloads from the first page; an in-flight old page cannot merge afterward. Paging does not change IDs/createdAt or the single-record decoder/edit path.

The existing service writes timestamps through Date.toISOString(); persist canonical UTC ISO text with milliseconds consistently. Before using lexical SQL bounds/cursors, Phase 2 must verify supported legacy writers/migrations and compare text ordering with chronological ordering in tests. Current Date.parse-compatible decoder acceptance is broader than this write representation. Do not silently normalize/rewrite/drop legacy timestamps or merely tighten the decoder to conceal them. If supported legacy representations cannot share the cursor ordering, mark the affected optimization **BLOCKED / OWNER DECISION REQUIRED** and document a compatibility proposal before changing storage behavior. No installed user database has been inspected to prove all timestamps canonical.

Phase 2 HISTORY_PAGE_SIZE is **50 default/maximum** (smaller positive integer requests allowed), selected after isolated 10/25/50 page observations. SQL looks ahead one record, so each page transfers at most 51 records and returns at most 50. No derived result cache is implemented; define its bound before adding any in Phase 3. These bounds are implementation choices, not production targets. Query plans use existing range/platform indexes; temporary ID/group sorting remains. No migration/new index was justified in Phase 2. The calendar needs no new columns or persisted daily aggregate tables.

Implemented compatibility guard: the first optimized read scans created_at representation in SQL across the database and returns at most one incompatible ID; a successful check is retained as one repository-lifetime flag. Canonical repository writes preserve it; incompatible repository writes reset it. This is an explicit one-time exception to scoped scanning to prevent legacy timestamps from being silently excluded by lexical ranges. Raw/external timestamp mutation is unsupported and requires repository recreation/reopening. No persistent source of truth is replaced. Four-digit canonical UTC timestamps/bounds are the currently supported optimized SQL representation; other/extended-year representations fail explicitly without mutation and require a documented compatibility proposal before enablement. Pure calendar helpers retain wider representable Gregorian coordinates. Existing list/get decoding remains unchanged.

### Validation scope and exact aggregates

Bounded read validation is intentionally scoped: history validates every returned row before exposing a page; summary validates every row matched by its range before exposing aggregates; activity validates every row matched by the displayed month before exposing markers. A matched corrupt row fails the entire corresponding result, never becoming a silently omitted operation or date. Global existence is not a monetary integrity audit. A scoped successful query does not certify the whole database.

This changes the incidental old behavior in which full-table decoding could fail a selected-period summary because of corruption outside that period. The extension does not scan all unrelated rows on each read. Existing startup storage-integrity checks remain intact. Invalid/unselectable timestamps outside a valid range cannot be certified by range queries; do not claim such a query detected all corruption. Any incompatible timestamp representation discovered by the Phase 2 compatibility checks is handled by the preceding explicit blocker, not silently repaired.

SQL aggregation must retain decoder-equivalent type, ID/platform/date and monetary validation for matched rows, including safe integer input limits, exact stored T, C = R - F - T and N = F + T. Return an explicit error on invalid values, unsafe converted totals, SQLite SUM overflow or loss of exactness at the adapter boundary. Grouped fare totals and operation count must also remain safe integers. Do not use floating-point SQL AVG or round a euro float; compute the existing quotient/remainder average from validated integer fare sum and count. Empty successful aggregate maps to zero count/totals/average and zero for each supported platform. Received cash is not revenue. Validate and aggregate within the same committed snapshot; document the concrete SQL/adapter approach and tests in Phase 2 before replacing JavaScript aggregation.

### Occupied local dates and refresh authority

Phase 2 summary/activity SQL uses the same matched monetary checks and validates exceptional noncanonical updated_at strings through Date.parse in bounded distinct-value batches (at most 50 per batch) within the same transaction. This preserves the old decoder's acceptance for updatedAt without transferring full records. Canonical created_at ordering is guarded as described above. Calendar occupiedDates uses independently resolved local-day intervals and excludes zero-length skipped dates; summary/listPage accept such an empty range as a successful empty query.

An occupied date has at least one matched valid saved operation, including a zero-tip operation. Markers ignore Historial's platform filter by design and carry no work-shift/profit meaning. Pending deletion remains occupied until commit. Use current device-time-zone calendar grouping and distinct local keys. Return only dates in the displayed month. Do not group UTC substrings or use a fixed offset. Phase 2 must verify an adapter-supported bounded query returning compact results; independently constructed local-day UTC intervals are a valid approach if per-zone SQL grouping is unsuitable. No full-record month transfer as a fallback. Loading/error activity is unknown, not confirmed absence.

Reuse commit notifications and existing clock/resume/subscription hooks. After successful create/edit/delete/delete-all, invalidate affected summaries/activity and reset history pages. Failed writes, undo and background cancellation do not remove records/markers or invalidate them as deleted. If precise affected-date metadata is unavailable, invalidate all bounded derived caches rather than guessing; no notification contract change is required for this extension.

If useful, cache derived results only in bounded session memory with query range, time zone, relevant platform and committed data generation in the key. Language/theme affect presentation, not monetary query identity. Coalesce repeated same-generation reads; every in-flight response must match the current query key and generation. On unmount clean subscriptions and prevent stale updates. Device-date/time-zone changes invalidate relative bounds and relevant markers; explicit calendar coordinates remain selected. No database source-of-truth replacement or permanent duplicate daily totals.

State distinguishes initial read, same-query refresh, load-more, ready/empty/end and error. Retained same-query data is visibly stale/updating; different-query data is hidden. Load-more failure retains prior pages with footer Retry. Initial failure never shows success zeros/empty. Calendar markers for a prior month/zone/revision cannot appear as current. UI loading/error details are governed by UI_DESIGN.md.

## Persistence boundaries

Records must survive app closure, force-stop, device restart, and non-destructive schema upgrades. Uninstalling the app or clearing its storage can remove local data. Do not promise recovery or backup functionality in this release.
