module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-calendars|react-native-swipe-gestures|recyclerlistview|uuid)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  moduleNameMapper: { '\\.svg$': '<rootDir>/src/test/svgMock.js' },
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
};
