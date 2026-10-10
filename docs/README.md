# Cash Driver — документація

Основні вимоги та правила підтримки застосунку. Документація англійською; інтерфейс має ES/EN/UK, валюта EUR, платформи Uber/Cabify/Bolt/Otro.

| Файл | Призначення |
| --- | --- |
| [PROJECT_SPEC.md](PROJECT_SPEC.md) | Функції та межі продукту |
| [UI_DESIGN.md](UI_DESIGN.md) | Екрани, чайові, теми, accessibility та анімація |
| [DATA_AND_CALCULATIONS.md](DATA_AND_CALCULATIONS.md) | Гроші, валідація, SQLite, дати й підсумки |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Архітектура, handoff, результати та відкриті перевірки |
| [AGENTS.md](AGENTS.md) | Правила роботи AI-агентів |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | Структура коду, компоненти та перевірки |
| [screen.png](screen.png) | Візуальний орієнтир; письмові вимоги мають пріоритет |
| agent_skills/ | Узгоджені локальні правила architecture/UI/domain; посилання в AGENTS.md |

Часткові та згорнуті чайові реалізовано й перевірено автоматизованими тестами. Постійні вимоги містяться в product/UI/data-документах; [native-підсумок](IMPLEMENTATION_PLAN.md#native-tip-acceptance) окремо описує фактично перевірені Android-сценарії та обмеження.

Повна native acceptance **NOT COMPLETE**: iOS, screen reader, Reduce Motion, анімація, адаптивна матриця й попередні gates залишаються відкритими. Тимчасові плани, дубльований звіт, проміжні докази та кеші видалено за прямим дорученням власника; це не означає проходження або відкладення перевірок. Закомічену історію можна відновити через Git.

Нову роботу виконуй лише за окремим дорученням; історичні фази не є завданням повторно починати реалізацію.
