import type { 
  SimpleDbEntityMarketData 
} from '@baron-chain/db/simple/entity/SimpleDbEntityMarket';
import type { 
  SimpleDbEntityUtxoData 
} from '@baron-chain/db/simple/entity/SimpleDbEntityUtxoAccounts';
import type { DBAccount } from './account';
import type { Wallet } from './wallet';

/**
 * Version information interface for backup compatibility
 */
export interface VersionInfo {
  version: number;
  quantumVersion?: number; // Version for quantum-safe features
}

/**
 * HD Wallet that can be imported
 */
export interface ImportableHDWallet extends 
  Omit<Wallet, 'backuped' | 'accounts' | 'associatedDevice' | 'deviceType'>,
  VersionInfo {
  accounts: Array<DBAccount>;
  accountIds: Array<string>;
  quantumSafe?: boolean;
  kyberKeys?: {
    publicKeys: Record<string, string>;
    encryptionParams: Record<string, string>;
  };
  dilithiumKeys?: {
    publicKeys: Record<string, string>;
    signatureParams: Record<string, string>;
  };
}

/**
 * Market data specific to Baron Chain
 */
export interface BaronMarketData extends SimpleDbEntityMarketData {
  quantumTokens?: {
    tokenId: string;
    price: string;
    marketCap: string;
    volume24h: string;
  }[];
}

/**
 * Complete backup object structure
 */
export interface BackupObject {
  // WalletID/ImportedAccountID -> encrypted credential
  credentials: Record<string, string>;
  
  // Quantum-safe credentials
  quantumCredentials?: {
    kyberKeys: Record<string, string>;
    dilithiumKeys: Record<string, string>;
  };

  // UUID -> DBAccount
  importedAccounts: Record<string, DBAccount & VersionInfo>;
  
  // UUID -> DBAccount  
  watchingAccounts: Record<string, DBAccount & VersionInfo>;
  
  // UUID -> ImportableHDWallet
  wallets: Record<string, ImportableHDWallet>;

  simpleDb?: {
    utxoAccounts?: SimpleDbEntityUtxoData;
    market?: BaronMarketData;
  };

  // Metadata about the backup
  metadata?: {
    createdAt: number;
    backupVersion: number;
    quantumSafe: boolean;
    chainVersion: string;
  };
}

/**
 * Type guard to check if wallet is quantum safe
 */
export const isQuantumSafeWallet = (
  wallet: ImportableHDWallet
): boolean => {
  return wallet.quantumSafe === true;
};

/**
 * Type guard to check if backup has quantum credentials
 */
export const hasQuantumCredentials = (
  backup: BackupObject
): boolean => {
  return backup.quantumCredentials !== undefined;
};
