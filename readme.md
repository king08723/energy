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
| P15 | 设备维护管理 | 设备 | 管理设备的维护计划和维护记录。 | 设备维护计划列表（设备名称、维护类型、计划时间、状态）、添加/编辑维护计划、维护记录查看（维护时间、维护内容、维护人员）、维护提醒设置、维护报告生成。 | pages\device-maintenance |

## 4. 页面关系与导航流示例
*   从 **[首页]** Tab Bar 进入 **[P01 首页/能耗总览]**。
*   **[P01 首页/能耗总览]** 可点击能耗曲线图或告警概览跳转至 **[P02 实时监控详情]** 或 **[P09 告警消息列表]**。
*   从 **[设备]** Tab Bar 进入 **[P03 设备列表]**。
*   **[P03 设备列表]** 可点击任一设备项跳转至 **[P04 设备详情与控制]**；点击"添加设备"按钮跳转至 **[P11 添加设备]**；点击"管理分组"按钮跳转至 **[P14 设备分组管理]**；点击"设备维护"按钮跳转至 **[P15 设备维护管理]**。
*   **[P04 设备详情与控制]** 可点击"自动化设置"入口跳转至 **[P10 自动化规则设置]**。
*   从 **[分析]** Tab Bar 进入 **[P05 历史数据与报告]**。
*   **[P05 历史数据与报告]** 可点击"节能建议"入口跳转至 **[P06 节能方案与建议]**。
*   从 **[我的]** Tab Bar 进入 **[P07 我的/个人中心]**。
*   **[P07 我的/个人中心]** 可点击"消息中心"跳转至 **[P09 告警消息列表]**；管理员用户可点击"用户与权限管理"跳转至 **[P12 用户与权限管理]**。
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

2. **在 `utils/api-mock.js` 中添加对应的模拟数据：**
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

3. **更新 `utils/api-usage.md` 文档：**
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

### 6.7 能耗数据模型与碳排放计算方案

#### 6.7.1 能耗数据模型概述

智慧能源管理小程序采用统一的能耗数据模型，实现了能源消耗数据的标准化处理和碳排放计算。该模型位于 `utils/energy-data-model.js`，为整个应用提供了一致的能源数据结构和计算方法。所有能耗数据均通过API接口获取和处理，确保数据的一致性和可靠性。

#### 6.7.2 核心数据结构

##### 6.7.2.1 能源类型定义
```javascript
// 能源类型 (utils/config.js)
export const ENERGY_TYPES = {
  ELECTRICITY: 'electricity', // 电力
  WATER: 'water',           // 水
  GAS: 'gas',               // 燃气
  SOLAR: 'solar',           // 光伏
  STORAGE: 'storage'        // 储能
};
```

##### 6.7.2.2 基准消耗率
```javascript
// 能源类型的基准消耗率 (单位: kW, m³/h, 吨/h)
this.baseConsumptionRates = {
  [ENERGY_TYPES.ELECTRICITY]: 0.5,  // 0.5 kW
  [ENERGY_TYPES.WATER]: 0.05,      // 0.05 吨/h
  [ENERGY_TYPES.GAS]: 0.1,         // 0.1 m³/h
  [ENERGY_TYPES.SOLAR]: -0.8,      // -0.8 kW (负值表示产能)
  [ENERGY_TYPES.STORAGE]: 0.3      // 0.3 kW
};
```

##### 6.7.2.3 设备类型能耗系数
```javascript
// 设备类型的能耗系数 (相对于基准消耗率的倍数)
this.deviceTypeFactors = {
  // 电力设备
  'air_conditioner': 2.5,
  'lighting': 0.8,
  // 水系统设备
  'water_pump': 1.5,
  // 燃气设备
  'gas_boiler': 3.0,
  // 其他设备...
};
```

#### 6.7.3 碳排放计算方案

##### 6.7.3.1 碳排放因子

系统使用两套碳排放因子，分别用于不同场景：

1. **能源数据模型中的碳排放因子** (kg CO2/单位能源)：
```javascript
// utils/energy-data-model.js
this.carbonEmissionFactors = {
  [ENERGY_TYPES.ELECTRICITY]: 0.785, // 0.785 kg CO2/kWh
  [ENERGY_TYPES.WATER]: 0.344,      // 0.344 kg CO2/吨
  [ENERGY_TYPES.GAS]: 2.093,        // 2.093 kg CO2/m³
  [ENERGY_TYPES.SOLAR]: 0,          // 0 kg CO2/kWh
  [ENERGY_TYPES.STORAGE]: 0.1       // 0.1 kg CO2/kWh (考虑充放电损耗)
};
```

2. **通用工具函数中的碳排放因子** (吨CO2/单位能源)：
```javascript
// utils/utils.js
const factors = {
  electricity: 0.000581, // 吨CO2/kWh
  gas: 0.002162,        // 吨CO2/立方米
  coal: 2.493           // 吨CO2/吨
};
```

##### 6.7.3.2 设备能耗计算

```javascript
// 计算设备能耗和碳排放
calculateDeviceEnergy(device, duration = 1, date = new Date()) {
  // 如果设备离线或关闭，能耗为0
  if (device.status === 'offline' || device.isOn === false) {
    return { value: 0, unit: this.getEnergyUnit(device.category), carbonEmission: 0 };
  }
  
  // 获取设备类型的能耗系数
  const typeFactor = this.deviceTypeFactors[device.type] || 1.0;
  
  // 获取时间模式系数
  const { factor: timeFactor } = this.getTimePattern(date);
  
  // 获取设备功率等级系数 (0-100%)
  const powerFactor = (device.powerLevel || 100) / 100;
  
  // 获取设备的能源类型
  const energyType = device.category || ENERGY_TYPES.ELECTRICITY;
  
  // 获取基准消耗率
  const baseRate = this.baseConsumptionRates[energyType] || this.baseConsumptionRates[ENERGY_TYPES.ELECTRICITY];
  
  // 计算能耗值
  const energyValue = baseRate * typeFactor * timeFactor * powerFactor * duration;
  
  // 计算碳排放量
  const carbonFactor = this.carbonEmissionFactors[energyType] || 0;
  const carbonEmission = Math.abs(energyValue) * carbonFactor;
  
  return {
    value: parseFloat(energyValue.toFixed(3)),
    unit: this.getEnergyUnit(energyType),
    carbonEmission: parseFloat(carbonEmission.toFixed(3))
  };
}
```

##### 6.7.3.3 通用碳排放计算函数

```javascript
// utils/utils.js
export function calculateCarbonEmission(electricity = 0, gas = 0, coal = 0) {
  // 碳排放因子（吨CO2/单位）
  const factors = {
    electricity: 0.000581, // 吨CO2/kWh
    gas: 0.002162, // 吨CO2/立方米
    coal: 2.493 // 吨CO2/吨
  };
  
  const electricityEmission = electricity * factors.electricity;
  const gasEmission = gas * factors.gas;
  const coalEmission = coal * factors.coal;
  
  return electricityEmission + gasEmission + coalEmission;
}
```

#### 6.7.4 数据累积与汇总

##### 6.7.4.1 能耗数据累积

```javascript
accumulateDeviceEnergy(deviceId, energyData, timestamp = new Date()) {
  if (!this.deviceEnergyCache.has(deviceId)) {
    this.deviceEnergyCache.set(deviceId, {
      daily: {},
      hourly: {},
      total: 0,
      carbonTotal: 0
    });
  }
  
  const deviceCache = this.deviceEnergyCache.get(deviceId);
  
  // 更新总能耗
  deviceCache.total += energyData.value;
  deviceCache.carbonTotal += energyData.carbonEmission;
  
  // 更新日能耗
  const dateKey = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
  if (!deviceCache.daily[dateKey]) {
    deviceCache.daily[dateKey] = { value: 0, carbonEmission: 0 };
  }
  deviceCache.daily[dateKey].value += energyData.value;
  deviceCache.daily[dateKey].carbonEmission += energyData.carbonEmission;
  
  // 更新小时能耗
  const hourKey = `${dateKey}T${timestamp.getHours().toString().padStart(2, '0')}`;
  if (!deviceCache.hourly[hourKey]) {
    deviceCache.hourly[hourKey] = { value: 0, carbonEmission: 0 };
  }
  deviceCache.hourly[hourKey].value += energyData.value;
  deviceCache.hourly[hourKey].carbonEmission += energyData.carbonEmission;
}
```

##### 6.7.4.2 多设备能耗汇总

```javascript
calculateDevicesEnergySummary(deviceIds, timeRange = 'day') {
  let totalEnergy = 0;
  let totalCarbon = 0;
  
  deviceIds.forEach(deviceId => {
    const energyData = this.getDeviceEnergyData(deviceId, timeRange);
    if (energyData) {
      totalEnergy += energyData.value;
      totalCarbon += energyData.carbonEmission;
    }
  });
  
  return {
    value: parseFloat(totalEnergy.toFixed(2)),
    carbonEmission: parseFloat(totalCarbon.toFixed(2))
  };
}
```

#### 6.7.5 时间序列数据生成

系统支持生成不同时间范围的能耗和碳排放时间序列数据，用于图表展示：

```javascript
generateTimeSeriesData(timeRange, energyType) {
  // 根据时间范围设置数据点数量和间隔
  // ...
  
  // 碳排放曲线生成逻辑
  if (energyType === 'carbon') {
    if (timeRange === '7d') {
      // 增加7天数据的差异性
      const dayOfWeek = time.getDay();
      // 工作日碳排放高，周末低
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 工作日
        // 周三碳排放最高
        const peakFactor = dayOfWeek === 3 ? 1.3 : 1.0;
        value = (100 + Math.random() * 30) * peakFactor;
      } else { // 周末
        value = 50 + Math.random() * 20;
      }
    } else {
      value = 70 + Math.sin(time.getHours()/4) * 30 + (time.getHours() % 7) * 2;
    }
  }
}
```

#### 6.7.6 能耗数据API接口

能耗数据模型通过API接口与前端页面交互，确保数据的一致性和可靠性：

```javascript
// 在API对象中添加能耗数据相关接口
const API = {
  // 现有方法...
  
  // 获取设备能耗数据
  getDeviceEnergyData: (deviceId, timeRange = 'day') => {
    return apiRequest(`/api/devices/${deviceId}/energy`, {
      method: 'GET',
      data: { timeRange }
    }, mockAPI.getDeviceEnergyData);
  },
  
  // 获取多设备能耗汇总
  getDevicesEnergySummary: (deviceIds, timeRange = 'day') => {
    return apiRequest('/api/devices/energy-summary', {
      method: 'POST',
      data: { deviceIds, timeRange }
    }, mockAPI.getDevicesEnergySummary);
  },
  
  // 获取碳排放数据
  getCarbonEmissionData: (params) => {
    return apiRequest('/api/carbon-emission', {
      method: 'GET',
      data: params
    }, mockAPI.getCarbonEmissionData);
  }
};
```

#### 6.7.7 使用指南

##### 6.7.7.1 初始化能源数据模型

```javascript
// 在app.js中初始化
const EnergyDataModel = require('./utils/energy-data-model.js');

App({
  onLaunch() {
    // 初始化能源数据模型
    this.globalData.energyModel = new EnergyDataModel();
  },
  globalData: {
    energyModel: null
  }
});
```

##### 6.7.7.2 在页面中使用

```javascript
// 在页面中使用能源数据模型
const app = getApp();
const API = require('../../utils/api.js');

Page({
  data: {
    deviceEnergy: {},
    carbonEmission: 0
  },
  
  onLoad(options) {
    const deviceId = options.id;
    
    // 通过API获取设备数据
    API.getDeviceDetail(deviceId).then(res => {
      if (res.success) {
        const device = res.data;
        
        // 计算设备能耗和碳排放
        const energyData = app.globalData.energyModel.calculateDeviceEnergy(device);
        
        this.setData({
          device,
          deviceEnergy: energyData,
          carbonEmission: energyData.carbonEmission
        });
      }
    });
  }
});
```

##### 6.7.7.3 数据一致性保障措施

为确保能耗数据模型中使用的设备数据与设备页面API获取的设备数据保持一致，避免数据不匹配问题，系统采用以下数据一致性保障措施：

###### 统一数据源

```javascript
// 在app.js中实现统一数据源管理
App({
  onLaunch() {
    // 初始化能源数据模型
    this.globalData.energyModel = new EnergyDataModel();
    // 初始化设备数据缓存
    this.globalData.devices = [];
    
    // 统一加载设备数据
    this.loadDeviceData();
  },
  
  // 统一加载设备数据的方法
  loadDeviceData() {
    API.getDeviceList().then(res => {
      this.globalData.devices = res.data;
      // 通知所有页面设备数据已更新
      this.notifyDeviceDataUpdate();
    });
  },
  
  // 获取设备数据的统一接口
  getDeviceById(deviceId) {
    return this.globalData.devices.find(device => device.id === deviceId);
  },
  
  globalData: {
    energyModel: null,
    devices: [],
    deviceDataObservers: []
  }
});
```

###### 数据同步机制

```javascript
// 在设备控制页面实现数据同步
Page({
  onLoad(options) {
    const app = getApp();
    const deviceId = options.id;
    
    // 注册设备数据变化的回调
    this.deviceUpdateCallback = (devices) => {
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        // 更新页面数据
        this.setData({ device });
        // 同步更新能耗计算
        this.updateEnergyData(device);
      }
    };
    
    // 添加到观察者列表
    app.globalData.deviceDataObservers.push(this.deviceUpdateCallback);
  },
  
  // 更新能耗数据
  updateEnergyData(device) {
    const app = getApp();
    // 使用最新的设备数据计算能耗
    const energyData = app.globalData.energyModel.calculateDeviceEnergy(device);
    // 更新页面显示
    this.setData({
      deviceEnergy: energyData,
      carbonEmission: energyData.carbonEmission
    });
  },
  
  onUnload() {
    // 页面卸载时移除观察者
    const app = getApp();
    const index = app.globalData.deviceDataObservers.indexOf(this.deviceUpdateCallback);
    if (index > -1) {
      app.globalData.deviceDataObservers.splice(index, 1);
    }
  }
});
```

###### 实时数据更新

```javascript
// 在设备状态变化时同步更新能耗计算
onSwitchChange(e) {
  const isOn = e.detail.value;
  const deviceId = this.data.device.id;
  
  // 调用API更新设备状态
  API.updateDeviceStatus(deviceId, { isOn }).then(res => {
    // 更新全局设备数据
    const app = getApp();
    const deviceIndex = app.globalData.devices.findIndex(d => d.id === deviceId);
    if (deviceIndex > -1) {
      app.globalData.devices[deviceIndex].isOn = isOn;
      // 通知所有观察者
      app.globalData.deviceDataObservers.forEach(callback => {
        callback(app.globalData.devices);
      });
    }
  });
}
```

### 6.8 API优化总结

项目的API工具已完成全面优化，主要成果包括：

#### 6.8.1 已完成的优化内容

1. **数据关联强化**：实现了设备数据、能耗数据、告警数据、场景模式数据、自动化规则数据之间的逻辑关联，确保数据一致性。

2. **统一数据模型**：在 <mcfile name="api-mock.js" path="utils/api-mock.js"></mcfile> 中使用 <mcfile name="energy-data-model.js" path="utils/energy-data-model.js"></mcfile> 统一数据模型，实现确定性数据生成。

3. **缓存机制**：实现数据缓存和增量更新机制，提高API响应性能。

4. **实时数据更新**：支持WebSocket实时数据订阅，为生产环境做好准备。

5. **扩展接口**：为场景模式和自动化规则添加完整的API接口支持。

#### 6.8.2 优化效果

- **性能提升**：通过缓存机制减少重复计算，提高数据获取效率
- **数据一致性**：确保不同页面展示的数据保持同步
- **可维护性**：统一的数据模型和接口设计，便于后续维护和扩展
- **生产就绪**：为接入真实API做好充分准备

详细的优化实现可参考：
- <mcfile name="API-OPTIMIZATION-COMPLETED.md" path="utils/API-OPTIMIZATION-COMPLETED.md"></mcfile> - 完整的优化实施记录
- <mcfile name="api-usage.md" path="utils/api-usage.md"></mcfile> - API使用指南和最佳实践

### 6.9 智能分析页面优化记录

#### 6.9.1 问题诊断与修复

在智能分析页面（P06）的开发过程中，遇到了多个技术问题并逐一解决：

**1. WXML语法兼容性问题**
- **问题**：WXML模板中使用了ES6箭头函数语法，导致编译错误
- **解决方案**：将箭头函数语法替换为标准函数语法，确保微信小程序兼容性
- **影响文件**：`pages/intelligent-analysis/intelligent-analysis.wxml`

**2. 复杂表达式处理优化**
- **问题**：WXML模板中包含复杂的JavaScript表达式，不符合微信小程序模板语法规范
- **解决方案**：
  - 在JS文件中新增 `calculateAlertStats` 函数处理告警统计逻辑
  - 在页面数据中添加 `alertStats` 对象存储计算结果
  - WXML模板使用简化的数据绑定表达式
- **优化效果**：提高了模板渲染性能，增强了代码可维护性

**3. API方法调用错误修复**
- **问题**：调用了不存在的API方法 `api.getDevices()` 和 `api.getAlerts()`
- **解决方案**：
  - 修正为正确的API方法：`api.getDeviceList()` 和 `api.getAlertList()`
  - 适配API返回的数据结构，使用 `response.data.list` 访问实际数组数据
- **影响文件**：`pages/intelligent-analysis/intelligent-analysis.js`

#### 6.9.2 代码质量提升

**数据处理优化**：
```javascript
// 优化前：直接使用API响应数据
const devices = devicesRes.data;

// 优化后：兼容不同数据结构
const devices = devicesRes.data.list || devicesRes.data;
```

**错误处理增强**：
- 添加了完善的空值检查和异常处理
- 实现了优雅的错误降级机制
- 提供了用户友好的错误提示

#### 6.9.3 性能优化成果

1. **模板渲染性能**：通过将复杂计算移至JS层，减少了模板渲染时的计算开销
2. **数据处理效率**：统一的数据访问模式，提高了数据处理的一致性
3. **用户体验**：解决了页面加载错误，确保功能正常运行

#### 6.9.4 最佳实践总结

基于此次优化经验，总结出以下开发最佳实践：

1. **WXML模板规范**：
   - 避免在模板中使用复杂的JavaScript表达式
   - 优先使用标准函数语法，避免ES6特性
   - 将业务逻辑计算移至JS文件中处理

2. **API调用规范**：
   - 使用前确认API方法的正确名称
   - 了解API返回的数据结构，正确访问数据
   - 实现数据结构的兼容性处理

3. **错误处理策略**：
   - 添加完善的空值检查
   - 实现优雅的错误降级
   - 提供清晰的错误信息反馈

4. **代码维护性**：
   - 将复杂逻辑封装为独立函数
   - 使用语义化的变量和函数命名
   - 添加必要的代码注释说明

这些优化确保了智能分析页面的稳定性和可维护性，为后续功能扩展奠定了良好基础。