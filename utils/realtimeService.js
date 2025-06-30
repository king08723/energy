// utils/realtimeService.js
const API = require('./api.js');

class RealtimeService {
  constructor(options) {
    this.deviceIds = options.deviceIds || [];
    this.onConnect = options.onConnect || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onError = options.onError || (() => {});
    this.debugMode = options.debugMode || false;

    this.socketTask = null;
    this.isConnected = false;
  }

  connect() {
    if (this.isConnected) {
      if (this.debugMode) {
        console.log('RealtimeService: Already connected.');
      }
      return;
    }

    this.socketTask = API.subscribeRealTimeData({
      deviceIds: this.deviceIds,
      onConnect: () => {
        if (this.debugMode) {
          console.log('RealtimeService: Connected.');
        }
        this.isConnected = true;
        this.onConnect();
      },
      onMessage: (data) => {
        this.onMessage(data);
      },
      onDisconnect: (event) => {
        if (this.debugMode) {
          console.log('RealtimeService: Disconnected.', event);
        }
        this.isConnected = false;
        this.onDisconnect();
        this.reconnect();
      },
      onError: (error) => {
        if (this.debugMode) {
          console.error('RealtimeService: Error.', error);
        }
        this.isConnected = false;
        this.onError(error);
      }
    });
  }

  disconnect() {
    if (this.socketTask) {
      API.unsubscribeRealTimeData(this.socketTask);
      this.socketTask = null;
      this.isConnected = false;
      if (this.debugMode) {
        console.log('RealtimeService: Disconnected by user.');
      }
    }
  }

  reconnect() {
    if (this.debugMode) {
      console.log('RealtimeService: Attempting to reconnect...');
    }
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, 5000);
  }

  updateDeviceIds(deviceIds) {
    this.deviceIds = deviceIds;
    if (this.isConnected) {
      this.disconnect();
      this.connect();
    }
  }
}

module.exports = RealtimeService;