# Project tuning

These static TypeScript exports preserve the current defaults. Edit the values here and rebuild/update the application; this is not a runtime settings editor. All durations use `Ms` unless explicitly named `Seconds`; layout dimensions are dp and scale with the existing component rules.

| File | Adjust here |
| --- | --- |
| `theme/tokens.ts` | Light/dark semantic palettes, gradients, spacing, typography (including Home/tab labels), radii, touch targets, icon sizes and state/decorative opacity |
| `theme/layout.ts` | Payment action wrapping, quick-amount/choice widths, text-width estimates and summary label font-scale limits |
| `theme/motion.ts` | Collapsible duration, skeleton half-cycle/minimum opacity and calendar animation/indicator timing |
| `theme/calendar.ts` | Calendar progress geometry; existing timing names delegate to `calendarMotion` for compatibility |
| `timing.ts` | Fare auto-advance, received-cash keyboard dismissal, success/result visibility, Undo window/countdown and local clock refresh |
| `solarTheme.ts` | Foreground location acquisition/permission timeouts, initial fix age, solar clock checks and approximate location watch options |
| `platforms.ts` | Existing platform IDs, labels and validation |

Keep independently meaningful parameters separate even when their numbers match. For example, changing payment success visibility must not change deletion feedback timing. Pressed opacity remains 0.7 for ordinary controls and 0.8 for choice controls. `DELETION_UNDO_SECONDS` remains available from its feature file and delegates to `deletionTiming.undoWindowSeconds`.

Palette colors belong only in `theme/tokens.ts`; components consume the active ThemeProvider palette. Brand artwork colors, SVG geometry, structural 0/1 values, layout fractions/rotations, unit conversions, calendar and monetary rules, database schema versions, query contracts and test fixtures are not general UI tuning. They remain with their owners. Native Android/iOS audio gain, playback deadlines and bundled WAV resources also remain native and unchanged by this refactor.

Changing a timeout or minimum layout size is a behavior/design change and needs the corresponding timer-boundary, accessibility or layout checks. Moving constants does not replace cleanup, stale-response protection, Reduce Motion, foreground-only location or permission rules. Existing tests intentionally retain independent literal expectations for defaults.
