import '@baron/shared/src/polyfills';
import { DeviceEventEmitter, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { KitProvider } from '@baron/kit';
import { startTrace } from '@baron/shared/src/perf/perfTrace';
import debugLogger from '@baron/shared/src/logger/debugLogger';

startTrace('js_render');

SplashScreen.preventAutoHideAsync().catch((error) => 
  console.warn('Error preventing splash screen auto-hide:', error)
);

if (process.env.NODE_ENV === 'production') {
  LogBox.ignoreAllLogs();
}

DeviceEventEmitter.addListener('native_log_info', (event: string) => {
  debugLogger.native.info(event);
});

export default KitProvider;
