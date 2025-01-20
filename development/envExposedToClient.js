/**
 * Client Environment Configuration for Baron Wallet
 * @packageDocumentation
 */

import { platforms, Platform } from './developmentConsts';

/**
 * Categories of environment variables
 */
const ENV_CATEGORIES = {
  CORE: 'core',
  PLATFORM: 'platform',
  FEATURES: 'features',
  EXTERNAL: 'external',
  ANALYTICS: 'analytics',
} as const;

/**
 * Environment variable configuration
 */
interface EnvVarConfig {
  name: string;
  category: typeof ENV_CATEGORIES[keyof typeof ENV_CATEGORIES];
  platforms: Platform[];
  description: string;
}

/**
 * Core environment variables exposed to client
 */
const CORE_ENV_VARS: EnvVarConfig[] = [
  {
    name: 'NODE_ENV',
    category: ENV_CATEGORIES.CORE,
    platforms: [platforms.all],
    description: 'Current Node environment'
  },
  {
    name: 'VERSION',
    category: ENV_CATEGORIES.CORE,
    platforms: [platforms.all],
    description: 'Application version'
  },
  {
    name: 'BUILD_NUMBER',
    category: ENV_CATEGORIES.CORE,
    platforms: [platforms.all],
    description: 'Build number'
  },
  {
    name: 'BARON_PLATFORM',
    category: ENV_CATEGORIES.CORE,
    platforms: [platforms.all],
    description: 'Current platform identifier'
  }
];

/**
 * Platform-specific environment variables
 */
const PLATFORM_ENV_VARS: EnvVarConfig[] = [
  {
    name: 'EXT_INJECT_MODE',
    category: ENV_CATEGORIES.PLATFORM,
    platforms: [platforms.ext],
    description: 'Extension injection mode'
  },
  {
    name: 'EXT_CHANNEL',
    category: ENV_CATEGORIES.PLATFORM,
    platforms: [platforms.ext],
    description: 'Extension distribution channel'
  },
  {
    name: 'ANDROID_CHANNEL',
    category: ENV_CATEGORIES.PLATFORM,
    platforms: [platforms.app],
    description: 'Android distribution channel'
  },
  {
    name: 'DESK_CHANNEL',
    category: ENV_CATEGORIES.PLATFORM,
    platforms: [platforms.desktop],
    description: 'Desktop distribution channel'
  }
];

/**
 * Feature-specific environment variables
 */
const FEATURE_ENV_VARS: EnvVarConfig[] = [
  {
    name: 'HARDWARE_SDK_CONNECT_SRC',
    category: ENV_CATEGORIES.FEATURES,
    platforms: [platforms.all],
    description: 'Hardware wallet connection source'
  },
  {
    name: 'QUANTUM_SAFE_MODE',
    category: ENV_CATEGORIES.FEATURES,
    platforms: [platforms.all],
    description: 'Quantum-safe mode enabled flag'
  }
];

/**
 * External service configuration variables
 */
const EXTERNAL_ENV_VARS: EnvVarConfig[] = [
  {
    name: 'COVALENT_KEY',
    category: ENV_CATEGORIES.EXTERNAL,
    platforms: [platforms.all],
    description: 'Covalent API key'
  }
];

/**
 * Analytics and tracking variables
 */
const ANALYTICS_ENV_VARS: EnvVarConfig[] = [
  {
    name: 'GITHUB_SHA',
    category: ENV_CATEGORIES.ANALYTICS,
    platforms: [platforms.all],
    description: 'Git commit SHA for build tracking'
  }
];

/**
 * Parameters for building client environment variables
 */
interface BuildEnvParams {
  platform: Platform;
}

/**
 * Get all environment variables for a specific platform
 * @param platform - Target platform
 * @returns Array of environment variable configurations
 */
function getEnvVarsForPlatform(platform: Platform): EnvVarConfig[] {
  const allEnvVars = [
    ...CORE_ENV_VARS,
    ...PLATFORM_ENV_VARS,
    ...FEATURE_ENV_VARS,
    ...EXTERNAL_ENV_VARS,
    ...ANALYTICS_ENV_VARS
  ];

  return allEnvVars.filter(envVar => 
    envVar.platforms.includes(platforms.all) || 
    envVar.platforms.includes(platform)
  );
}

/**
 * Build environment variables exposed to client
 * WARNING: DO NOT expose sensitive data (passwords, private keys, etc.)
 * @param params - Build parameters
 * @returns Array of environment variable names
 */
function buildEnvExposedToClientDangerously({ platform }: BuildEnvParams): string[] {
  const envVars = getEnvVarsForPlatform(platform);
  return envVars.map(env => env.name);
}

/**
 * Get environment variable documentation
 * @param platform - Target platform
 * @returns Documentation of available environment variables
 */
function getEnvVarDocumentation(platform: Platform): string {
  const envVars = getEnvVarsForPlatform(platform);
  let doc = '# Baron Wallet Environment Variables\n\n';
  
  Object.values(ENV_CATEGORIES).forEach(category => {
    const categoryVars = envVars.filter(env => env.category === category);
    if (categoryVars.length > 0) {
      doc += `\n## ${category.toUpperCase()}\n\n`;
      categoryVars.forEach(env => {
        doc += `- \`${env.name}\`: ${env.description}\n`;
      });
    }
  });
  
  return doc;
}

export {
  buildEnvExposedToClientDangerously,
  getEnvVarDocumentation,
  getEnvVarsForPlatform,
  ENV_CATEGORIES
};

export type { EnvVarConfig, BuildEnvParams };
