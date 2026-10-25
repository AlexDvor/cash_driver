import { dictionaries, es, languageOptions, translate } from './translations';

test('only Spanish and English are available and bundled', () => {
  expect(languageOptions).toEqual([
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
  ]);
  expect(Object.keys(dictionaries).sort()).toEqual(['en', 'es']);
});

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
  expect(translate('es', 'unfinished')).toBe('En desarrollo');
  expect(translate('en', 'unfinished')).toBe('In development');
});
