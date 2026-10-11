# Cash Driver — MVP v1.0

## Purpose

A mobile cash calculator for professional drivers that automatically keeps a local payment history. The driver selects a platform, enters the fare and received cash, sees the change immediately, and confirms the payment. Saved operations feed daily, weekly, and monthly summaries.

## Product decisions

| Item | v1 decision |
| --- | --- |
| Framework | React Native CLI with TypeScript |
| Platforms | Android and iOS with the same v1 features; Android may be implemented first, but both require native acceptance verification |
| UI language | Spanish by default; English and Ukrainian selectable |
| Currency | EUR, displayed as `20,50 €` |
| Payment platform | Uber, Cabify, Bolt, Otro |
| Navigation | Inicio, Historial, Resumen, Ajustes |
| Persistence | Local SQLite database |
| Connectivity | All features work offline |
| Visual style | Light/dark palettes, rounded cards, green actions; automatic system theme by default |

Cabify is the spelling used for the platform mentioned in the request. Platform selection is a manual label; it does not connect to external services.

## Required functionality

Partial-tip requirements below were documented on 2026-10-09. Phases 2–3 implement exact-tip domain/persistence, migration v4 and the shared optional input/actions UI with automated tests. Phase 4 history/summary integration verified by automated tests; native acceptance is NOT VERIFIED. Historical full-change-only acceptance does not verify this extension.

### Inicio

- Show app title, current local date and time, and compact today's totals separately labeled as fare, tips, and cash retained.
- Select Uber, Cabify, Bolt, or Otro. Initially use Uber. Inicio and Ajustes share one persisted default platform: the latest explicit selection in either screen wins. Editing a historical operation does not change this preference.
- Enter `Importe a cobrar` and `El cliente entrega`.
- Accept comma or period decimal input with at most two fractional digits.
- Offer quick received-amount buttons and an `Exacto` button.
- Calculate and prominently display `CAMBIO` immediately.
- Collapsible-tip behavior (2026-10-10, implemented in Phases2–3 with automated checks): initially show + Add tip before the change result; expand to the existing Propina input, Remove tip and All change as tip. Preserve positive T in the collapsed header; removing clears and collapses. Edit starts expanded for positive saved T. Follow UI_DESIGN.md and DATA_AND_CALCULATIONS.md for lifecycle, blur/errors and reset rules. Shared create/edit form implements the collapsed header/content. Selected Android emulator acceptance is recorded in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#native-tip-acceptance); full native acceptance remains NOT VERIFIED. Permanent handoff and open gates are in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md); temporary plans were removed by explicit owner instruction; open native gates remain unchanged.
- Save with `Confirmar cobro`; only after successful persistence show a brief message with the saved fare and, when present, tip, then clear monetary inputs. Preserve the complete draft on failure and allow retry.
- Store the actual confirmation date and time automatically; date entry is not required.

### Historial

- Newest operations first, grouped by local date.
- Period filters: Hoy, Semana, Mes, Todo.
- Calendar/history extension (2026-10-10, Phase 5 implementation and automated checks complete; native acceptance NOT VERIFIED): Mes initially shows the current calendar month and supports previous/next month, direct month/year selection and an explicit selected day. Follow the shared calendar contract below; Hoy/Semana and Todo retain their existing meaning.
- Platform filter: Todas, Uber, Cabify, Bolt, Otro.
- Each row shows platform, date/time, fare, and a tip when present.
- Open details with fare, received cash, change given, tip, and cash retained.
- Use the same payment form for correction, including exact saved tip amount, partial/full-tip actions, quick values and change calculation. Clearly title it `Editar operación`; preserve original creation time and ID. Cancelling leaves the operation unchanged.
- Allow deletion after confirmation, followed by a brief `Deshacer` opportunity for a single operation. Follow the deferred deletion rules in DATA_AND_CALCULATIONS.md.

### Resumen

- Select Hoy, Semana, or Mes.
- Display operation count, fare total, tip total, total cash retained, and average fare per operation.
- Display fare totals by platform.
- Refresh after changes and when returning to the screen.
- Show zero totals for empty periods; do not fabricate charts or records.
- Use the same calendar interaction as Historial, with independent screen selection. Monthly/day totals cover the applied local period, using the existing monetary formulas.

### Calendar and large-history extension — 2026-10-10

Status: **Phases 0–5 implementation COMPLETE; Phase 6 PARTIALLY VERIFIED / NOT COMPLETE**. Phase 7 documentation handoff preserves the permanent contracts and evidence; temporary-plan removal remains pending the required acceptance gates. This assigned extension expands historical navigation and bounded loading, not payment arithmetic. [UI_DESIGN.md](UI_DESIGN.md#shared-calendar-and-period-navigation) defines presentation; [DATA_AND_CALCULATIONS.md](DATA_AND_CALCULATIONS.md#calendar-selection-and-bounded-reads) defines queries and lifecycle. Current implementation map, checks and remaining Android/iOS gates are in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

- Share one calendar modal and quick year/month selector across Historial and Resumen. A month grid has green circles on dates with saved cash operations across all platforms. A plain date means no saved cash operation; it does not prove a day off. The selected date and today have separate indicators.
- Each screen keeps its own session-only applied selection. First Mes entry selects the current local month; later entries restore its prior selection. Automatic current-month selection follows month rollover until explicit month/day navigation, which pins that calendar selection. Theme/language changes and refresh preserve the selection. Restart starts with existing default Hoy; no new persisted preference.
- Browsing the modal is a draft: Show month applies its month, selecting a day applies that date, and cancel/dismiss/Back preserves the prior filter. Day is a calendar submode of Mes, not a replacement for Hoy. Return to month shows the selected day's full month. Future periods may be viewed as ordinary empty periods after successful loading.
- Historial keeps its platform filter when applying dates; activity markers remain all-platform with an explicit legend. Resumen keeps all existing statistics and platform totals. No cross-screen selection synchronization.
- History loads bounded pages into one virtualized viewport. Summary and calendar query only relevant ranges and return compact validated results; do not transfer all stored operations to calculate a period.
- Provide separate initial, load-more and refresh feedback, empty states only after successful reads, and localized errors/Retry. Unknown calendar activity during loading/error must not look like a confirmed empty month. Prior-period results cannot appear under a newly selected date.
- Preserve pending deletion in rows/totals/calendar until deletion commits, and preserve all existing Home/edit/settings behavior. Read-only date navigation never creates or modifies records.

Installed calendar: react-native-calendars1.1314.0. History uses pages of at most50 records with one-row SQL lookahead; no derived-result cache or new schema/index is introduced. These implementation choices and the selected Android measurements are documented in IMPLEMENTATION_PLAN.md, with their limits. Requirements do not establish a production capacity/latency guarantee or complete native acceptance. iOS, full screen-reader/Reduce Motion and remaining native/adaptive checks stay open.

### Ajustes

- Display EUR as fixed currency. Select interface language: `Español`, `English`, or `Українська`; default to Spanish on first launch regardless of device language. Persist selection locally and apply immediately throughout the app without restarting or clearing drafts.
- Select `Tema`: `Claro`, `Oscuro`, or `Automático` (initial default). Automatic follows the system appearance, including its day/night schedule when configured. Explicit light/dark choices override it. Persist the choice locally and update all screens without restarting or clearing drafts.
- Select the default platform using the shared preference described under Inicio; a later selection in Inicio updates it again. Apply it to the next new operation without replacing an existing payment draft.
- Toggle confirmation haptics where supported.
- Show app version.
- Explain that data stays on this device and uninstalling the app or clearing its storage may erase history.
- Offer `Eliminar todas las operaciones` with an explicit destructive confirmation.

## Scope boundary

Build the calculator, optional partial or full-change tip, local history, editing/deletion, summaries, and the settings above. Accounts, remote services, external platform integration, tracking, exports, work shifts, expenses, and custom platform management are outside this release. Do not add speculative future fields or modules.

## Next stage after MVP

Prioritize backup and restoration of local history after the calculator, history, and reliable persistence are complete. Backup is outside v1; its format, destination, restore validation, and conflict handling require a separate specification before implementation. Do not add backup fields, services, or dependencies to MVP in anticipation. Additional charts and statistics have lower priority.

## Primary example

Select Uber → enter `20` → enter `50` → see `30,00 €` change → confirm → a dated Uber operation appears in history → today's fare total and cash retained each increase by `20,00 €`.

For a fare of `18,00 €`, received cash of `20,00 €`, and All change as tip: change given is `0,00 €`, tip is `2,00 €`, fare total increases by `18,00 €`, and cash retained increases by `20,00 €`.

For fare `20,00 €`, received cash `50,00 €`, and entered tip `5,00 €`: return `25,00 €`; save fare 2000, received 5000, tip 500, change 2500 and retained cash 2500 cents. Fare totals increase by 20 euros, tips by 5 and retained cash by 25; received cash is not revenue.

## Completion criteria

All documented flows work offline, data survives app and device restart, monetary calculations are exact, invalid payments cannot be saved, failures do not discard inputs, and all four screens follow the design specification.
