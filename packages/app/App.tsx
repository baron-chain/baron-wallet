import '@baron/shared/src/polyfills';
import { DeviceEventEmitter, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { KitProvider } from '@baron/kit';
import { startTrace } from '@baron/shared/src/perf/perfTrace';
import debugLogger from '@baron/shared/src/logger/debugLogger';

class AppInitializer {
  static async initialize() {
    try {
      // Start performance tracing
      startTrace('js_render');

      // Configure splash screen
      await this.configureSplashScreen();

      // Setup logging
      this.setupLogging();

      // Setup native event listeners
      this.setupNativeEventListeners();
    } catch (error) {
      console.error('Error during Baron Wallet initialization:', error);
      throw error;
    }
  }

  private static async configureSplashScreen() {
    try {
      await SplashScreen.preventAutoHideAsync();
    } catch (error) {
      console.warn('Failed to configure Baron Wallet splash screen:', error);
    }
  }

  private static setupLogging() {
    if (process.env.NODE_ENV === 'production') {
      LogBox.ignoreAllLogs();
    }
  }

  private static setupNativeEventListeners() {
    DeviceEventEmitter.addListener('native_log_info', (event: string) => {
      debugLogger.native.info(event);
    });
  }
}

// Initialize the app
AppInitializer.initialize().catch(error => {
  console.error('Critical error during Baron Wallet initialization:', error);
});

// Export the KitProvider as the default export
export default KitProvider;

// Export the initializer for testing or manual initialization
export { AppInitializer };
