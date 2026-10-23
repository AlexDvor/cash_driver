// Розміри для перенесення елементів: dp — одиниці розмітки, масштаб тексту враховується окремо.
export const paymentLayout = {
  tipActionsStackWidth: 400, // Нижче цієї ширини з урахуванням масштабу тексту дії чайових стають стовпчиком, dp.
  quickAmountMinimumWidth: 64, // Мінімальна ширина швидкої суми до врахування масштабу тексту, dp.
} as const;

export const choiceLayout = {
  adaptiveColumnMinimumWidth: 132, // Мінімальна ширина одного варіанта вибору для двох колонок, dp.
  labelCharacterWidthFactor: 0.6, // Оцінка ширини символу відносно розміру шрифту для одиночного вибору.
  multiChoiceLabelCharacterWidthFactor: 0.55, // Оцінка ширини символу для кнопок із множинним вибором.
} as const;

export const summaryLayout = {
  moneyCharacterWidth: 34, // Оцінка ширини символу суми для розміщення ілюстрації поруч, dp.
  countMinimumFontScale: 0.5, // До якої частки початкового розміру можна зменшувати текст кількості операцій.
  labelMinimumFontScale: 0.25, // До якої частки початкового розміру можна зменшувати підписи підсумків.
} as const;
