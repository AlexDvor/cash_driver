---
name: cashdriver-architecture
description: Refactor existing CashDriver screens, hooks and components without changing application behavior.
---

# CashDriver architecture skill

Adapted from CashDriver-agent-kit.zip on 2026-10-09. Read docs/AGENTS.md and the final refactoring architecture/handoff in docs/IMPLEMENTATION_PLAN.md first. Refactoring Phases 0–7 are closed; apply these rules only within a new user-assigned scope. User requirements and existing product/data/UI contracts take precedence over kit examples.

## Scope and placement

Use for screen/component/hook/navigation refactoring. Preserve React Native CLI, TypeScript, existing dependencies and current functionality. There are six screens: Home, History, Summary, Settings, Details and Edit; do not add the kit's AddTrip or Statistics screens.

Move only the assigned files: screens into src/screens/<Name>Screen/, hooks into responsibility subfolders in src/hooks/, feature-facing UI into src/components/<Name>/, primitives into src/ui/<Name>/, navigation into src/navigation/ and contexts into src/providers/. Keep domain types/calculations/services/repositories feature-grouped, database infrastructure in src/database/, and translations/formatting in src/i18n/. Existing paths remain valid until their phase migrates them. Create folders on demand, without unused api/context/assets/utils scaffolding.

## Rules

- PascalCase component/screen folders and files; descriptive utility names and typed props. Avoid any, unsafe casts and unnecessary dependencies.
- JSX and event wiring in .tsx; static StyleSheet.create definitions in .styles.ts; nontrivial public props in .interface.ts. Preserve runtime styles, values and existing named exports.
- Extract cohesive reusable components or orchestration only when it improves readability. UI receives data/handlers; hooks coordinate React lifecycle/services; services validate writes; repositories own SQL; pure functions own arithmetic.
- Preserve typed route params and exact route values, provider order/lifetimes, Safe Area, keyboard/back behavior and text scaling. Update production, Jest and native test-entry imports together.
- Preserve edit draft identity, pending UUIDs, asynchronous response guards, cleanup and global deletion state. Do not move Providers into individual screens or introduce circular barrel imports.
- No DentalCare assets, copied business features, new state frameworks or speculative layers. No audio/video or tracking.

## Completion

Main agent integrates disjoint subagent tasks, obtains read-only behavioral review and runs typecheck/lint/full Jest. Report actual commands, results and native limitations; commit only the successful phase's files. Stop at its boundary.
