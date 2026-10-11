const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const root = path.resolve(__dirname, '../..');
module.exports = mergeConfig(getDefaultConfig(root), {
  projectRoot: root,
  resolver: { blockList: /$a/ },
});
