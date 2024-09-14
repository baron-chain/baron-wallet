import '@onekeyhq/shared/src/polyfills';
import { DeviceEventEmitter, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { KitProvider } from '@onekeyhq/kit';
import { startTrace } from '@onekeyhq/shared/src/perf/perfTrace';
import debugLogger from '@onekeyhq/shared/src/logger/debugLogger';

// Start performance tracing
startTrace('js_render');

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch((error) => 
  console.warn('Error preventing splash screen auto-hide:', error)
);

// Ignore all logs in production
if (process.env.NODE_ENV === 'production') {
  LogBox.ignoreAllLogs();
}

// Set up native log info listener
DeviceEventEmitter.addListener('native_log_info', (event: string) => {
  debugLogger.native.info(event);
});

// Export the KitProvider as the default export
export default KitProvider;
