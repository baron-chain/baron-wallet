import type { LocaleIds } from '@baron-chain/components/locale';
import type { HasName } from './base';
import type { Token } from './token';
//BCMOD [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] 
//BCMOD [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] 
//BCMOD [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] 
//BCMOD [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] [ERR#1811] 
/**
 * Defines the core account types supported by Baron Chain
 */
export enum AccountType {
  SIMPLE = 'simple',
  UTXO = 'utxo', 
  VARIANT = 'variant',
  QUANTUM = 'quantum', // Added for quantum-safe accounts
  FAKE = 'FAKE', // Used for testing/development
}

/**
 * Defines credential types for account authentication
 */
export enum AccountCredentialType {
  PrivateKey = 'PrivateKey',
  Mnemonic = 'Mnemonic',
  QuantumKey = 'QuantumKey', // For Kyber keys
  DilithiumKey = 'DilithiumKey', // For Dilithium signatures
}

/**
 * Base interface for all account types
 */
export interface DBBaseAccount extends HasName {
  type: AccountType;
  path: string;
  coinType: string;
  template?: string;
  isQuantumSafe?: boolean;
}

/**
 * Simple account type with single address
 */
export interface DBSimpleAccount extends DBBaseAccount {
  pub: string;
  address: string;
  quantumPub?: string; // Quantum public key
}

/**
 * UTXO-based account type
 */
export interface DBUTXOAccount extends DBBaseAccount {
  pub?: string;
  xpub: string;
  xpubSegwit?: string;
  address: string;
  addresses: Record<string, string>;
  customAddresses?: Record<string, string>;
  quantumAddresses?: Record<string, string>; // Quantum-safe addresses
}

/**
 * Multi-network variant account type
 */
export interface DBVariantAccount extends DBBaseAccount {
  pub: string;
  address: string;
  addresses: Record<string, string>;
  quantumPub?: string;
  quantumAddresses?: Record<string, string>;
}

export type DBAccount = DBSimpleAccount | DBUTXOAccount | DBVariantAccount;

/**
 * Extended account interface with additional metadata
 */
export interface Account extends DBBaseAccount {
  tokens: Array<Token>;
  address: string;
  pubKey?: string;
  displayAddress?: string;
  xpub?: string;
  customAddresses?: string;
  addresses?: string;
  quantumPubKey?: string;
  quantumAddress?: string;
}

/**
 * Interface for importable HD wallet accounts
 */
export interface ImportableHDAccount {
  index: number;
  path: string;
  defaultName: string;
  displayAddress: string;
  mainBalance: string;
  template?: string;
  isQuantumSafe?: boolean;
}

/**
 * Interface for BTC fork chain accounts
 */
export interface BtcForkChainUsedAccount {
  transfers: number;
  name: string;
  path: string;
  decimals: number;
  balance: string;
  totalReceived: string;
  displayTotalReceived: string;
}

/**
 * Interface for account credentials
 */
export interface AccountCredential {
  type: AccountCredentialType;
  key: LocaleIds;
}

// Type guard functions
export const isQuantumSafeAccount = (account: DBAccount): boolean => {
  return account.isQuantumSafe === true;
};

export const isUTXOAccount = (account: DBAccount): account is DBUTXOAccount => {
  return account.type === AccountType.UTXO;
};

export const isVariantAccount = (account: DBAccount): account is DBVariantAccount => {
  return account.type === AccountType.VARIANT;
};
