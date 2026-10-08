jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(() => {
    throw new Error(
      'Native SQLite unavailable in Jest; inject a real test connection',
    );
  }),
}));
jest.mock('react-native-get-random-values', () => ({}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
