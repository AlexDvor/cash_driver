export const platforms = ['uber', 'cabify', 'bolt', 'other'] as const;

export type Platform = (typeof platforms)[number];

// These existing platform labels stay the same in every interface language.
export const platformLabels: Record<Platform, string> = {
  uber: 'Uber',
  cabify: 'Cabify',
  bolt: 'Bolt',
  other: 'Otro',
};

export function isPlatform(value: unknown): value is Platform {
  return platforms.some(platform => platform === value);
}
