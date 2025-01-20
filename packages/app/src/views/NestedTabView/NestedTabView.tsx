import type { ForwardRefRenderFunction } from 'react';
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { UIManager, findNodeHandle } from 'react-native';

import { Box } from '@baron-chain/components';
import { debugLogger } from '@baron-chain/shared/logger';

import NativeNestedTabView from './NativeNestedTabView';
import type { 
  PagerViewViewManagerType,
  NestedTabViewProps, 
  PageChangeEvent, 
  PageScrollStateChangeEvent 
} from './types';

/**
 * Handle type for imperative methods on the NestedTabView
 */
export interface ForwardRefHandle {
  setPageIndex: (pageIndex: number) => void;
  setRefreshing: (refreshing: boolean) => void;
}

/**
 * Advanced Nested Tab View Component
 * Provides flexible tab navigation with scroll and refresh management
 */
const NestedTabView: ForwardRefRenderFunction<
  ForwardRefHandle,
  NestedTabViewProps
> = (
  {
    headerView,
    children,
    onPageChange,
    onPageScrollStateChange,
    onPageVerticalScroll,
    scrollEnabled = true,
    ...restProps
  },
  ref,
) => {
  // Ref to track scrolling state
  const isScrolling = useRef(false);
  
  // Ref for the native tab view component
  const tabRef = useRef<PagerViewViewManagerType>(null);

  /**
   * Set the current page index imperatively
   * @param pageIndex - Index of the page to navigate to
   */
  const setPageIndex = useCallback((pageIndex: number) => {
    try {
      const nodeHandle = findNodeHandle(tabRef.current);
      if (nodeHandle) {
        UIManager.dispatchViewManagerCommand(
          nodeHandle,
          'setPageIndex',
          [pageIndex]
        );
      }
    } catch (error) {
      debugLogger.common.error('Failed to switch tab', error);
    }
  }, []);

  /**
   * Set the refreshing state imperatively
   * @param refreshing - Boolean indicating refresh state
   */
  const setRefreshing = useCallback((refreshing: boolean) => {
    try {
      const nodeHandle = findNodeHandle(tabRef.current);
      if (nodeHandle) {
        UIManager.dispatchViewManagerCommand(
          nodeHandle,
          'setRefreshing',
          [refreshing]
        );
      }
    } catch (error) {
      debugLogger.common.error('Failed to set refresh state', error);
    }
  }, []);

  // Expose imperative methods to parent components
  useImperativeHandle(ref, () => ({
    setPageIndex,
    setRefreshing,
  }));

  /**
   * Handle page change events
   */
  const onTabChange = useCallback(
    (e: PageChangeEvent) => {
      onPageChange?.(e);
    },
    [onPageChange]
  );

  /**
   * Handle vertical scroll events
   */
  const onVerticalScroll = useCallback(() => {
    isScrolling.current = false;
    onPageVerticalScroll?.();
  }, [onPageVerticalScroll]);

  /**
   * Determine if the component should capture responder
   */
  const onMoveShouldSetResponderCapture = useCallback(
    () => isScrolling.current,
    []
  );

  /**
   * Handle page scroll state changes
   */
  const onPageScrollStateChange = useCallback(
    (e: PageScrollStateChangeEvent) => {
      onPageScrollStateChange?.(e);
      
      switch (e.nativeEvent.state) {
        case 'idle':
          isScrolling.current = false;
          break;
        case 'dragging':
          isScrolling.current = true;
          break;
      }
    },
    [onPageScrollStateChange]
  );

  return (
    <NativeNestedTabView
      onPageChange={onTabChange}
      onPageScrollStateChange={onPageScrollStateChange}
      onPageVerticalScroll={onVerticalScroll}
      scrollEnabled={scrollEnabled}
      onMoveShouldSetResponderCapture={onMoveShouldSetResponderCapture}
      disableTabSlide={false}
      ref={tabRef}
      {...restProps}
    >
      {/* Native header view */}
      <Box>{headerView}</Box>
      {children}
    </NativeNestedTabView>
  );
};

export default memo(forwardRef(NestedTabView));
