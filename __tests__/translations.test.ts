import {
  dictionaries,
  es,
  languageOptions,
  translate,
} from '../src/i18n/translations';

test.each(languageOptions)(
  '$label has all translation keys and nonempty text',
  ({ value }) => {
    expect(Object.keys(dictionaries[value]).sort()).toEqual(
      Object.keys(es).sort(),
    );
    for (const text of Object.values(dictionaries[value])) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  },
);

test('uses the requested language for navigation and unfinished-state messages', () => {
  expect(translate('es', 'home')).toBe('Inicio');
  expect(translate('en', 'home')).toBe('Home');
  expect(translate('uk', 'home')).toBe('Головна');
  expect(translate('uk', 'unfinished')).toBe('У розробці');
});
