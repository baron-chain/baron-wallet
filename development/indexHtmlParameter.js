/**
 * EJS Template Configuration for Baron Wallet
 * @packageDocumentation
 */

import fs from 'fs';
import path from 'path';
import { platforms } from './developmentConsts';

/**
 * Supported browsers configuration
 */
const SUPPORTED_BROWSERS = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
  SAFARI: 'safari',
  EDGE: 'edge',
} as const;

type SupportedBrowser = typeof SUPPORTED_BROWSERS[keyof typeof SUPPORTED_BROWSERS];

/**
 * EJS template parameters interface
 */
interface EjsParams {
  filename?: string;
  platform?: string;
  browser?: SupportedBrowser;
}

/**
 * Interpolation parameters interface
 */
interface InterpolateParams {
  filename: string;
  platform: string;
}

/**
 * Application configuration interface
 */
interface AppConfig {
  title: string;
  description: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  publicUrl: string;
}

/**
 * Default application configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  title: 'Baron Wallet',
  description: 'Quantum-Safe Cryptocurrency Wallet',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'zh', 'ko', 'ja'],
  publicUrl: process.env.PUBLIC_URL || '',
};

/**
 * Error messages
 */
const ERROR_MESSAGES = {
  FILE_NOT_FOUND: 'Preload script file not found:',
  INVALID_PLATFORM: 'Invalid platform specified:',
  INVALID_BROWSER: 'Invalid browser specified:',
} as const;

/**
 * Read preload script safely with error handling
 * @param platform - Target platform
 * @returns Preload script content
 */
function readPreloadScript(platform: string): string {
  const preloadPath = path.resolve(
    __dirname, 
    '../packages/ext/src/assets/preload-html-head.js'
  );

  try {
    if (!fs.existsSync(preloadPath)) {
      throw new Error(`${ERROR_MESSAGES.FILE_NOT_FOUND} ${preloadPath}`);
    }
    return fs.readFileSync(preloadPath, { encoding: 'utf-8' });
  } catch (error) {
    console.error('Failed to read preload script:', error);
    return ''; // Return empty string as fallback
  }
}

/**
 * Validate platform
 * @param platform - Platform to validate
 * @throws Error if platform is invalid
 */
function validatePlatform(platform: string): void {
  if (platform && !Object.values(platforms).includes(platform as any)) {
    throw new Error(`${ERROR_MESSAGES.INVALID_PLATFORM} ${platform}`);
  }
}

/**
 * Validate browser
 * @param browser - Browser to validate
 * @throws Error if browser is invalid
 */
function validateBrowser(browser: string): void {
  if (browser && !Object.values(SUPPORTED_BROWSERS).includes(browser as any)) {
    throw new Error(`${ERROR_MESSAGES.INVALID_BROWSER} ${browser}`);
  }
}

/**
 * Generate meta tags for SEO
 * @param config - Application configuration
 * @returns Meta tags HTML string
 */
function generateMetaTags(config: AppConfig): string {
  return `
    <meta name="description" content="${config.description}">
    <meta property="og:title" content="${config.title}">
    <meta property="og:description" content="${config.description}">
    <meta property="og:type" content="website">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  `;
}

/**
 * Generate noscript content
 * @returns Noscript HTML content
 */
function generateNoscriptContent(): string {
  return `
    <form action="" style="background-color:#fff;position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;">
      <div style="font-size:18px;font-family:Helvetica,sans-serif;line-height:24px;margin:10%;width:80%;">
        <p>JavaScript is required to use Baron Wallet.</p>
        <p style="margin:20px 0;">
          <button type="submit" style="background-color: #4630EB; border-radius: 100px; border: none; box-shadow: none; color: #fff; cursor: pointer; font-weight: bold; line-height: 20px; padding: 6px 16px;">
            Reload
          </button>
        </p>
      </div>
    </form>
  `;
}

/**
 * Create EJS template parameters
 * @param params - EJS parameters
 * @returns Complete EJS parameters
 */
function createEjsParams({ 
  filename = '', 
  platform = '', 
  browser = '' 
}: EjsParams = {}) {
  validatePlatform(platform);
  validateBrowser(browser);

  return {
    filename,
    platform,
    browser,
    htmlHeadPreloadCode: readPreloadScript(platform),
    isDev: process.env.NODE_ENV === 'development',
    metaTags: generateMetaTags(DEFAULT_CONFIG),
    config: DEFAULT_CONFIG,
  };
}

/**
 * Create interpolation parameters
 * @param params - Interpolation parameters
 * @returns Complete interpolation parameters
 */
function createInterpolateParams({ 
  filename, 
  platform 
}: InterpolateParams) {
  validatePlatform(platform);

  return {
    WEB_PUBLIC_URL: DEFAULT_CONFIG.publicUrl,
    WEB_TITLE: DEFAULT_CONFIG.title,
    LANG_ISO_CODE: DEFAULT_CONFIG.defaultLanguage,
    NO_SCRIPT: generateNoscriptContent(),
    ROOT_ID: 'baron-wallet-root',
  };
}

export {
  createEjsParams,
  createInterpolateParams,
  SUPPORTED_BROWSERS,
  DEFAULT_CONFIG,
};

export type {
  EjsParams,
  InterpolateParams,
  AppConfig,
  SupportedBrowser,
};
