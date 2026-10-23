// Незмінні внутрішні позначення платформ для збереження та перевірок.
export const platforms = ['uber', 'cabify', 'bolt', 'other'] as const;

// Тип платформи: дозволяє лише позначення зі списку вище.
export type Platform = (typeof platforms)[number];
// Назви платформ на екрані; однакові для всіх мов інтерфейсу.
export const platformLabels: Record<Platform, string> = {
  uber: 'Uber',
  cabify: 'Cabify',
  bolt: 'Bolt',
  other: 'Otro',
};

// Перевіряє, чи значення є однією з підтримуваних платформ.
export function isPlatform(value: unknown): value is Platform {
  return platforms.some(platform => platform === value);
}
