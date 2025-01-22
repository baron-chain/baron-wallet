import { Logger } from '@baron-chain/shared/logger';
import { RestClient } from '@baron-chain/shared/http';
import { BaronEndpoints } from './endpoints';

/**
 * Types for token balance queries and responses
 */
export interface TokenBalanceQuery {
  networkId: string;
  address: string;
  contractAddresses?: string[];
  xpub?: string;
  includeBRC20?: boolean;
}

export interface TokenBalance {
  address: string;
  balance: string;
  tokenName?: string;
  senderAddress?: string;
  blockHeight?: string;
  availableBalance?: string;
  transferBalance?: string;
}

/**
 * Main client for interacting with Baron Chain wallet API
 */
export class BaronWalletClient {
  private readonly logger: Logger;
  private readonly client: RestClient;

  constructor() {
    this.logger = new Logger('BaronWalletClient');
    this.client = new RestClient(BaronEndpoints.getBaseUrl(), {
      timeout: 60000 // 60 second timeout
    });
  }

  /**
   * Fetches token balances for an address
   */  
  public async getTokenBalances({
    networkId,
    address,
    contractAddresses,
    xpub,
    includeBRC20 = true
  }: TokenBalanceQuery): Promise<TokenBalance[]> {
    
    this.logger.debug('Fetching token balances', {
      networkId,
      address,
      contractAddresses
    });

    const query: Record<string, any> = {
      network: networkId,
      address: address,
      includeBRC20
    };

    if (xpub) {
      query.xpub = xpub;
    }

    if (contractAddresses?.length) {
      query.contractAddresses = contractAddresses;
    }

    try {
      const response = await this.client.get<TokenBalance[]>(
        '/v1/token/balances',
        { params: query }
      );

      return response.data;

    } catch (error) {
      this.logger.error('Failed to fetch token balances', error);
      throw error;
    }
  }

  /**
   * Gets quantum-safe token information
   */
  public async getQuantumSafeTokenInfo(tokenAddress: string): Promise<TokenBalance> {
    try {
      const response = await this.client.get<TokenBalance>(
        `/v1/token/${tokenAddress}/info`
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch quantum-safe token info', error);
      throw error;
    }
  }
}

// Export default client instance
export const baronWalletClient = new BaronWalletClient();
