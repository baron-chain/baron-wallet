const path = require('path');
const babelTools = require('../../development/babelTools');
const { platforms } = babelTools.developmentConsts;

module.exports = function (api) {
  api.cache(true);
  const baseConfig = {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'react-native-reanimated/plugin',
        {
          globals: ['__scanCodes'],
        },
      ],
    ],
  };
  const normalizedConfig = babelTools.normalizeConfig({
    platform: platforms.app,
    config: baseConfig,
  });
  return {
    ...normalizedConfig,
    env: {
      production: {
      },
      development: {
      },
    },
  };
};
