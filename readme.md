# 智慧能源管理小程序页面及Tab Bar规划文档

## 1. 规划总览与原则
本次页面规划遵循以下设计原则：
*   **用户中心：** 优先考虑用户最常执行的任务和最关心的信息，如实时能耗查看、设备控制。
*   **简洁直观：** 避免过于复杂的层级，确保页面内容清晰，核心功能一步到位。
*   **高频优先：** 将用户使用频率最高的功能（如首页、设备管理）放到Tab Bar或显眼位置。
*   **逻辑连贯：** 页面之间的跳转和信息流应符合用户的认知习惯，提供流畅的用户体验。
*   **模块化：** 将相关功能归类到同一模块或页面，便于管理和理解，提高可维护性。
*   **适应性：** 考虑未来功能扩展的可能性，预留接口和设计弹性。

## 2. Tab Bar 规划
根据PRD的核心功能和用户旅程，我将Tab Bar规划为以下4个核心模块，以满足用户高频使用需求并提供清晰的导航路径：

### 2.1 Tab Bar 项 1: 首页
*   **功能范围：** 提供整体能耗概览、核心数据展示、快捷入口和告警信息。
*   **建议图标：** 房子 (home)
*   **关联页面：** 首页/能耗总览 (P01)

### 2.2 Tab Bar 项 2: 设备
*   **功能范围：** 管理已接入的智能能源设备，查看设备状态并进行远程控制。
*   **建议图标：** 插头 (control)
*   **关联页面：** 设备列表 (P03)

### 2.3 Tab Bar 项 3: 分析
*   **功能范围：** 提供历史能耗数据查询、报告生成、节能建议和异常告警详情。
*   **建议图标：** 仪表盘 (data)
*   **关联页面：** 历史数据与报告 (P05)

### 2.4 Tab Bar 项 4: 我的
*   **功能范围：** 用户个人信息管理、账号设置、消息中心及其他辅助功能。
*   **建议图标：** 人物 (profile)
*   **关联页面：** 我的/个人中心 (P07)

## 3. 小程序页面列表

| 编号 | 页面名称 | 所属 Tab Bar 项 | 页面作用/目的 | 页面呈现内容（关键信息点及主要交互元素） | 页面路径 |
| ---- | -------- | -------------- | ------------- | ---------------------------------------- | -------- |
| P01 | 首页/能耗总览 | 首页 | 快速查看整体能耗概况，提供核心功能快捷入口。 | 实时总能耗数据（今日/本月）、用电负荷曲线图（实时/今日）、设备告警概览（数量、类型）、快捷控制按钮（如一键节能、场景模式切换）、天气信息、消息通知入口、能耗排名入口。 | pages\index |
| P02 | 实时监控详情 | 首页 | 深入查看特定区域或设备的实时能耗数据和状态。 | 区域/设备选择器、分时能耗曲线、功率/电压/电流等实时参数、设备运行状态（在线/离线/故障）、环境参数（温度/湿度，如传感器支持）、告警列表。 | pages\monitor |
| P03 | 设备列表 | 设备 | 管理已接入的智能能源设备，查看设备状态。 | 已绑定设备列表（设备名称、类型、在线状态、告警标识）、添加设备入口、设备筛选/搜索功能、设备分组切换、分组管理入口。 | pages\devices |
| P04 | 设备详情与控制 | 设备 | 对单个智能设备进行远程控制和参数设置。 | 设备名称、设备类型、设备状态、开关按钮、运行模式选择（如空调模式）、定时任务设置、自动化规则关联、历史运行数据（如开关时长、累计能耗）、故障提示与诊断。 | pages\device-detail |
| P05 | 历史数据与报告 | 分析 | 查看过去特定时间段的能耗数据和分析报告。 | 时间范围选择器（日/周/月/年/自定义）、能耗曲线图（总能耗、分项能耗）、能耗对比分析（同期对比、环比）、能耗报告生成与下载（PDF/Excel）、碳排放量展示。 | pages\data |
| P06 | 节能方案与建议 | 分析 | 提供个性化的节能建议和方案。 | 推荐节能方案列表（基于能耗数据分析）、节能小贴士、节能成果展示（如累计节约电量/费用）、用户自定义节能目标设置、节能知识库。 | pages\saving |
| P07 | 我的/个人中心 | 我的 | 用户查看个人信息、管理账号、设置偏好。 | 用户头像、昵称、企业/机构信息、我的设备（快捷入口）、消息中心、意见反馈、隐私设置、关于我们、版本信息、退出登录。 | pages\profile |
| P08 | 登录/注册 | (无 Tab Bar) | 用户注册或登录小程序。 | 手机号登录/注册、微信授权登录、验证码输入、密码设置、用户协议与隐私政策。 | pages\login |
| P09 | 告警消息列表 | (无 Tab Bar) | 查看所有告警消息，并进行处理。 | 告警消息列表（时间、设备、类型、状态）、告警筛选（未读/已读、类型）、告警详情查看、告警处理（标记已读、忽略）。 | pages\alerts |
| P10 | 自动化规则设置 | 设备 | 创建和管理设备的自动化运行规则。 | 自动化规则列表、添加新规则入口、规则编辑（触发条件：时间、设备状态、能耗阈值；执行动作：设备控制、消息通知）、规则启用/禁用。 | pages\automation |
| P11 | 添加设备 | 设备 | 引导用户添加新的智能能源设备。 | 设备类型选择、设备连接指引（如扫码、手动输入SN）、网络配置（Wi-Fi配网）、设备绑定成功提示。 | pages\add-device |
| P12 | 用户与权限管理 | 我的 | 管理子账户和其操作权限（仅管理员可见）。 | 用户列表、添加/编辑用户、角色分配（管理员/普通用户/访客）、权限配置（设备控制、数据查看等）。 | pages\user-management |
| P13 | 场景模式管理 | 设备 | 配置和切换预设的场景模式。 | 场景模式列表（生产模式、非生产模式、上课模式等）、场景模式编辑（包含设备、运行参数）、场景模式一键切换。 | pages\scene-mode |
| P14 | 设备分组管理 | 设备 | 创建、编辑和管理设备分组。 | 分组列表（分组名称、设备数量、创建时间）、添加/编辑分组（分组名称、描述、图标选择）、设备分组分配（拖拽或选择设备到分组）、分组删除确认、分组权限设置。 | pages\group-management |

## 4. 页面关系与导航流示例
*   从 **[首页]** Tab Bar 进入 **[P01 首页/能耗总览]**。
*   **[P01 首页/能耗总览]** 可点击能耗曲线图或告警概览跳转至 **[P02 实时监控详情]** 或 **[P09 告警消息列表]**。
*   从 **[设备]** Tab Bar 进入 **[P03 设备列表]**。
*   **[P03 设备列表]** 可点击任一设备项跳转至 **[P04 设备详情与控制]**；点击"添加设备"按钮跳转至 **[P11 添加设备]**；点击"管理分组"按钮跳转至 **[P14 设备分组管理]**。
*   **[P04 设备详情与控制]** 可点击“自动化设置”入口跳转至 **[P10 自动化规则设置]**。
*   从 **[分析]** Tab Bar 进入 **[P05 历史数据与报告]**。
*   **[P05 历史数据与报告]** 可点击“节能建议”入口跳转至 **[P06 节能方案与建议]**。
*   从 **[我的]** Tab Bar 进入 **[P07 我的/个人中心]**。
*   **[P07 我的/个人中心]** 可点击“消息中心”跳转至 **[P09 告警消息列表]**；管理员用户可点击“用户与权限管理”跳转至 **[P12 用户与权限管理]**。
*   所有二级及以上页面（如P02, P04, P06, P09, P10, P11, P12, P13, P14）通过顶部导航栏的返回按钮返回上一级页面。
*   **[P08 登录/注册]** 为独立页面，不属于Tab Bar导航，完成登录/注册后跳转至 **[P01 首页/能耗总览]**。

## 5. 设计系统与视觉规范 (Design System & Visual Guidelines)

### 5.1 设计系统概述

为确保整个小程序的视觉一致性和开发效率，我们建立了统一的设计系统。该系统基于首页的高级科技感深色主题，提供了完整的组件库和样式规范。

### 5.2 核心设计文件

*   **`/styles/design-system.wxss`** - 核心样式文件，包含所有基础组件和工具类
*   **`/styles/README.md`** - 详细的使用指南和最佳实践
*   **`/styles/example-page.wxml`** - 完整的示例页面，展示设计系统的使用方法

### 5.3 页面开发规范

#### 5.3.1 样式引入
所有页面的 `.wxss` 文件都应在顶部引入设计系统：
```css
@import '/styles/design-system.wxss';
```

#### 5.3.2 基础布局结构
每个页面都应使用统一的容器结构：
```xml
<view class="energy-container">
  <!-- 背景装饰 -->
  <view class="energy-bg-decoration">
    <view class="energy-bg-circle" style="..."></view>
    <!-- 更多装饰圆圈 -->
  </view>
  
  <!-- 页面内容 -->
  <view class="energy-glass-card energy-p-32">
    <!-- 具体内容 -->
  </view>
</view>
```

#### 5.3.3 核心CSS类名

**布局类：**
*   `energy-container` - 页面主容器
*   `energy-glass-card` - 毛玻璃卡片
*   `energy-flex`, `energy-flex-between`, `energy-flex-center` - Flex布局
*   `energy-grid-2`, `energy-grid-3` - 网格布局

**文字类：**
*   `energy-title-large`, `energy-title-medium` - 标题文字
*   `energy-text-primary`, `energy-text-secondary`, `energy-text-tertiary` - 正文文字

**组件类：**
*   `energy-btn` - 按钮样式
*   `energy-icon` - 图标容器
*   `energy-data-card` - 数据展示卡片
*   `energy-status-dot` - 状态指示器

**工具类：**
*   `energy-p-16`, `energy-p-24`, `energy-p-32` - 内边距
*   `energy-mb-16`, `energy-mb-24`, `energy-mb-32` - 下边距
*   `energy-transition` - 过渡动画

### 5.4 配色使用指南

*   **主背景：** 使用 `energy-container` 自动应用深色渐变
*   **强调色：** 青色 `#00ffff` 用于重要按钮、链接、状态指示
*   **状态色：** 
    *   成功：`energy-status-success` (绿色)
    *   警告：`energy-status-warning` (黄色) 
    *   危险：`energy-status-critical` (红色)

### 5.5 开发最佳实践

1. **优先使用预定义类名**：避免重复定义相似样式
2. **保持命名一致性**：所有自定义类名以 `energy-` 开头
3. **遵循组件化原则**：复用设计系统中的组件模式
4. **注意响应式适配**：使用 `rpx` 单位确保多设备兼容
5. **测试视觉一致性**：参考示例页面确保风格统一

### 5.6 扩展指南

当需要添加新的组件或样式时：
1. 首先检查设计系统中是否已有类似组件
2. 遵循现有的命名规范和视觉风格
3. 在 `design-system.wxss` 中添加新样式
4. 更新使用指南文档
5. 在示例页面中展示新组件的用法

## 6. 页面开发API集成指南 (Page Development API Integration Guide)

### 6.1 API工具使用

#### 6.1.1 引入API工具
所有页面的 `.js` 文件都应引入统一的API工具：
```javascript
// 引入API工具
const API = require('../../utils/api.js');

// 页面数据
Page({
  data: {
    // 页面数据定义
  },
  
  onLoad() {
    // 页面加载时获取数据
    this.loadPageData();
  },
  
  // 加载页面数据的统一方法
  async loadPageData() {
    try {
      // 显示加载状态
      wx.showLoading({ title: '加载中...' });
      
      // 调用API获取数据
      const result = await API.getHomeOverview();
      
      if (result.success) {
        this.setData({
          // 更新页面数据
          ...result.data
        });
      } else {
        // 处理错误情况
        wx.showToast({
          title: result.message || '数据加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('页面数据加载失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    } finally {
      // 隐藏加载状态
      wx.hideLoading();
    }
  }
});
```

#### 6.1.2 环境配置
在 `app.js` 中配置API环境：
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

### 6.2 页面数据获取模式

#### 6.2.1 首页数据获取
```javascript
// pages/index/index.js
const API = require('../../utils/api.js');

Page({
  data: {
    realTimeEnergy: {},
    loadCurve: [],
    alertSummary: {},
    weather: {},
    quickControls: []
  },
  
  onLoad() {
    this.loadHomeData();
    // 设置定时刷新
    this.startAutoRefresh();
  },
  
  onUnload() {
    // 清理定时器
    this.stopAutoRefresh();
  },
  
  // 加载首页数据
  async loadHomeData() {
    try {
      const [overviewResult, monitorResult] = await Promise.all([
        API.getHomeOverview(),
        API.getMonitorDetail()
      ]);
      
      if (overviewResult.success) {
        this.setData({
          realTimeEnergy: overviewResult.data.realTimeEnergy,
          alertSummary: overviewResult.data.alertSummary,
          weather: overviewResult.data.weather,
          quickControls: overviewResult.data.quickControls
        });
      }
      
      if (monitorResult.success) {
        this.setData({
          loadCurve: monitorResult.data.energyCurve
        });
      }
    } catch (error) {
      console.error('首页数据加载失败:', error);
    }
  },
  
  // 自动刷新机制
  startAutoRefresh() {
    this.refreshTimer = setInterval(() => {
      this.loadHomeData();
    }, 30000); // 30秒刷新一次
  },
  
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
});
```

#### 6.2.2 设备列表数据获取
```javascript
// pages/devices/devices.js
const API = require('../../utils/api.js');

Page({
  data: {
    deviceList: [],
    filterType: 'all',
    searchKeyword: '',
    loading: false
  },
  
  onLoad() {
    this.loadDeviceList();
  },
  
  // 加载设备列表
  async loadDeviceList() {
    this.setData({ loading: true });
    
    try {
      const params = {};
      
      // 添加筛选条件
      if (this.data.filterType !== 'all') {
        params.type = this.data.filterType;
      }
      
      if (this.data.searchKeyword) {
        params.keyword = this.data.searchKeyword;
      }
      
      const result = await API.getDeviceList(params);
      
      if (result.success) {
        this.setData({
          deviceList: result.data
        });
      }
    } catch (error) {
      console.error('设备列表加载失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },
  
  // 设备类型筛选
  onFilterChange(e) {
    this.setData({
      filterType: e.detail.value
    });
    this.loadDeviceList();
  },
  
  // 搜索功能
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    // 防抖处理
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.loadDeviceList();
    }, 500);
  }
});
```

#### 6.2.3 设备控制操作
```javascript
// pages/device-detail/device-detail.js
const API = require('../../utils/api.js');

Page({
  data: {
    deviceId: '',
    deviceInfo: {},
    controlling: false
  },
  
  onLoad(options) {
    this.setData({ deviceId: options.id });
    this.loadDeviceDetail();
  },
  
  // 加载设备详情
  async loadDeviceDetail() {
    try {
      const result = await API.getDeviceDetail(this.data.deviceId);
      
      if (result.success) {
        this.setData({
          deviceInfo: result.data
        });
      }
    } catch (error) {
      console.error('设备详情加载失败:', error);
    }
  },
  
  // 设备开关控制
  async onSwitchChange(e) {
    if (this.data.controlling) return;
    
    this.setData({ controlling: true });
    
    try {
      const result = await API.controlDevice(this.data.deviceId, {
        action: 'switch',
        value: e.detail.value
      });
      
      if (result.success) {
        // 更新设备状态
        this.setData({
          'deviceInfo.isOn': e.detail.value
        });
        
        wx.showToast({
          title: e.detail.value ? '设备已开启' : '设备已关闭',
          icon: 'success'
        });
      } else {
        // 控制失败，恢复开关状态
        wx.showToast({
          title: result.message || '控制失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('设备控制失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    } finally {
      this.setData({ controlling: false });
    }
  }
});
```

### 6.3 错误处理与用户体验

#### 6.3.1 统一错误处理
```javascript
// 创建通用的错误处理函数
function handleApiError(error, defaultMessage = '操作失败') {
  console.error('API错误:', error);
  
  let message = defaultMessage;
  
  if (error && error.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
}

// 在页面中使用
try {
  const result = await API.someMethod();
  // 处理成功结果
} catch (error) {
  handleApiError(error, '数据加载失败');
}
```

#### 6.3.2 加载状态管理
```javascript
// 页面加载状态管理
Page({
  data: {
    loading: {
      page: false,
      refresh: false,
      submit: false
    }
  },
  
  // 设置加载状态
  setLoading(type, status) {
    this.setData({
      [`loading.${type}`]: status
    });
    
    if (type === 'page' && status) {
      wx.showLoading({ title: '加载中...' });
    } else if (type === 'page' && !status) {
      wx.hideLoading();
    }
  },
  
  // 使用示例
  async loadData() {
    this.setLoading('page', true);
    try {
      const result = await API.getData();
      // 处理数据
    } catch (error) {
      handleApiError(error);
    } finally {
      this.setLoading('page', false);
    }
  }
});
```

### 6.4 数据缓存与优化

#### 6.4.1 本地缓存策略
```javascript
// 缓存工具函数
const CacheManager = {
  // 设置缓存
  set(key, data, expireTime = 5 * 60 * 1000) { // 默认5分钟过期
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      expireTime: expireTime
    };
    wx.setStorageSync(key, cacheData);
  },
  
  // 获取缓存
  get(key) {
    try {
      const cacheData = wx.getStorageSync(key);
      if (!cacheData) return null;
      
      const now = Date.now();
      if (now - cacheData.timestamp > cacheData.expireTime) {
        // 缓存过期，删除
        wx.removeStorageSync(key);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      return null;
    }
  },
  
  // 清除缓存
  clear(key) {
    wx.removeStorageSync(key);
  }
};

// 在页面中使用缓存
Page({
  async loadDataWithCache() {
    const cacheKey = 'device_list';
    
    // 先尝试从缓存获取
    let data = CacheManager.get(cacheKey);
    
    if (data) {
      this.setData({ deviceList: data });
      return;
    }
    
    // 缓存不存在或过期，从API获取
    try {
      const result = await API.getDeviceList();
      if (result.success) {
        this.setData({ deviceList: result.data });
        // 缓存数据
        CacheManager.set(cacheKey, result.data);
      }
    } catch (error) {
      handleApiError(error);
    }
  }
});
```

### 6.5 实时数据订阅

#### 6.5.1 WebSocket连接管理
```javascript
// pages/monitor/monitor.js - 实时监控页面
const API = require('../../utils/api.js');

Page({
  data: {
    realTimeData: {},
    connected: false
  },
  
  onLoad() {
    this.subscribeRealTimeData();
  },
  
  onUnload() {
    this.unsubscribeRealTimeData();
  },
  
  // 订阅实时数据
  async subscribeRealTimeData() {
    try {
      await API.subscribeRealTimeData({
        deviceIds: ['device_001', 'device_002'],
        onMessage: (data) => {
          // 处理实时数据更新
          this.handleRealTimeUpdate(data);
        },
        onConnect: () => {
          this.setData({ connected: true });
        },
        onDisconnect: () => {
          this.setData({ connected: false });
        }
      });
    } catch (error) {
      console.error('实时数据订阅失败:', error);
    }
  },
  
  // 取消订阅
  async unsubscribeRealTimeData() {
    try {
      await API.unsubscribeRealTimeData();
    } catch (error) {
      console.error('取消订阅失败:', error);
    }
  },
  
  // 处理实时数据更新
  handleRealTimeUpdate(data) {
    this.setData({
      realTimeData: {
        ...this.data.realTimeData,
        ...data
      }
    });
  }
});
```

### 6.6 API扩展开发指南

#### 6.6.1 新增API接口
当需要新增API接口时，按以下步骤操作：

1. **在 `utils/api.js` 中添加新方法：**
```javascript
// 添加到API对象中
const API = {
  // 现有方法...
  
  // 设备分组管理API
  getDeviceGroups: (params) => {
    return apiRequest('/api/device-groups', {
      method: 'GET',
      data: params
    }, mockAPI.getDeviceGroups);
  },
  
  createDeviceGroup: (groupData) => {
    return apiRequest('/api/device-groups', {
      method: 'POST',
      data: groupData
    }, mockAPI.createDeviceGroup);
  },
  
  updateDeviceGroup: (groupId, groupData) => {
    return apiRequest(`/api/device-groups/${groupId}`, {
      method: 'PUT',
      data: groupData
    }, mockAPI.updateDeviceGroup);
  },
  
  deleteDeviceGroup: (groupId) => {
    return apiRequest(`/api/device-groups/${groupId}`, {
      method: 'DELETE'
    }, mockAPI.deleteDeviceGroup);
  },
  
  addDeviceToGroup: (groupId, deviceId) => {
    return apiRequest(`/api/device-groups/${groupId}/devices`, {
      method: 'POST',
      data: { deviceId }
    }, mockAPI.addDeviceToGroup);
  },
  
  removeDeviceFromGroup: (groupId, deviceId) => {
    return apiRequest(`/api/device-groups/${groupId}/devices/${deviceId}`, {
      method: 'DELETE'
    }, mockAPI.removeDeviceFromGroup);
  },
  
  batchControlDeviceGroup: (groupId, controlData) => {
    return apiRequest(`/api/device-groups/${groupId}/batch-control`, {
      method: 'POST',
      data: controlData
    }, mockAPI.batchControlDeviceGroup);
  }
};
```

2. **在 `api-mock.js` 中添加对应的模拟数据：**
```javascript
// 在EnergyMockAPI类中添加设备分组管理方法
getDeviceGroups(params) {
  return {
    success: true,
    data: [
      {
        id: 'group_001',
        name: '办公区域',
        description: '办公区域设备分组',
        deviceCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        permissions: ['view', 'control']
      }
    ]
  };
},

createDeviceGroup(groupData) {
  return {
    success: true,
    data: {
      id: 'group_' + Date.now(),
      ...groupData,
      deviceCount: 0,
      createdAt: new Date().toISOString()
    }
  };
}
```

3. **更新 `api-usage.md` 文档：**
```markdown
#### 设备分组管理接口
\`\`\`javascript
// 获取设备分组列表
const groups = await API.getDeviceGroups();

// 创建设备分组
const newGroup = await API.createDeviceGroup({
  name: '新分组',
  description: '分组描述'
});
\`\`\`
```

#### 6.6.2 数据结构扩展
当需要扩展现有数据结构时：

1. **保持向后兼容：** 新增字段不影响现有功能
2. **提供默认值：** 为新字段提供合理的默认值
3. **更新类型定义：** 在注释中说明新字段的类型和用途
4. **测试兼容性：** 确保现有页面正常工作

```javascript
// 扩展设备数据结构示例
const deviceData = {
  // 现有字段
  id: 'device_001',
  name: '设备名称',
  
  // 新增字段（向后兼容）
  energyEfficiency: 0.85, // 能效比（新增）
  maintenanceStatus: 'normal', // 维护状态（新增）
  lastMaintenanceDate: '2024-01-01' // 最后维护日期（新增）
};
```

通过以上API集成指南，开发者可以：
- 统一使用API工具获取数据
- 正确处理加载状态和错误情况
- 实现数据缓存和性能优化
- 支持实时数据订阅
- 规范地扩展新的API接口和数据结构