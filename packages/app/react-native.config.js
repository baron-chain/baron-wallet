const createReactNativeConfig = () => {
  // Determine if running in Continuous Integration environment
  const isCI = process.env.CI === 'true';

  // Configuration for platform-specific dependencies
  const platformDependencies = {
    'react-native-flipper': {
      platforms: isCI ? { ios: null, android: null } : {},
    },
    '@baron-chain/google-signin': {
      platforms: {
        ios: null,
      },
    },
    '@baron-chain/v8-runtime': {
      platforms: {
        ios: null,
      },
    },
  };

  return {
    // Path to react-native module
    reactNativePath: '../../node_modules/react-native',
    
    // Platform-specific dependencies
    dependencies: platformDependencies,

    // Additional configuration for quantum-safe wallet
    quantumSafeConfig: {
      cryptoRuntime: '@baron-chain/quantum-crypto',
      platformOptimizations: isCI
    }
  };
};

module.exports = createReactNativeConfig();
