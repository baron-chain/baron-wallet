const isCI = process.env.CI === 'true';

module.exports = {
  // Path to the react-native package
  reactNativePath: '../../node_modules/react-native',

  // Dependency-specific configurations
  dependencies: {
    // Disable Flipper in CI environment
    'react-native-flipper': {
      platforms: isCI ? { ios: null, android: null } : {},
    },

    // Disable Google Sign-In for iOS
    '@react-native-google-signin/google-signin': {
      platforms: {
        ios: null,
      },
    },

    // Disable react-native-v8 for iOS
    'react-native-v8': {
      platforms: {
        ios: null,
      },
    },
  },
};
