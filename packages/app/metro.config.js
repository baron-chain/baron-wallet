const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const createMetroConfig = () => {
  const config = getDefaultConfig(projectRoot);

  // Enhanced source extensions
  const sourceExtensions = [
    ...config.resolver.sourceExts,
    'text-js',
    'd.ts',
    'cjs',
    'min.js'
  ];

  // Polyfill modules for Node.js core modules
  const browserPolyfills = {
    fs: require.resolve('react-native-level-fs'),
    path: require.resolve('path-browserify'),
    stream: require.resolve('readable-stream'),
    crypto: require.resolve('@baron-chain/baron-wallet/shared/crypto/cross-crypto/index.native.js'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    net: require.resolve('react-native-tcp-socket'),
    tls: require.resolve('react-native-tcp-socket')
  };

  // Quantum-safe specific configurations
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer')
  };

  return {
    ...config,
    projectRoot,
    resolver: {
      ...config.resolver,
      sourceExts: sourceExtensions,
      extraNodeModules: {
        ...config.resolver.extraNodeModules,
        ...browserPolyfills
      }
    }
  };
};

module.exports = createMetroConfig();
