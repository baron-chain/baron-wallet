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

class BuildDoneNotifyPlugin {
  apply(compiler) {
    compiler.hooks.done.tap(
      'BuildDoneNotifyPlugin',
      (compilation, callback) => {
        const msg = `Baron Build at ${new Date().toLocaleTimeString()}`;
        setTimeout(() => {
          console.log('\u001b[33m'); // yellow color
          console.log('===================================');
          console.log(msg);
          console.log('===================================');
          console.log('\u001b[0m'); // reset color
        }, 300);
        notifier.notify(msg);
      },
    );
  }
}

function createDefaultResolveExtensions() {
  return [
    '.web.ts', '.web.tsx', '.web.mjs', '.web.js', '.web.jsx',
    '.ts', '.tsx', '.mjs', '.cjs', '.js', '.jsx', '.json', '.wasm', '.d.ts',
  ];
}

function createDevServerProxy() {
  return {
    '/nexa_ws': {
      target: 'wss://testnet-explorer.nexa.org:30004',
      changeOrigin: true,
      ws: true,
    },
  };
}

async function modifyExpoEnv({ env, platform }) {
  const locations = await getPathsAsync(env.projectRoot);

  const indexHtmlFile = path.resolve(
    __dirname,
    '../packages/shared/src/web/index.html',
  );
  locations.template.indexHtml = indexHtmlFile;
  locations.template.indexHtmlTemplateParameters =
    indexHtmlParameter.createEjsParams({
      filename: 'index.html',
      platform,
    });

  return {
    ...env,
    locations: {
      ...locations,
    },
  };
}

function normalizeConfig({
  platform,
  config,
  env,
  configName,
  enableAnalyzerHtmlReport,
  buildTargetBrowser,
}) {
  const isDev = process.env.NODE_ENV !== 'production';
  let resolveExtensions = createDefaultResolveExtensions();

  if (platform) {
    configureOutput(config, platform, isDev);
    configurePlugins(config, platform, isDev, enableAnalyzerHtmlReport, configName);
    configureDevServer(config);
    resolveExtensions = configureResolveExtensions(resolveExtensions, platform, buildTargetBrowser, configName);
  }

  configureModuleRules(config, platform, developmentConsts.isManifestV3, configName);
  configureResolve(config, resolveExtensions, platform);
  configureOptimization(config);

  return config;
}

function configureOutput(config, platform, isDev) {
  if (PUBLIC_URL) config.output.publicPath = PUBLIC_URL;
  if (platform === 'web' && !isDev) config.output.crossOriginLoading = 'anonymous';
  config.output.filename = '[name].bundle.js';
}

function configurePlugins(config, platform, isDev, enableAnalyzerHtmlReport, configName) {
  config.plugins = [
    ...config.plugins,
    new webpack.ProgressPlugin(),
    platform !== 'ext' ? new DuplicatePackageCheckerPlugin() : null,
    isDev ? new BuildDoneNotifyPlugin() : null,
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    new webpack.DefinePlugin({
      'process.env.BARON_BUILD_TYPE': JSON.stringify(platform),
      'process.env.EXT_INJECT_RELOAD_BUTTON': JSON.stringify(process.env.EXT_INJECT_RELOAD_BUTTON),
      'process.env.PUBLIC_URL': PUBLIC_URL,
    }),
    isDev ? new ReactRefreshWebpackPlugin({ overlay: false }) : null,
    platform === 'web' && !isDev ? new SubresourceIntegrityPlugin() : null,
  ].filter(Boolean);

  if (process.env.ENABLE_ANALYZER) {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    config.plugins.push(new BundleAnalyzerPlugin(getBundleAnalyzerConfig(enableAnalyzerHtmlReport, configName)));
  }
}

function configureDevServer(config) {
  if (config.devServer) {
    config.devServer.proxy = {
      ...config.devServer.proxy,
      ...createDevServerProxy(),
    };
    config.devServer.onBeforeSetupMiddleware = setupReactRenderTrackerMiddleware;
  }
}

function configureResolveExtensions(resolveExtensions, platform, buildTargetBrowser, configName) {
  const newExtensions = [
    ...(buildTargetBrowser ? ['.ts', '.tsx', '.js', '.jsx'].map(ext => `.${buildTargetBrowser}-${platform}${ext}`) : []),
    ...(configName && platform === 'ext' && developmentConsts.isManifestV3
      ? ['.ts', '.tsx', '.js', '.jsx'].map(ext => `.${platform}-${configName}-v3${ext}`)
      : []),
    ...(configName ? ['.ts', '.tsx', '.js', '.jsx'].map(ext => `.${platform}-${configName}${ext}`) : []),
    ...['.ts', '.tsx', '.js', '.jsx'].map(ext => `.${platform}${ext}`),
    ...resolveExtensions,
  ];

  return lodash.uniq(newExtensions).sort((a, b) => {
    if (a.includes(platform) && b.includes(platform)) return 0;
    return a.includes(platform) ? -1 : 0;
  });
}

function configureModuleRules(config, platform, isManifestV3, configName) {
  const useImportMetaLoader = platform !== 'ext' || 
    (platform === 'ext' && !isManifestV3) ||
    (platform === 'ext' && isManifestV3 && configName === devUtils.consts.configName.offscreen);

  if (useImportMetaLoader) {
    config.module.rules.push({
      test: /@polkadot/,
      loader: require.resolve('@open-wc/webpack-import-meta-loader'),
    });
  }

  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  });

  config.module.rules.push({
    test: /\.ejs$/i,
    use: ['html-loader', 'template-ejs-loader'],
  });

  config.module.rules.forEach(normalizeModuleRule);
}

function configureResolve(config, resolveExtensions, platform) {
  config.resolve.extensions = resolveExtensions;
  config.resolve.alias = {
    ...config.resolve.alias,
    // Add any necessary aliases here
  };
  config.resolve.fallback = {
    ...config.resolve.fallback,
    'crypto': require.resolve('@baronhq/shared/src/modules3rdParty/cross-crypto/index.js'),
    'stream': require.resolve('stream-browserify'),
    'path': false,
    'https': false,
    'http': false,
    'net': false,
    'zlib': false,
    'tls': false,
    'child_process': false,
    'process': false,
    'fs': false,
    'util': false,
    'os': false,
    'buffer': require.resolve('buffer/'),
  };
}

function configureOptimization(config) {
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
      cacheGroups: {
        // Add any necessary cache groups here
      },
      ...config.optimization.splitChunks,
    },
  };
}

function normalizeModuleRule(rule) {
  if (!rule) return;

  if (rule.loader && rule.loader.indexOf('file-loader') >= 0 && rule.exclude) {
    rule.exclude.push(/\.wasm$/);
    rule.exclude.push(/\.cjs$/);
    rule.exclude.push(/\.custom-file-loader-exclude-extensions-from-webpack-tools$/);
  }

  if (rule.test && rule.test.toString() === '/\\.(mjs|[jt]sx?)$/') {
    rule.test = /\.(cjs|mjs|[jt]sx?)$/;
  }

  if (rule.test && rule.test.toString() === '/\\.+(js|jsx|mjs|ts|tsx)$/') {
    rule.test = /\.+(cjs|js|jsx|mjs|ts|tsx)$/;
  }

  (rule.oneOf || []).forEach(normalizeModuleRule);
}

function getBundleAnalyzerConfig(enableAnalyzerHtmlReport, configName) {
  return enableAnalyzerHtmlReport
    ? {
        analyzerMode: 'static',
        reportFilename: `report${configName ? `-${configName}` : ''}.html`,
        openAnalyzer: false,
      }
    : {
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

function setupReactRenderTrackerMiddleware(devServer) {
  devServer.app.get(
    '/react-render-tracker@0.7.3/dist/react-render-tracker.js',
    (req, res) => {
      const sendResponse = (text) => {
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        );
        res.setHeader('Age', '0');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'text/javascript');
        res.write(text);
        res.end();
      };

      if (req.headers && req.headers.cookie && req.headers.cookie.includes('rrt=1')) {
        const filePath = path.join(
          __dirname,
          '../node_modules/react-render-tracker/dist/react-render-tracker.js',
        );
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            res.status(500).send(`Error reading file: ${filePath}`);
            return;
          }
          sendResponse(data);
        });
      } else {
        sendResponse("console.log('react-render-tracker is disabled')");
      }
    },
  );
}

module.exports = {
  developmentConsts,
  normalizeConfig,
  modifyExpoEnv,
  createDevServerProxy,
};
