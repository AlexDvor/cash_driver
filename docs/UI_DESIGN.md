# UI design and screen behavior

## Reference direction

Spanish labels in this document and the reference image are the default-language examples. All visible text and accessibility labels must have English and Ukrainian equivalents with the same behavior. Layout must accommodate translations without clipping or reducing essential font sizes.

Use `docs/screen.png` as the visual reference for green accents, rounded cards, monetary hierarchy, and navigation. It shows Inicio, a tip state of Inicio, Historial, operation details, Resumen, and Ajustes; these are not six separate tabs. Follow the written specification when the reference differs: use platform text labels, separately labeled daily totals, and the result treatment documented below. Sample transactions, dates, and version values in the image are illustrative, not installed app data. Do not reproduce fixed device dimensions or clipped content. See CODING_STANDARDS.md for tokens, reuse, and adaptive layout rules.

## Modern, practical visual quality

Deliver a polished contemporary mobile interface within the existing green visual direction and MVP scope. Use consistent spacing, typography hierarchy, rounded surfaces, restrained shadows, one coherent icon style, clear selection/focus states, and immediate press feedback. Prioritize easy-to-scan monetary values and a fast payment flow. Avoid decorative clutter, excessive gradients/blur, and effects that reduce contrast or obscure actions. The reference is a visual starting point; improvements must preserve documented behavior and theme tokens.

Use subtle transitions for pressed/selected states, tip-section appearance, success feedback, and navigation when they clarify a change. Monetary results update immediately; do not animate through intermediate amounts. Animation completion must never trigger persistence or determine transaction success. Avoid delaying confirmation, blocking input, flashing, or looping decorative motion. Respect the device's Reduce Motion setting with simplified or disabled nonessential transitions; retain readable static feedback. Verify responsiveness and state preservation on both platforms, both themes, and all languages.

## Tokens

| Token | Light | Dark |
| --- | --- | --- |
| Background | #F5F7F6 | #101714 |
| Card | #FFFFFF | #1A2520 |
| Primary | #0E7A4B | #69D9A4 |
| On primary | #FFFFFF | #102219 |
| Secondary green | #1F9D62 | #86E5BA |
| Soft green | #E8F5EE | #203B2D |
| Main text | #111827 | #F0F5F2 |
| Secondary text | #626975 | #B0BEB6 |
| Border | #E5E7EB | #405349 |
| Error text | #B91C1C | #FFB4B4 |
| Error surface | #FEF2F2 | #402626 |

Phase 8 contrast correction: light secondary text was darkened from #6B7280 to #626975. Computed opaque-color contrast is 5.14:1 on Background and 4.93:1 on Soft green (previously 4.49:1 and 4.31:1). These measurements do not replace native disabled-state, system-bar or screen-reader acceptance.

The reference image illustrates light appearance. Dark appearance uses muted charcoal-green backgrounds, distinct card surfaces, light text, and softer green accents. These are design values, not verified accessibility results; check actual text, control, focus, and disabled-state contrast during implementation. Use `On primary` on primary buttons and `Main text` on soft-green result areas. All surfaces, inputs, navigation, dialogs, toasts, icons, and loading/error/empty states use the resolved palette. References below to white cards or deep-green accents describe the light palette; dark mode uses the corresponding semantic tokens. Typography, spacing, and behavior stay consistent.

## Theme behavior

In Ajustes, show `Tema` with `Claro`, `Oscuro`, and `Automático` (initial default). Explain automatic mode with `Usa el tema del dispositivo. Para cambiar entre día y noche, configura el horario en los ajustes del sistema.` Apply explicit selection immediately to every screen, including details/editing, and match system bar appearance where supported.

Automatic mode responds to system appearance changes while open and on resume. If the system preference is unavailable, use light. It does not infer ambient light, request sensor/location permissions, or define its own day/night schedule. Explicit light/dark choices stay fixed when system appearance changes. Switching preserves navigation, raw inputs, tip choice, filters, and pending operations.

Use system sans-serif fonts. Titles: 28–32 logical units, bold; card headings: 18–20; body: 16; supporting text: 14; money inputs: 28–32; change: 48–64. Use tabular digits where available. Spacing scale: 4, 8, 12, 16, 20, 24, 32. Screen padding: 20. Card radius: 24; input and primary button radius: 16; chip radius: 12. Subtle shadows only.

Respect safe areas, text scaling, and narrow Android displays. Minimum primary button height is 56, and other interactive targets are at least 48. Selected states use shape or text weight as well as color. Include accessibility labels. Contrast must be readable; secondary green is not automatically suitable for small text on white.

## Android and iOS

Use one shared component/theme system and identical payment behavior on both platforms. Adapt native interaction rather than copy an entire screen per platform.

| Area | Android | iOS |
| --- | --- | --- |
| Insets and bars | Respect status/navigation bars and edge-to-edge insets | Respect notch, status bar, and home indicator |
| Back navigation | System back returns from details/editing without saving | Header back and stack gesture return without saving |
| Keyboard | Decimal keyboard where available; fields/actions remain reachable | Decimal keyboard plus an accessible way to dismiss it; fields/actions remain reachable |
| Controls | Native Switch and confirmation dialogs may use Android appearance | Native Switch and confirmation dialogs may use iOS appearance |
| Feedback | Respect device/system haptic settings | Respect device capability and user preference; no-op if unavailable |

Both keyboards use the same comma/period parser. Theme changes, accessibility labels, loading/error behavior, and local persistence must work equally. Do not intercept ordinary platform navigation unnecessarily. Haptics fire only after successful save and never determine payment success.

## Shared navigation

A fixed bottom bar with consistent outline icons and labels: Inicio, Historial, Resumen, Ajustes. Active icon and label are deep green. Transaction details and editing are stack screens above the tabs. Scroll content when necessary; the keyboard must not obscure active fields or confirmation actions.

## Inicio: top to bottom

1. `Cash Driver`, subtitle `Registro rápido de efectivo`, local date/time such as `8 oct 2026 · 12:28`.
2. A quiet daily summary with operation count and separately labeled `Importe de viajes`, `Propinas`, and `Efectivo retenido`. Cash retained includes tips once and excludes change returned; never use an unlabeled monetary total.
3. White card titled `Nuevo cobro`.
4. `Plataforma` selector: Uber, Cabify, Bolt, Otro. Four equal chips or a two-row layout on narrow displays; no clipped text. Use text labels rather than downloaded brand artwork.
5. `Importe a cobrar` money input.
6. `El cliente entrega` money input.
7. Quick buttons such as `20 €`, `50 €`, `100 €`, plus `Exacto`. Buttons replace the received amount, not add to it.
8. Soft-green result area: `CAMBIO`, then a dominant `30,00 €`.
9. For a positive difference, a compact `El cambio es propina` toggle. When active, show `Propina: 2,00 €` and change `0,00 €`.
10. Full-width green `Confirmar cobro` button.

Before sufficient input, show `—` in the change result. For insufficient cash show `Faltan 3,00 €` and inline `El importe recibido es insuficiente`; never show a valid zero-change state for an underpayment. Disable confirm for invalid inputs and while saving. During save show progress without layout jumps. After successful commit, use a brief toast such as `Cobro registrado · Importe de viaje: 18,00 € · Propina: 2,00 €` and optional haptic feedback. Omit the tip segment when zero. Display committed amounts, not received cash as the fare.

## Historial

Title `Historial`, subtitle `Tus cobros en efectivo`. Period chips, then a compact platform selector. Group rows under dates such as `Hoy · 8 oct 2026`. Rows: platform and time on the left, fare on the right, optional tip below. Use a soft-green success marker consistently. Empty state: `Todavía no hay operaciones` with `Registrar cobro` navigation to Inicio. Filtered empty state: `No hay operaciones en este período`.

Details: `Detalle de operación`, platform, full local date/time, and labeled monetary values. Secondary `Editar` action and soft-red `Eliminar`. Delete dialog: `¿Eliminar esta operación?`, `Cancelar`, `Eliminar`. Edit screen clearly says `Editar operación`; saving does not create a new record.

Editing reuses the payment form: platform, fare, received cash, quick values, live change result, and full-change tip toggle. Prepopulate from the saved operation, including its tip state. Changing fare or received cash clears the toggle as on Inicio. Use `Guardar cambios`; after commit show `Operación actualizada` with labeled fare and optional tip. On failure preserve the edited draft and allow retry; cancelling leaves the stored operation unchanged.

After confirmed single-operation deletion, show `Eliminación pendiente` with `Deshacer`. Keep the operation in history and totals until deletion commits; show its pending state and disable editing or another deletion of that row. Undo cancels the pending deletion without rewriting the record. The owner-approved window is 10 seconds, defined by DELETION_UNDO_SECONDS in src/features/transactions/deletionConstants.ts; follow DATA_AND_CALCULATIONS.md for expiry and background cancellation. On commit refresh history and totals; on failure show `No se pudo eliminar la operación. Inténtalo de nuevo.` and keep the record. Delete-all has no undo.

## Resumen

Title `Resumen`, visible selected date range, segmented Hoy/Semana/Mes selector. Large deep-green card: `Efectivo retenido`, total, and operation count. White statistic cards: `Importe de viajes`, `Propinas`, `Promedio por operación`. A simple `Por plataforma` list shows fare totals. Label values explicitly so tips are not counted twice. Charts are unnecessary in v1.

## Ajustes

Title `Ajustes`. Theme-colored grouped rows for fixed EUR, language selection, theme selection, preferred platform, confirmation haptics, and version. Destructive action near the bottom: `Eliminar todas las operaciones`. Dialog: `Se eliminarán todas las operaciones guardadas. Esta acción no se puede deshacer.` Actions: `Cancelar`, `Eliminar todo`.

Show `Idioma` / `Language` / `Мова` according to the current language. Always display language choices in their own language: `Español`, `English`, `Українська`, with a clear selected marker. Selection takes effect immediately across all screens and messages, and survives restart. The initial selection is Español. Language selection does not change EUR, platform names, or transaction amounts.

Label the shared platform preference `Plataforma predeterminada` and explain `Se actualiza también al elegir una plataforma en Inicio.` Include `Los datos se guardan solo en este dispositivo. Desinstalar la aplicación o borrar sus datos puede eliminar tu historial. Esta versión no incluye copia de seguridad ni restauración.`

## Error and loading states

On save failure: `No se pudo guardar el cobro. Inténtalo de nuevo.` Keep the draft. Database initialization may show a brief loader, then a retryable error. Do not display zeros as real statistics when loading failed. Disable destructive and edit actions during their writes. Keep UI strings centralized.
