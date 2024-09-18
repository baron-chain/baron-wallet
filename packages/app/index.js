import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import { appSetting, AppSettingKey } from '@baron/shared/src/storage/appSetting';
import App from './App';

function setupPerformanceMonitoring() {
  if (appSetting.getBoolean(AppSettingKey.perf_switch)) {
    const {
      markJsBundleLoadedTime,
      markBatteryLevel,
      startRecordingMetrics,
    } = require('@baron/shared/src/modules3rdParty/react-native-metrix');
    markJsBundleLoadedTime();
    markBatteryLevel();
    startRecordingMetrics();
  }
}

function setupReactRenderTracker() {
  if (process.env.NODE_ENV !== 'production' && appSetting.getBoolean(AppSettingKey.rrt)) {
    const manufacturer = Platform.constants.Brand
      ? `${Platform.constants.Brand} (${Platform.constants.Manufacturer})`
      : '';
    const fingerprint = Platform.constants.Fingerprint
      ? `-${Platform.constants.Fingerprint}`
      : '';
    
    global.REMPL_TITLE = `${manufacturer}${Platform.OS}_${Platform.Version}${fingerprint}`;
    require('react-render-tracker');
  }
}

setupPerformanceMonitoring();
setupReactRenderTracker();

registerRootComponent(App);
