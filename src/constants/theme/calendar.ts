// Вигляд індикатора календаря; часові значення беруться з motion.ts.
import { calendarMotion } from './motion';
export const calendarFeedback = {
  progressHeight: 2, // Висота смуги завантаження календаря, dp.
  progressSegmentFraction: 0.3, // Яку частку ширини смуги займає рухомий індикатор.
  progressDuration: calendarMotion.progressDurationMs, // Тривалість проходу індикатора, мс; змінюється в motion.ts.
  indicatorDelay: calendarMotion.indicatorDelayMs, // Затримка появи індикатора, мс; змінюється в motion.ts.
  highlightDuration: calendarMotion.highlightDurationMs, // Тривалість появи підсвічування, мс; змінюється в motion.ts.
};
