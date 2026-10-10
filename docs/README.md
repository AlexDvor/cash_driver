# Cash Driver — пакет документації MVP

Ця папка містить специфікацію, правила роботи AI-агентів і перевірені handoff реалізації CashDriver. Поточна структура після рефакторингу та межі перевірок записані в `IMPLEMENTATION_PLAN.md`; історичні описи не визначають сучасне розташування файлів. Повна native acceptance залишається незавершеною.

| Файл | Призначення |
| --- | --- |
| AGENTS.md | Інструкції та правила роботи AI-агента |
| docs/CODING_STANDARDS.md | Структура коду, дизайн-константи, компоненти, адаптивність і перевірки |
| docs/screen.png | Візуальний орієнтир; письмова специфікація має пріоритет у разі розбіжностей |
| PROJECT_SPEC.md | Функції та межі першої версії |
| docs/UI_DESIGN.md | Чотири екрани, зелений стиль, тексти й поведінка інтерфейсу |
| docs/DATA_AND_CALCULATIONS.md | Гроші в центах, здача, чайові, SQLite, дати й підсумки |
| docs/IMPLEMENTATION_PLAN.md | Порядок реалізації та перевірки |
| docs/agent_skills/ | Узгоджені з CashDriver правила architecture/UI/domain з agent kit; читаються через docs/AGENTS.md |

Документація англійською для зручної роботи coding-агентів. Інтерфейс застосунку — іспанською за замовчуванням, з вибором англійської або української в налаштуваннях. Платформи: Uber, Cabify, Bolt, Otro. Основний сценарій: сума поїздки → отримана готівка → здача → підтвердження → історія та підсумки.

Рефакторинг Phases 0–7 завершено в scope коду, документації та доступних перевірок. Постійна архітектура, коміти й відкриті native gates збережені в `IMPLEMENTATION_PLAN.md`; тимчасовий план видалено. Нову роботу виконуй лише за окремим завданням користувача.

Нове розширення від 2026-10-09 — часткові чайові: поїздка 20 €, отримано 50 €, чайові 5 €, здача 25 €. Контракти описані в PROJECT_SPEC.md, DATA_AND_CALCULATIONS.md та UI_DESIGN.md. Фази 2–3 реалізують розрахунки, збереження, міграцію v4 та спільний блок введення з автоматичними перевірками; інтеграцію історії та підсумків перевірено у фазі 4, native acceptance очікує фазу 5. Порядок етапів тимчасово записаний у [PARTIAL_TIPS_PLAN.md](PARTIAL_TIPS_PLAN.md). Цей план буде видалено після постійного handoff; його створення не перезапускає історичні фази. Історичні результати перевірок не підтверджують нову функцію.

Нове розширення від 2026-10-10 — згорнута секція чайових. Фази 0–2 завершені: документацію узгоджено, стан і lifecycle hook реалізовано та перевірено. Згорнутий UI й анімація очікують окремої фази 3. Порядок окремих доручень і gates: [COLLAPSIBLE_TIPS_PLAN.md](COLLAPSIBLE_TIPS_PLAN.md). Старий partial-tip план і незавершені native-перевірки зберігаються.

## Архівний початковий промпт для AI-агента

Наведені нижче промпти описують початок історичного MVP-процесу; вони не є дорученням повторно запускати завершені фази в поточному проєкті.

```text
Read docs/AGENTS.md, docs/PROJECT_SPEC.md, docs/UI_DESIGN.md,
docs/DATA_AND_CALCULATIONS.md, docs/CODING_STANDARDS.md,
and docs/IMPLEMENTATION_PLAN.md first. Inspect docs/screen.png as the visual reference.
Execute only Phase 0 — Project inspection from docs/IMPLEMENTATION_PLAN.md.
Inspect the existing project without implementation changes.
Keep Spanish as the default with English/Ukrainian selection, the green design system, integer-cent arithmetic,
local SQLite persistence, and Uber/Cabify/Bolt/Otro platform selection.
Report existing work, dependencies, available checks, and blockers.
Stop after the report; do not start Phase 1.
```

Для наступного етапу: «Виконай лише Phase N з docs/IMPLEMENTATION_PLAN.md. Перевір передумови, дотримуйся docs/AGENTS.md і docs/CODING_STANDARDS.md, виконай перевірки цієї фази, онови Progress та зупинись. Наступну фазу не починай». Заміни N на потрібний номер; спочатку виконай Phase 0. Фази й передавання результатів описані в одному IMPLEMENTATION_PLAN.md, без окремого документа на кожну фазу.

Якщо в проєкті вже є `AGENTS.md`, об'єднай правила, зберігши потрібні існуючі інструкції. Не перезаписуй його без перевірки.

Для фази реалізації можна додати до промпту:

```text
Add or update meaningful tests for this phase and run the relevant checks.
Reuse suitable project custom hooks; create focused hooks only where needed.
If subagent tools are available, use one review subagent to inspect this phase's
changed code and tests without editing files. Fix confirmed findings and report
checks actually run. If unavailable, perform self-review and say so.
Record the results in Progress and stop before the next phase.
```

Цей блок призначений для фаз із написанням коду, а не для Phase 0. Custom React hooks організовують логіку застосунку; Git hooks запускають перевірки; субагент переглядає результат. Це різні механізми.
