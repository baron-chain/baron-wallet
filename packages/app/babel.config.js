const path = require('path');

// Development constants
const PLATFORMS = {
  APP: 'app',
  EXTENSION: 'extension',
  WEB: 'web',
};

// Normalize babel configuration based on platform and environment
function normalizeConfig({ platform, config }) {
  const rootPath = path.resolve(__dirname);
  
  return {
    ...config,
    plugins: [
      ...config.plugins,
      [
        'module-resolver',
        {
          root: [rootPath],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
          alias: {
            '@baronWallet': path.resolve(rootPath, 'src'),
            '@components': path.resolve(rootPath, 'src/components'),
            '@screens': path.resolve(rootPath, 'src/screens'),
            '@navigation': path.resolve(rootPath, 'src/navigation'),
            '@services': path.resolve(rootPath, 'src/services'),
            '@assets': path.resolve(rootPath, 'assets'),
            '@utils': path.resolve(rootPath, 'src/utils'),
            '@hooks': path.resolve(rootPath, 'src/hooks'),
            '@constants': path.resolve(rootPath, 'src/constants'),
            '@store': path.resolve(rootPath, 'src/store'),
            '@theme': path.resolve(rootPath, 'src/theme'),
          },
        },
      ],
    ],
  };
}

module.exports = function(api) {
  api.cache(true);

  // Base configuration
  const baseConfig = {
    presets: [
      ['babel-preset-expo', {
        // Optimize bundle size
        lazyImports: true,
      }],
    ],
    plugins: [
      // Reanimated plugin configuration for QR scanning
      [
        'react-native-reanimated/plugin',
        {
          globals: ['__scanCodes'],
          relativeSourceLocation: true,
        },
      ],
      // Transform runtime for better performance
      '@babel/plugin-transform-runtime',
      // Tailwind CSS support
      'nativewind/babel',
    ],
  };

  // Platform-specific configuration
  const config = normalizeConfig({
    platform: PLATFORMS.APP,
    config: baseConfig,
  });

  return {
    ...config,
    env: {
      production: {
        plugins: [
          'transform-remove-console',
          ['transform-react-remove-prop-types', {
            removeImport: true,
            additionalLibraries: ['react-native-prop-types'],
          }],
        ],
      },
      development: {
        plugins: [
          // Development-specific plugins
          'react-native-flipper/babel',
        ],
      },
    },
    // Handle async/await
    sourceMaps: true,
    retainLines: true,
  };
};
