import type { NativeModule } from 'react-native';

// Generic callback type for native module responses
type NativeCallback<T> = (result: T) => void;

/**
 * Interface for permission management in the wallet
 */
export interface PermissionManagerInterface extends NativeModule {
  isOpenLocation: () => boolean;
  openLocationSetting: () => void;
}

/**
 * Interface for hardware wallet (Lite) management
 */
export interface HardwareWalletInterface extends NativeModule {
  // NFC and card-related operations
  checkNFCPermission: (callback: NativeCallback<boolean>) => void;
  getCardName: (callback: NativeCallback<string>) => void;
  
  // Wallet seed management
  setMnemonic: (
    mnemonic: string, 
    password: string, 
    overwrite: boolean, 
    callback: NativeCallback<boolean>
  ) => void;
  getMnemonicWithPin: (password: string, callback: NativeCallback<string>) => void;
  
  // Security operations
  changePin: (
    oldPassword: string, 
    newPassword: string, 
    callback: NativeCallback<boolean>
  ) => void;
  reset: (callback: NativeCallback<boolean>) => void;
  
  // Device interactions
  cancel: () => void;
  openSettings: () => void;
}

/**
 * Interface for splash screen management
 */
export interface SplashScreenManagerInterface extends NativeModule {
  show: () => void;
}

/**
 * Interface for local HTTP server management
 */
export interface HTTPServerManagerInterface extends NativeModule {
  start: (
    port: number, 
    name: string, 
    callback: (data: string, success: boolean) => void
  ) => void;
  stop: () => void;
  respond: (id: string, code: number, type: string, body: string) => void;
}

/**
 * Interface for push notification management
 */
export interface PushNotificationManagerInterface extends NativeModule {
  registerNotification: () => void;
}

/**
 * Interface for app minimization and navigation
 */
export interface AppMinimizationInterface extends NativeModule {
  exit: () => void;
  goBack: () => void;
  minimize: () => void;
}

/**
 * Interface for cache management
 */
export interface CacheManagerInterface extends NativeModule {
  clearWebViewData: () => Promise<boolean>;
}

/**
 * Interface for app restart functionality
 */
export interface AppRestartInterface extends NativeModule {
  restart: () => void;
}

/**
 * Interface for native logging
 */
export interface LoggerNativeInterface extends NativeModule {
  log: (message: string) => void;
}

// Extend React Native's NativeModulesStatic to include Baron Wallet specific modules
declare module 'react-native' {
  interface NativeModulesStatic {
    HTTPServerManager: HTTPServerManagerInterface;
    HardwareWalletManager: HardwareWalletInterface;
    PermissionManager: PermissionManagerInterface;
    SplashScreenManager: SplashScreenManagerInterface;
    PushNotificationManager: PushNotificationManagerInterface;
    AppMinimizer: AppMinimizationInterface;
    CacheManager: CacheManagerInterface;
    NativeAppRestart: AppRestartInterface;
    LoggerNative: LoggerNativeInterface;
  }
}
