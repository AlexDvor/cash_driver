// Швидкість анімацій. Системне зменшення руху й надалі враховують компоненти.
export const motion = {
  tabTransitionDurationMs: 180,
  tabTransitionOffset: 8,
  collapsibleDurationMs: 180, // Тривалість розгортання й згортання секцій, зокрема чайових, мс.
  skeletonHalfCycleDurationMs: 750, // Тривалість одного згасання або появи заглушки завантаження, мс.
  skeletonMinimumOpacity: 0.55, // Найменша непрозорість заглушки під час пульсації: 0 — невидима, 1 — суцільна.
} as const;

export const calendarMotion = {
  progressDurationMs: 1000, // Тривалість одного проходу смуги завантаження календаря, мс.
  indicatorDelayMs: 200, // Пауза перед появою індикатора завантаження календаря, мс.
  highlightDurationMs: 180, // Тривалість появи підсвічування місяця з операціями, мс.
} as const;
