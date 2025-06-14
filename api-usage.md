# 智慧能源管理小程序 - 接口工具使用说明

## 概述

`api-mock.js` 是为智慧能源管理小程序提供的模拟数据接口工具，包含了所有页面所需的数据接口和模拟数据。该工具可以在开发阶段替代真实的后端接口，提供完整的前端开发支持。

## 快速开始

### 1. 引入接口工具

```javascript
// 在小程序中引入
const energyAPI = require('./api-mock.js');

// 或者在浏览器环境中
// <script src="./api-mock.js"></script>
// const energyAPI = window.energyAPI;
```

### 2. 基本使用

```javascript
// 获取首页数据
const homeData = energyAPI.getHomeOverview();
console.log(homeData);

// 获取设备列表
const deviceList = energyAPI.getDeviceList();
console.log(deviceList);
```

## 接口分类

### 用户管理相关

#### 1. 用户登录
```javascript
const result = energyAPI.login('13800138001', '123456');
// 返回: { success: true, data: { token, userInfo }, message }
```

#### 2. 获取用户信息
```javascript
const userInfo = energyAPI.getUserInfo('001');
// 返回: { success: true, data: { id, phone, nickname, role, ... } }
```

#### 3. 获取用户列表（管理员功能）
```javascript
const userList = energyAPI.getUserList();
// 返回: { success: true, data: [用户列表] }
```

### 首页数据

#### 1. 获取首页概览数据
```javascript
const overview = energyAPI.getHomeOverview();
// 返回包含:
// - realTimeEnergy: 实时能耗数据
// - loadCurve: 用电负荷曲线
// - alertSummary: 告警概览
// - weather: 天气信息
// - quickControls: 快捷控制状态
```

#### 2. 获取实时监控详情
```javascript
const monitorDetail = energyAPI.getMonitorDetail('device_001');
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
const allDevices = energyAPI.getDeviceList();

// 按类型筛选
const airConditioners = energyAPI.getDeviceList({ type: 'air_conditioner' });

// 按状态筛选
const onlineDevices = energyAPI.getDeviceList({ status: 'online' });

// 关键词搜索
const searchResult = energyAPI.getDeviceList({ keyword: '空调' });
```

#### 2. 获取设备详情
```javascript
const deviceDetail = energyAPI.getDeviceDetail('device_001');
// 返回包含:
// - 基本设备信息
// - specifications: 设备规格
// - historyData: 历史运行数据
// - currentParams: 当前参数
```

#### 3. 控制设备
```javascript
// 开关控制
const switchResult = energyAPI.controlDevice('device_001', {
  action: 'switch',
  value: true
});

// 模式设置
const modeResult = energyAPI.controlDevice('device_001', {
  action: 'setMode',
  value: 'cooling'
});

// 参数设置
const paramResult = energyAPI.controlDevice('device_001', {
  action: 'setParams',
  params: { temperature: 26, brightness: 80 }
});
```

#### 4. 添加设备
```javascript
const newDevice = energyAPI.addDevice({
  name: '新空调设备',
  type: 'air_conditioner',
  location: '办公室',
  brand: '格力',
  model: 'GMV-120WL/A'
});
```

### 历史数据与报告

#### 1. 获取历史能耗数据
```javascript
const historyData = energyAPI.getHistoryEnergyData({
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
const report = energyAPI.generateEnergyReport({
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

### 告警管理

#### 1. 获取告警列表
```javascript
// 获取所有告警
const allAlerts = energyAPI.getAlertList();

// 按状态筛选
const unreadAlerts = energyAPI.getAlertList({ status: 'unread' });

// 按级别筛选
const criticalAlerts = energyAPI.getAlertList({ level: 'critical' });

// 按类型筛选
const deviceAlerts = energyAPI.getAlertList({ type: 'device_offline' });
```

#### 2. 处理告警
```javascript
// 标记为已读
const readResult = energyAPI.handleAlert('alert_001', 'read');

// 忽略告警
const ignoreResult = energyAPI.handleAlert('alert_001', 'ignore');

// 解决告警
const resolveResult = energyAPI.handleAlert('alert_001', 'resolve');
```

### 自动化规则

#### 1. 获取自动化规则列表
```javascript
const rules = energyAPI.getAutomationRules();
```

#### 2. 创建自动化规则
```javascript
const newRule = energyAPI.createAutomationRule({
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
const updateResult = energyAPI.updateAutomationRule('rule_001', {
  enabled: false,
  name: '更新后的规则名称'
});
```

### 场景模式

#### 1. 获取场景模式列表
```javascript
const scenes = energyAPI.getSceneModes();
```

#### 2. 切换场景模式
```javascript
const switchResult = energyAPI.switchSceneMode('scene_002');
```

### 节能方案

#### 1. 获取节能方案
```javascript
const savingPlans = energyAPI.getSavingPlans();
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

## 页面对应接口映射

### P01 - 首页/能耗总览
- `getHomeOverview()` - 获取首页概览数据

### P02 - 实时监控详情
- `getMonitorDetail(deviceId)` - 获取监控详情

### P03 - 设备列表
- `getDeviceList(params)` - 获取设备列表

### P04 - 设备详情与控制
- `getDeviceDetail(deviceId)` - 获取设备详情
- `controlDevice(deviceId, command)` - 控制设备

### P05 - 历史数据与报告
- `getHistoryEnergyData(params)` - 获取历史数据
- `generateEnergyReport(params)` - 生成报告

### P06 - 节能方案与建议
- `getSavingPlans()` - 获取节能方案

### P07 - 我的/个人中心
- `getUserInfo(userId)` - 获取用户信息

### P08 - 登录/注册
- `login(phone, code)` - 用户登录

### P09 - 告警消息列表
- `getAlertList(params)` - 获取告警列表
- `handleAlert(alertId, action)` - 处理告警

### P10 - 自动化规则设置
- `getAutomationRules()` - 获取规则列表
- `createAutomationRule(ruleData)` - 创建规则
- `updateAutomationRule(ruleId, updateData)` - 更新规则

### P11 - 添加设备
- `addDevice(deviceInfo)` - 添加设备

### P12 - 用户与权限管理
- `getUserList()` - 获取用户列表

### P13 - 场景模式管理
- `getSceneModes()` - 获取场景列表
- `switchSceneMode(sceneId)` - 切换场景

## 注意事项

1. **数据持久化**: 当前版本的数据修改只在内存中生效，页面刷新后会重置。如需持久化，可以结合 localStorage 或其他存储方案。

2. **异步处理**: 所有接口都是同步返回，实际使用时可以包装成 Promise 或添加延时模拟网络请求。

3. **错误处理**: 接口返回格式统一为 `{ success: boolean, data?: any, message?: string }`，请注意检查 success 字段。

4. **数据更新**: 设备控制、告警处理等操作会直接修改内存中的数据，后续查询会返回更新后的数据。

5. **扩展性**: 可以根据实际需求添加新的接口方法或修改现有数据结构。

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
  },
  
  loadHomeData() {
    const result = energyAPI.getHomeOverview();
    if (result.success) {
      this.setData({
        overview: result.data,
        loading: false
      });
    }
  },
  
  // 切换场景模式
  onSceneSwitch(e) {
    const sceneId = e.currentTarget.dataset.sceneId;
    const result = energyAPI.switchSceneMode(sceneId);
    if (result.success) {
      wx.showToast({ title: '场景切换成功' });
      this.loadHomeData(); // 重新加载数据
    }
  }
});
```

这个接口工具提供了智慧能源管理小程序所需的全部模拟数据，可以支持完整的前端开发和测试工作。