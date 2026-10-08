import { resolveTheme } from '../src/theme/resolveTheme';

test('automatic mode follows the system and falls back to light', () => {
  expect(resolveTheme('system', 'dark')).toBe('dark');
  expect(resolveTheme('system', 'light')).toBe('light');
  expect(resolveTheme('system', null)).toBe('light');
  expect(resolveTheme('system', undefined)).toBe('light');
});

test('explicit modes override the system', () => {
  expect(resolveTheme('light', 'dark')).toBe('light');
  expect(resolveTheme('dark', 'light')).toBe('dark');
  expect(resolveTheme('dark', null)).toBe('dark');
});
