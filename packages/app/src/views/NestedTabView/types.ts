import type { ForwardedRef, ReactNode } from 'react';
import { Dimensions } from 'react-native';
import { makeMutable } from 'react-native-reanimated';
import type { 
  NativeSyntheticEvent, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import type { FontProps } from '@baron-chain/components/typography';

/**
 * Calculates the optimal drawer width based on screen dimensions
 * @returns {number} Drawer width constrained to 85% of screen width or 400px
 */
export const getDrawerWidth = (): number => {
  const { width } = Dimensions.get('window');
  const expectedWidth = width * 0.85;
  const maxWidth = 400;
  return Math.min(maxWidth, expectedWidth);
};

// Mutable values for nested tab and drawer translations
export const nestedTabStartX = makeMutable(0);
export const nestedTabTransX = makeMutable(-getDrawerWidth());

// Page change event types
export type PageChangeEventData = Readonly<{
  tabName: string;
  index: number;
}>;

export type PageChangeEvent = NativeSyntheticEvent<PageChangeEventData>;

// Refresh callback types
export type RefreshCallbackEventData = Readonly<{
  refresh: boolean;
}>;

export type RefreshCallbackEvent = NativeSyntheticEvent<RefreshCallbackEventData>;

// Page scroll state types
export type PageScrollState = 'idle' | 'dragging' | 'settling';

export type PageScrollStateChangeEventData = Readonly<{
  state: PageScrollState;
}>;

export type PageScrollStateChangeEvent = NativeSyntheticEvent<PageScrollStateChangeEventData>;

// Tab view styling interface
export interface TabViewStyle {
  height: number;
  paddingX?: number;
  paddingY?: number;
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  indicatorColor?: string;
  bottomLineColor?: string;
  labelStyle?: FontProps;
  tabSpaceEqual?: boolean;
  activeLabelColor?: string;
  labelColor?: string;
}

// Tab properties interface
export interface TabProps {
  name: string;
  label: string;
}

// Native nested tab view props interface
export interface NativeNestedTabViewProps {
  values: TabProps[];
  headerHeight?: number;
  scrollEnabled?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tabViewStyle?: TabViewStyle;
  refresh?: boolean;
  disableRefresh?: boolean;
  spinnerColor?: string;
  onRefreshCallBack?: (e: RefreshCallbackEvent) => void;
  onPageChange?: (e: PageChangeEvent) => void;
  onPageScrollStateChange?: (e: PageScrollStateChangeEvent) => void;
  onPageVerticalScroll?: () => void;
  slideDisable?: boolean;
}

// Extended nested tab view props
export interface NestedTabViewProps extends NativeNestedTabViewProps {
  headerView?: ReactNode;
  gestureRef?: ForwardedRef<unknown>;
  canOpenDrawer?: boolean;
}
