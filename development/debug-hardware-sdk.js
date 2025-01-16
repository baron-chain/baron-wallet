/**
 * @file debug-hardware-sdk.js
 * Hardware SDK debug script
 * Hardware SDK publish script: yarn publish:yalc
 *
 * Example: yarn debug:hardware-sdk -v 0.2.40
 */
//BCMOD [ERR#1811]
const { exec, execSync } = require('child_process');
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const LIB_VERSION = argv.v || 'latest';

const BARON_LIBRARIES = [
  'hd-core',
  'hd-ble-sdk',
  'hd-transport',
  'hd-web-sdk',
  'hd-shared',
];

/**
 * Add Baron libraries using yalc
 */
function addLibraries() {
  BARON_LIBRARIES.forEach((library) => {
    try {
      execSync(`yalc add @baronfe/${library}@${LIB_VERSION}`);
      console.log(`Added @baronfe/${library}@${LIB_VERSION} successfully`);
    } catch (error) {
      console.error(`Error adding @baronfe/${library}: ${error.message}`);
    }
  });
}

/**
 * Install yalc globally
 */
function installYalc() {
  return new Promise((resolve, reject) => {
    exec('npm install -g yalc', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing yalc: ${error.message}`);
        reject(error);
      } else {
        console.log('yalc installed successfully');
        resolve();
      }
    });
  });
}

/**
 * Check if yalc is installed and proceed accordingly
 */
function checkYalcAndProceed() {
  exec('which yalc', async (error, stdout, stderr) => {
    if (error) {
      console.log('yalc not found, installing...');
      try {
        await installYalc();
        addLibraries();
      } catch (installError) {
        console.error('Failed to install yalc. Please install it manually.');
      }
    } else {
      console.log('yalc is already installed, adding libraries...');
      addLibraries();
    }
  });
}

// Start the process
checkYalcAndProceed();
