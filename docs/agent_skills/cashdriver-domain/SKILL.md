---
name: cashdriver-domain
description: Preserve CashDriver payment arithmetic, date boundaries, storage and summaries during refactoring.
---

# CashDriver domain skill

Adapted from CashDriver-agent-kit.zip on 2026-10-09. Read docs/PROJECT_SPEC.md and docs/DATA_AND_CALCULATIONS.md. Use for payment, platform, persistence, date/filter and summary changes.

## Existing model and responsibilities

CashTransaction is the current model, with fare/received/change/tip/net integer cents and original confirmation timestamp. Do not replace it with the kit's proposed Trip or add editable dates, deductions, commissions, shifts or fees. Platforms are uber, cabify, bolt and other; preserve IDs and existing labels.

Keep pure money/payment/history functions in features/transactions, calendar/summary functions in features/summary, formatting in i18n, and SQL in existing feature repositories. Centralize runtime platform metadata only in its assigned phase; preserve historical SQL/migration literals and advance schema version only for an assigned migration. Screens/hooks are not calculation policy owners.

## Protected behavior

- Integer EUR cents, current input bounds/parser, positive fare, underpayment rejection, quick replacement and Exacto. The 2026-10-09 partial-tip target uses exact tipCents, optional blank-zero input and No tip/All change actions; monetary edits clear tip. Require 0 <= tip <= received - fare; net = fare + tip and received = change + net. Follow DATA_AND_CALCULATIONS.md focus/blur rules; partial-tip implementation remains pending until its assigned phases pass.
- Partial-tip migration targets v4 from the inspected v3 baseline, preserving history/preferences/indexes and rollback. Repository decoding, service retry comparisons and summary validation must use exact T; never reconstruct a partial tip from a boolean. Preserve historical migration semantics and legacy full-change records.
- Stable pending UUID for unchanged failed save retries, duplicate protection and success/reset only after persistence commit. Preserve complete failed drafts and service-side recalculation.
- Edit preserves ID/createdAt and updates updatedAt without changing the default platform. Shared Home/Settings defaults affect pristine/next drafts without replacing active drafts.
- Ten-second single-deletion undo leaves the row/totals intact; expiry commits only while active, background cancels, failed delete retains data. Delete-all is confirmed separately and preserves preferences.
- UTC timestamps, current device timezone, Monday/calendar/DST boundaries, half-open periods, immutable filtering and stable ordering. Summary separates fares, tips and retained cash; received cash is not revenue and retained cash is not profit.
- Serialization, rollback, non-destructive migrations, corrupt-storage errors, commit-only notifications, stale-response rejection and cleanup remain unchanged. Optional haptics cannot turn a committed payment into failure.

## Verification

Reuse existing money/payment/history/period/summary and real-SQLite integration tests, component/hook retry/draft/refresh tests and deletion race tests. Update imports without weakening assertions. Add regression coverage only for an uncovered change risk. Record actual fresh test results separately from historical native evidence; no profitability or full MVP readiness claims.
