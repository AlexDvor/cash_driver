module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['src/test/setup.js'],
      env: { jest: true },
    },
  ],
};
