require('./env');

const webpack = require('webpack');
const lodash = require('lodash');
const notifier = require('node-notifier');
const { getPathsAsync } = require('@expo/webpack-config/env');
const path = require('path');
const fs = require('fs');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');
const devUtils = require('@baronhq/ext/development/devUtils');
const developmentConsts = require('./developmentConsts');
const indexHtmlParameter = require('./indexHtmlParameter');

const { PUBLIC_URL } = process.env;

class BuildNotificationPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('BuildNotificationPlugin', () => {
      const timestamp = new Date().toLocaleTimeString();
      const msg = `Baron Wallet Build Complete - ${timestamp}`;
      
      setTimeout(() => {
        console.log('\u001b[33m');
        console.log('===================================');
        console.log(msg);
        console.log('===================================');
        console.log('\u001b[0m');
      }, 300);
      
      notifier.notify(msg);
    });
  }
}

const resolveExtensions = [
  '.web.ts', '.web.tsx', '.web.mjs', '.web.js', '.web.jsx',
  '.ts', '.tsx', '.mjs', '.cjs', '.js', '.jsx', '.json', '.wasm', '.d.ts',
];

const proxyConfig = {
  '/baron_ws': {
    target: 'wss://testnet.baron-chain.org',
    changeOrigin: true,
    ws: true,
  },
};

async function modifyExpoEnvironment({ env, platform }) {
  const locations = await getPathsAsync(env.projectRoot);
  const templatePath = path.resolve(__dirname, '../packages/shared/src/web/index.html');
  
  locations.template.indexHtml = templatePath;
  locations.template.indexHtmlTemplateParameters = indexHtmlParameter.createEjsParams({
    filename: 'index.html',
    platform,
  });

  return { ...env, locations: { ...locations } };
}

function normalizeConfig({
  platform,
  config,
  env,
  configName,
  enableAnalyzerHtmlReport,
  buildTargetBrowser,
}) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  let extensions = [...resolveExtensions];

  if (platform) {
    configureOutputSettings(config, platform, isDevelopment);
    configurePlugins(config, platform, isDevelopment, enableAnalyzerHtmlReport, configName);
    configureDevServer(config);
    extensions = getPlatformExtensions(extensions, platform, buildTargetBrowser, configName);
  }

  configureModules(config, platform, developmentConsts.isManifestV3, configName);
  setupResolution(config, extensions, platform);
  setupOptimization(config);

  return config;
}

function configureOutputSettings(config, platform, isDevelopment) {
  if (PUBLIC_URL) {
    config.output.publicPath = PUBLIC_URL;
  }
  
  if (platform === 'web' && !isDevelopment) {
    config.output.crossOriginLoading = 'anonymous';
  }
  
  config.output.filename = '[name].baron.js';
}

function configurePlugins(config, platform, isDevelopment, enableAnalyzerHtmlReport, configName) {
  const plugins = [
    new webpack.ProgressPlugin(),
    platform !== 'ext' && new DuplicatePackageCheckerPlugin(),
    isDevelopment && new BuildNotificationPlugin(),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    new webpack.DefinePlugin({
      'process.env.BARON_BUILD_TYPE': JSON.stringify(platform),
      'process.env.PUBLIC_URL': PUBLIC_URL,
    }),
    isDevelopment && new ReactRefreshWebpackPlugin({ overlay: false }),
    platform === 'web' && !isDevelopment && new SubresourceIntegrityPlugin(),
  ].filter(Boolean);

  if (process.env.ENABLE_ANALYZER) {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    plugins.push(new BundleAnalyzerPlugin(getAnalyzerConfig(enableAnalyzerHtmlReport, configName)));
  }

  config.plugins = [...config.plugins, ...plugins];
}

function configureDevServer(config) {
  if (config.devServer) {
    config.devServer.proxy = {
      ...config.devServer.proxy,
      ...proxyConfig,
    };
    config.devServer.onBeforeSetupMiddleware = setupDevMiddleware;
  }
}

function getPlatformExtensions(baseExtensions, platform, targetBrowser, configName) {
  const platformSpecific = [
    ...(targetBrowser ? ['.ts', '.tsx', '.js', '.jsx'].map(ext => `.${targetBrowser}-${platform}${ext}`) : []),
    ...(configName && platform === 'ext' && developmentConsts.isManifestV3
      ? ['.ts', '.tsx', '.js', '.jsx'].map(ext => `.${platform}-${configName}-v3${ext}`)
      : []),
    ...(configName ? ['.ts', '.tsx', '.js', '.jsx'].map(ext => `.${platform}-${configName}${ext}`) : []),
    ...['.ts', '.tsx', '.js', '.jsx'].map(ext => `.${platform}${ext}`),
    ...baseExtensions,
  ];

  return lodash.uniq(platformSpecific).sort((a, b) => 
    a.includes(platform) && !b.includes(platform) ? -1 : 0
  );
}

function configureModules(config, platform, isManifestV3, configName) {
  const useMetaLoader = platform !== 'ext' || 
    (platform === 'ext' && !isManifestV3) ||
    (platform === 'ext' && isManifestV3 && configName === devUtils.consts.configName.offscreen);

  if (useMetaLoader) {
    config.module.rules.push({
      test: /@polkadot/,
      loader: require.resolve('@open-wc/webpack-import-meta-loader'),
    });
  }

  config.module.rules.push(
    {
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    },
    {
      test: /\.ejs$/i,
      use: ['html-loader', 'template-ejs-loader'],
    }
  );

  config.module.rules.forEach(normalizeRule);
}

function setupResolution(config, extensions, platform) {
  config.resolve = {
    ...config.resolve,
    extensions,
    fallback: {
      crypto: require.resolve('@baronhq/shared/src/modules3rdParty/cross-crypto/index.js'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      path: false,
      https: false,
      http: false,
      net: false,
      zlib: false,
      tls: false,
      'child_process': false,
      process: false,
      fs: false,
      util: false,
      os: false,
    }
  };
}

function setupOptimization(config) {
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      minSize: 100 * 1024,
      maxSize: 4 * 1024 * 1024,
      hidePathInfo: true,
      automaticNameDelimiter: '.',
      name: false,
      maxInitialRequests: 20,
      maxAsyncRequests: 50000,
      ...config.optimization.splitChunks,
    },
  };
}

function normalizeRule(rule) {
  if (!rule) return;

  if (rule.loader?.includes('file-loader') && rule.exclude) {
    rule.exclude.push(/\.wasm$/, /\.cjs$/);
  }

  if (rule.test?.toString() === '/\\.(mjs|[jt]sx?)$/') {
    rule.test = /\.(cjs|mjs|[jt]sx?)$/;
  }

  if (rule.test?.toString() === '/\\.+(js|jsx|mjs|ts|tsx)$/') {
    rule.test = /\.+(cjs|js|jsx|mjs|ts|tsx)$/;
  }

  (rule.oneOf || []).forEach(normalizeRule);
}

function getAnalyzerConfig(enableHtmlReport, configName) {
  return enableHtmlReport ? {
    analyzerMode: 'static',
    reportFilename: `baron-report${configName ? `-${configName}` : ''}.html`,
    openAnalyzer: false,
  } : {
    analyzerMode: 'disabled',
    generateStatsFile: true,
    statsOptions: {
      reasons: false,
      warnings: false,
      errors: false,
      optimizationBailout: false,
      usedExports: false,
      providedExports: false,
      source: false,
      ids: false,
      children: false,
      chunks: false,
      modules: !!process.env.ANALYSE_MODULE,
    },
  };
}

function setupDevMiddleware(devServer) {
  devServer.app.get(
    '/baron-dev-tools/tracker.js',
    (req, res) => {
      const sendResponse = (content) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Age', '0');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'text/javascript');
        res.send(content);
      };

      if (req.headers?.cookie?.includes('baron_dev=1')) {
        const trackerPath = path.join(__dirname, '../node_modules/react-render-tracker/dist/react-render-tracker.js');
        fs.readFile(trackerPath, 'utf8', (err, data) => {
          if (err) {
            console.error('Baron Dev Tools Error:', err);
            res.status(500).send('Error loading Baron dev tools');
            return;
          }
          sendResponse(data);
        });
      } else {
        sendResponse("console.log('Baron dev tools disabled')");
      }
    },
  );
}

module.exports = {
  developmentConsts,
  normalizeConfig,
  modifyExpoEnvironment,
  proxyConfig,
};
