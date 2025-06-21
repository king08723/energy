# 智慧能源管理小程序 - 接口工具使用说明

## 概述

`utils/api-mock.js` 是为智慧能源管理小程序提供的模拟数据接口工具，包含了所有页面所需的数据接口和模拟数据。该工具可以在开发阶段替代真实的后端接口，提供完整的前端开发支持。

## 快速开始

### 1. 引入API工具

```javascript
// 在小程序中引入
const API = require('../../utils/api.js');

// 或者在浏览器环境中
// <script src="./utils/api-mock.js"></script>
// const energyAPI = window.energyAPI;
```

### 2. 环境配置

```javascript
// app.js
const API = require('./utils/api.js');

App({
  onLaunch() {
    // 根据开发环境配置API
    if (wx.getAccountInfoSync().miniProgram.envVersion === 'develop') {
      // 开发环境使用模拟数据
      API.config.setEnvironment('development');
    } else {
      // 生产环境使用真实API
      API.config.setEnvironment('production');
    }
  }
});
```

### 3. 基本使用

```javascript
// 获取首页数据
const homeData = API.getHomeOverview();
console.log(homeData);

// 获取设备列表
const deviceList = API.getDeviceList();
console.log(deviceList);
```

## 接口分类

### 用户管理相关

#### 1. 用户登录
```javascript
const result = API.login('13800138001', '123456');
// 返回: { success: true, data: { token, userInfo }, message }
```

#### 2. 获取用户信息
```javascript
const userInfo = API.getUserInfo('001');
// 返回: { success: true, data: { id, phone, nickname, role, ... } }
```

#### 3. 获取用户列表（管理员功能）
```javascript
const userList = API.getUserList();
// 返回: { success: true, data: [用户列表] }
```

### 首页数据

#### 1. 获取首页概览数据
```javascript
const overview = API.getHomeOverview();
// 返回包含:
// - realTimeEnergy: 实时能耗数据
// - loadCurve: 用电负荷曲线
// - alertSummary: 告警概览
// - weather: 天气信息
// - quickControls: 快捷控制状态
```

#### 2. 获取实时监控详情
```javascript
const monitorDetail = API.getMonitorDetail('device_001');
// 返回包含:
// - deviceInfo: 设备信息
// - energyCurve: 分时能耗曲线
// - realTimeParams: 实时参数
// - environmentParams: 环境参数
// - alerts: 告警列表
```

### 设备管理

#### 1. 获取设备列表
```javascript
// 获取所有设备
const allDevices = API.getDeviceList();

// 按类型筛选
const airConditioners = API.getDeviceList({ type: 'air_conditioner' });

// 按状态筛选
const onlineDevices = API.getDeviceList({ status: 'online' });

// 关键词搜索
const searchResult = API.getDeviceList({ keyword: '空调' });
```

#### 2. 获取设备详情
```javascript
const deviceDetail = API.getDeviceDetail('device_001');
// 返回包含:
// - 基本设备信息
// - specifications: 设备规格
// - historyData: 历史运行数据
// - currentParams: 当前参数
```

#### 3. 控制设备
```javascript
// 开关控制
const switchResult = API.controlDevice('device_001', {
  action: 'switch',
  value: true
});

// 模式设置
const modeResult = API.controlDevice('device_001', {
  action: 'setMode',
  value: 'cooling'
});

// 参数设置
const paramResult = API.controlDevice('device_001', {
  action: 'setParams',
  params: { temperature: 26, brightness: 80 }
});
```

#### 4. 添加设备
```javascript
const newDevice = API.addDevice({
  name: '新空调设备',
  type: 'air_conditioner',
  location: '办公室',
  brand: '格力',
  model: 'GMV-120WL/A'
});
```

#### 5. 设备分组管理
```javascript
// 获取设备分组列表
const deviceGroups = API.getDeviceGroups();

// 创建设备分组
const newGroup = API.createDeviceGroup({
  name: '办公区空调',
  description: '办公区域的所有空调设备',
  deviceIds: ['device_001', 'device_002']
});

// 更新设备分组
const updateResult = API.updateDeviceGroup('group_001', {
  name: '会议室空调',
  description: '会议室的所有空调设备'
});

// 删除设备分组
const deleteResult = API.deleteDeviceGroup('group_001');

// 添加设备到分组
const addResult = API.addDeviceToGroup('group_001', 'device_003');

// 从分组移除设备
const removeResult = API.removeDeviceFromGroup('group_001', 'device_003');

// 批量控制分组内设备
const batchResult = API.batchControlDeviceGroup('group_001', {
  action: 'switch',
  value: false
});
```

### 历史数据与报告

#### 1. 获取历史能耗数据
```javascript
const historyData = API.getHistoryEnergyData({
  timeRange: 'month', // week, month, year
  energyType: 'electricity', // electricity, water, gas
  deviceId: 'device_001' // 可选，特定设备
});
// 返回包含:
// - chartData: 图表数据
// - statistics: 统计数据
// - breakdown: 分项能耗
// - carbonEmission: 碳排放量
```

#### 2. 生成能耗报告
```javascript
const report = API.generateEnergyReport({
  reportType: 'monthly', // daily, weekly, monthly, yearly
  timeRange: '2024-01'
});
// 返回包含:
// - reportId: 报告ID
// - summary: 汇总数据
// - trends: 趋势分析
// - recommendations: 建议
// - downloadUrl: 下载链接
```

#### 3. 能耗数据API接口
```javascript
// 获取设备能耗数据
const deviceEnergyData = API.getDeviceEnergyData({
  deviceId: 'device_001',
  timeRange: 'day', // hour, day, week, month
  energyType: 'electricity' // electricity, water, gas, solar, storage
});

// 获取多设备能耗汇总
const energySummary = API.getDevicesEnergySummary({
  deviceIds: ['device_001', 'device_002'],
  timeRange: 'day',
  energyType: 'electricity'
});

// 获取碳排放数据
const carbonData = API.getCarbonEmissionData({
  timeRange: 'month',
  deviceType: 'all' // all, air_conditioner, lighting, etc.
});
```

### 告警管理

#### 1. 获取告警列表
```javascript
// 获取所有告警
const allAlerts = API.getAlertList();

// 按状态筛选
const unreadAlerts = API.getAlertList({ status: 'unread' });

// 按级别筛选
const criticalAlerts = API.getAlertList({ level: 'critical' });

// 按类型筛选
const deviceAlerts = API.getAlertList({ type: 'device_offline' });
```

#### 2. 处理告警
```javascript
// 标记为已读
const readResult = API.handleAlert('alert_001', 'read');

// 忽略告警
const ignoreResult = API.handleAlert('alert_001', 'ignore');

// 解决告警
const resolveResult = API.handleAlert('alert_001', 'resolve');
```

### 自动化规则

#### 1. 获取自动化规则列表
```javascript
const rules = API.getAutomationRules();
```

#### 2. 创建自动化规则
```javascript
const newRule = API.createAutomationRule({
  name: '夜间自动关灯',
  description: '每天晚上10点自动关闭办公区照明',
  trigger: {
    type: 'time',
    conditions: [{ time: '22:00', days: [1, 2, 3, 4, 5] }]
  },
  actions: [{
    deviceId: 'device_002',
    action: 'switch',
    params: { on: false }
  }]
});
```

#### 3. 更新自动化规则
```javascript
const updateResult = API.updateAutomationRule('rule_001', {
  enabled: false,
  name: '更新后的规则名称'
});
```

### 场景模式

#### 1. 获取场景模式列表
```javascript
const scenes = API.getSceneModes();
```

#### 2. 切换场景模式
```javascript
const switchResult = API.switchSceneMode('scene_002');
```

### 节能方案

#### 1. 获取节能方案
```javascript
const savingPlans = API.getSavingPlans();
// 返回包含:
// - plans: 节能方案列表
// - achievements: 节能成果
// - tips: 节能小贴士
```

## 数据结构说明

### 设备对象结构
```javascript
{
  id: 'device_001',
  name: '设备名称',
  type: 'air_conditioner', // 设备类型
  location: '设备位置',
  status: 'online', // online, offline, fault
  isOn: true, // 开关状态
  hasAlert: false, // 是否有告警
  power: 15.5, // 功率(kW)
  brand: '品牌',
  model: '型号'
  // 其他设备特定参数...
}
```

### 告警对象结构
```javascript
{
  id: 'alert_001',
  title: '告警标题',
  content: '告警内容',
  level: 'critical', // critical, warning, info
  type: 'device_offline', // 告警类型
  deviceId: 'device_001',
  deviceName: '设备名称',
  location: '设备位置',
  status: 'unread', // unread, read, ignored, resolved
  createTime: '2024-01-15T10:30:00Z',
  handleTime: null
}
```

### 自动化规则结构
```javascript
{
  id: 'rule_001',
  name: '规则名称',
  description: '规则描述',
  enabled: true,
  trigger: {
    type: 'time', // time, condition, holiday
    conditions: []
  },
  actions: [{
    deviceId: 'device_001',
    action: 'switch',
    params: {}
  }],
  createTime: '2024-01-10T10:00:00Z',
  executeCount: 15
}
```

### 实时数据订阅

#### 1. 订阅实时数据
```javascript
// 订阅设备实时数据
API.subscribeRealTimeData({
  deviceId: 'device_001',
  dataType: 'energy', // energy, status, alert
  callback: function(data) {
    console.log('收到实时数据更新:', data);
    // 更新页面数据
    this.setData({
      deviceData: data
    });
  }
});

// 订阅能耗实时数据
API.subscribeRealTimeData({
  dataType: 'energy_summary',
  callback: function(data) {
    console.log('收到能耗汇总更新:', data);
    // 更新图表数据
    this.updateChart(data);
  }
});
```

#### 2. 取消订阅
```javascript
// 在页面卸载时取消订阅
onUnload() {
  API.unsubscribeRealTimeData({
    deviceId: 'device_001',
    dataType: 'energy'
  });
  
  // 或取消所有订阅
  API.unsubscribeRealTimeData();
}
```

## 页面对应接口映射

### P01 - 首页/能耗总览
- `API.getHomeOverview()` - 获取首页概览数据
- `API.subscribeRealTimeData()` - 订阅实时能耗数据

### P02 - 实时监控详情
- `API.getMonitorDetail(deviceId)` - 获取监控详情
- `API.subscribeRealTimeData()` - 订阅设备实时数据

### P03 - 设备列表
- `API.getDeviceList(params)` - 获取设备列表
- `API.getDeviceGroups()` - 获取设备分组

### P04 - 设备详情与控制
- `API.getDeviceDetail(deviceId)` - 获取设备详情
- `API.controlDevice(deviceId, command)` - 控制设备
- `API.getDeviceEnergyData()` - 获取设备能耗数据

### P05 - 历史数据与报告
- `API.getHistoryEnergyData(params)` - 获取历史数据
- `API.generateEnergyReport(params)` - 生成报告
- `API.getCarbonEmissionData()` - 获取碳排放数据

### P06 - 节能方案与建议
- `API.getSavingPlans()` - 获取节能方案

### P07 - 我的/个人中心
- `API.getUserInfo(userId)` - 获取用户信息

### P08 - 登录/注册
- `API.login(phone, code)` - 用户登录

### P09 - 告警消息列表
- `API.getAlertList(params)` - 获取告警列表
- `API.handleAlert(alertId, action)` - 处理告警
- `API.subscribeRealTimeData({ dataType: 'alert' })` - 订阅实时告警

### P10 - 自动化规则设置
- `API.getAutomationRules()` - 获取规则列表
- `API.createAutomationRule(ruleData)` - 创建规则
- `API.updateAutomationRule(ruleId, updateData)` - 更新规则

### P11 - 添加设备
- `API.addDevice(deviceInfo)` - 添加设备

### P12 - 用户与权限管理
- `API.getUserList()` - 获取用户列表

### P13 - 场景模式管理
- `API.getSceneModes()` - 获取场景列表
- `API.switchSceneMode(sceneId)` - 切换场景

### P14 - 设备分组管理
- `API.getDeviceGroups()` - 获取设备分组
- `API.createDeviceGroup(groupData)` - 创建设备分组
- `API.updateDeviceGroup(groupId, updateData)` - 更新设备分组
- `API.deleteDeviceGroup(groupId)` - 删除设备分组
- `API.batchControlDeviceGroup(groupId, command)` - 批量控制分组设备

## 注意事项

### 1. 环境配置管理

```javascript
// 配置API环境
API.config.setEnvironment('development'); // 开发环境，使用模拟数据
API.config.setEnvironment('production');  // 生产环境，使用真实API

// 开启/关闭模拟模式
API.config.setMockMode(true);  // 开启模拟数据模式

// 开启/关闭日志模式
API.config.setLogMode(true);   // 开启日志记录

// 自定义配置
API.config.setCustomConfig({
  baseUrl: 'https://api.example.com/v1',
  timeout: 5000,
  retryCount: 3
});
```

### 2. 错误处理与用户体验

```javascript
// 统一错误处理函数
function handleApiError(error, type = 'toast') {
  console.error('[API Error]', error);
  
  // 根据错误类型和场景显示不同的提示
  if (type === 'toast') {
    wx.showToast({
      title: error.message || '操作失败，请重试',
      icon: 'none'
    });
  } else if (type === 'modal') {
    wx.showModal({
      title: '提示',
      content: error.message || '操作失败，请重试',
      showCancel: false
    });
  }
  
  // 特定错误处理
  if (error.code === 'TOKEN_EXPIRED') {
    // 跳转到登录页
    wx.navigateTo({ url: '/pages/login/login' });
  }
}

// 加载状态管理
function setLoading(type, status) {
  if (type === 'page') {
    this.setData({ pageLoading: status });
  } else if (type === 'refresh') {
    this.setData({ refreshing: status });
  } else if (type === 'submit') {
    this.setData({ submitting: status });
  }
}
```

### 3. 数据缓存与优化策略

```javascript
// 使用缓存管理工具
const CacheManager = {
  // 设置缓存
  set: function(key, data, expireTime = 300000) { // 默认5分钟过期
    wx.setStorageSync(key, {
      data: data,
      expireTime: Date.now() + expireTime
    });
  },
  
  // 获取缓存
  get: function(key) {
    const cache = wx.getStorageSync(key);
    if (!cache) return null;
    
    // 检查是否过期
    if (Date.now() > cache.expireTime) {
      this.clear(key);
      return null;
    }
    
    return cache.data;
  },
  
  // 清除缓存
  clear: function(key) {
    wx.removeStorageSync(key);
  }
};

// 使用缓存获取数据示例
function getDeviceListWithCache() {
  const cacheKey = 'device_list';
  const cachedData = CacheManager.get(cacheKey);
  
  if (cachedData) {
    // 使用缓存数据
    return cachedData;
  }
  
  // 缓存不存在或已过期，重新获取
  const result = API.getDeviceList();
  if (result.success) {
    // 设置缓存，有效期10分钟
    CacheManager.set(cacheKey, result.data, 10 * 60 * 1000);
    return result.data;
  }
  
  return [];
}
```

### 4. 统一数据获取接口

```javascript
// 使用统一数据获取接口
API.getData({
  type: 'device_list', // 数据类型
  params: { status: 'online' }, // 参数
  useCache: true, // 是否使用缓存
  cacheTime: 5 * 60 * 1000, // 缓存时间
  onSuccess: (data) => {
    // 成功回调
    this.setData({ devices: data });
  },
  onError: (error) => {
    // 错误回调
    handleApiError(error);
  }
});
```

### 5. API优化方案

#### 数据关联强化
- 设备数据与能耗数据关联
- 告警数据与设备状态关联
- 统计数据与详细数据一致性

#### 数据模型与生成逻辑优化
- 统一数据模型
- 确定性数据生成
- 数据缓存与增量更新

#### API接口优化
- 统一数据获取接口
- 实时数据更新机制

## 示例：完整的页面数据获取

```javascript
// 首页数据获取示例
Page({
  data: {
    overview: {},
    loading: true
  },
  
  onLoad() {
    this.loadHomeData();
    
    // 订阅实时数据更新
    API.subscribeRealTimeData({
      dataType: 'energy_summary',
      callback: this.handleRealTimeUpdate
    });
  },
  
  onUnload() {
    // 取消订阅
    API.unsubscribeRealTimeData();
  },
  
  loadHomeData() {
    const result = API.getHomeOverview();
    if (result.success) {
      this.setData({
        overview: result.data,
        loading: false
      });
    }
  },
  
  // 实时数据更新处理
  handleRealTimeUpdate(data) {
    // 更新页面数据
    const newOverview = { ...this.data.overview };
    newOverview.realTimeEnergy = data;
    this.setData({ overview: newOverview });
  },
  
  // 切换场景模式
  onSceneSwitch(e) {
    const sceneId = e.currentTarget.dataset.sceneId;
    const result = API.switchSceneMode(sceneId);
    if (result.success) {
      wx.showToast({ title: '场景切换成功' });
      this.loadHomeData(); // 重新加载数据
    }
  }
});
```

这个接口工具提供了智慧能源管理小程序所需的全部模拟数据，可以支持完整的前端开发和测试工作。通过环境配置管理、错误处理、数据缓存和实时数据订阅等功能，可以更高效地开发和维护小程序。