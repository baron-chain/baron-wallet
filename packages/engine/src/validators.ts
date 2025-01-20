import BigNumber from 'bignumber.js';
import * as bip39 from 'bip39';
import { isString } from 'lodash';

import type { Network } from '@baron-chain/kit/src/store/types';
import { backgroundMethod } from '@baron-chain/shared/background/decorators';

import {
  IMPL_COSMOS,
  IMPL_DOT,
  IMPL_XMR,
} from '@baron-chain/shared/engine/constants';
import platformEnv from '@baron-chain/shared/platform';

import * as errors from './errors';
import { BaronValidatorError, BaronValidatorTip } from './errors';
import * as limits from './limits';
import { decodePassword } from './secret/encryptors/aes256';
import { UserInputCategory } from './types/credential';
import { WALLET_TYPE_HD, WALLET_TYPE_HW } from './types/wallet';

import type { DBAPI } from './databases/base';
import type { Engine } from './index';
import type { UserInputCheckResult } from './types/credential';
import type { AccountNameInfo } from './types/network';

// Fee validation constants
const FEE_LIMIT_HIGH_VALUE_MULTIPLIER = 20;
const FEE_PRICE_HIGH_VALUE_MULTIPLIER = 4;

// Chains with similar address formats
const FORK_CHAIN_ADDRESS_FORMATS = [IMPL_COSMOS, IMPL_DOT];
const WEBVIEW_BACKED_CHAINS = platformEnv.isNative ? [IMPL_XMR] : [];

/**
 * Comprehensive validation class for Baron Wallet
 * Handles various input validations across different blockchain networks
 */
class Validators {
  private _dbApi: DBAPI;
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
    this._dbApi = engine.dbApi;
  }

  get dbApi(): DBAPI {
    return this._dbApi;
  }

  set dbApi(dbApi: DBAPI) {
    this._dbApi = dbApi;
  }

  /**
   * Determine the input type across multiple network contexts
   * @param input - User input to validate
   * @param networks - Possible networks for the input
   * @param filterCategories - Specific input categories to check
   * @param returnEarly - Stop after first matching category
   */
  private async matchInputType(
    input: string,
    networks: Network[],
    filterCategories: UserInputCategory[] = [],
    returnEarly = false,
  ): Promise<UserInputCheckResult[]> {
    const results: UserInputCheckResult[] = [];
    const networkIds = networks.map((network) => network.id);
    const vault = await this.engine.getChainOnlyVault(networkIds[0]);

    const checkInputCategory = async (
      category: UserInputCategory,
      validationMethod: (input: string) => Promise<boolean>,
      derivationMethod?: (input: string) => Promise<AccountNameInfo[]>,
    ) => {
      if (filterCategories.includes(category) && await validationMethod(input)) {
        const derivationOptions = derivationMethod 
          ? await derivationMethod(input) 
          : undefined;

        const result: UserInputCheckResult = { 
          category, 
          possibleNetworks: networkIds, 
          derivationOptions 
        };

        if (returnEarly) return [result];
        results.push(result);
      }
      return [];
    };

    await Promise.all([
      checkInputCategory(
        UserInputCategory.IMPORTED, 
        vault.validateImportedCredential,
        vault.getAccountNameInfosByImportedOrWatchingCredential
      ),
      checkInputCategory(
        UserInputCategory.WATCHING, 
        vault.validateWatchingCredential,
        vault.getAccountNameInfosByImportedOrWatchingCredential
      ),
      checkInputCategory(
        UserInputCategory.ADDRESS,
        async (addr) => {
          try {
            await vault.validateAddress(addr);
            return true;
          } catch {
            return false;
          }
        }
      )
    ]);

    return results;
  }

  /**
   * Comprehensive user input validation
   * @param input - Input to validate
   * @param forCategories - Categories to validate against
   * @param selectedNetwork - Optional specific network context
   */
  @backgroundMethod()
  async validateCreateInput({
    input,
    onlyFor,
    selectedNetwork,
  }: {
    input: string;
    onlyFor?: UserInputCategory;
    selectedNetwork?: Network;
  }) {
    const filterCategories = onlyFor 
      ? [onlyFor] 
      : [
          UserInputCategory.MNEMONIC,
          UserInputCategory.IMPORTED,
          UserInputCategory.WATCHING,
          UserInputCategory.ADDRESS,
        ];

    // Check mnemonic first if included in categories
    if (filterCategories.includes(UserInputCategory.MNEMONIC)) {
      try {
        await this.validateMnemonic(input);
        return [{ category: UserInputCategory.MNEMONIC }];
      } catch {
        // Continue to other validation checks
      }
    }

    // If a specific network is selected, validate against it
    if (selectedNetwork) {
      const result = await this.matchInputType(
        input, 
        [selectedNetwork], 
        filterCategories
      );

      return result.length > 0 ? result : [];
    }

    return [];
  }

  /**
   * Validate mnemonic seed phrase
   * @param mnemonic - Seed phrase to validate
   */
  @backgroundMethod()
  async validateMnemonic(mnemonic: string): Promise<string> {
    const cleanedMnemonic = mnemonic.trim().replace(/\s+/g, ' ');
    
    if (!bip39.validateMnemonic(cleanedMnemonic)) {
      throw new errors.InvalidMnemonic();
    }
    
    return cleanedMnemonic;
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   */
  @backgroundMethod()
  async validatePasswordStrength(password: string): Promise<string> {
    const decodedPassword = decodePassword({ password });
    
    if (decodedPassword.length < 8 || decodedPassword.length > 128) {
      throw new errors.PasswordStrengthValidationFailed();
    }
    
    return password;
  }

  // Additional methods from the original implementation would follow...
  // (Other methods like validateAddress, validateTokenAddress, etc.)
}

export { Validators };
