# Cash Driver — AI agent instructions

Read `docs/PROJECT_SPEC.md`, `docs/UI_DESIGN.md`, `docs/DATA_AND_CALCULATIONS.md`, and `docs/IMPLEMENTATION_PLAN.md` before implementation. They describe the complete v1 scope. This file is the instruction entry point for coding agents.

## Working rules

Follow `docs/CODING_STANDARDS.md` for code placement, theme tokens, component reuse, adaptive layout, and completion checks. Inspect `docs/screen.png` before UI implementation; UI_DESIGN.md takes precedence over visual examples where they differ.

1. Implement only the v1 features documented here. Do not invent additional modules.
2. Use React Native CLI and TypeScript. Do not migrate to Expo.
3. Keep the application fully offline. Use SQLite for transactions and persisted local preferences.
4. All monetary data must be integer cents. Never calculate money using decimal euro values.
5. Visible interface text follows the selected language: Spanish by default, English or Ukrainian as alternatives. Code identifiers and documentation are English. Centralize all UI strings with matching translation keys across the three languages.
6. Preserve the green design tokens and the four tabs: Inicio, Historial, Resumen, Ajustes.
7. Optimize the main flow for quick use: select platform, enter fare, enter received amount, see change, confirm.
8. Keep calculation utilities independent of React Native. Put SQL in a repository, not in screens.
9. Use explicit types. Avoid unnecessary dependencies, state frameworks, abstraction layers, or unrequested infrastructure.
10. Inspect an existing project before changing it. Preserve unrelated work and follow existing compatible conventions.
11. Prevent duplicate saves. Reset the form only after persistence succeeds. Preserve inputs on failure.
12. Require confirmation for deletion. Refresh history and statistics after create, edit, or delete.
13. Version the database schema and use non-destructive migrations.
14. Never show sample operations as real data in the installed application.
15. Run the relevant checks in `docs/IMPLEMENTATION_PLAN.md`. Report what was actually verified and any environment limitations.
16. Implement only the phase assigned by the user in `docs/IMPLEMENTATION_PLAN.md`, or in the temporary `docs/REFACTORING_PLAN.md` for refactoring. Verify prerequisites, record the phase handoff, and stop before the next phase. Do not interpret the complete MVP specification as permission to implement all phases.
17. Add/update meaningful behavioral tests during each coding phase and reuse suitable custom hooks as specified in CODING_STANDARDS.md. When the user requests a subagent review and tools support it, use the bounded review workflow there; report actual verification and delegation results.

## Source of truth

The latest explicit user instructions take precedence. `PROJECT_SPEC.md` defines scope, `DATA_AND_CALCULATIONS.md` defines arithmetic and data rules, and `UI_DESIGN.md` defines presentation. If a material conflict remains, explain it before implementing the affected behavior. Resolve routine choices independently within this scope.

## Refactoring conventions reconciled from CashDriver-agent-kit

Read the applicable local skills before changing code: [architecture](agent_skills/cashdriver-architecture/SKILL.md), [UI](agent_skills/cashdriver-ui/SKILL.md), and [domain](agent_skills/cashdriver-domain/SKILL.md). They are adapted documentation copies of the supplied archive; they are not automatically discovered `.agents/skills` installations. This phase keeps instruction files inside docs/.

- Preserve CashTransaction, integer cents, all four platform IDs, the existing palettes, offline SQLite and all current behavior. No audio/video, tracking, platform APIs, commission calculations or speculative fields.
- Move screens to `src/screens/<Name>Screen/` and hooks to `src/hooks/` only in their assigned refactoring phases. Keep pure domain functions/services/repositories feature-grouped, and formatting in i18n; the kit's Trip/global-utils examples do not replace these responsibilities.
- Separate static `.styles.ts` and nontrivial public `.interface.ts` beside components. Retain dynamic palette/inset/state styles; do not create a token for every local number or change design values.
- Use named exports consistent with the existing application. Maintain typed routes, accessible controls, safe areas, keyboard access and native/test-entry imports.
- Shared tokens now live in `src/constants/theme/tokens.ts`; consume reactive `useAppTheme()` from `src/providers/ThemeProvider/ThemeProvider.tsx`. Mode resolution/system-bar helpers remain in `src/theme/`. The kit's static Theme.colors and DentalCare palette are examples, not a replacement.
- Preserve existing translation dictionaries; localization already exists. Routes live in `src/navigation/routes.ts`, platform metadata in `src/constants/platforms.ts`. Preserve exact string values and existing labels, including `Otro` in every language.
- Use bounded implementation/review subagents as described in the plan. Main agent owns integration and commits. Run typecheck, lint and full Jest after each implementation phase; stage only phase files and commit successful phases, with actual results recorded.

Priority for refactoring: latest user requirements > existing CashDriver product/data/UI contracts and protected behavior > reconciled kit skills > DentalCare examples. New placement is a phased migration, not permission to overwrite existing behavior or restart historical MVP phases.
