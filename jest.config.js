module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-calendars|react-native-swipe-gestures|recyclerlistview|uuid)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleNameMapper: { '\\.svg$': '<rootDir>/__tests__/svgMock.js' },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
};
