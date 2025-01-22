import type { BaseObject } from '@baron-chain/shared/types/base';

/**
 * Database account derivation record
 */
export interface DBAccountDerivation extends BaseObject {
  walletId: string;
  accounts: string[];
  template: string;
  quantumDerivation?: boolean;
  kyberParams?: string;
  dilithiumParams?: string;
}

/**
 * Parameters for setting account template
 */
export interface SetAccountTemplateParams {
  accountId: string;
  template: string;
  isQuantumSafe?: boolean;
}

/**
 * Parameters for adding account derivation
 */
export interface AddAccountDerivationParams {
  walletId: string;
  accountId: string;
  impl: string;
  template: string;
  derivationStore?: IDBObjectStore;
  isQuantumSafe?: boolean;
  kyberParams?: {
    publicKey: string;
    encryptionParams: string;
  };
  dilithiumParams?: {
    publicKey: string;
    signatureParams: string;
  };
}

/**
 * Type guard to check if derivation is quantum safe
 */
export const isQuantumSafeDerivation = (
  derivation: DBAccountDerivation
): boolean => {
  return derivation.quantumDerivation === true;
};
