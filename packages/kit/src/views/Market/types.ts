import type { ICON_NAMES } from '@onekeyhq/components';
import type { Token as TokenType } from '@onekeyhq/engine/src/types/token';

import type {
  MarketCategory,
  SimplyMarketCategory,
} from '../../store/reducers/market';
import type { EMarketCellData } from './config';
import type { MessageDescriptor } from 'react-intl';

export enum MarketRoutes {
  MarketSearchModal = 'MarketSearchModal',
}

export type MarketRoutesParams = {
  [MarketRoutes.MarketSearchModal]: undefined;
};

export type CommonPriceCardProps = {
  onPress?: () => void;
  token: TokenType;
};

export type MarketCategoryHeadProps = {
  categories: SimplyMarketCategory[];
};

export type MarketCategoryToggleItem = MarketCategory & {
  leftIconName?: ICON_NAMES;
  leftIconSize?: number;
  rightIconName?: ICON_NAMES;
  rightIconSize?: number;
};

export type MarketCategoryToggleComponentProp = {
  items: MarketCategoryToggleItem[];
  onSelect: (item: MarketCategoryToggleItem) => void;
};

export type ListHeadTagType = {
  id: EMarketCellData;
  title?: MessageDescriptor['id'];
  minW: string;
  textAlign?: 'center' | 'left' | 'right';
  showVerticalLayout?: boolean;
  hide924Width?: boolean;
  hide824Width?: boolean;
  hide1024Width?: boolean;
  isSearch?: boolean;
  dislocation?: { id: EMarketCellData; title: MessageDescriptor['id'] };
};
