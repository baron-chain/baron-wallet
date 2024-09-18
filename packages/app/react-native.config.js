const isCI = process.env.CI === 'true';

module.exports = {
  reactNativePath: '../../node_modules/react-native',
  dependencies: {
    'react-native-flipper': {
      platforms: isCI ? { ios: null, android: null } : {},
    },
    '@react-native-google-signin/google-signin': {
      platforms: {
        ios: null,
      },
    },
    'react-native-v8': {
      platforms: {
        ios: null,
      },
    },
  },
};
