import { useIsVerticalLayout } from '@onekeyhq/components';
import type { EVMDecodedItem } from '@onekeyhq/engine/src/vaults/impl/evm/decoder/decoder';
import type { IDecodedTx, IHistoryTx } from '@onekeyhq/engine/src/vaults/types';

import { TxHistoryDetailModal } from '../../../views/TxHistory/TxHistoryDetailModal';
import { TxUtxosDetailModal } from '../../../views/TxUtxos/TxUtxosDetailModal';
import { TransactionDetailModalRoutes } from '../../routesEnum';

import createStackNavigator from './createStackNavigator';

export type TransactionDetailRoutesParams = {
  [TransactionDetailModalRoutes.HistoryDetailModal]: {
    decodedItem?: EVMDecodedItem;
    decodedTx?: IDecodedTx;
    historyTx?: IHistoryTx;
  };
  [TransactionDetailModalRoutes.UtxoDetailModal]: {
    decodedTx: IDecodedTx;
  };
};

const TransactionDetailNavigator =
  createStackNavigator<TransactionDetailRoutesParams>();

const modalRoutes = [
  {
    name: TransactionDetailModalRoutes.HistoryDetailModal,
    // component: HistoryDetail,
    component: TxHistoryDetailModal,
  },
  {
    name: TransactionDetailModalRoutes.UtxoDetailModal,
    component: TxUtxosDetailModal,
  },
];

const TransactionDetailModalStack = () => {
  const isVerticalLayout = useIsVerticalLayout();
  return (
    <TransactionDetailNavigator.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: !!isVerticalLayout,
      }}
    >
      {modalRoutes.map((route) => (
        <TransactionDetailNavigator.Screen
          key={route.name}
          name={route.name}
          component={route.component}
        />
      ))}
    </TransactionDetailNavigator.Navigator>
  );
};

export default TransactionDetailModalStack;
