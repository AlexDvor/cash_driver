// Основні параметри оформлення. Відступи й розміри задані у dp, текст враховує системний масштаб.
export const spacing = {
  xs: 4, // Найменший відступ, dp.
  sm: 8, // Малий відступ, dp.
  md: 12, // Середній відступ, dp.
  lg: 16, // Основний відступ, dp.
  xl: 20, // Збільшений відступ, dp.
  xxl: 24, // Великий відступ, dp.
};
export const typography = {
  title: 30, // Розмір основного заголовка.
  homeTitle: 24, // Розмір назви Cash Driver на головній.
  tabLabel: 12, // Розмір підписів нижньої навігації.
  heading: 20, // Розмір заголовків секцій.
  body: 16, // Розмір основного тексту.
  supporting: 14, // Розмір пояснень і допоміжного тексту.
  money: 32, // Розмір цифр у грошових полях.
  paymentMoney: 24, // Максимальна сума в парному полі без зменшення системного масштабу.
  summaryMoney: 40,
  summaryStatMoney: 24,
  change: 56, // Розмір суми решти.
};
// Наскільки заокруглені кути елементів, dp.
export const radii = {
  card: 24, // Картки.
  input: 16, // Поля введення.
  button: 16, // Кнопки.
  chip: 12, // Компактні кнопки та позначки.
};
export const sizing = {
  primaryButton: 56, // Мінімальна висота основної кнопки, dp.
  touchTarget: 48, // Мінімальний розмір доступної області натискання, dp.
  icon: 24, // Базовий розмір іконки, dp.
  borderWidth: 1, // Товщина звичайної рамки, dp.
  contentMaxWidth: 640, // Максимальна ширина вмісту, щоб форма не розтягувалась на планшеті, dp.
  skeletonTextMinWidth: 64, // Мінімальна ширина текстової заглушки завантаження, dp.
} as const;
// Непрозорість: 0 — невидимо, 1 — повністю видно.
export const opacity = {
  pressed: 0.7, // Непрозорість звичайної кнопки під час натискання.
  choicePressed: 0.8, // Непрозорість кнопки вибору під час натискання.
  calendarBackdrop: 0.6, // Непрозорість затемнення за вікном календаря.
  summaryCircleFill: 0.12, // Непрозорість фону круглої кнопки підсумку дня.
  undoProgress: 0.18, // Непрозорість смуги відліку скасування видалення.
} as const;
// Розміри іконок і стрілок, dp.
export const iconSizing = {
  platform: 28, // Розмір логотипа платформи у формі й налаштуваннях, dp.
  historyPlatform: 44, // Розмір логотипа платформи в історії, dp.
  detailsPlatform: 60, // Розмір логотипа платформи в деталях операції, dp.
  summary: 44, // Звичайний розмір ілюстрації підсумків, dp.
  summaryHero: 80, // Розмір великої ілюстрації монет у підсумках, dp.
  summaryMetric: 32, // Розмір іконок показників підсумків, dp.
  calendar: 32, // Розмір іконки календаря, dp.
  chevronStroke: 2, // Товщина ліній маленьких стрілок, dp.
  calendarChevron: 10, // Розмір стрілки у вікні календаря, dp.
  periodChevron: 7, // Розмір стрілки вибору періоду, dp.
  summaryChevron: 9, // Розмір стрілки підсумку дня, dp.
  tipChevron: 8, // Розмір стрілки секції чайових, dp.
  calendarActivityDot: 4, // Діаметр крапки дня з операціями, dp.
  calendarSelectionStroke: 2, // Товщина обведення вибраного дня, dp.
  back: {
    shaftLeft: 3, // Відступ прямої частини стрілки Назад зліва, dp.
    shaftTop: 11, // Відступ прямої частини стрілки Назад зверху, dp.
    shaftWidth: 20, // Довжина прямої частини стрілки Назад, dp.
    stroke: 2.5, // Товщина ліній стрілки Назад, dp.
    shaftRadius: 2, // Заокруглення прямої частини стрілки Назад, dp.
    headLeft: 4, // Відступ вістря стрілки Назад зліва, dp.
    headTop: 6, // Відступ вістря стрілки Назад зверху, dp.
    headSize: 12, // Розмір вістря стрілки Назад, dp.
  },
} as const;
export interface Palette {
  summaryHeroStart: string;
  summaryHeroEnd: string;
  summaryHeroGlow: string;
  summaryIcon: string;
  transparent: string; // Прозорий колір без заливки.
  disabledSurface: string; // Фон недоступних кнопок.
  disabledText: string; // Текст недоступних кнопок.
  background: string; // Загальний фон екранів.
  card: string; // Фон карток і звичайних елементів вибору.
  primary: string; // Основний акцентний колір і правильний результат оплати.
  onPrimary: string; // Текст та іконки на основному акцентному фоні.
  softGreen: string; // М’який зелений фон вибору та швидких сум.
  text: string; // Основний текст.
  secondaryText: string; // Пояснення й другорядний текст.
  border: string; // Рамки та роздільники.
  errorText: string; // Текст помилок і небезпечних дій.
  errorSurface: string; // Фон помилок і небезпечних дій.
}
export const palettes: Record<'light' | 'dark', Palette> = {
  // Кольори світлої теми.
  light: {
    summaryHeroStart: '#136C46',
    summaryHeroEnd: '#095231',
    summaryHeroGlow: '#65E5A9',
    summaryIcon: '#43B982',
    transparent: 'transparent', // Прозорий колір без заливки.
    disabledSurface: '#E5E7EB', // Фон недоступних кнопок.
    disabledText: '#626975', // Текст недоступних кнопок.
    background: '#F5F7F6', // Загальний фон екранів.
    card: '#FFFFFF', // Фон карток і звичайних елементів вибору.
    primary: '#0E7A4B', // Основний акцентний колір і правильний результат оплати.
    onPrimary: '#FFFFFF', // Текст та іконки на основному акцентному фоні.
    softGreen: '#E8F5EE', // М’який зелений фон вибору та швидких сум.
    text: '#111827', // Основний текст.
    secondaryText: '#626975', // Пояснення й другорядний текст.
    border: '#E5E7EB', // Рамки та роздільники.
    errorText: '#B91C1C', // Текст помилок і небезпечних дій.
    errorSurface: '#FEF2F2', // Фон помилок і небезпечних дій.
  },
  // Кольори темної теми.
  dark: {
    summaryHeroStart: '#204735',
    summaryHeroEnd: '#10261B',
    summaryHeroGlow: '#4D8068',
    summaryIcon: '#62C698',
    transparent: 'transparent', // Прозорий колір без заливки.
    disabledSurface: '#303C35', // Фон недоступних кнопок.
    disabledText: '#B0BEB6', // Текст недоступних кнопок.
    background: '#101714', // Загальний фон екранів.
    card: '#1A2520', // Фон карток і звичайних елементів вибору.
    primary: '#69D9A4', // Основний акцентний колір і правильний результат оплати.
    onPrimary: '#102219', // Текст та іконки на основному акцентному фоні.
    softGreen: '#203B2D', // М’який зелений фон вибору та швидких сум.
    text: '#F0F5F2', // Основний текст.
    secondaryText: '#B0BEB6', // Пояснення й другорядний текст.
    border: '#405349', // Рамки та роздільники.
    errorText: '#FFB4B4', // Текст помилок і небезпечних дій.
    errorSurface: '#921252', // Фон помилок і небезпечних дій.
  },
};
export const surfaceDepth = {
  leadingOpacity: 0.1,
  trailingOpacity: 0.035,
} as const;
export const summaryHeroLighting = {
  lightOpacity: 0.44,
  darkOpacity: 0.27,
} as const;
