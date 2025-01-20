import { isManifestV3 } from './developmentConsts';

const cryptoModules: string[] = [
  '@cmdcode/buff-utils',
  '@cmdcode/tapscript',
  '@cmdcode/tapscript/dist/main.cjs',
  '@cmdcode/crypto-utils',
  '@cmdcode/crypto-utils/dist/main.cjs',
  '@noble/curves',
];

const walletConnectModules: string[] = [
  '@walletconnect/time',
  '@walletconnect/utils',
  '@walletconnect/window-getters',
  '@walletconnect/window-metadata',
  '@walletconnect/relay-api',
  '@walletconnect/core',
  '@walletconnect/auth-client',
  '@walletconnect/sign-client',
  '@walletconnect-v2/utils',
  '@walletconnect-v2/core',
  '@stablelib/chacha20poly1305',
  '@stablelib/hkdf',
  '@stablelib/random',
  '@stablelib/sha256',
  '@stablelib/x25519',
];

const blockchainModules: string[] = [
  '@substrate/txwrapper-core',
  '@polkadot/api',
  '@polkadot/wasm-bridge',
  '@polkadot/types-codec',
  '@polkadot/rpc-provider',
  '@polkadot/rpc-core',
  '@polkadot/types',
  '@polkadot/util',
  '@polkadot/util-crypto',
  '@polkadot/keyring',
  '@mysten/sui.js',
  '@solana/web3.js',
  '@kaspa/core-lib',
  '@zondax/izari-filecoin'
];

const baronModules: string[] = [
  '@baronhq/blockchain-libs',
  '@baronhq/components',
  '@baronhq/kit',
  '@baronhq/kit-bg',
  '@baronhq/shared',
  '@baronhq/engine',
  '@baronhq/app'
];

const uiModules: string[] = [
  'moti',
  '@gorhom',
  'react-native-animated-splash-screen',
  'popmotion'
];

const utilityModules: string[] = [
  'superstruct',
  'timeout-signal'
];

export const webModuleTranspile: string[] = [
  ...cryptoModules,
  ...walletConnectModules,
  ...blockchainModules.filter(m => !m.includes('@substrate')),
  ...uiModules.filter(m => !m.includes('react-native')),
  ...utilityModules,
  '@baronhq'
];

export const extModuleTranspile: string[] = [
  ...cryptoModules,
  ...walletConnectModules,
  ...blockchainModules,
  ...baronModules,
  ...uiModules,
  ...utilityModules,
  ...(isManifestV3() ? [] : [])
];

// Maintain CommonJS compatibility
module.exports = {
  webModuleTranspile,
  extModuleTranspile
};
