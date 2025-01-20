#!/usr/bin/env node

const process = require('process');
const chalk = require('chalk');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const minimist = require('minimist');
const execa = require('execa');

const BARON_PACKAGE_DIR = 'packages/app';
process.chdir(BARON_PACKAGE_DIR);

const argv = minimist(process.argv.slice(2));

// Configuration and utility functions
const CONFIG = {
  defaultPlatform: 'ios',
  defaultFormat: 'html',
  bundlePrefix: 'baron-wallet',
  tmpDirPrefix: 'baron-wallet-bundle-visualizer'
};

const sanitizeString = (str) => str ? str.replace(/[^\w-]/gi, '') : str;

const getPackageInfo = () => {
  try {
    return JSON.parse(fs.readFileSync('./package.json'));
  } catch (err) {
    console.error(chalk.red.bold('Error reading package.json:'), err);
    process.exit(1);
  }
};

const getAppName = () => {
  const pkgJSON = getPackageInfo();
  if (pkgJSON.name) return sanitizeString(pkgJSON.name);
  
  try {
    const appJSON = JSON.parse(fs.readFileSync('./app.json'));
    return sanitizeString(appJSON.name) || 
           sanitizeString(appJSON.expo?.name) || 
           CONFIG.bundlePrefix;
  } catch (err) {
    console.warn(chalk.yellow('Warning: Using default app name.'));
    return CONFIG.bundlePrefix;
  }
};

const getEntryPoint = () => {
  const pkgJSON = getPackageInfo();
  return pkgJSON.main || 'index.js';
};

const getReactNativeBin = () => {
  const localBin = './node_modules/.bin/react-native';
  if (fs.existsSync(localBin)) return localBin;
  
  try {
    const reactNativeDir = path.dirname(require.resolve('react-native/package.json'));
    return path.join(reactNativeDir, './cli.js');
  } catch (err) {
    console.error(
      chalk.red.bold('React Native CLI not found. Please check your dependencies:'),
      chalk.blue.bold(`-> ${getPackageInfo().bugs}`)
    );
    process.exit(1);
  }
};

// Setup directories and paths
const baseDir = path.join(os.tmpdir(), CONFIG.tmpDirPrefix);
const tmpDir = path.join(baseDir, getAppName());
const outDir = path.join(tmpDir, 'output');

// Command line arguments
const options = {
  entryFile: argv['entry-file'] || getEntryPoint(),
  platform: argv.platform || CONFIG.defaultPlatform,
  dev: argv.dev || false,
  verbose: argv.verbose || false,
  resetCache: argv['reset-cache'] || false,
  bundleOutput: argv['bundle-output'] || path.join(tmpDir, `${getAppName()}-${argv.platform || CONFIG.defaultPlatform}.bundle`),
  format: argv.format || CONFIG.defaultFormat
};

// Ensure directories exist
fs.ensureDirSync(baseDir);
fs.ensureDirSync(tmpDir);

// Get previous bundle size if exists
let prevBundleSize;
if (fs.existsSync(options.bundleOutput)) {
  const stats = fs.statSync(options.bundleOutput);
  prevBundleSize = stats.size;
}

// Bundle generation
console.log(chalk.green.bold('Generating Baron Wallet bundle...'));

const commands = [
  'bundle',
  '--platform', options.platform,
  '--dev', options.dev,
  '--entry-file', options.entryFile,
  '--bundle-output', options.bundleOutput,
  '--sourcemap-output', `${options.bundleOutput}.map`,
];

if (options.resetCache) {
  commands.push('--reset-cache', options.resetCache);
}

if (options.verbose) {
  console.log(chalk.blue('Bundle command:'), commands.join(' '));
}

const reactNativeBin = getReactNativeBin();
const bundlePromise = execa(reactNativeBin, commands);

// Handle bundle generation process
bundlePromise.stdout.pipe(process.stdout);

bundlePromise
  .then(() => {
    const stats = fs.statSync(options.bundleOutput);
    const bundleSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    let deltaMessage = '';
    if (prevBundleSize) {
      const delta = stats.size - prevBundleSize;
      if (delta > 0) {
        deltaMessage = chalk.yellow(` (+${formatBytes(delta)})`);
      } else if (delta < 0) {
        deltaMessage = chalk.green.bold(` (-${formatBytes(Math.abs(delta))})`);
      } else {
        deltaMessage = chalk.green(' (unchanged)');
      }
    }
    
    console.log(chalk.green.bold(`Bundle size: ${bundleSizeMB} MB${deltaMessage}`));
    
    const output = {
      timestamp: new Date().toISOString(),
      bundle: {
        name: path.basename(options.bundleOutput),
        size: stats.size,
        platform: options.platform
      },
      config: {
        dev: options.dev,
        entryFile: options.entryFile
      }
    };
    
    fs.writeFileSync(
      path.join(tmpDir, 'stats.json'), 
      JSON.stringify(output, null, 2)
    );
  })
  .catch(error => {
    console.error(
      chalk.red.bold('Bundle generation failed:'),
      chalk.red(error.message)
    );
    
    if (options.verbose) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }
    
    process.exit(1);
  });

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
