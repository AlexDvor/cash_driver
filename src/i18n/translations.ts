export type Language = 'es' | 'en' | 'uk';
export const es = {
  today: 'Hoy',
  operationCount: 'Operaciones',
  fareTotal: 'Importe de viajes',
  tipsTotal: 'Propinas',
  retainedCash: 'Efectivo retenido',
  totalsLoading: 'Cargando los totales de hoy',
  totalsFailed: 'No se pudieron cargar los totales de hoy. Reintenta.',
  newPayment: 'Nuevo cobro',
  platform: 'Plataforma',
  otherPlatform: 'Otro',
  fareInput: 'Importe a cobrar',
  receivedInput: 'El cliente entrega',
  exact: 'Exacto',
  change: 'CAMBIO',
  missingCash: 'Faltan {amount}',
  insufficientCash: 'El importe recibido es insuficiente',
  changeIsTip: 'El cambio es propina',
  tipAmount: 'Propina: {amount}',
  confirmPayment: 'Confirmar cobro',
  savingPayment: 'Guardando cobro…',
  paymentFailed: 'No se pudo guardar el cobro. Inténtalo de nuevo.',
  retryPayment: 'Reintentar cobro',
  savedPayment: 'Cobro registrado · Importe de viaje: {fare}',
  savedPaymentWithTip:
    'Cobro registrado · Importe de viaje: {fare} · Propina: {tip}',
  invalidMoney: 'Introduce un importe válido con hasta dos decimales.',
  positiveFare: 'El importe del viaje debe ser mayor que cero.',
  maximumMoney: 'El importe máximo es {amount}.',
  dismissKeyboard: 'Ocultar teclado',
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
  today: 'Today',
  operationCount: 'Operations',
  fareTotal: 'Trip fares',
  tipsTotal: 'Tips',
  retainedCash: 'Cash retained',
  totalsLoading: 'Loading today’s totals',
  totalsFailed: 'Could not load today’s totals. Retry.',
  newPayment: 'New payment',
  platform: 'Platform',
  otherPlatform: 'Other',
  fareInput: 'Trip fare',
  receivedInput: 'Cash received',
  exact: 'Exact',
  change: 'CHANGE',
  missingCash: 'Missing {amount}',
  insufficientCash: 'The cash received is insufficient',
  changeIsTip: 'Keep all change as a tip',
  tipAmount: 'Tip: {amount}',
  confirmPayment: 'Confirm payment',
  savingPayment: 'Saving payment…',
  paymentFailed: 'Could not save the payment. Try again.',
  retryPayment: 'Retry payment',
  savedPayment: 'Payment recorded · Trip fare: {fare}',
  savedPaymentWithTip: 'Payment recorded · Trip fare: {fare} · Tip: {tip}',
  invalidMoney: 'Enter a valid amount with up to two decimal places.',
  positiveFare: 'The trip fare must be greater than zero.',
  maximumMoney: 'The maximum amount is {amount}.',
  dismissKeyboard: 'Dismiss keyboard',
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
  today: 'Сьогодні',
  operationCount: 'Операції',
  fareTotal: 'Суми поїздок',
  tipsTotal: 'Чайові',
  retainedCash: 'Утримана готівка',
  totalsLoading: 'Завантаження підсумків за сьогодні',
  totalsFailed:
    'Не вдалося завантажити підсумки за сьогодні. Повторіть спробу.',
  newPayment: 'Нова оплата',
  platform: 'Платформа',
  otherPlatform: 'Інша',
  fareInput: 'Вартість поїздки',
  receivedInput: 'Отримана готівка',
  exact: 'Точна сума',
  change: 'ЗДАЧА',
  missingCash: 'Бракує {amount}',
  insufficientCash: 'Отриманої готівки недостатньо',
  changeIsTip: 'Уся здача як чайові',
  tipAmount: 'Чайові: {amount}',
  confirmPayment: 'Підтвердити оплату',
  savingPayment: 'Збереження оплати…',
  paymentFailed: 'Не вдалося зберегти оплату. Повторіть спробу.',
  retryPayment: 'Повторити оплату',
  savedPayment: 'Оплату збережено · Вартість поїздки: {fare}',
  savedPaymentWithTip:
    'Оплату збережено · Вартість поїздки: {fare} · Чайові: {tip}',
  invalidMoney:
    'Введіть коректну суму з не більш ніж двома десятковими знаками.',
  positiveFare: 'Вартість поїздки має бути більшою за нуль.',
  maximumMoney: 'Максимальна сума — {amount}.',
  dismissKeyboard: 'Приховати клавіатуру',
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
export type TranslationParams = Record<string, string | number>;
export function translate(
  language: Language,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  return (dictionaries[language][key] ?? es[key]).replace(
    /\{(\w+)\}/g,
    (placeholder, name: string) =>
      params[name] === undefined ? placeholder : String(params[name]),
  );
}
