// Configuration for running Jest tests on TypeScript files
const { normalizeConfig, developmentConsts } = require('./development/babelTools');

module.exports = normalizeConfig({
  platform: developmentConsts.platforms.all,
  config: {
    presets: ['babel-preset-expo'],
    plugins: [],
  },
});
