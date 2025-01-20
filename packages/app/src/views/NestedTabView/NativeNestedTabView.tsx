import { requireNativeComponent } from 'react-native';
import type { HostComponent } from 'react-native';
import type { NestedTabViewProps } from './types';

/**
 * Name of the native view manager for the nested tab view
 */
const VIEW_MANAGER_NAME = 'BaronNestedTabView';

/**
 * Type definition for the native nested tab view component
 */
export type PagerViewViewManagerType = HostComponent<NestedTabViewProps>;

/**
 * Native nested tab view component bridge
 * Connects the React Native JavaScript layer with the native implementation
 */
const NativeNestedTabView = requireNativeComponent(
  VIEW_MANAGER_NAME,
) as PagerViewViewManagerType;

export default NativeNestedTabView;
