export type Language = 'es' | 'en' | 'uk';
export const es = {
  appName: 'Cash Driver',
  storageLoading: 'Cargando datos locales',
  storageFailed:
    'No se pueden abrir los datos locales. No se han borrado. Reintenta.',
  retry: 'Reintentar',
  preferencesSaved: 'El idioma y el tema se guardan en este dispositivo.',
  preferencesWriteFailed:
    'No se pudo guardar la preferencia. Se conserva la selección anterior. Reintenta.',
  themeWriteFailed:
    'No se pudo guardar el tema. Se conserva el tema anterior. Reintenta.',
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
  summaryPending: 'La pantalla de totales todavía no está implementada.',
  detailsPending:
    'La ruta de detalles está preparada. Todavía no se cargan operaciones.',
  editPending:
    'La ruta de edición está preparada. Todavía no se pueden modificar operaciones.',
  settingsPending:
    'Los controles de plataforma, vibración y las demás opciones se añadirán en una fase posterior.',
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
  storageLoading: 'Loading local data',
  storageFailed: 'Cannot open local data. It has not been deleted. Retry.',
  retry: 'Retry',
  preferencesSaved: 'Language and theme are saved on this device.',
  preferencesWriteFailed:
    'Could not save the preference. The previous selection is retained. Retry.',
  themeWriteFailed:
    'Could not save the theme. The previous theme is retained. Retry.',
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
  summaryPending: 'The totals screen is not implemented yet.',
  detailsPending:
    'The details route is ready. Transactions are not loaded yet.',
  editPending:
    'The editing route is ready. Transactions cannot be changed yet.',
  settingsPending:
    'Platform, haptics and other settings controls will be added in a later phase.',
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
  storageLoading: 'Завантаження локальних даних',
  storageFailed:
    'Не вдалося відкрити локальні дані. Їх не видалено. Повторіть спробу.',
  retry: 'Повторити',
  preferencesSaved: 'Мова й тема зберігаються на цьому пристрої.',
  preferencesWriteFailed:
    'Не вдалося зберегти налаштування. Залишено попередній вибір. Повторіть спробу.',
  themeWriteFailed:
    'Не вдалося зберегти тему. Залишено попередню тему. Повторіть спробу.',
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
  summaryPending: 'Екран підсумків ще не реалізовано.',
  detailsPending:
    'Маршрут деталей підготовлено. Операції ще не завантажуються.',
  editPending:
    'Маршрут редагування підготовлено. Змінювати операції ще неможливо.',
  settingsPending:
    'Елементи вибору платформи, вібровідгуку та інші параметри з’являться на наступному етапі.',
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
