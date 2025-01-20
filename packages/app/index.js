import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import { appSettings, AppSettingKey } from '@baron-chain/baron-wallet/shared/storage/appSettings';
import App from './App';

const setupPerformanceMonitoring = () => {
  if (!appSettings.getBoolean(AppSettingKey.PERFORMANCE_MONITORING)) return;

  try {
    const {
      markJsBundleLoadedTime,
      markBatteryLevel,
      startRecordingMetrics,
    } = require('@baron-chain/baron-wallet/shared/modules/performance-metrics');

    markJsBundleLoadedTime();
    markBatteryLevel();
    startRecordingMetrics();
  } catch (error) {
    console.error('Performance monitoring setup failed:', error);
  }
};

const setupReactRenderTracker = () => {
  if (process.env.NODE_ENV === 'production') return;
  
  if (!appSettings.getBoolean(AppSettingKey.RENDER_TRACKER)) return;

  try {
    const manufacturer = Platform.constants.Brand
      ? `${Platform.constants.Brand} (${Platform.constants.Manufacturer})`
      : 'Unknown';
    
    const deviceInfo = [
      manufacturer,
      Platform.OS,
      Platform.Version,
      Platform.constants.Fingerprint || ''
    ].filter(Boolean).join('_');

    global.REMPL_TITLE = deviceInfo;
    
    require('react-render-tracker');
  } catch (error) {
    console.error('React Render Tracker setup failed:', error);
  }
};

const initializeApp = () => {
  setupPerformanceMonitoring();
  setupReactRenderTracker();
  registerRootComponent(App);
};

initializeApp();
