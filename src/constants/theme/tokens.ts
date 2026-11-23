import { Platform } from 'react-native';

// Основні параметри оформлення. Відступи й розміри задані у dp, текст враховує системний масштаб.

// Шрифт Inter: на Android зареєстрований як родина "Inter" (res/font/inter.xml, MainApplication).
// На iOS файли ще не додані до Xcode-проєкту, тому лишаємо системний шрифт, щоб не було помилки.
export const fontFamily = Platform.select<string | undefined>({
  android: 'Inter',
  default: undefined,
});
export const spacing = {
  xs: 4, // Найменший відступ, dp.
  sm: 8, // Малий відступ, dp.
  md: 12, // Середній відступ, dp.
  lg: 16, // Основний відступ, dp.
  xl: 20, // Збільшений відступ, dp.
  xxl: 24, // Великий відступ, dp.
};
export const typography = {
  title: 28, // Розмір основного заголовка (Title/Screen).
  homeTitle: 28, // Розмір назви Cash Driver на головній.
  tabLabel: 12, // Розмір підписів нижньої навігації (Caption).
  heading: 18, // Розмір заголовків секцій (Title/Section).
  body: 16, // Розмір основного тексту.
  supporting: 14, // Розмір пояснень і допоміжного тексту (Label/Medium).
  caption: 12, // Дрібні підписи (Caption).
  overline: 11, // Підписи великими літерами (Overline).
  money: 32, // Розмір цифр у грошових полях.
  paymentMoney: 24, // Максимальна сума в парному полі без зменшення системного масштабу.
  summaryMoney: 36, // Money/Large (36/40).
  summaryStatMoney: 24,
  change: 52, // Розмір суми решти (Money/Hero).
};
// Міжлітерні інтервали для заголовків і сум (dp, від'ємні значення стискають великі цифри).
export const letterSpacing = {
  money: -1, // Великі суми.
  title: -0.3, // Заголовки екранів.
  overline: 0.9, // Підписи великими літерами.
} as const;
// Наскільки заокруглені кути елементів, dp.
export const radii = {
  card: 20, // Картки (radius/lg).
  cardLarge: 28, // Великі картки: форма оплати, чек (radius/xl).
  input: 14, // Поля введення (radius/md).
  button: 999, // Кнопки-«пігулки» (radius/full).
  chip: 14, // Компактні кнопки та позначки (radius/md).
  plate: 10, // Квадратні плашки під іконки (radius/sm).
  pill: 999, // Повністю заокруглені елементи.
};
export const sizing = {
  primaryButton: 56, // Мінімальна висота основної кнопки, dp.
  touchTarget: 48, // Мінімальний розмір доступної області натискання, dp.
  icon: 24, // Базовий розмір іконки, dp.
  backButton: 40, // Кругла кнопка «Назад» у заголовку, dp.
  iconButton: 32, // Кругла кнопка-шеврон (підсумок дня, фільтри), dp.
  iconPlate: 36, // Квадратна плашка під іконку (чайові), dp.
  toggleWidth: 52, // Ширина перемикача, dp.
  toggleHeight: 32, // Висота перемикача, dp.
  toggleInset: 3, // Відступ повзунка від краю перемикача, dp.
  borderWidth: 1, // Товщина звичайної рамки, dp.
  contentMaxWidth: 640, // Максимальна ширина вмісту, щоб форма не розтягувалась на планшеті, dp.
  skeletonTextMinWidth: 64, // Мінімальна ширина текстової заглушки завантаження, dp.
} as const;
// Непрозорість: 0 — невидимо, 1 — повністю видно.
export const opacity = {
  pressed: 0.7, // Непрозорість звичайної кнопки під час натискання.
  disabled: 0.35, // Непрозорість недоступних стрілок навігації.
  choicePressed: 0.8, // Непрозорість кнопки вибору під час натискання.
  calendarBackdrop: 0.6, // Непрозорість затемнення за вікном календаря.
  undoProgress: 0.18, // Непрозорість смуги відліку скасування видалення.
} as const;
// Розміри іконок і стрілок, dp.
export const iconSizing = {
  platform: 28, // Розмір логотипа платформи у формі й налаштуваннях, dp.
  historyPlatform: 40, // Розмір логотипа платформи в історії, dp.
  detailsPlatform: 60, // Розмір логотипа платформи в деталях операції, dp.
  summary: 44, // Звичайний розмір ілюстрації підсумків, dp.
  chevronStroke: 2, // Товщина ліній маленьких стрілок, dp.
  summaryChevron: 9, // Розмір стрілки підсумку дня, dp.
  calendarActivityDot: 4, // Діаметр крапки дня з операціями, dp.
  calendarSelectionStroke: 2, // Товщина обведення вибраного дня, dp.
} as const;
export interface Palette {
  transparent: string; // Прозорий колір без заливки.
  disabledSurface: string; // Фон недоступних кнопок.
  disabledText: string; // Текст недоступних кнопок.
  background: string; // Загальний фон екранів.
  card: string; // Фон карток і звичайних елементів вибору.
  primary: string; // Основний акцентний колір і правильний результат оплати.
  onPrimary: string; // Текст та іконки на основному акцентному фоні.
  softGreen: string; // М’який акцентний фон вибору (accent/soft).
  text: string; // Основний текст.
  secondaryText: string; // Пояснення й другорядний текст.
  border: string; // Рамки та роздільники (border/subtle).
  errorText: string; // Текст помилок і небезпечних дій.
  errorSurface: string; // Фон помилок і небезпечних дій.
  // Редизайн 2026-11 (dark premium): додаткові семантичні ролі.
  surfaceRaised: string; // Піднята поверхня: вибрані сегменти, другорядні кнопки (bg/raised).
  fieldSurface: string; // Фон грошових полів (bg/field).
  borderStrong: string; // Виразна рамка: другорядні кнопки, вимкнений перемикач (border/strong).
  tertiaryText: string; // Підказки, неактивні вкладки, шеврони (text/tertiary).
  accentFill: string; // Лаймова заливка: основна кнопка, увімкнений перемикач (accent/fill).
  onAccent: string; // Текст та іконки на лаймовій заливці (accent/on).
  indicator: string; // Заливка індикаторів і вибраного: стовпчики, смужки, перемикач, вибраний день (у світлій темі темніший олив для контрасту).
  onIndicator: string; // Текст та іконки на заливці індикатора.
  plateStart: string; // Верх градієнта плашки під іконку.
  plateEnd: string; // Низ градієнта плашки під іконку.
  plateBorder: string; // Тонка рамка плашки під іконку.
  plateGlow: string; // Колір світіння акцентної плашки (прозорий, де світіння не потрібне).
}
export const palettes: Record<'light' | 'dark', Palette> = {
  // Кольори світлої теми.
  light: {
    transparent: 'transparent', // Прозорий колір без заливки.
    disabledSurface: '#DDE0D9', // Фон недоступних кнопок.
    disabledText: '#5E6561', // Текст недоступних кнопок.
    background: '#ECEEE9', // Загальний фон екранів (bg/canvas).
    card: '#FFFFFF', // Фон карток (bg/surface).
    primary: '#4F6B00', // Акцентний текст і рамки на світлому фоні (accent/text).
    onPrimary: '#FFFFFF', // Текст на темно-оливковій заливці primary.
    softGreen: '#E2EEB5', // accent/soft.
    text: '#0C0E0D', // Основний текст.
    secondaryText: '#5A615E', // Пояснення й другорядний текст.
    border: '#CBD0C8', // Рамки та роздільники.
    errorText: '#C62828', // Текст помилок і небезпечних дій.
    errorSurface: '#FCEBEB', // Фон помилок і небезпечних дій.
    surfaceRaised: '#E7EAE2',
    fieldSurface: '#EEF0EA',
    borderStrong: '#B3B9B0',
    tertiaryText: '#6B726F',
    accentFill: '#C8F04A',
    onAccent: '#0A0B0B',
    indicator: '#5E7F00',
    onIndicator: '#FFFFFF',
    plateStart: '#EEF5CF',
    plateEnd: '#DDE8AA',
    plateBorder: 'rgba(79, 107, 0, 0.28)',
    plateGlow: 'transparent',
  },
  // Кольори темної теми.
  dark: {
    transparent: 'transparent', // Прозорий колір без заливки.
    disabledSurface: '#1C1F1E', // Фон недоступних кнопок.
    disabledText: '#7C8380', // Текст недоступних кнопок.
    background: '#0A0B0B', // Загальний фон екранів (bg/canvas).
    card: '#141615', // Фон карток (bg/surface).
    primary: '#C8F04A', // Лаймовий акцент (accent/text).
    onPrimary: '#0A0B0B', // Текст та іконки на лаймовому фоні.
    softGreen: '#1E2512', // accent/soft.
    text: '#F2F4F3', // Основний текст.
    secondaryText: '#9BA29F', // Пояснення й другорядний текст.
    border: '#232725', // Рамки та роздільники.
    errorText: '#FF7A7A', // Текст помилок і небезпечних дій.
    errorSurface: '#2A1515', // Фон помилок і небезпечних дій.
    surfaceRaised: '#1C1F1E',
    fieldSurface: '#0F1110',
    borderStrong: '#313634',
    tertiaryText: '#5F6663',
    accentFill: '#C8F04A',
    onAccent: '#0A0B0B',
    indicator: '#C8F04A',
    onIndicator: '#0A0B0B',
    plateStart: '#242B14',
    plateEnd: '#12150C',
    plateBorder: 'rgba(200, 240, 74, 0.28)',
    plateGlow: '#C8F04A',
  },
};
