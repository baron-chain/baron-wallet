const { defaults } = require('jest-config');
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

module.exports = async () => {
  const { stdout } = await exec('yarn config get cacheFolder');
  const cacheDirectory = stdout.trim().replace('\n', '');

  return {
    preset: 'jest-expo',
    coverageProvider: 'v8',
    cacheDirectory: `${cacheDirectory}/.baron-mono-jest-cache`,
    setupFilesAfterEnv: [
      './jest-setup.js',
      './node_modules/react-native-gesture-handler/jestSetup.js',
    ],
    testEnvironment: 'jest-environment-node',
    verbose: true,
    moduleFileExtensions: [
      ...defaults.moduleFileExtensions,
      'd.ts',
      'ts',
      'tsx',
    ],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        '<rootDir>/__mocks__/fileMock.js',
      '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    },
    transformIgnorePatterns: ['nodo_modules/react-native-reanimated'],
    reporters: [
      'default',
      [
        './node_modules/jest-html-reporter',
        {
          'pageTitle': 'Test Report',
        },
      ],
    ],
  };
};
