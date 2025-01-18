import { isManifestV3 } from './developmentConsts';
//BCMOD [ERR#1811] [ERR#1811]
const sharedTranspile: string[] = [];

const taprootModules: string[] = [
  '@cmdcode/buff-utils',
  '@cmdcode/tapscript',
  '@cmdcode/tapscript/dist/main.cjs',
  '@cmdcode/crypto-utils',
  '@cmdcode/crypto-utils/dist/main.cjs',
];

const walletConnectModules: string[] = [
  '@walletconnect/time',
  '@walletconnect/utils',
  '@walletconnect/window-getters',
  '@walletconnect/window-metadata',
  '@walletconnect/relay-api',
  '@walletconnect/core',
  '@walletconnect-v2/utils',
  '@walletconnect-v2/core',
  '@walletconnect-v2/core/node_modules/@walletconnect/utils',
  '@walletconnect/auth-client',
  '@walletconnect/auth-client/node_modules/@walletconnect/utils',
  '@walletconnect/auth-client/node_modules/@walletconnect/core',
  '@walletconnect/sign-client',
  '@walletconnect/sign-client/node_modules/@walletconnect/utils',
  '@walletconnect/sign-client/node_modules/@walletconnect/core',
  '@stablelib/chacha20poly1305',
  '@stablelib/hkdf',
  '@stablelib/random',
  '@stablelib/sha256',
  '@stablelib/x25519',
];

const substrateModules: string[] = ['@substrate/txwrapper-core'];

const polkadotModules: string[] = [
  '@polkadot/api',
  '@polkadot/wasm-bridge',
  '@polkadot/types-codec',
  '@polkadot/rpc-provider',
  '@polkadot/rpc-core',
  '@polkadot/types',
  '@polkadot/util',
  '@polkadot/util-crypto',
  '@polkadot/keyring',
];

const webModuleTranspile: string[] = [
  ...sharedTranspile,
  ...walletConnectModules,
  ...taprootModules,
  'moti',
  '@gorhom',
  '@mysten/sui.js',
  'superstruct',
  '@noble/curves',
  '@polkadot',
  '@solana/web3.js',
  '@kaspa/core-lib',
  '@zondax/izari-filecoin',
  '@baronhq',
  'timeout-signal',
];

const extModuleTranspile: string[] = [
  ...sharedTranspile,
  ...substrateModules,
  ...polkadotModules,
  ...walletConnectModules,
  ...taprootModules,
  '@baronhq/blockchain-libs',
  '@baronhq/components',
  '@baronhq/kit',
  '@baronhq/kit-bg',
  '@baronhq/shared',
  '@baronhq/engine',
  '@baronhq/app',
  'react-native-animated-splash-screen',
  'moti',
  'popmotion',
  '@mysten/sui.js',
  'superstruct',
  'timeout-signal',
  '@noble/curves',
  '@solana/web3.js',
  '@zondax/izari-filecoin',
  '@kaspa/core-lib',
  ...(isManifestV3()
    ? [
        // '@blitslabs/filecoin-js-signer'
      ]
    : []),
];

export { webModuleTranspile, extModuleTranspile };

// For CommonJS compatibility (if needed)
module.exports = {
  webModuleTranspile,
  extModuleTranspile,
};
