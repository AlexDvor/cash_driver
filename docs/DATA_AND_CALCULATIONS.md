# Data, arithmetic, and persistence

## Types

```ts
type Platform = 'uber' | 'cabify' | 'bolt' | 'other';

interface CashTransaction {
  id: string; // UUID generated once per save attempt
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
| Empty | Incomplete; cannot confirm |
| `20,` | Draft while focused; normalize to 2000 on blur |
| `20,555`, `1,2.3`, `-5`, letters | Invalid; cannot confirm |

Do not accept grouping separators in editable inputs. A formatted displayed value must not be passed back to the raw parser. Keep raw input strings during editing; format amounts on blur or in read-only displays. `20` displays as `20,00 €`, not `20,50 €`.

## Arithmetic

Let F = fare, R = received, T = tip, C = change given, N = retained cash.

- Require R >= F before confirming.
- Normal payment: T = 0; C = R - F; N = F.
- Full change as tip: T = R - F; C = 0; N = F + T.
- Always enforce C = R - F - T and N = R - C = F + T.
- v1 tip input is only the full-change toggle; partial tips are not exposed.
- Changing fare or received cash clears the tip toggle, preventing an unintended tip.
- Exact payment uses R = F and T = C = 0.

Never clamp an underpayment to a valid zero change. Return an invalid/insufficient result and disable confirmation. Recalculate all derived fields on create and edit; do not trust cached UI results.

## Quick values

Use candidate received amounts 500, 1000, 2000, 5000, 10000, and 20000 cents. Show up to three ascending candidates greater than or equal to the fare. For 1740 cents show 2000, 5000, and 10000. Show `Exacto` for every valid fare. Hide unavailable suggestions; do not invent an insufficient banknote value. A quick-value tap replaces R and clears the tip toggle.

## Database

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('uber','cabify','bolt','other')),
  fare_amount_cents INTEGER NOT NULL CHECK (fare_amount_cents > 0),
  cash_received_cents INTEGER NOT NULL,
  change_given_cents INTEGER NOT NULL CHECK (change_given_cents >= 0),
  tip_cents INTEGER NOT NULL DEFAULT 0 CHECK (tip_cents >= 0),
  net_cash_cents INTEGER NOT NULL CHECK (net_cash_cents >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  CHECK (cash_received_cents >= fare_amount_cents),
  CHECK (change_given_cents = cash_received_cents - fare_amount_cents - tip_cents),
  CHECK (net_cash_cents = fare_amount_cents + tip_cents),
  CHECK (tip_cents = 0 OR change_given_cents = 0)
);
CREATE INDEX transactions_created_at_idx ON transactions(created_at);
CREATE INDEX transactions_platform_created_at_idx
  ON transactions(platform, created_at);
```

Use bound SQL parameters. Validate safe integers and input limits in the service before writes. SQLite bindings must preserve integer monetary values. Persist settings locally. Initialize once, use schema versioning and migrations, and do not wipe data on app upgrades. Handle unavailable/corrupt storage with a visible retryable error; do not silently replace it with an empty database.

Generate a UUID once for a pending operation. Disable repeated confirm taps and guard the write in the service. A retry of the same draft reuses its ID; a duplicate insert must not produce a second record. Clear the draft only after successful commit. Keep creation time unchanged on edit; set updatedAt on successful correction. Refresh totals after mutations.

## Language preference

Persist `language` as `es`, `en`, or `uk`, initially `es`. Use formatting locales `es-ES`, `en-GB`, and `uk-UA` respectively. Currency stays EUR and the clock stays 24-hour in every language; display separators, currency placement, and date names follow the selected locale. Format from integer cents without changing arithmetic or stored values. Keep comma and period accepted by the raw money parser in every language; do not reformat or reparse focused drafts during switching. Period boundaries still use the device time zone, not language or locale.

Restore the saved language during initialization. A failed language write displays a localized retryable error and restores the last persisted language without losing drafts. Switching language preserves navigation, filters, tip choice, and pending operations; it does not modify transaction rows. Device-language changes do not override the user's selection.

## Theme preference

Persist `themeMode` as `light`, `dark`, or `system` in local preferences, initially `system`. Store the user's mode, not the currently resolved system appearance. Resolve the effective palette centrally; a missing system appearance falls back to light. Restore the preference during initialization before presenting the main screens to avoid flashing the wrong palette. A failed preference read follows the documented storage error/retry behavior. A failed theme write shows `No se pudo guardar el tema. Inténtalo de nuevo.` and restores the last persisted mode without changing transaction drafts. Theme switching must not write transaction data or restart the application.

## Default platform preference

Persist a single default platform, initially Uber. Explicit platform selection in Inicio or Ajustes updates the same preference; the most recent selection wins. A new form uses this value, and resetting after successful save retains it. A settings change must not overwrite an existing payment draft. Historical edits do not update the preference. Keep the displayed setting synchronized with the persisted value and expose persistence failure rather than claiming it was saved.

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
- History ordering: createdAt descending, with ID as a stable tie-breaker.

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

## Persistence boundaries

Records must survive app closure, force-stop, device restart, and non-destructive schema upgrades. Uninstalling the app or clearing its storage can remove local data. Do not promise recovery or backup functionality in this release.
