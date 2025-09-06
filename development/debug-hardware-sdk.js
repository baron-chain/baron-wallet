#!/usr/bin/env node

/**
 * @file debug-hardware-sdk.js
 * Baron Chain Hardware SDK Debug Utility
 * Hardware SDK publish script: yarn publish:yalc
 * 
 * Usage: yarn debug:hardware-sdk -v <version>
 * Example: yarn debug:hardware-sdk -v 1.0.0
 */

const { exec, execSync } = require('child_process');
const minimist = require('minimist');
const chalk = require('chalk');
const semver = require('semver');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Parse command line arguments
const argv = minimist(process.argv.slice(2));
const LIB_VERSION = argv.v || 'latest';

// Baron Chain Hardware SDK Libraries
const BARON_LIBRARIES = [
  'hardware-core',
  'hardware-ble-sdk',
  'hardware-transport',
  'hardware-web-sdk',
  'hardware-shared',
];

// Validation and utility functions
function validateVersion(version) {
  if (version === 'latest') return true;
  return semver.valid(version) !== null;
}

function logSuccess(message) {
  console.log(chalk.green('✓'), message);
}

function logError(message) {
  console.error(chalk.red('✗'), message);
}

function logInfo(message) {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Check if a command exists in the system
 * @param {string} command - Command to check
 * @returns {Promise<boolean>}
 */
async function commandExists(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Add Baron Chain libraries using yalc
 * @returns {Promise<void>}
 */
async function addLibraries() {
  if (!validateVersion(LIB_VERSION)) {
    throw new Error(`Invalid version format: ${LIB_VERSION}`);
  }

  const results = [];
  for (const library of BARON_LIBRARIES) {
    const libraryName = `@baron-chain/${library}`;
    const fullLibraryName = `${libraryName}@${LIB_VERSION}`;
    
    try {
      logInfo(`Adding ${fullLibraryName}...`);
      await execAsync(`yalc add ${fullLibraryName}`);
      results.push({ library: fullLibraryName, success: true });
      logSuccess(`Added ${fullLibraryName} successfully`);
    } catch (error) {
      results.push({ library: fullLibraryName, success: false, error: error.message });
      logError(`Failed to add ${fullLibraryName}: ${error.message}`);
    }
  }

  // Print summary
  console.log('\nInstallation Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(chalk.bold(`Total: ${results.length}`));
  console.log(chalk.green(`Success: ${successful}`));
  if (failed > 0) {
    console.log(chalk.red(`Failed: ${failed}`));
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ${r.library}: ${r.error}`);
    });
  }
}

/**
 * Install yalc globally
 * @returns {Promise<void>}
 */
async function installYalc() {
  logInfo('Installing yalc globally...');
  try {
    await execAsync('npm install -g yalc');
    logSuccess('yalc installed successfully');
  } catch (error) {
    throw new Error(`Failed to install yalc: ${error.message}`);
  }
}

/**
 * Check dependencies and environment
 * @returns {Promise<void>}
 */
async function checkEnvironment() {
  // Check Node.js version
  const nodeVersion = process.version;
  if (!semver.satisfies(nodeVersion, '>=14.0.0')) {
    throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 14 or higher.`);
  }

  // Check npm
  if (!await commandExists('npm')) {
    throw new Error('npm is not installed');
  }

  // Check git (required for yalc)
  if (!await commandExists('git')) {
    throw new Error('git is not installed');
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Print header
    console.log(chalk.bold('\nBaron Chain Hardware SDK Debug Utility'));
    console.log(chalk.gray('=====================================\n'));

    // Check environment
    logInfo('Checking environment...');
    await checkEnvironment();
    logSuccess('Environment check passed');

    // Check if yalc is installed
    const hasYalc = await commandExists('yalc');
    if (!hasYalc) {
      logInfo('yalc not found, installing...');
      await installYalc();
    } else {
      logSuccess('yalc is already installed');
    }

    // Add libraries
    logInfo('Adding Baron Chain Hardware SDK libraries...');
    await addLibraries();
    
    logSuccess('Setup completed successfully');
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute main function
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
