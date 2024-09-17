import { platforms, Platform } from './developmentConsts';

// Define a type for the function parameter
interface BuildEnvParams {
  platform: Platform;
}

// Define a type for the environment variables
type EnvironmentVariable = string;

function buildEnvExposedToClientDangerously({ platform }: BuildEnvParams): EnvironmentVariable[] {
  // *** ATTENTION: DO NOT expose any sensitive variable here ***
  // ***        like password, secretKey, etc.     ***
  const transformInlineEnvironmentVariables: EnvironmentVariable[] = [
    'NODE_ENV',
    'VERSION',
    'BUILD_NUMBER',
    'BARON_PLATFORM',
    'EXT_INJECT_MODE',
    'EXT_CHANNEL',
    'ANDROID_CHANNEL',
    'DESK_CHANNEL',
    'COVALENT_KEY',
    'HARDWARE_SDK_CONNECT_SRC',
    'GITHUB_SHA',
  ];

  if (platform === platforms.app) {
    transformInlineEnvironmentVariables.push('JPUSH_KEY');
  }

  return transformInlineEnvironmentVariables;
}

// Export as a named export for better tree-shaking
export { buildEnvExposedToClientDangerously };

// For CommonJS compatibility (if needed)
module.exports = {
  buildEnvExposedToClientDangerously,
};
