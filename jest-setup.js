require('react-native-reanimated').setUpTests();

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();
global.fetch = require('node-fetch');
global.WebSocket = require('isomorphic-ws');

jest.mock('react-native-zip-archive', () => ({
  zip: jest.fn(),
}));

jest.mock('react-native-file-logger', () => ({
  FileLogger: {
    configure: jest.fn(),
    write: jest.fn(),
  },
  LogLevel: {
    Debug: 0,
    Info: 1,
    Warning: 2,
    Error: 3,
  },
}));

jest.mock('react-native-device-info', () => ({
  getBuildNumber: jest.fn(),
  getDeviceId: jest.fn(),
  getIncrementalSync: jest.fn(),
  getModel: jest.fn(),
  getSystemName: jest.fn(),
  getSystemVersion: jest.fn(),
  getTotalMemorySync: jest.fn(),
  getUsedMemorySync: jest.fn(),
}));
