# API接口优化实现说明

本文档详细说明了在智慧能源管理小程序中实现的API接口优化功能，包括统一数据获取接口、实时数据更新机制和相关的性能优化措施。

## 1. 优化功能概览

### 1.1 统一数据获取接口
- **API.getData(dataType, params)** - 统一的数据获取接口
- **API.getBatchData(requests)** - 批量数据获取接口
- **API.preloadData(pageType)** - 数据预加载机制

### 1.2 实时数据更新机制
- **API.subscribeRealTimeData(options)** - WebSocket实时数据订阅
- **API.unsubscribeRealTimeData(socketTask)** - 取消实时数据订阅
- 支持设备状态、能耗数据、告警信息的实时更新

### 1.3 数据缓存优化
- **API.cache.clearAll()** - 清除所有缓存
- **API.cache.clear(type)** - 清除特定类型缓存
- **API.cache.getStatus()** - 获取缓存状态

## 2. 页面实现详情

### 2.1 首页 (index.js)

#### 实现的优化功能：
1. **批量数据获取**
   ```javascript
   // 使用批量接口一次性获取首页所需的所有数据
   const batchResult = await api.getBatchData([
     { type: 'home', params: {} },
     { type: 'monitor', params: {} },
     { type: 'alert', params: {} }
   ]);
   ```

2. **实时数据更新**
   ```javascript
   // 初始化WebSocket连接，实时更新设备状态和能耗数据
   this.socketTask = api.subscribeRealTimeData({
     deviceIds: deviceIds,
     onConnect: () => { /* 连接成功处理 */ },
     onMessage: (data) => { this.handleRealTimeMessage(data); },
     onDisconnect: (event) => { /* 断开重连处理 */ },
     onError: (error) => { /* 错误处理 */ }
   });
   ```

3. **数据预加载**
   ```javascript
   // 页面显示时预加载用户可能访问的数据
   api.preloadData('index');
   ```

#### 关键方法：
- `initRealTimeData()` - 初始化实时数据连接
- `handleRealTimeMessage()` - 处理实时消息
- `updateDeviceRealTimeData()` - 更新设备实时数据
- `updateEnergyRealTimeData()` - 更新能耗实时数据
- `handleNewAlert()` - 处理新告警
- `disconnectRealTime()` - 断开实时连接

### 2.2 设备页面 (devices.js)

#### 实现的优化功能：
1. **批量数据获取**
   ```javascript
   // 一次性获取设备和分组数据
   const requests = [
     { type: 'device', params: {} },
     { type: 'groups', params: {} }
   ];
   const batchResult = await API.getBatchData(requests);
   ```

2. **统一数据获取**
   ```javascript
   // 使用统一接口刷新设备数据
   const deviceResult = await API.getData('device', {
     refresh: true,
     includeStats: true
   });
   ```

3. **实时设备监控**
   ```javascript
   // 监控所有设备的实时状态变化
   this.socketTask = API.subscribeRealTimeData({
     deviceIds: deviceIds,
     onMessage: (data) => { this.handleRealTimeMessage(data); }
   });
   ```

#### 关键方法：
- `initRealTimeMonitor()` - 初始化实时监控
- `updateDeviceStatus()` - 更新设备状态
- `handleDeviceAlert()` - 处理设备告警
- `formatDeviceData()` - 格式化设备数据
- `disconnectRealTime()` - 断开实时连接

### 2.3 数据页面 (data.js)

#### 实现的优化功能：
1. **批量数据获取**
   ```javascript
   // 一次性获取概览、图表、对比数据
   const requests = [
     { type: 'energy', params: { dataType: 'overview' } },
     { type: 'energy', params: { dataType: 'chart' } },
     { type: 'energy', params: { dataType: 'compare' } }
   ];
   ```

2. **实时能耗监控**
   ```javascript
   // 订阅能耗和图表数据的实时更新
   this.socketTask = API.subscribeRealTimeData({
     dataTypes: ['energy', 'chart'],
     onMessage: (data) => { this.handleRealTimeMessage(data); }
   });
   ```

3. **备用数据机制**
   ```javascript
   // 当API调用失败时，自动使用模拟数据作为备用
   await this.loadFallbackData(['overview', 'chart', 'compare']);
   ```

#### 关键方法：
- `initRealTimeMonitor()` - 初始化实时监控
- `updateEnergyData()` - 更新能耗数据
- `updateChartData()` - 更新图表数据
- `loadFallbackData()` - 加载备用数据
- `getDefaultOverviewData()` - 获取默认概览数据

## 3. API工具类增强 (utils/api.js)

### 3.1 新增的核心方法

#### 统一数据获取接口
```javascript
API.getData = async function(dataType, params = {}) {
  // 支持多种数据类型：device, energy, alert, user, monitor等
  // 自动处理缓存、重试、错误处理
};
```

#### 批量数据获取接口
```javascript
API.getBatchData = async function(requests) {
  // 并行处理多个数据请求
  // 返回统一格式的批量结果
};
```

#### 实时数据订阅
```javascript
API.subscribeRealTimeData = function(options) {
  // 建立WebSocket连接
  // 支持设备ID、数据类型过滤
  // 提供连接、消息、断开、错误回调
};
```

#### 数据预加载
```javascript
API.preloadData = async function(pageType) {
  // 根据页面类型预加载相关数据
  // 提升用户体验
};
```

### 3.2 缓存管理增强
```javascript
API.cache = {
  clearAll: function() { /* 清除所有缓存 */ },
  clear: function(type) { /* 清除特定类型缓存 */ },
  getStatus: function() { /* 获取缓存状态 */ }
};
```

## 4. 性能优化效果

### 4.1 数据加载优化
- **批量请求**：减少网络请求次数，提升加载速度
- **数据预加载**：预测用户行为，提前加载数据
- **智能缓存**：避免重复请求，提升响应速度

### 4.2 实时性提升
- **WebSocket连接**：实现真正的实时数据更新
- **自动重连**：网络异常时自动恢复连接
- **消息过滤**：只接收相关的数据更新

### 4.3 用户体验改善
- **加载状态管理**：清晰的加载和连接状态提示
- **错误处理**：优雅的错误处理和备用方案
- **性能监控**：实时连接状态显示

## 5. 使用示例

### 5.1 基本数据获取
```javascript
// 获取设备列表
const deviceResult = await API.getData('device', {
  page: 1,
  pageSize: 10,
  status: 'online'
});

// 获取能耗数据
const energyResult = await API.getData('energy', {
  dataType: 'overview',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### 5.2 批量数据获取
```javascript
const batchResult = await API.getBatchData([
  { type: 'device', params: { status: 'online' } },
  { type: 'energy', params: { dataType: 'overview' } },
  { type: 'alert', params: { level: 'high' } }
]);

if (batchResult.success) {
  const deviceData = batchResult.data[0];
  const energyData = batchResult.data[1];
  const alertData = batchResult.data[2];
}
```

### 5.3 实时数据订阅
```javascript
const socketTask = API.subscribeRealTimeData({
  deviceIds: ['device1', 'device2'],
  dataTypes: ['status', 'energy'],
  
  onConnect: () => {
    console.log('实时连接建立成功');
  },
  
  onMessage: (message) => {
    const { type, deviceId, data } = message;
    // 处理实时数据更新
  },
  
  onDisconnect: () => {
    console.log('实时连接断开');
  },
  
  onError: (error) => {
    console.error('实时连接错误:', error);
  }
});

// 取消订阅
API.unsubscribeRealTimeData(socketTask);
```

## 6. 注意事项

### 6.1 兼容性
- 保持与原有API的兼容性
- 新功能采用渐进式增强
- 支持模拟数据作为备用方案

### 6.2 性能考虑
- 合理使用批量请求，避免过度聚合
- 及时断开不需要的实时连接
- 定期清理缓存数据

### 6.3 错误处理
- 实现完善的错误处理机制
- 提供用户友好的错误提示
- 支持自动重试和降级方案

## 7. 总结

通过实现API接口优化，智慧能源管理小程序在以下方面得到了显著提升：

1. **性能优化**：批量请求和数据预加载大幅提升了数据加载速度
2. **实时性**：WebSocket实时数据更新提供了更好的用户体验
3. **可靠性**：完善的错误处理和备用方案确保了系统的稳定性
4. **可维护性**：统一的API接口简化了代码维护
5. **扩展性**：模块化的设计便于后续功能扩展

这些优化为用户提供了更流畅、更实时、更可靠的能源管理体验。