// @ts-nocheck
import { JsBridgeSimple } from '@baronfe/cross-inpage-provider-core';
import type { IJsBridgeMessagePayload } from '@baronfe/cross-inpage-provider-types';

describe('CrossInpageProvider Tests', () => {
  it('two bridge communication', async () => {
    let currentChainId = '0x3';
    
    const host = new JsBridgeSimple({
      timeout: 0,
      sendAsString: false,
      receiveHandler(event: IJsBridgeMessagePayload) {
        const { method } = event.data;
        if (method === 'eth_chainId') {
          return currentChainId;
        }
      },
    });
    
    const inpage = new JsBridgeSimple({
      timeout: 0,
      sendAsString: false,
      receiveHandler(event: IJsBridgeMessagePayload) {
        const { method, params } = event.data;
        if (method === 'metamask_chainChanged') {
          currentChainId = params.chainId;
        }
      },
    });

    host.setRemote(inpage);
    inpage.setRemote(host);

    host.on('error', (error) => {
      console.log(error);
    });

    const chainId = await inpage.request({
      scope: 'ethereum',
      data: { method: 'eth_chainId' },
    });
    expect(chainId).toEqual(currentChainId);

    host.requestSync({
      scope: 'ethereum',
      data: {
        method: 'metamask_chainChanged',
        params: { chainId: '0x2' },
      },
    });
    expect(currentChainId).toEqual('0x2');
  });
});
