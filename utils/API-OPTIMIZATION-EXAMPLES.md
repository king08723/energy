# API接口优化使用示例

本文档展示了智慧能源管理小程序中API接口优化功能的使用方法和最佳实践。

## 1. 统一数据获取接口

### 1.1 基本使用

```javascript
const API = require('../utils/api.js');

// 获取设备列表
API.getData('device', { type: 'lighting' }).then(result => {
  if (result.success) {
    this.setData({ lightingDevices: result.data });
  }
});

// 获取能耗数据
API.getData('energy', { 
  deviceId: 'device_001',
  timeRange: '24h' 
}).then(result => {
  if (result.success) {
    this.setData({ energyData: result.data });
  }
});

// 获取告警列表
API.getData('alert', { 
  status: 'active',
  limit: 10 
}).then(result => {
  if (result.success) {
    this.setData({ alerts: result.data });
  }
});
```

### 1.2 在页面中的应用

```javascript
// pages/index/index.js
Page({
  data: {
    homeData: {},
    loading: true
  },

  onLoad() {
    this.loadHomeData();
  },

  // 加载首页数据
  async loadHomeData() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await API.getData('home');
      if (result.success) {
        this.setData({
          homeData: result.data,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载首页数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 刷新数据
  onRefresh() {
    this.loadHomeData();
  }
});
```

## 2. 批量数据获取

### 2.1 一次性获取多种数据

```javascript
// 批量获取首页所需的所有数据
const requests = [
  { type: 'device', params: { limit: 10 } },
  { type: 'energy', params: { timeRange: '24h' } },
  { type: 'alert', params: { status: 'active' } }
];

API.getBatchData(requests).then(result => {
  if (result.success) {
    const { device, energy, alert } = result.data;
    
    this.setData({
      devices: device?.data || [],
      energyData: energy?.data || {},
      alerts: alert?.data || []
    });
    
    // 处理部分失败的情况
    if (result.errors.length > 0) {
      console.warn('部分数据获取失败:', result.errors);
    }
  }
});
```

### 2.2 设备详情页面应用

```javascript
// pages/device-detail/device-detail.js
Page({
  data: {
    deviceId: '',
    deviceInfo: {},
    energyData: {},
    alerts: []
  },

  onLoad(options) {
    this.setData({ deviceId: options.deviceId });
    this.loadDeviceData();
  },

  async loadDeviceData() {
    const { deviceId } = this.data;
    
    const requests = [
      { type: 'device', params: { deviceId } },
      { type: 'energy', params: { deviceId, timeRange: '7d' } },
      { type: 'alert', params: { deviceId, limit: 5 } }
    ];

    try {
      const result = await API.getBatchData(requests);
      if (result.success) {
        this.setData({
          deviceInfo: result.data.device?.data || {},
          energyData: result.data.energy?.data || {},
          alerts: result.data.alert?.data || []
        });
      }
    } catch (error) {
      wx.showToast({ title: '数据加载失败', icon: 'error' });
    }
  }
});
```

## 3. 实时数据更新

### 3.1 基本WebSocket订阅

```javascript
// pages/monitor/monitor.js
Page({
  data: {
    deviceIds: ['device_001', 'device_002'],
    realTimeData: {},
    connectionStatus: 'disconnected'
  },

  socketTask: null,

  onLoad() {
    this.initRealTimeData();
  },

  onUnload() {
    this.disconnectRealTime();
  },

  // 初始化实时数据连接
  initRealTimeData() {
    const { deviceIds } = this.data;
    
    this.socketTask = API.subscribeRealTimeData({
      deviceIds: deviceIds,
      
      // 连接成功回调
      onConnect: () => {
        console.log('实时数据连接成功');
        this.setData({ connectionStatus: 'connected' });
        wx.showToast({ title: '实时监控已开启', icon: 'success' });
      },
      
      // 接收消息回调
      onMessage: (data) => {
        console.log('收到实时数据:', data);
        this.handleRealTimeMessage(data);
      },
      
      // 连接断开回调
      onDisconnect: (event) => {
        console.log('实时数据连接断开:', event);
        this.setData({ connectionStatus: 'disconnected' });
        
        // 尝试重连
        setTimeout(() => {
          this.initRealTimeData();
        }, 5000);
      },
      
      // 错误回调
      onError: (error) => {
        console.error('实时数据连接错误:', error);
        wx.showToast({ title: '连接异常', icon: 'error' });
      }
    });
  },

  // 处理实时消息
  handleRealTimeMessage(message) {
    const { type, deviceId, data } = message;
    
    switch (type) {
      case 'device_update':
        // 更新设备状态
        this.updateDeviceData(deviceId, data);
        break;
      case 'energy_update':
        // 更新能耗数据
        this.updateEnergyData(deviceId, data);
        break;
      case 'alert':
        // 处理新告警
        this.handleNewAlert(data);
        break;
    }
  },

  // 更新设备数据
  updateDeviceData(deviceId, data) {
    const realTimeData = { ...this.data.realTimeData };
    realTimeData[deviceId] = {
      ...realTimeData[deviceId],
      ...data,
      lastUpdate: Date.now()
    };
    
    this.setData({ realTimeData });
  },

  // 断开实时连接
  disconnectRealTime() {
    if (this.socketTask) {
      API.unsubscribeRealTimeData(this.socketTask);
      this.socketTask = null;
    }
  }
});
```

### 3.2 设备控制页面的实时更新

```javascript
// pages/devices/devices.js
Page({
  data: {
    devices: [],
    realTimeStatus: {}
  },

  socketTask: null,

  onShow() {
    this.loadDevices();
    this.startRealTimeMonitor();
  },

  onHide() {
    this.stopRealTimeMonitor();
  },

  async loadDevices() {
    const result = await API.getData('device');
    if (result.success) {
      this.setData({ devices: result.data });
      
      // 提取设备ID用于实时监控
      const deviceIds = result.data.map(device => device.id);
      this.startRealTimeMonitor(deviceIds);
    }
  },

  startRealTimeMonitor(deviceIds) {
    if (!deviceIds || deviceIds.length === 0) return;
    
    this.socketTask = API.subscribeRealTimeData({
      deviceIds,
      onMessage: (message) => {
        if (message.type === 'device_update') {
          this.updateDeviceStatus(message.deviceId, message.data);
        }
      }
    });
  },

  updateDeviceStatus(deviceId, statusData) {
    const devices = this.data.devices.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          status: statusData.status,
          power: statusData.power,
          lastUpdate: statusData.timestamp
        };
      }
      return device;
    });
    
    this.setData({ devices });
  },

  stopRealTimeMonitor() {
    if (this.socketTask) {
      API.unsubscribeRealTimeData(this.socketTask);
      this.socketTask = null;
    }
  }
});
```

## 4. 数据预加载

### 4.1 页面切换时的预加载

```javascript
// app.js
App({
  onLaunch() {
    // 应用启动时预加载首页数据
    API.preloadData('index');
  },

  onShow() {
    // 应用显示时预加载常用数据
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage.route;
    
    // 根据当前页面预加载相关数据
    if (route.includes('index')) {
      API.preloadData('index');
    } else if (route.includes('devices')) {
      API.preloadData('devices');
    }
  }
});
```

### 4.2 用户行为驱动的预加载

```javascript
// pages/index/index.js
Page({
  onLoad() {
    // 预加载首页数据
    API.preloadData('index');
  },

  // 用户点击设备卡片时预加载设备详情
  onDeviceCardTap(e) {
    const deviceId = e.currentTarget.dataset.deviceId;
    
    // 预加载设备详情数据
    setTimeout(() => {
      API.getData('device', { deviceId });
      API.getData('energy', { deviceId, timeRange: '24h' });
    }, 100);
    
    // 跳转到设备详情页
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?deviceId=${deviceId}`
    });
  },

  // 用户滑动到数据分析区域时预加载数据页面内容
  onScrollToDataSection() {
    API.preloadData('data');
  }
});
```

## 5. 错误处理和重试机制

### 5.1 统一错误处理

```javascript
// 封装带错误处理的数据获取方法
function safeGetData(dataType, params = {}, options = {}) {
  const { showError = true, retryTimes = 3 } = options;
  
  return API.getData(dataType, params)
    .then(result => {
      if (!result.success && showError) {
        wx.showToast({
          title: result.message || '数据获取失败',
          icon: 'error'
        });
      }
      return result;
    })
    .catch(error => {
      console.error(`获取${dataType}数据失败:`, error);
      
      if (showError) {
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'error'
        });
      }
      
      return {
        success: false,
        message: error.message || '网络异常',
        error
      };
    });
}

// 使用示例
safeGetData('device', { type: 'lighting' }, { showError: true })
  .then(result => {
    if (result.success) {
      this.setData({ devices: result.data });
    }
  });
```

### 5.2 网络状态监控

```javascript
// utils/network-monitor.js
class NetworkMonitor {
  constructor() {
    this.isOnline = true;
    this.listeners = [];
    this.init();
  }

  init() {
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.isOnline = res.isConnected;
      this.notifyListeners(res);
    });

    // 获取初始网络状态
    wx.getNetworkType({
      success: (res) => {
        this.isOnline = res.networkType !== 'none';
      }
    });
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners(networkInfo) {
    this.listeners.forEach(callback => {
      callback(networkInfo);
    });
  }
}

const networkMonitor = new NetworkMonitor();
module.exports = networkMonitor;
```

## 6. 性能优化建议

### 6.1 数据缓存策略

```javascript
// 使用本地缓存减少网络请求
function getCachedData(dataType, params = {}, cacheTime = 5 * 60 * 1000) {
  const cacheKey = `${dataType}_${JSON.stringify(params)}`;
  const cached = wx.getStorageSync(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < cacheTime) {
    return Promise.resolve(cached.data);
  }
  
  return API.getData(dataType, params).then(result => {
    if (result.success) {
      wx.setStorageSync(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    return result;
  });
}
```

### 6.2 请求去重

```javascript
// 防止重复请求
const pendingRequests = new Map();

function deduplicateRequest(dataType, params = {}) {
  const requestKey = `${dataType}_${JSON.stringify(params)}`;
  
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }
  
  const promise = API.getData(dataType, params).finally(() => {
    pendingRequests.delete(requestKey);
  });
  
  pendingRequests.set(requestKey, promise);
  return promise;
}
```

## 7. 最佳实践总结

1. **统一接口使用**：优先使用 `API.getData()` 统一接口，保持代码一致性
2. **批量数据获取**：页面需要多种数据时使用 `API.getBatchData()` 减少请求次数
3. **实时数据订阅**：监控页面使用 WebSocket 实时更新，提升用户体验
4. **数据预加载**：根据用户行为预测，提前加载可能需要的数据
5. **错误处理**：统一错误处理机制，提供友好的用户提示
6. **性能优化**：合理使用缓存和请求去重，避免不必要的网络请求
7. **资源清理**：页面卸载时及时断开 WebSocket 连接，避免内存泄漏

通过以上API优化方案，可以显著提升小程序的性能和用户体验，为后续接入真实API奠定良好基础。