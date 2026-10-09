# Coding standards for AI agents

Apply these rules during implementation within the scope of PROJECT_SPEC.md. Inspect the existing project first and reuse compatible conventions and components. The paths below describe responsibilities; adapt them to an established equivalent structure rather than creating a parallel architecture.

## Placement and responsibilities

The table below describes current responsibilities. Refactoring Phases 1–5 place screens in `src/screens/`, hooks in `src/hooks/`, universal primitives in `src/ui/`, feature-facing UI in `src/components/`, navigation in `src/navigation/` and contexts in `src/providers/`. Static styles and nontrivial public props are adjacent files; provider accessors remain beside their context. Feature folders retain calculations, services, repositories and deletion constants. Shared theme tokens now live in `src/constants/theme/tokens.ts`, and platform metadata/type validation in `src/constants/platforms.ts`. Theme resolution/system-bar helpers remain in `src/theme/`. Do not create duplicate implementations to satisfy the target tree. Keep domain calculations, services and repositories feature-grouped. The permanent architecture and data-flow handoff in IMPLEMENTATION_PLAN.md describes the final structure; product/data/UI behavior retains its existing authority.

| Location | Put here | Keep out |
| --- | --- | --- |
| `src/constants/theme/` | Existing palettes, typography, spacing, radii and shared sizing tokens from UI_DESIGN.md | Runtime context state and payment logic |
| `src/constants/platforms.ts` | Four stable IDs, derived Platform type, existing labels and isPlatform guard | SQL/migration literals and preferences state |
| `src/theme/` | Theme mode resolution and native system-bar helper | Duplicate palette/token definitions and payment logic |
| `src/i18n/` | Matching Spanish, English, and Ukrainian translation dictionaries, locale mapping and formatting | User transaction data; relocated LanguageProvider/context accessor |
| `src/ui/<Name>/` | Universal ActionButton, AppText, Card, ChoiceGroup, MoneyInput, ScreenContainer and TabIcon; adjacent static styles/complex props | SQL and feature-specific orchestration |
| `src/components/<Name>/` | Shared create/edit PaymentForm, DailySummary, DeletionNotice and TransactionLoadState; styles/complex props where needed | SQL and duplicated calculation policy |
| `src/screens/<Name>Screen/` | One screen entry per folder: Home, History, Summary, Settings, Details, Edit; adjacent static styles where used | SQL, duplicated arithmetic, copies of shared forms |
| `src/hooks/app/`, `src/hooks/transactions/`, `src/hooks/summary/` | Clock/subscriptions, form/create-save/load orchestration, daily/period refresh; React lifecycle and service coordination | SQL and pure calculation policy; provider context definitions |
| `src/features/transactions/` | Types, pure calculations, service, repository and deletion constants | Duplicated create/edit arithmetic; relocated screens/hooks/presentation components/Provider |
| `src/features/summary/` | Period calculations and aggregation | A second source of monetary rules; relocated screens/hooks/presentation components |
| `src/features/settings/` | Preferences, defaults, haptics and installed-version adapters | Transaction SQL in screens; screen entries |
| `src/database/` | Connection lifecycle and versioned migrations | Presentation logic |
| `src/navigation/` | AppNavigator, AppTabBar, exact route constants and typed params; global deletion footer wiring | Storage/calculation policy and Provider context definitions |
| `src/providers/<Name>/` | PersistenceProvider, LanguageProvider, ThemeProvider, DeletionProvider and their accessors; bootstrap styles where needed | Route definitions and duplicated services |
| `src/app/` | Persistence composition and change notifier | Relocated navigation/Providers; large payment screens or calculation rules |

## Style and reuse

- Use TypeScript with explicit props and domain types; avoid `any` and unexplained type assertions. Use descriptive English identifiers and follow existing formatting/lint conventions.
- Define reusable visual values once in theme tokens. Screens and components reference those tokens rather than repeat color literals, font sizes, spacing, or radii. Unique layout values may stay local when their purpose is clear.
- Use React Native style definitions for stable styles; use dynamic styles only for state or available layout. Keep component-specific styles beside their component, following the project's existing convention.
- Compose screens from focused components. Extract a component when it has a clear responsibility or repeated behavior, not merely to wrap every View. Avoid universal components with many unrelated flags.
- Reuse one payment form for create and edit. Pass mode, initial values, save state, and callbacks explicitly; validation and derived monetary values come from the same pure utilities/service.
- Hooks manage reusable React state, lifecycle, and service interaction. They do not replace pure calculation functions or repositories. Screens compose UI; services validate writes; repositories own SQL.
- Keep effects and subscriptions scoped, with cleanup. Avoid fetching or writing during render, duplicated derived state, and unnecessary new libraries or state frameworks.

## Simple, beginner-readable code

Keep localization small: reuse compatible existing i18n tooling, otherwise use typed dictionaries and one shared accessor without a new framework. Translate navigation, forms, settings, dialogs, accessibility labels, and loading/empty/error/success states. Use interpolation for amounts/counts rather than sentence concatenation; handle count wording in each language. Missing keys must fail the translation completeness check; Spanish fallback is a runtime safeguard, not permission to ship incomplete translations. Language changes update labels without remounting payment forms.

Write code that a developer with basic React and TypeScript knowledge can follow. Simplicity must preserve the documented validation, persistence, and failure handling.

- Prefer ordinary functions, functional components, explicit props, and focused hooks. Do not introduce factories, dependency-injection containers, class hierarchies, generic base services, or additional architectural layers without a concrete current need.
- Use names that describe intent and units, such as `calculateChange` and `fareAmountCents`. Avoid unexplained abbreviations, clever one-liners, nested ternaries, and long chains that hide intermediate steps. Prefer named intermediate values and early returns when they improve clarity.
- Keep each function/component focused on one responsibility. Split a file when it combines distinct responsibilities or contains a reusable coherent part; do not split every small helper into its own file or enforce arbitrary line-count limits.
- Extract shared logic for actual reuse, especially money rules and the create/edit form. Do not build configurable frameworks for hypothetical future features. A little local presentation code is acceptable when an abstraction would obscure the flow.
- Keep dependencies explicit. A save flow should be traceable from screen/hook to service validation/calculation and repository persistence. Avoid hidden writes, unrelated side effects, and duplicated sources of state.
- Comment why a non-obvious decision exists, particularly cents arithmetic, date boundaries, retry IDs, and deferred deletion. Do not narrate obvious code. Keep comments accurate when behavior changes.
- Do not use lint/type suppressions, unsafe casts, or swallowed errors just to make checks pass. Resolve the cause or report the limitation. Follow existing formatting; do not reformat unrelated files or add tooling during a feature task without a concrete need.
- After each phase, explain the main changed files and their responsibilities in a few sentences, including how the implemented flow connects them. Record this in the phase handoff defined in IMPLEMENTATION_PLAN.md; do not create a large parallel architecture document.

## Adaptive layout

Resolve light/dark semantic tokens through ThemeProvider in `src/providers/ThemeProvider/`, using `src/constants/theme/` tokens and `src/theme/` resolution/system-bar helpers, the persisted preference and reactive system appearance. Components consume the resolved theme rather than maintain individual theme switches or fixed light-only styles. Share typography/spacing across palettes; propagate changes without remounting forms or losing state. Clean up appearance subscriptions. Reuse existing theme infrastructure when compatible.

- Use available window/container width and flex layout, not a fixed screenshot size or device model detection. When responsive branching is needed, use reactive dimensions so rotation and window resizing update the layout.
- Keep typography based on the documented logical-unit tokens and system text scaling. Do not multiply all font sizes and controls by screen width or disable font scaling to make the screenshot fit.
- Respect safe areas and keyboard space. Allow scrolling and wrapping; inputs and save actions remain reachable on short or narrow displays and with large system text.
- Let selectors and statistic cards wrap or stack when their content no longer fits. On wider displays, constrain and center content for readability rather than stretching inputs indefinitely. Document any added shared width/breakpoint token and its purpose.
- Preserve the documented touch-target minimums, readable contrast, accessibility labels, and selected/error states. Do not truncate essential monetary values or hide labels to solve overflow.

## Design resources and optional tooling

When the assigned phase needs design expertise, use relevant available skills according to their instructions, inspect the reference, and consult current official library/platform documentation. If a needed skill is unavailable, report that and continue with available tools; do not claim it was used. Installing a skill/plugin or connecting an external account is a separate action requiring the user's request. Do not upload project files or transaction data to external services merely to get design advice.

Built-in styling and animation remain a valid default. A maintained styling, icon, or animation library may be adopted for a concrete current need within the assigned implementation phase. First explain its benefit versus the existing tools, check React Native/native architecture and Android/iOS compatibility, review required dependencies, and record the choice in the phase handoff. Reuse an existing compatible library; avoid multiple overlapping styling systems or replacing the app architecture for appearance alone. Keep shared semantic tokens and beginner-readable components regardless of library choice.

## Verification before completion

### Tests and custom hooks during implementation

- In each coding phase, add or update meaningful tests for new or changed behavior before declaring it complete. Cover observable outcomes and relevant failure paths; do not defer tests to final acceptance. Reuse existing coverage when sufficient and explain that in the handoff. Pure visual/token-only changes need visual checks rather than tests that merely repeat constants. Phase 0 is inspection only and adds no tests.
- Use existing project hooks when their contracts fit. Create a custom hook for cohesive reusable state, effects, or service coordination, not every helper. During the authorized refactoring, move application hooks into responsibility subfolders in `src/hooks/`; provider accessors may stay beside their context. Before that phase, feature-local hooks remain valid. Examples such as `usePaymentForm`, `useTransactions`, or `usePreferences` are possible responsibilities, not mandatory files. Keep money/date calculations as pure functions and SQL in repositories.
- Test hook behavior through focused hook/component tests where needed: state transitions, retry without losing drafts, subscriptions/cleanup, and preservation on theme/language changes. Avoid asserting internal implementation details or mocking away the behavior being verified. Native storage and platform behavior still require native checks.
- Reuse existing Git pre-commit hooks/CI for available checks. Report skipped/unavailable checks; do not bypass failing checks or install a new hook framework solely to enforce this document.

### Optional subagent review

When the user requests subagents for an implementation phase and the environment supports them, delegate a bounded review of changed code/tests against the phase requirements. A review subagent should read the relevant docs, inspect the diff, and report concrete defects and missing behavioral coverage; it must not start later phases or independently edit the same files. The main agent assesses findings, fixes confirmed issues, runs the relevant checks, and records the review outcome. If delegation is unavailable, perform a self-review and state that no subagent was used. Review does not replace tests or native verification.

1. Review the changed files against the placement table: no SQL in screens, no duplicated money rules, no repeated theme values, and no duplicated payment form.
   Also review readability: clear names and units, focused responsibilities, traceable data flow, and no unnecessary abstraction layers. Type/lint checks alone do not prove this.
2. Run the project's existing type check, lint, and relevant tests from IMPLEMENTATION_PLAN.md. Report actual commands and results; report unavailable checks explicitly.
3. Verify affected UI on narrow and wider layouts, increased system text, and with the keyboard open. Compare visual direction with `docs/screen.png` while applying current written requirements.
4. Check loading, empty, error, retry, and disabled states for the affected flow. Do not claim native or visual checks from unit tests alone.
5. Review visual consistency and motion against UI_DESIGN.md. Check reduced motion, immediate monetary updates, and that animations do not block input or affect save outcomes. Record unverified device behavior explicitly.

Reuse existing pre-commit hooks or CI checks when present. React hooks are application logic, not quality gates. Do not add a hook framework, mandatory review agents, or new tooling solely for this checklist; automated enforcement can be proposed separately if existing tools cannot cover a recurring issue. A separate review agent is optional when explicitly requested, and does not replace the checks above.
