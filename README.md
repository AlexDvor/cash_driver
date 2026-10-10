# CashDriver

CashDriver is an offline cash calculator and payment log for drivers. Enter the fare and the cash received, add an optional tip, and see the change immediately. Confirmed payments are stored locally and included in daily, weekly, and monthly summaries.

Platform labels — Uber, Cabify, Bolt, and Otro — are selected manually. The app does not connect to these services.

## Features

- Exact EUR calculations using integer cents, with comma or period decimal input.
- Quick received-amount buttons and an exact-payment action.
- Collapsible tip section: add a specific amount or use all change as a tip. A positive tip stays visible in the header when collapsed; removing it clears the amount.
- Local SQLite history with payment details, editing, period/platform filters, and confirmed deletion with an undo opportunity for individual payments.
- Separate fare, tip, and retained-cash totals; average fare and fare totals by platform.
- Spanish (default), English, and Ukrainian interface languages.
- Light, dark, and automatic system themes; saved language, theme, and default-platform preferences.

For example, a **20 €** fare, **50 €** received, and **5 €** tip produces **25 €** change and **25 €** retained cash. Received cash is not counted as revenue; retained cash is not a profit calculation.

## Screens

| Screen | Purpose |
| --- | --- |
| Inicio | Record a payment and view today's totals |
| Historial | Browse, inspect, edit, and delete saved payments |
| Resumen | View daily, weekly, and monthly totals |
| Ajustes | Choose language, theme, default platform, and haptic feedback; manage local data |

Data stays on the device. Uninstalling the app or clearing its storage can erase payment history. Backup and restoration are outside the current scope.

## Technology

React Native CLI **0.87.1**, React **19.2.3**, TypeScript, React Navigation, and SQLite through `@op-engineering/op-sqlite`. The application has no required backend or account registration. Internet access is needed to install development dependencies, not to record payments.

## Development setup

Run commands from the repository root unless stated otherwise.

- Node.js **22.11.0 or newer**, as specified in `package.json`.
- Android: JDK 17, Android SDK/Android Studio, and a running emulator or USB-connected device. The project sets `minSdkVersion` to **24** (Android 7.0).
- iOS: macOS, Xcode, Ruby/Bundler, and CocoaPods dependencies from the project's `Gemfile`.

Install JavaScript dependencies:

```sh
npm ci
```

Start Metro in one terminal:

```sh
npm start
```

Build and launch Android in another terminal:

```sh
npm run android
```

### Android rebuild and Metro cache

The existing clean/rebuild scripts use `gradlew.bat` and are intended for Windows:

```sh
npm run android:rebuild
```

This runs Gradle clean and then the Android build. It does not reset Metro's cache or remove the installed app's data. To reset Metro's cache, stop the running Metro process and start it with:

```sh
npm run start:reset
```

Metro reload requires a connected, running development app. If it reports "No apps connected", launch the app with `npm run android` and check the device connection.

### iOS

On macOS, install the native dependencies, then launch iOS with Metro running in another terminal:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

The repository includes an iOS target, but native iOS build and acceptance have not been verified in the current Windows environment.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test -- --runInBand --watch=false
```

`npm run format` applies the project's formatting rules to source, tests, and supported root files.

Automated coverage includes monetary rules, form lifecycle, persistence/migrations, history, summaries, and save/retry protection. Selected Android emulator flows have been checked; full native acceptance remains incomplete. Outstanding accessibility, motion, layout, and platform checks are recorded in the [implementation handoff](docs/IMPLEMENTATION_PLAN.md#native-tip-acceptance).

## Project structure

| Path | Contents |
| --- | --- |
| `src/screens/`, `src/components/`, `src/ui/` | Screens, shared form components, and UI primitives |
| `src/hooks/`, `src/providers/`, `src/navigation/` | Form/data hooks, application state providers, and navigation |
| `src/features/`, `src/database/` | Domain calculations, services, repositories, and SQLite setup/migrations |
| `src/i18n/`, `src/constants/`, `src/theme/` | Translations, shared constants, and theme helpers |
| `__tests__/` | Automated tests and native acceptance entries |
| `android/`, `ios/` | Native projects |
| `docs/` | Product contracts, coding guidance, and verification history |

## Documentation

- [Documentation index](docs/README.md)
- [Product specification](docs/PROJECT_SPEC.md)
- [UI behavior and design](docs/UI_DESIGN.md)
- [Data and calculation rules](docs/DATA_AND_CALCULATIONS.md)
- [Implementation handoff and open checks](docs/IMPLEMENTATION_PLAN.md)
- [Coding standards](docs/CODING_STANDARDS.md)
- [AI agent instructions](docs/AGENTS.md)
