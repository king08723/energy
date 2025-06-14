# 智慧能源管理API工具优化说明

## 优化概述

本次优化主要针对智慧能源系统实时数据对接需求，对API工具进行了全面升级，支持真实API和模拟数据的无缝切换，并增强了生产环境的稳定性和可维护性。

## 主要优化功能

### 1. 环境配置管理

#### 多环境支持
- **开发环境 (development)**: 启用模拟数据和详细日志
- **测试环境 (testing)**: 使用真实API，保留日志功能
- **生产环境 (production)**: 优化性能，关闭调试功能

```javascript
// 环境配置示例
const API = require('./utils/api.js');

// 设置环境
API.config.setEnvironment('production');

// 获取当前配置
const config = API.config.getCurrentConfig();
console.log('当前环境配置:', config);
```

#### 动态配置切换
```javascript
// 启用/禁用模拟模式
API.config.setMockMode(false); // 切换到真实API

// 启用/禁用日志
API.config.setLogMode(true); // 开启调试日志

// 自定义配置
API.config.setCustomConfig({
  timeout: 15000,
  baseUrl: 'https://custom-api.example.com'
});
```

### 2. 请求拦截器系统

#### 自动认证处理
- 自动添加Authorization头部
- Token过期自动跳转登录
- 设备信息和版本号自动附加

#### 请求预处理
```javascript
// 请求拦截器自动处理以下内容：
// 1. 添加认证token
// 2. 添加设备信息
// 3. 添加时间戳
// 4. 统一请求格式
```

### 3. 响应拦截器系统

#### 统一数据格式
```javascript
// 所有API响应统一格式：
{
  success: boolean,    // 请求是否成功
  data: any,          // 响应数据
  message: string,    // 响应消息
  code: number        // 状态码
}
```

#### 错误处理
- 401认证失效自动处理
- 网络错误统一处理
- 错误信息标准化

### 4. 重试机制

```javascript
// 自动重试配置
const API_CONFIG = {
  retryTimes: 3,      // 最大重试次数
  timeout: 10000      // 请求超时时间
};

// 重试策略：
// 1. 指数退避算法
// 2. 网络错误自动重试
// 3. 超时自动重试
```

### 5. 实时数据支持

#### WebSocket连接
```javascript
// 订阅实时数据
const socketTask = API.subscribeRealTimeData(['device1', 'device2'], (data) => {
  console.log('实时数据:', data);
  // 处理实时数据更新
});

// 取消订阅
API.unsubscribeRealTimeData(socketTask);
```

#### 实时能耗监控
```javascript
// 获取实时能耗数据
const realTimeData = await API.getRealTimeEnergyData(['device1', 'device2']);
```

### 6. 工具方法增强

#### 网络状态检查
```javascript
const networkStatus = await API.utils.checkNetworkStatus();
if (!networkStatus.isConnected) {
  wx.showToast({ title: '网络连接异常', icon: 'none' });
}
```

#### 批量请求
```javascript
const requests = [
  API.getHomeOverview(),
  API.getDeviceList(),
  API.getAlertList()
];

const results = await API.utils.batchRequest(requests);
```

#### 缓存管理
```javascript
// 清除所有缓存
API.utils.clearCache();
```

### 7. 新增API接口

#### 系统配置接口
```javascript
// 获取系统配置
const config = await API.getSystemConfig();

// 更新系统配置
await API.updateSystemConfig(newConfig);

// 获取API版本
const version = await API.getApiVersion();

// 健康检查
const health = await API.healthCheck();
```

## 使用指南

### 1. 基础配置

在 `app.js` 中进行全局配置：

```javascript
const API = require('./utils/api.js');

App({
  onLaunch() {
    // 根据编译环境设置API环境
    if (process.env.NODE_ENV === 'production') {
      API.config.setEnvironment('production');
    } else {
      API.config.setEnvironment('development');
      API.config.setLogMode(true);
    }
  }
});
```

### 2. 页面中使用

```javascript
const API = require('../../utils/api.js');

Page({
  data: {
    socketTask: null,
    realTimeData: {}
  },
  
  async onLoad() {
    try {
      // 检查网络状态
      const networkStatus = await API.utils.checkNetworkStatus();
      if (!networkStatus.isConnected) {
        wx.showToast({ title: '网络连接异常', icon: 'none' });
        return;
      }
      
      // 加载页面数据
      await this.loadPageData();
      
      // 订阅实时数据
      this.subscribeRealTimeData();
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },
  
  async loadPageData() {
    const requests = [
      API.getHomeOverview(),
      API.getDeviceList(),
      API.getAlertList()
    ];
    
    const results = await API.utils.batchRequest(requests);
    
    results.forEach((result, index) => {
      if (result.success) {
        switch (index) {
          case 0:
            this.setData({ overview: result.data.data });
            break;
          case 1:
            this.setData({ devices: result.data.data });
            break;
          case 2:
            this.setData({ alerts: result.data.data });
            break;
        }
      }
    });
  },
  
  subscribeRealTimeData() {
    const deviceIds = this.data.devices.map(device => device.id);
    const socketTask = API.subscribeRealTimeData(deviceIds, (data) => {
      this.handleRealTimeData(data);
    });
    
    this.setData({ socketTask });
  },
  
  handleRealTimeData(data) {
    switch (data.type) {
      case 'energy_data':
        this.setData({
          'realTimeData.energy': data.data
        });
        break;
      case 'device_status':
        this.updateDeviceStatus(data.data);
        break;
      case 'alert':
        this.handleNewAlert(data.data);
        break;
    }
  },
  
  onUnload() {
    // 页面卸载时清理资源
    if (this.data.socketTask) {
      API.unsubscribeRealTimeData(this.data.socketTask);
    }
  }
});
```

### 3. 错误处理最佳实践

```javascript
try {
  const result = await API.getDeviceList();
  if (result.success) {
    // 处理成功响应
    this.setData({ devices: result.data });
  } else {
    // 处理业务错误
    wx.showToast({ title: result.message, icon: 'none' });
  }
} catch (error) {
  // 处理网络错误或其他异常
  console.error('API调用失败:', error);
  wx.showToast({ title: '网络请求失败', icon: 'none' });
}
```

## 性能优化

### 1. 请求优化
- 自动重试机制减少失败率
- 请求超时控制
- 批量请求减少网络开销

### 2. 缓存策略
- Token自动缓存和刷新
- 用户信息本地缓存
- 配置信息缓存

### 3. 内存管理
- WebSocket连接自动清理
- 页面卸载时资源释放
- 缓存过期自动清理

## 安全特性

### 1. 认证安全
- Token自动管理
- 认证失效自动处理
- 安全头部自动添加

### 2. 数据安全
- 请求数据加密传输
- 敏感信息不记录日志
- 本地存储加密

### 3. 接口安全
- 请求签名验证
- 时间戳防重放攻击
- 设备指纹识别

## 监控和调试

### 1. 日志系统
```javascript
// 开发环境自动启用详细日志
API.config.setLogMode(true);

// 日志内容包括：
// - 请求详情
// - 响应数据
// - 错误信息
// - 性能指标
```

### 2. 性能监控
- 请求响应时间统计
- 成功率监控
- 错误率统计
- 网络状态监控

### 3. 调试工具
- 模拟数据切换
- 网络状态模拟
- 错误注入测试

## 迁移指南

### 从旧版本迁移

1. **更新引入方式**：
```javascript
// 旧版本
const API = require('../../utils/api.js');

// 新版本（兼容旧版本）
const API = require('../../utils/api.js');
```

2. **配置环境**：
```javascript
// 在app.js中添加环境配置
API.config.setEnvironment('production');
```

3. **更新错误处理**：
```javascript
// 统一使用新的响应格式
if (result.success) {
  // 处理成功
} else {
  // 处理失败
}
```

4. **添加实时数据支持**：
```javascript
// 在需要实时数据的页面添加订阅
this.subscribeRealTimeData();
```

## 总结

本次API工具优化为智慧能源管理小程序提供了：

1. **生产就绪**：支持多环境配置，可直接用于生产环境
2. **实时数据**：WebSocket支持，满足实时监控需求
3. **高可用性**：重试机制、错误处理、网络检查
4. **易维护性**：统一接口格式、详细日志、调试工具
5. **高性能**：批量请求、缓存策略、资源管理
6. **安全性**：认证管理、数据加密、安全头部

通过这些优化，API工具已经具备了对接真实智慧能源系统的能力，同时保持了开发阶段的便利性和灵活性。