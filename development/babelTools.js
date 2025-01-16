//BCMOD [ERR#1811] [ERR#1811]
require('./env');
const path = require('path');
const developmentConsts = require('./developmentConsts');
const envExposedToClient = require('./envExposedToClient');

const fullPath = (pathStr) => path.resolve(__dirname, pathStr);

const moduleResolverAliasForAllWebPlatform = {
  'react-native-restart': fullPath('./module-resolver/react-native-restart-mock'),
  'react-native-fast-image': fullPath('./module-resolver/react-native-fast-image-mock'),
  'react-native-keyboard-manager': fullPath('./module-resolver/react-native-keyboard-manager-mock'),
};

const customAliasForComponents = (name, file) => {
  if (name.startsWith('use')) {
    return `@baronhq/components/src/Provider/hooks/${name}`;
  }
  return `@baronhq/components/src/${name}`;
};

function normalizeConfig({ platform, config }) {
  process.env.BARON_PLATFORM = platform;
  
  const moduleResolver = getModuleResolver(platform);
  
  const {
    isJest,
    isDev,
    isProduction,
    isWeb,
    isWebEmbed,
    isDesktop,
    isExtension,
    isNative,
    isExtChrome,
    isExtFirefox,
  } = require('../packages/shared/src/buildTimeEnv');

  config.plugins = [
    ...(config.plugins || []),
    [
      'transform-inline-environment-variables',
      {
        'include': envExposedToClient.buildEnvExposedToClientDangerously({ platform }),
      },
    ],
    [
      'transform-define',
      {
        'platformEnv.isJest': isJest,
        'platformEnv.isDev': isDev,
        'platformEnv.isProduction': isProduction,
        'platformEnv.isWeb': isWeb,
        'platformEnv.isWebEmbed': isWebEmbed,
        'platformEnv.isDesktop': isDesktop,
        'platformEnv.isExtension': isExtension,
        'platformEnv.isNative': isNative,
        'platformEnv.isExtChrome': isExtChrome,
        'platformEnv.isExtFirefox': isExtFirefox,
      },
    ],
    ['babel-plugin-import', {
      'libraryName': 'lodash',
      'libraryDirectory': '',
      'camel2DashComponentName': false,
    }, 'lodash'],
    ['babel-plugin-import', {
      'libraryName': '@baronhq/components',
      'camel2DashComponentName': false,
      'customName': customAliasForComponents,
    }, '@baronhq_components'],
    ['babel-plugin-import', {
      'libraryName': '@baronhq/components/src',
      'camel2DashComponentName': false,
      'customName': customAliasForComponents,
    }, '@baronhq_components_src'],
    ['babel-plugin-inline-import', { 'extensions': ['.text-js'] }],
    '@babel/plugin-transform-flow-strip-types',
    ['@babel/plugin-proposal-decorators', { 'legacy': true }],
    ['@babel/plugin-proposal-class-properties', { 'loose': true }],
    ['@babel/plugin-proposal-private-methods', { 'loose': true }],
    ['@babel/plugin-proposal-private-property-in-object', { 'loose': true }],
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-class-static-block',
    isDev && [
      'babel-plugin-catch-logger',
      {
        source: '@baronhq/shared/src/logger/autoLogger',
        name: 'autoLogger',
        methodName: 'error',
        catchPromise: false,
        namespaced: false,
      },
    ],
    moduleResolver && ['module-resolver', moduleResolver],
  ].filter(Boolean);

  if (!config.targets) {
    config.targets = 'defaults';
  }

  config.assumptions = {
    noDocumentAll: true,
    noClassCalls: true,
    noIncompleteNsImportDetection: true,
    noNewArrows: true,
    setClassMethods: true,
    setComputedProperties: true,
  };

  return config;
}

function getModuleResolver(platform) {
  const baseAlias = moduleResolverAliasForAllWebPlatform;
  
  switch (platform) {
    case developmentConsts.platforms.ext:
      return {
        alias: {
          ...baseAlias,
          ...(developmentConsts.isManifestV3 ? {
            'filecoin.js': fullPath('./module-resolver/filecoin.js/index.ext-bg-v3.js'),
          } : {}),
        },
      };
    case developmentConsts.platforms.web:
    case developmentConsts.platforms.webEmbed:
    case developmentConsts.platforms.desktop:
      return { alias: baseAlias };
    case developmentConsts.platforms.app:
      return {
        alias: {
          '@ipld/dag-cbor': '@ipld/dag-cbor/dist/index.min.js',
          'multiformats/basics': 'multiformats/basics',
          'multiformats/cid': 'multiformats/cid',
          'multiformats/hashes': 'multiformats/hashes',
          'multiformats': 'multiformats/index.js',
        },
      };
    default:
      return null;
  }
}

module.exports = {
  developmentConsts,
  normalizeConfig,
};
