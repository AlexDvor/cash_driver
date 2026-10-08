export type Language = 'es' | 'en' | 'uk';
export const es = {
  appName: 'Cash Driver',
  home: 'Inicio',
  history: 'Historial',
  summary: 'Resumen',
  settings: 'Ajustes',
  subtitle: 'Registro rápido de efectivo',
  details: 'Detalle de operación',
  edit: 'Editar operación',
  back: 'Volver',
  unfinished: 'En desarrollo',
  homePending:
    'El formulario de cobro estará disponible en una fase posterior.',
  historyPending: 'El historial y sus filtros todavía no están implementados.',
  summaryPending:
    'Los totales estarán disponibles cuando se implemente el almacenamiento local.',
  detailsPending:
    'La ruta de detalles está preparada. Todavía no se cargan operaciones.',
  editPending:
    'La ruta de edición está preparada. Todavía no se pueden modificar operaciones.',
  settingsPending:
    'Las preferencias persistentes y las demás opciones se añadirán en una fase posterior.',
  sessionOnly:
    'Vista previa: el idioma y el tema solo se aplican durante esta sesión. No se guardan.',
  language: 'Idioma',
  theme: 'Tema',
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Automático',
  systemHelp:
    'Usa el tema del dispositivo. Para cambiar entre día y noche, configura el horario en los ajustes del sistema.',
};
export type TranslationKey = keyof typeof es;
type Dictionary = Record<TranslationKey, string>;
export const en: Dictionary = {
  appName: 'Cash Driver',
  home: 'Home',
  history: 'History',
  summary: 'Summary',
  settings: 'Settings',
  subtitle: 'Quick cash records',
  details: 'Transaction details',
  edit: 'Edit transaction',
  back: 'Back',
  unfinished: 'In development',
  homePending: 'The payment form will be available in a later phase.',
  historyPending: 'History and its filters are not implemented yet.',
  summaryPending: 'Totals will be available once local storage is implemented.',
  detailsPending:
    'The details route is ready. Transactions are not loaded yet.',
  editPending:
    'The editing route is ready. Transactions cannot be changed yet.',
  settingsPending:
    'Persistent preferences and other settings will be added in a later phase.',
  sessionOnly:
    'Preview: language and theme apply only during this session. They are not saved.',
  language: 'Language',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  system: 'Automatic',
  systemHelp:
    'Uses the device theme. To switch between day and night, configure the schedule in system settings.',
};
export const uk: Dictionary = {
  appName: 'Cash Driver',
  home: 'Головна',
  history: 'Історія',
  summary: 'Підсумки',
  settings: 'Налаштування',
  subtitle: 'Швидкий облік готівки',
  details: 'Деталі операції',
  edit: 'Редагувати операцію',
  back: 'Назад',
  unfinished: 'У розробці',
  homePending: 'Форма оплати буде доступна на наступному етапі.',
  historyPending: 'Історія та її фільтри ще не реалізовані.',
  summaryPending:
    'Підсумки будуть доступні після реалізації локального сховища.',
  detailsPending:
    'Маршрут деталей підготовлено. Операції ще не завантажуються.',
  editPending:
    'Маршрут редагування підготовлено. Змінювати операції ще неможливо.',
  settingsPending:
    'Збереження налаштувань та інші параметри з’являться на наступному етапі.',
  sessionOnly:
    'Попередній перегляд: мова й тема діють лише протягом цього сеансу та не зберігаються.',
  language: 'Мова',
  theme: 'Тема',
  light: 'Світла',
  dark: 'Темна',
  system: 'Автоматична',
  systemHelp:
    'Використовує тему пристрою. Для зміни між денною та нічною темами налаштуйте розклад у системних налаштуваннях.',
};
export const dictionaries: Record<Language, Dictionary> = { es, en, uk };
export const languageOptions: { value: Language; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
];
export const locales: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-GB',
  uk: 'uk-UA',
};
export function translate(language: Language, key: TranslationKey): string {
  return dictionaries[language][key] ?? es[key];
}
