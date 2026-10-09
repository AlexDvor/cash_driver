---
name: cashdriver-ui
description: Organize CashDriver UI styles and props while preserving its current responsive light/dark design.
---

# CashDriver UI skill

Adapted from CashDriver-agent-kit.zip on 2026-10-09. Use for UI/style extraction. Read docs/UI_DESIGN.md and docs/CODING_STANDARDS.md; refactoring is not a redesign.

- Keep the actual current palettes, typography, spacing, radii and sizing. Do not copy the kit's provisional DentalCare-derived token files or invent new design values.
- Until the constants phase, consume src/theme/tokens and useAppTheme as currently implemented. After migration use src/constants/theme for shared static tokens while retaining resolved runtime colors from the theme provider. Static Theme.colors must not freeze light/dark behavior.
- Separate StyleSheet.create into Component.styles.ts. Keep dynamic styles based on runtime state, available width, font scale, palette and insets. Use memoization only with an actual need.
- Centralize reusable visual decisions, not every one-off geometry value. Preserve local native-View icon geometry; do not presume SVG assets or add an icon dependency.
- Use feature-facing components and universal primitives as distinct responsibilities; retain one shared create/edit payment form. Extract nontrivial props beside their component.
- Preserve accessibility labels/test IDs, touch areas, wrapping, text scaling, loading/empty/error/retry/disabled states, keyboard access and current press feedback. Language/theme changes must preserve drafts and navigation.
- Verify affected layouts with available native checks; automated tests do not establish visual, tactile or screen-reader acceptance. Existing physical haptics FAIL and iOS/accessibility NOT VERIFIED remain open.
