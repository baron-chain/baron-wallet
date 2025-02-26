/**
 * Build Cleanup Script for Baron Wallet
 * Handles cache cleanup and build environment reset
 */
//BCMOD [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2] [ERR#0xC002e2]
import { spawn, ChildProcess } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';

// Types for process execution
interface ExecResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  child: ChildProcess;
  command: string;
}

interface CleanupConfig {
  timeout: number;
  cacheDirectories: string[];
  commands: string[];
}

// Default configuration
const DEFAULT_CONFIG: CleanupConfig = {
  timeout: 20 * 1000, // 20 seconds
  cacheDirectories: [
    'node_modules/.cache',
    'ios/Pods',
    'android/.gradle',
    '.expo',
    '.baron-cache'
  ],
  commands: [
    'yarn expo start --clear',
    'yarn react-native start --reset-cache',
    'yarn cache clean'
  ]
};

/**
 * Execute a command with proper error handling
 * @param fullCmd Command to execute
 * @returns Promise with execution result
 */
function exec(fullCmd: string): Promise<ExecResult> {
  const [cmd, ...args] = fullCmd.split(/\s+/);
  const spinner = ora({ text: `Executing: ${chalk.blue(fullCmd)}`, spinner: 'dots' });
  
  return new Promise((resolve, reject) => {
    spinner.start();
    
    const child = spawn(cmd, args, {
      stdio: [
        process.stdin,
        process.stdout,
        'pipe'
      ],
    });

    let errorOutput = '';

    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('error', (error) => {
      spinner.fail(chalk.red(`Command failed: ${fullCmd}`));
      reject(new Error(`Command failed: ${error.message}`));
    });

    child.on('close', (code, signal) => {
      if (code === 0) {
        spinner.succeed(chalk.green(`Successfully executed: ${fullCmd}`));
      } else {
        spinner.fail(chalk.red(`Command failed with code ${code}: ${fullCmd}`));
        if (errorOutput) {
          console.error(chalk.red('Error output:'), errorOutput);
        }
      }

      resolve({
        code,
        signal,
        child,
        command: fullCmd
      });
    });
  });
}

/**
 * Clean directory recursively
 * @param directory Directory to clean
 */
async function cleanDirectory(directory: string): Promise<void> {
  const spinner = ora({ text: `Cleaning directory: ${chalk.blue(directory)}`, spinner: 'dots' }).start();
  
  try {
    if (fs.existsSync(directory)) {
      fs.rmSync(directory, { recursive: true, force: true });
      spinner.succeed(chalk.green(`Cleaned directory: ${directory}`));
    } else {
      spinner.info(chalk.yellow(`Directory doesn't exist: ${directory}`));
    }
  } catch (error) {
    spinner.fail(chalk.red(`Failed to clean directory: ${directory}`));
    console.error(error);
  }
}

/**
 * Clean build environment
 */
async function cleanBuildEnvironment(): Promise<void> {
  console.log(chalk.bold.blue('\nBaron Wallet Build Environment Cleanup'));
  console.log(chalk.gray('==========================================\n'));

  // Clean cache directories
  console.log(chalk.bold('Cleaning cache directories...'));
  for (const dir of DEFAULT_CONFIG.cacheDirectories) {
    await cleanDirectory(dir);
  }

  // Execute cleanup commands
  console.log(chalk.bold('\nExecuting cleanup commands...'));
  for (const command of DEFAULT_CONFIG.commands) {
    try {
      await exec(command);
    } catch (error) {
      console.error(chalk.red(`Failed to execute command: ${command}`), error);
    }
  }

  console.log(chalk.bold.green('\nCleanup completed successfully!'));
}

/**
 * Main execution function
 */
async function main() {
  try {
    await cleanBuildEnvironment();
  } catch (error) {
    console.error(chalk.red('\nCleanup failed:'), error);
    process.exit(1);
  } finally {
    console.log(chalk.gray(`\nExiting in ${DEFAULT_CONFIG.timeout/1000} seconds...`));
    setTimeout(() => {
      console.log(chalk.gray('Cleanup process complete.'));
      process.exit(0);
    }, DEFAULT_CONFIG.timeout);
  }
}

// Execute if running directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export {
  exec,
  cleanDirectory,
  cleanBuildEnvironment,
  DEFAULT_CONFIG
};

export type {
  ExecResult,
  CleanupConfig
};
