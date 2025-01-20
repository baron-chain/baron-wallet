/**
 * Environment Configuration for Baron Wallet
 * @packageDocumentation
 */

import path from 'path';
import dotenv from 'dotenv';
import { format } from 'date-fns';
import fs from 'fs';

interface EnvLoadResult {
  file: string;
  result: dotenv.DotenvConfigOutput;
}

/**
 * Environment file configuration
 */
const ENV_FILES = {
  DEFAULT: '.env',
  VERSION: '.env.version',
  EXPO: '.env.expo',
  LOCAL: '.env.local', // Optional local overrides
  TEST: '.env.test',   // Test environment
} as const;

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'BARON_API_URL',
  'BARON_NETWORK',
  'BARON_BUILD_TYPE'
] as const;

/**
 * Load a specific environment file
 * @param fileName - Name of the env file to load
 * @returns Environment load result
 */
const loadEnvFile = (fileName: string): EnvLoadResult => {
  const filePath = path.resolve(__dirname, '..', fileName);
  
  // Check if file exists before attempting to load
  const exists = fs.existsSync(filePath);
  
  const result = exists ? dotenv.config({ path: filePath }) : { error: new Error(`File not found: ${fileName}`) };
  
  return {
    file: fileName,
    result
  };
};

/**
 * Validate required environment variables
 */
const validateEnv = (): void => {
  const missingVars = REQUIRED_ENV_VARS.filter(
    varName => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

/**
 * Set development build number if not in production
 */
const setDevBuildNumber = (): void => {
  if (process.env.NODE_ENV !== 'production') {
    process.env.BUILD_NUMBER = process.env.BUILD_NUMBER || 
      `${format(new Date(), 'yyyyMMddHHmm')}-dev`;
  }
};

/**
 * Load environment configuration
 */
const loadEnvironment = (): void => {
  try {
    // Load all environment files
    const results = Object.values(ENV_FILES).map(loadEnvFile);
    
    // Check for errors
    const errors = results
      .filter(result => result.result.error)
      .filter(result => {
        // Ignore missing optional files
        if (result.file === ENV_FILES.LOCAL || result.file === ENV_FILES.TEST) {
          return false;
        }
        return true;
      });

    if (errors.length > 0) {
      const errorMessages = errors
        .map(error => `${error.file}: ${error.result.error?.message}`)
        .join('\n');
      
      throw new Error(
        `Failed to load environment files:\n${errorMessages}`
      );
    }

    // Set development build number
    setDevBuildNumber();

    // Validate environment
    validateEnv();

    // Log environment info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Environment loaded successfully:', {
        NODE_ENV: process.env.NODE_ENV,
        BUILD_NUMBER: process.env.BUILD_NUMBER,
        BARON_NETWORK: process.env.BARON_NETWORK,
        BARON_BUILD_TYPE: process.env.BARON_BUILD_TYPE
      });
    }
  } catch (error) {
    console.error('Environment configuration failed:', error);
    throw error;
  }
};

// Load environment on import
loadEnvironment();

// Environment type definitions
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      BUILD_NUMBER: string;
      BARON_API_URL: string;
      BARON_NETWORK: 'mainnet' | 'testnet' | 'devnet';
      BARON_BUILD_TYPE: 'release' | 'debug';
      [key: string]: string | undefined;
    }
  }
}

export {
  ENV_FILES,
  REQUIRED_ENV_VARS,
  loadEnvFile,
  validateEnv,
  setDevBuildNumber,
  loadEnvironment
};
