// developmentConsts.ts
//BCMOD [ERR#1811]
// Use TypeScript's const assertion for better type inference
const platforms = {
  all: 'all',
  app: 'app',
  desktop: 'desktop',
  ext: 'ext',
  web: 'web',
  webEmbed: 'webEmbed',
} as const;

// Create a type from the platforms object
type Platform = typeof platforms[keyof typeof platforms];

// Use a more descriptive name for the environment variable
const MANIFEST_V3_ENV_VAR = 'EXT_MANIFEST_V3';

// Function to safely check for environment variable
const isManifestV3 = (): boolean => {
  const envValue = process.env[MANIFEST_V3_ENV_VAR];
  return envValue === 'true' || envValue === '1';
};

// Export as a named export for better tree-shaking
export {
  isManifestV3,
  platforms,
  Platform,
};

// For CommonJS compatibility (if needed)
module.exports = {
  isManifestV3,
  platforms,
};
