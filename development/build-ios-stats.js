#!/usr/bin/env node
//BCMOD [ERR#1811]
const process = require('process');
const chalk = require('chalk');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const minimist = require('minimist');
const execa = require('execa');

process.chdir('packages/app');

const argv = minimist(process.argv.slice(2));
const pkgJSON = JSON.parse(fs.readFileSync('./package.json'));

const sanitizeString = (str) => str ? str.replace(/[^\w]/gi, '') : str;

const getAppName = () => {
  if (pkgJSON.name) return sanitizeString(pkgJSON.name);
  try {
    const appJSON = JSON.parse(fs.readFileSync('./app.json'));
    return sanitizeString(appJSON.name) || sanitizeString(appJSON.expo.name) || 'UnknownApp';
  } catch (err) {
    console.error(chalk.yellow('Warning: Unable to determine app name. Using "UnknownApp".'));
    return 'UnknownApp';
  }
};

const getEntryPoint = () => pkgJSON.main || 'index.js';

const getReactNativeBin = () => {
  const localBin = './node_modules/.bin/react-native';
  if (fs.existsSync(localBin)) return localBin;
  try {
    const reactNativeDir = path.dirname(require.resolve('react-native/package.json'));
    return path.join(reactNativeDir, './cli.js');
  } catch (e) {
    console.error(
      chalk.red.bold('React-native binary could not be located. Please report this issue with environment info to:'),
      chalk.blue.bold(`-> ${require('../package.json').bugs}`)
    );
    process.exit(1);
  }
};

const baseDir = path.join(os.tmpdir(), 'react-native-bundle-visualizer');
const tmpDir = path.join(baseDir, getAppName());
const outDir = path.join(tmpDir, 'output');
const entryFile = argv['entry-file'] || getEntryPoint();
const platform = argv.platform || 'ios';
const dev = argv.dev || false;
const verbose = argv.verbose || false;
const resetCache = argv['reset-cache'] || false;
const bundleOutput = argv['bundle-output'] || path.join(tmpDir, `${platform}.bundle`);
const bundleOutputSourceMap = `${bundleOutput}.map`;
const format = argv.format || 'html';

fs.ensureDirSync(baseDir);
fs.ensureDirSync(tmpDir);

let prevBundleSize;
if (fs.existsSync(bundleOutput)) {
  const stats = fs.statSync(bundleOutput);
  prevBundleSize = stats.size;
}

console.log(chalk.green.bold('Generating bundle...'));

const commands = [
  'bundle',
  '--platform', platform,
  '--dev', dev,
  '--entry-file', entryFile,
  '--bundle-output', bundleOutput,
  '--sourcemap-output', bundleOutputSourceMap,
];

if (resetCache) {
  commands.push('--reset-cache', resetCache);
}

if (argv.expo) {
  console.warn(chalk.yellow.bold(
    'The "--expo" command is deprecated for Expo SDK 41+. Use react-native-bundle-visualizer@2 for Expo SDK 40 or lower.'
  ));
}

const reactNativeBin = getReactNativeBin();
const bundlePromise = execa(reactNativeBin, commands);
bundlePromise.stdout.pipe(process.stdout);

bundlePromise.then(() => {
  const stats = fs.statSync(bundleOutput);
  const bundleSizeMB = Math.round((stats.size / (1024 * 1024)) * 100) / 100;

  let deltaSuffix = '';
  if (prevBundleSize) {
    const delta = stats.size - prevBundleSize;
    if (delta > 0) {
      deltaSuffix = chalk.yellow(` (+++ increased by ${delta} bytes)`);
    } else if (delta < 0) {
      deltaSuffix = chalk.green.bold(` (--- decreased by ${Math.abs(delta)} bytes)`);
    } else {
      deltaSuffix = chalk.green(' (unchanged)');
    }
  }

  console.log(chalk.green.bold(`Bundle size: ${bundleSizeMB} MB`) + deltaSuffix);

  const output = {
    assets: [{ name: 'bundle', size: stats.size }]
  };

  fs.writeFileSync('stats.json', JSON.stringify(output, null, 2));
}).catch(error => {
  console.error(chalk.red.bold('Error generating bundle:'), error);
  process.exit(1);
});
