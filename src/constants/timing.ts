// Затримки інтерфейсу: Ms — мілісекунди, Seconds — секунди.
export const paymentTiming = {
  confirmationVibrationDurationMs: 500, // Відчутний імпульс після успішного збереження на Android, мс.
  fareAdvanceDelayMs: 5000, // Пауза після введення вартості перед переходом до отриманої суми, мс.
  receivedDismissDelayMs: 2000, // Пауза після введення отриманої суми перед приховуванням клавіатури, мс.
  successMessageDurationMs: 4000, // Скільки зберігати стан успішної оплати; повідомлення показується в редагуванні, мс.
} as const;

export const deletionTiming = {
  undoWindowSeconds: 10, // Скільки секунд є на скасування видалення.
  countdownRefreshIntervalMs: 1000, // Як часто оновлювати відлік скасування без анімації, мс.
  resultMessageDurationMs: 4000, // Скільки показувати результат видалення всіх операцій, мс.
} as const;

export const clockTiming = {
  refreshIntervalMs: 1000, // Як часто перевіряти місцеві дату, час і часовий пояс, мс.
} as const;
