/**
 * Development constants configuration for Baron Wallet
 * @packageDocumentation
 */

/**
 * Supported platforms in Baron Wallet
 */
const platforms = {
  all: 'all',
  app: 'app',               // Mobile app (iOS/Android)
  desktop: 'desktop',       // Desktop application
  ext: 'ext',              // Browser extension
  web: 'web',              // Web application
  webEmbed: 'webEmbed',    // Embedded web version
  quantum: 'quantum',       // Quantum-safe features
} as const;

/**
 * Platform type derived from platforms object
 */
type Platform = typeof platforms[keyof typeof platforms];

/**
 * Environment names for different build configurations
 */
const environments = {
  development: 'development',
  production: 'production',
  staging: 'staging',
  testing: 'testing',
} as const;

type Environment = typeof environments[keyof typeof environments];

/**
 * Environment variable names used in the application
 */
const ENV_VARS = {
  MANIFEST_VERSION: 'BARON_MANIFEST_VERSION',
  BUILD_ENV: 'BARON_BUILD_ENV',
  DEBUG_MODE: 'BARON_DEBUG_MODE',
  QUANTUM_FEATURES: 'BARON_QUANTUM_FEATURES',
} as const;

/**
 * Configuration for different platform features
 */
const platformFeatures = {
  [platforms.app]: {
    supportsBiometrics: true,
    supportsHardwareWallet: true,
    supportsQuantumSafe: true,
  },
  [platforms.desktop]: {
    supportsBiometrics: false,
    supportsHardwareWallet: true,
    supportsQuantumSafe: true,
  },
  [platforms.ext]: {
    supportsBiometrics: false,
    supportsHardwareWallet: true,
    supportsQuantumSafe: true,
  },
  [platforms.web]: {
    supportsBiometrics: false,
    supportsHardwareWallet: false,
    supportsQuantumSafe: true,
  },
  [platforms.webEmbed]: {
    supportsBiometrics: false,
    supportsHardwareWallet: false,
    supportsQuantumSafe: true,
  },
  [platforms.quantum]: {
    supportsBiometrics: true,
    supportsHardwareWallet: true,
    supportsQuantumSafe: true,
  },
} as const;

/**
 * Type for platform features
 */
type PlatformFeatures = typeof platformFeatures[Platform];

/**
 * Checks if manifest v3 is enabled
 * @returns {boolean} True if manifest v3 is enabled
 */
const isManifestV3 = (): boolean => {
  const version = process.env[ENV_VARS.MANIFEST_VERSION];
  return version === '3' || version === 'v3';
};

/**
 * Gets the current environment
 * @returns {Environment} Current environment
 */
const getCurrentEnvironment = (): Environment => {
  return (process.env[ENV_VARS.BUILD_ENV] as Environment) || environments.development;
};

/**
 * Checks if quantum features are enabled
 * @returns {boolean} True if quantum features are enabled
 */
const isQuantumFeaturesEnabled = (): boolean => {
  return process.env[ENV_VARS.QUANTUM_FEATURES] === 'true';
};

/**
 * Gets features supported by a platform
 * @param {Platform} platform - Target platform
 * @returns {PlatformFeatures} Platform features
 */
const getPlatformFeatures = (platform: Platform): PlatformFeatures => {
  return platformFeatures[platform];
};

/**
 * Development constants configuration object
 */
export const developmentConfig = {
  platforms,
  environments,
  ENV_VARS,
  platformFeatures,
  isManifestV3,
  getCurrentEnvironment,
  isQuantumFeaturesEnabled,
  getPlatformFeatures,
} as const;

// Type exports
export type {
  Platform,
  Environment,
  PlatformFeatures,
};

// For CommonJS compatibility
export default developmentConfig;
