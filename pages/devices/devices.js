// pages/devices/devices.js
// 在文件顶部添加API和工具函数引入
const API = require('../../utils/api.js');
const { formatUptime } = require('../../utils/utils.js');

Page({
  data: {
    // 实时连接状态
    realTimeStatus: 'disconnected', // connected, disconnected, error
    // 设备统计数据
    deviceStats: {
      total: 0,
      online: 0,
      alerts: 0, // 修改字段名以匹配WXML绑定
      signalStrength: 3, // 网络信号强度 1-4
      healthScore: 85, // 设备健康度百分比
      healthLevel: 'success', // 健康度等级: success/warning/error
      healthColor: '#10B981', // 健康度颜色
      // 设备类型分布数据
      sensorDevices: 0, // 传感器设备数量
      controlDevices: 0, // 控制设备数量
      monitorDevices: 0, // 监控设备数量
      otherDevices: 0, // 其他设备数量
      // 告警严重程度分布数据
      criticalAlerts: 0, // 严重告警数量
      warningAlerts: 0, // 警告告警数量
      infoAlerts: 0, // 信息告警数量
      // 趋势数据
      totalTrend: {
        type: 'up',
        icon: '↗',
        text: '+5'
      },
      onlineTrend: {
        type: 'up',
        icon: '↗',
        text: '+8'
      },
      alertTrend: {
        type: 'down',
        icon: '↘',
        text: '-2'
      },
      healthTrend: {
        type: 'stable',
        icon: '→',
        text: '0%'
      }
    },

    // 搜索和筛选状态
    showSearch: false,
    showGroups: false,
    searchKeyword: '',
    filterType: 'all',
    selectedGroup: 'all',

    // 批量操作相关
    batchMode: false,
    selectedDevices: [],
    selectAllText: '全选', // 全选按钮文本

    // 实时刷新状态
    isRefreshing: false,

    // 分页相关数据
    currentPage: 1, // 当前页码
    totalPages: 1, // 总页数
    pageSize: 5, // 每页显示数量
    hasMore: true, // 是否还有更多数据
    loadingMore: false, // 是否正在加载更多
    showPagination: false, // 是否显示分页导航

    // 设备分组数据
    deviceGroups: [
      { id: 'production', name: '生产区域', count: 8 },
      { id: 'office', name: '办公区域', count: 12 },
      { id: 'public', name: '公共区域', count: 6 }
    ],

    // 设备性能数据
    performanceData: {
      avgResponseTime: 125,
      responseTimeTrend: 'down',
      responseScore: 85, // 响应时间得分 0-100
      successRate: 98.5,
      successTrend: 'up', // 成功率趋势
      networkLatency: 45,
      latencyTrend: 'down', // 延迟趋势
      latencyLevel: 'good' // good/warning/error
    },

    // 智能推荐数据
    recommendations: [
      {
        id: 'rec_001',
        type: 'energy',
        icon: '💡',
        title: '优化能耗配置',
        description: '检测到3台设备可通过调整运行时间节省15%能耗'
      },
      {
        id: 'rec_002',
        type: 'maintenance',
        icon: '🔧',
        title: '预防性维护',
        description: '智能开关C3建议在本周进行维护检查'
      }
    ],

    // 设备列表数据
    allDevices: [], // 所有设备数据（统一数据源）
    devices: [], // 筛选后的全部设备数据
    filteredDevices: [], // 筛选后的设备数据（用于非分页模式）
    currentPageDevices: [], // 当前页显示的设备数据（最多5个）
    loading: false,

    // 滚动位置控制
    scrollTop: 0,

    // 调试模式控制
    debugMode: false
  },

  // 卡片点击事件 - 增加快速筛选功能
  onCardTap(e) {
    const type = e.currentTarget.dataset.type;
    const stats = this.data.deviceStats;

    // 快速筛选功能
    switch (type) {
      case 'total':
        // 显示全部设备
        this.setData({
          filterType: 'all',
          showSearch: true // 展开搜索筛选面板
        });
        this.applyFilters();
        break;
      case 'online':
        // 快速筛选在线设备 - 修复映射错误
        this.setData({
          filterType: 'online',
          showSearch: true
        });
        this.applyFilters();
        break;
      case 'alerts':
        // 快速筛选告警设备
        this.setData({
          filterType: 'alert',
          showSearch: true
        });
        this.applyFilters();
        break;
      case 'health':
        // 根据健康度筛选
        const filterType = stats.healthScore < 70 ? 'abnormal' : 'healthy';
        this.setData({
          filterType: filterType,
          showSearch: true
        });
        this.applyFilters();
        break;
    }
  },

  /**
   * 清除所有筛选条件
   */
  onClearFilter() {
    this.setData({
      searchKeyword: '',
      filterType: 'all',
      selectedGroup: 'all'
    });

    // 重新加载第一页数据
    this.applyFilters();

    wx.showToast({
      title: '已清除所有筛选条件',
      icon: 'success',
      duration: 1500
    });
  },

  onLoad: function (options) {
    // 初始化页面状态
    this.isDestroyed = false;
    this.searchCache = new Map(); // 搜索结果缓存
    this.lastSearchKeyword = '';
    this.lastFilterType = 'all';

    // 初始化性能监控
    this.initPerformanceMonitor();

    // 页面加载时初始化数据
    this.initDeviceData().then(() => {
      // 确保设备数据加载完成后再初始化实时监控
      this.initRealTimeMonitor();
    }).catch(() => {
      // 即使数据加载失败，也尝试初始化实时监控
      this.initRealTimeMonitor();
    });
    this.updateDeviceStats();
  },

  onReady: function () {
    // 页面初次渲染完成
  },

  onShow: function () {
    // 页面显示时刷新数据和启动实时监控
    this.refreshDeviceData().then(() => {
      // 确保设备数据加载完成后再初始化实时监控
      this.initRealTimeMonitor();
    }).catch(() => {
      // 即使数据加载失败，也尝试初始化实时监控
      this.initRealTimeMonitor();
    });

    // 数据预加载 - 预测用户可能访问的页面
    API.preloadData('devices');
  },

  onHide: function () {
    // 页面隐藏时断开实时连接
    this.disconnectRealTime();

    // 清理搜索定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.activeTimers.delete(this.searchTimer);
      this.searchTimer = null;
      this.isSearching = false;
    }
  },

  onShow: function () {
    // 页面显示时重新连接实时数据
    this.initRealTimeMonitor();

    // 重置重连次数
    this.reconnectAttempts = 0;
  },

  onUnload: function () {
    // 标记页面已销毁，防止异步操作继续执行
    this.isDestroyed = true;

    // 页面卸载时断开实时连接
    this.disconnectRealTime();

    // 清理所有定时器和资源
    this.cleanupResources();

    // 清理性能监控
    if (this.performanceMonitor) {
      this.logPerformanceReport();
      this.performanceMonitor = null;
    }

    // 清理缓存，防止内存泄漏
    if (this.dataCache) {
      this.dataCache.deviceLookup.clear();
      this.dataCache = null;
    }

    if (this.searchCache) {
      this.searchCache.clear();
      this.searchCache = null;
    }

    // 清理定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    if (this.updateStatsTimer) {
      clearTimeout(this.updateStatsTimer);
      this.updateStatsTimer = null;
    }

    // 清理活动定时器
    if (this.activeTimers) {
      this.activeTimers.forEach(timer => {
        clearInterval(timer);
      });
      this.activeTimers.clear();
      this.activeTimers = null;
    }
  },

  // 实时连接相关属性
  socketTask: null,
  isRealTimeConnected: false,
  reconnectAttempts: 0,

  // 搜索相关属性
  searchTimer: null,
  isSearching: false,

  // 性能监控属性 - 移动到onLoad中初始化以避免深拷贝警告
  performanceMonitor: null,

  // 定时器管理 - 移动到onLoad中初始化以避免深拷贝警告
  activeTimers: null,

  // 数据缓存 - 移动到onLoad中初始化以避免深拷贝警告
  dataCache: null,

  /**
   * 初始化性能监控 - 修复WeChat小程序复杂数据结构警告
   */
  initPerformanceMonitor() {
    // 初始化性能监控对象
    this.performanceMonitor = {
      setDataCount: 0,
      searchOperations: 0,
      filterOperations: 0,
      realTimeUpdates: 0,
      memoryUsage: 0,
      lastCleanup: Date.now(),
      startTime: Date.now()
    };

    // 初始化定时器管理
    this.activeTimers = new Set();

    // 初始化数据缓存
    this.dataCache = {
      lastFilterResult: null,
      lastFilterParams: null,
      deviceLookup: new Map()
    };

    // 定期清理资源（每5分钟）
    const cleanupTimer = setInterval(() => {
      this.performResourceCleanup();
    }, 5 * 60 * 1000);

    this.activeTimers.add(cleanupTimer);

    if (this.data.debugMode) {
      console.log('性能监控已初始化');
    }
  },

  /**
   * 优化的setData方法，带性能监控 - 增加安全检查
   */
  optimizedSetData(data, callback) {
    // 安全检查：确保性能监控已初始化
    if (this.performanceMonitor) {
      this.performanceMonitor.setDataCount++;
    }

    // 批量更新优化
    if (this.pendingSetData) {
      Object.assign(this.pendingSetData, data);
      return;
    }

    this.pendingSetData = data;

    // 使用微任务批量执行setData
    Promise.resolve().then(() => {
      const batchData = this.pendingSetData;
      this.pendingSetData = null;

      this.setData(batchData, callback);

      // 性能监控
      if (this.data.debugMode && this.performanceMonitor && this.performanceMonitor.setDataCount % 10 === 0) {
        console.log(`setData调用次数: ${this.performanceMonitor.setDataCount}`);
      }
    });
  },

  /**
   * 资源清理 - 增加安全检查
   */
  cleanupResources() {
    try {
      // 清理搜索定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }

      // 清理所有活跃定时器
      if (this.activeTimers && typeof this.activeTimers.forEach === 'function') {
        this.activeTimers.forEach(timer => {
          clearTimeout(timer);
          clearInterval(timer);
        });
        this.activeTimers.clear();
      }

      // 清理数据缓存
      if (this.dataCache) {
        if (this.dataCache.deviceLookup && typeof this.dataCache.deviceLookup.clear === 'function') {
          this.dataCache.deviceLookup.clear();
        }
        this.dataCache.lastFilterResult = null;
        this.dataCache.lastFilterParams = null;
      }

      if (this.data.debugMode) {
        console.log('资源清理完成');
      }
    } catch (error) {
      console.error('cleanupResources: Error during cleanup', error);
    }
  },

  /**
   * 定期资源清理 - 增加安全检查
   */
  performResourceCleanup() {
    try {
      if (!this.performanceMonitor || !this.dataCache) {
        if (this.data.debugMode) {
          console.warn('performResourceCleanup: 性能监控或数据缓存未初始化');
        }
        return;
      }

      const now = Date.now();
      const timeSinceLastCleanup = now - (this.performanceMonitor.lastCleanup || 0);

      // 每5分钟清理一次缓存
      if (timeSinceLastCleanup > 5 * 60 * 1000) {
        // 清理设备查找缓存
        if (this.dataCache.deviceLookup && typeof this.dataCache.deviceLookup.size === 'number') {
          if (this.dataCache.deviceLookup.size > 1000) {
            this.dataCache.deviceLookup.clear();
          }
        }

        // 重置性能计数器
        if (this.performanceMonitor) {
          this.performanceMonitor.searchOperations = 0;
          this.performanceMonitor.filterOperations = 0;
          this.performanceMonitor.lastCleanup = now;
        }

        if (this.data.debugMode) {
          console.log('定期资源清理完成');
        }
      }
    } catch (error) {
      console.error('performResourceCleanup: Error during cleanup', error);
    }
  },

  /**
   * 性能报告
   */
  logPerformanceReport() {
    const monitor = this.performanceMonitor;
    const runtime = Date.now() - monitor.startTime;

    console.log('=== 设备页面性能报告 ===');
    console.log(`运行时间: ${runtime}ms`);
    console.log(`setData调用次数: ${monitor.setDataCount}`);
    console.log(`搜索操作次数: ${monitor.searchOperations}`);
    console.log(`筛选操作次数: ${monitor.filterOperations}`);
    console.log(`实时更新次数: ${monitor.realTimeUpdates}`);
    console.log(`缓存大小: ${this.dataCache.deviceLookup.size}`);
    console.log('========================');
  },

  /**
   * 初始化设备数据 - 使用API优化功能和缓存机制
   */
  async initDeviceData() {
    try {
      // 显示加载状态
      wx.showLoading({
        title: '加载设备数据...',
        mask: true
      });

      // 使用API.getDataWithCache获取设备数据
      const deviceResult = await API.getDataWithCache('device', { includeStats: true });

      if (deviceResult.success) {
        let devices = deviceResult.data.list;
        devices = this.formatDeviceDataFixed(devices);

        const totalPages = Math.ceil(devices.length / this.data.pageSize);
        const showPagination = devices.length > this.data.pageSize;

        this.setData({
          allDevices: devices,
          devices: devices, // 初始时筛选结果等于全部设备
          filteredDevices: devices, // 初始时筛选结果等于全部设备
          currentPage: 1,
          totalPages: totalPages,
          showPagination: showPagination
        });

        this.loadCurrentPageDevices(1);
      } else {
        throw new Error(deviceResult.message || '获取设备数据失败');
      }

      // 使用API.getDataWithCache获取分组数据
      const groupsResult = await API.getDataWithCache('groups');
      if (groupsResult.success) {
        this.setData({
          deviceGroups: groupsResult.data.list || this.data.deviceGroups
        });
      }

    } catch (error) {
      console.error('初始化设备数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 获取设备图标 - 新的图标映射系统
   */
  getDeviceIcon(deviceType) {
    const iconMapping = {
      // 电气设备
      'air_conditioner': '❄️',
      'lighting': '💡',
      'power_distribution': '⚡',
      'smart_meter': '📊',
      'solar_inverter': '☀️',
      'motor': '⚙️',
      'air_compressor': '🔧',
      'ev_charger': '🔌',
      'ups': '🔋',
      // 水处理设备
      'water_meter': '💧',
      'water_heater': '🔥',
      'water_treatment': '🌊',
      'cooling_water': '❄️',
      'solar_water_heater': '☀️',
      // 燃气设备
      'gas_meter': '🔥',
      'gas_boiler': '🔥',
      'gas_detector': '⚠️',
      // 其他设备
      'environment_monitor': '🌡️',
      'environment_sensor': '🌡️',
      'smart_control': '🎛️'
    };

    return iconMapping[deviceType] || '📱';
  },

  /**
   * 格式化设备数据 - 修复版本
   */
  formatDeviceData(devices) {
    return devices.map(device => {
      // 添加一些UI所需的额外属性
      device.statusText = device.status === 'online' ? '在线' : '离线';
      device.healthStatus = device.hasAlert ? 'warning' : 'good';

      // 根据设备类型设置图标
      switch (device.type) {
        default:
          device.icon = this.getDeviceIcon(device.type);
          break;

        // case 'switch': device.icon = '�'; break; // Handled by getDeviceIcon
        // case 'hvac': device.icon = '❄️'; break; // Handled by getDeviceIcon

      }

      // 格式化功率数据，确保保留一位小数
      if (device.power !== undefined && device.power !== null) {
        device.power = parseFloat(device.power).toFixed(1);
      }

      // 格式化运行时间
      if (device.uptime) {
        const uptimeStr = typeof device.uptime === 'number' ?
          `${Math.floor(device.uptime)}小时${Math.round((device.uptime % 1) * 60)}分钟` :
          device.uptime;
        device.uptime = formatUptime(uptimeStr);
      }

      return device;
    });
  },

  /**
   * 格式化设备数据 - 新版本（修复图标问题）
   */
  formatDeviceDataFixed(devices) {
    return devices.map(device => {
      // 添加一些UI所需的额外属性
      device.statusText = device.status === 'online' ? '在线' : '离线';
      device.healthStatus = device.hasAlert ? 'warning' : 'good';

      // 根据设备类型设置图标 - 使用新的图标映射系统
      device.icon = this.getDeviceIcon(device.type);

      // 格式化功率数据，确保保留一位小数
      if (device.power !== undefined && device.power !== null) {
        device.power = parseFloat(device.power).toFixed(1);
      }

      // 格式化运行时间
      if (device.uptime) {
        const uptimeStr = typeof device.uptime === 'number' ?
          `${Math.floor(device.uptime)}小时${Math.round((device.uptime % 1) * 60)}分钟` :
          device.uptime;
        device.uptime = formatUptime(uptimeStr);
      }

      return device;
    });
  },

  /**
   * 获取设备类型的中文名称 - 用于搜索功能
   */
  getDeviceTypeName(deviceType) {
    const deviceTypeNames = {
      // 电气设备
      'air_conditioner': '空调',
      'lighting': '照明',
      'power_distribution': '配电',
      'smart_meter': '电表',
      'solar_inverter': '逆变器',
      'motor': '电机',
      'air_compressor': '压缩机',
      'ev_charger': '充电桩',
      'ups': 'UPS',
      // 水处理设备
      'water_meter': '水表',
      'water_heater': '热水器',
      'water_treatment': '水处理',
      'cooling_water': '冷却水',
      'solar_water_heater': '太阳能热水器',
      // 燃气设备
      'gas_meter': '燃气表',
      'gas_boiler': '燃气锅炉',
      'gas_detector': '燃气检测器',
      // 其他设备
      'environment_monitor': '环境监测',
      'environment_sensor': '环境传感器',
      'smart_control': '智能控制'
    };

    return deviceTypeNames[deviceType] || deviceType;
  },

  /**
   * 获取设备类别的中文名称 - 用于搜索功能
   */
  getDeviceCategoryName(category) {
    const categoryNames = {
      'electricity': '电力',
      'water': '水务',
      'gas': '燃气',
      'other': '其他'
    };

    return categoryNames[category] || category;
  },

  /**
   * 初始化实时监控 - 增强错误处理
   */
  initRealTimeMonitor() {
    // 获取所有设备ID用于实时监控
    const deviceIds = this.data.allDevices.map(device => device.id);

    if (deviceIds.length === 0) {
      if (this.data.debugMode) {
        console.log('设备列表为空，跳过实时监控初始化');
      }
      return;
    }

    // 避免重复连接
    if (this.isRealTimeConnected && this.socketTask) {
      if (this.data.debugMode) {
        console.log('实时连接已存在，跳过重复初始化');
      }
      return;
    }

    try {
      this.socketTask = API.subscribeRealTimeData({
        deviceIds: deviceIds,

        // 连接成功回调
        onConnect: () => {
          if (this.data.debugMode) {
            console.log('设备页面实时数据连接成功');
          }
          this.isRealTimeConnected = true;
          this.setData({ realTimeStatus: 'connected' });
        },

        // 接收消息回调
        onMessage: (data) => {
          this.handleRealTimeMessage(data);
        },

        // 连接断开回调
        onDisconnect: (event) => {
          if (this.data.debugMode) {
            console.log('设备页面实时数据连接断开:', event);
          }
          this.isRealTimeConnected = false;
          this.setData({ realTimeStatus: 'disconnected' });

          // 尝试重连，但限制重连次数
          if (!this.reconnectAttempts) {
            this.reconnectAttempts = 0;
          }

          if (this.reconnectAttempts < 3) {
            this.reconnectAttempts++;
            setTimeout(() => {
              if (!this.isRealTimeConnected) {
                this.initRealTimeMonitor();
              }
            }, 5000 * this.reconnectAttempts); // 递增延迟
          }
        },

        // 错误回调
        onError: (error) => {
          // 过滤掉 reportRealtimeAction:fail 错误，这是微信小程序的已知问题
          if (error && error.message && error.message.includes('reportRealtimeAction:fail')) {
            if (this.data.debugMode) {
              console.warn('忽略微信小程序reportRealtimeAction错误:', error.message);
            }
            return;
          }

          console.error('设备页面实时数据连接错误:', error);
          this.isRealTimeConnected = false;
          this.setData({ realTimeStatus: 'error' });
        }
      });
    } catch (error) {
      console.error('初始化实时监控失败:', error);
      this.setData({ realTimeStatus: 'error' });
    }
  },

  /**
   * 处理实时消息 - 增强错误处理
   */
  handleRealTimeMessage(message) {
    // 参数验证
    if (!message || typeof message !== 'object') {
      if (this.data.debugMode) {
        console.warn('handleRealTimeMessage: Invalid message', message);
      }
      return;
    }

    try {
      const { type, deviceId, data } = message;

      // 验证必要字段
      if (!type || !deviceId) {
        if (this.data.debugMode) {
          console.warn('handleRealTimeMessage: Missing required fields', { type, deviceId });
        }
        return;
      }

      switch (type) {
        case 'device_update':
          if (data && typeof data === 'object') {
            this.updateDeviceStatus(deviceId, data);
          } else {
            if (this.data.debugMode) {
              console.warn('handleRealTimeMessage: Invalid device_update data', { deviceId, data });
            }
          }
          break;
        case 'device_alert':
          if (data && typeof data === 'object') {
            this.handleDeviceAlert(deviceId, data);
          } else {
            if (this.data.debugMode) {
              console.warn('handleRealTimeMessage: Invalid device_alert data', { deviceId, data });
            }
          }
          break;
        default:
          if (this.data.debugMode) {
            console.warn('handleRealTimeMessage: Unknown message type', { type, deviceId });
          }
          break;
      }
    } catch (error) {
      console.error('handleRealTimeMessage: Critical error', error, { message });
    }
  },

  /**
   * 更新设备状态 - 优化版本，减少内存分配，增强错误处理
   */
  updateDeviceStatus(deviceId, statusData) {
    // 参数验证
    if (!deviceId || !statusData) {
      if (this.data.debugMode) {
        console.warn('updateDeviceStatus: Invalid parameters', { deviceId, statusData });
      }
      return;
    }

    try {
      this.performanceMonitor.realTimeUpdates++;

      // 确保数据结构存在
      const { allDevices = [], filteredDevices = [], devices = [] } = this.data;

      // 使用缓存查找设备索引，增加安全检查
      let deviceIndices = this.dataCache.deviceLookup.get(deviceId);
      if (!deviceIndices) {
        deviceIndices = {
          all: allDevices.findIndex(d => d && d.id === deviceId),
          filtered: filteredDevices.findIndex(d => d && d.id === deviceId),
          display: devices.findIndex(d => d && d.id === deviceId)
        };
        this.dataCache.deviceLookup.set(deviceId, deviceIndices);
      }

      const updateData = {};
      let hasUpdates = false;

      // 更新allDevices中的设备 - 增加设备存在性检查
      if (deviceIndices.all !== -1 && deviceIndices.all < allDevices.length) {
        const device = allDevices[deviceIndices.all];
        if (device && device.id === deviceId) {
          const updates = this.buildDeviceUpdate(device, statusData);

          if (Object.keys(updates).length > 0) {
            Object.keys(updates).forEach(key => {
              updateData[`allDevices[${deviceIndices.all}].${key}`] = updates[key];
            });
            hasUpdates = true;
          }
        } else {
          // 设备不存在或ID不匹配，清除缓存
          this.dataCache.deviceLookup.delete(deviceId);
          if (this.data.debugMode) {
            console.warn('updateDeviceStatus: Device mismatch in allDevices', { deviceId, device });
          }
        }
      }

      // 更新filteredDevices中的设备 - 增加设备存在性检查
      if (deviceIndices.filtered !== -1 && deviceIndices.filtered < filteredDevices.length) {
        const device = filteredDevices[deviceIndices.filtered];
        if (device && device.id === deviceId) {
          const updates = this.buildDeviceUpdate(device, statusData);

          if (Object.keys(updates).length > 0) {
            Object.keys(updates).forEach(key => {
              updateData[`filteredDevices[${deviceIndices.filtered}].${key}`] = updates[key];
            });
            hasUpdates = true;
          }
        } else {
          // 设备不存在或ID不匹配，清除缓存
          this.dataCache.deviceLookup.delete(deviceId);
          if (this.data.debugMode) {
            console.warn('updateDeviceStatus: Device mismatch in filteredDevices', { deviceId, device });
          }
        }
      }

      // 更新当前显示的devices中的设备 - 增加设备存在性检查
      if (deviceIndices.display !== -1 && deviceIndices.display < devices.length) {
        const device = devices[deviceIndices.display];
        if (device && device.id === deviceId) {
          const updates = this.buildDeviceUpdate(device, statusData);

          if (Object.keys(updates).length > 0) {
            Object.keys(updates).forEach(key => {
              updateData[`devices[${deviceIndices.display}].${key}`] = updates[key];
            });
            hasUpdates = true;
          }
        } else {
          // 设备不存在或ID不匹配，清除缓存
          this.dataCache.deviceLookup.delete(deviceId);
          if (this.data.debugMode) {
            console.warn('updateDeviceStatus: Device mismatch in devices', { deviceId, device });
          }
        }
      }

      // 批量更新数据
      if (hasUpdates) {
        this.optimizedSetData(updateData);

        // 异步更新统计信息，避免阻塞
        setTimeout(() => {
          this.updateDeviceStats();
        }, 0);
      }
    } catch (error) {
      console.error('updateDeviceStatus: Critical error', error, {
        deviceId,
        statusData,
        dataStructure: {
          allDevicesLength: this.data.allDevices?.length,
          filteredDevicesLength: this.data.filteredDevices?.length,
          devicesLength: this.data.devices?.length
        }
      });

      // 清除可能损坏的缓存
      this.dataCache.deviceLookup.delete(deviceId);
    }
  },

  /**
   * 构建设备更新对象 - 只包含变化的字段，增强错误处理
   */
  buildDeviceUpdate(currentDevice, statusData) {
    const updates = {};

    // 防御性编程：检查参数有效性
    if (!currentDevice || typeof currentDevice !== 'object') {
      if (this.data.debugMode) {
        console.warn('buildDeviceUpdate: currentDevice is invalid', currentDevice);
      }
      return updates;
    }

    if (!statusData || typeof statusData !== 'object') {
      if (this.data.debugMode) {
        console.warn('buildDeviceUpdate: statusData is invalid', statusData);
      }
      return updates;
    }

    // 安全地比较和更新字段
    try {
      if (statusData.status !== undefined && currentDevice.status !== statusData.status) {
        updates.status = statusData.status;
        updates.statusText = statusData.status === 'online' ? '在线' : '离线';
      }
      if (statusData.power !== undefined && currentDevice.power !== statusData.power) {
        updates.power = statusData.power;
      }
      if (statusData.energy !== undefined && currentDevice.energy !== statusData.energy) {
        updates.energy = statusData.energy;
      }
      if (statusData.timestamp !== undefined && currentDevice.lastUpdate !== statusData.timestamp) {
        updates.lastUpdate = statusData.timestamp;
      }
    } catch (error) {
      console.error('buildDeviceUpdate: Error processing updates', error, {
        currentDevice,
        statusData
      });
    }

    return updates;
  },

  /**
   * 处理设备告警
   */
  handleDeviceAlert(deviceId, alertData) {
    // 更新设备的告警状态
    const { allDevices } = this.data;
    const device = allDevices.find(d => d.id === deviceId);

    if (device) {
      device.hasAlert = true;
      device.healthStatus = 'warning';

      // 显示告警提示
      if (alertData.level === 'high' || alertData.level === 'critical') {
        wx.showToast({
          title: `设备${device.name}发生${alertData.level === 'critical' ? '严重' : '重要'}告警`,
          icon: 'none',
          duration: 3000
        });
      }
    }
  },

  /**
   * 断开实时连接 - 增强版本
   */
  disconnectRealTime() {
    if (this.socketTask) {
      try {
        API.unsubscribeRealTimeData(this.socketTask);
      } catch (error) {
        if (this.data.debugMode) {
          console.warn('断开实时连接时发生错误:', error);
        }
      }
      this.socketTask = null;
    }

    this.isRealTimeConnected = false;
    this.reconnectAttempts = 0; // 重置重连次数
    this.setData({ realTimeStatus: 'disconnected' });
  },

  /**
   * 存储所有设备数据并初始化分页状态
   */
  initPaginationData(devices) {
    const totalPages = Math.ceil(devices.length / this.data.pageSize);
    const showPagination = devices.length > this.data.pageSize;

    this.setData({
      allDevices: devices,
      devices: devices, // 初始时筛选结果等于全部设备
      currentPage: 1,
      totalPages: totalPages,
      showPagination: showPagination,
      hasMore: devices.length > this.data.pageSize // 判断是否有更多数据
    });

    // 严格按照分页逻辑加载第一页数据
    this.loadCurrentPageDevices(1);
  },

  /**
   * 应用筛选条件并更新devices数据 - 优化版本，添加缓存机制
   */
  applyDeviceFilters() {
    // 检查页面是否已销毁
    if (this.isDestroyed) {
      return;
    }

    const { allDevices, searchKeyword, filterType, selectedGroup } = this.data;

    // 生成缓存键
    const cacheKey = `${searchKeyword || ''}_${filterType}_${selectedGroup}`;

    // 检查缓存
    if (this.searchCache && this.searchCache.has(cacheKey)) {
      const cachedResult = this.searchCache.get(cacheKey);
      this.updateFilteredResults(cachedResult);
      return;
    }

    // 性能监控
    if (this.performanceMonitor) {
      this.performanceMonitor.filterOperations++;
    }

    let filtered = allDevices;

    // 应用搜索关键词过滤
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim();
      const isChineseKeyword = /[\u4e00-\u9fa5]/.test(keyword);

      const searchCondition = isChineseKeyword ?
        (text) => text.includes(keyword) :
        (text) => text.toLowerCase().includes(keyword.toLowerCase());

      filtered = filtered.filter(device => {
        const deviceName = (device.name || '').toString();
        const deviceLocation = (device.location || '').toString();
        const deviceType = (device.type || '').toString();
        const deviceId = (device.id || '').toString();
        const deviceTypeName = this.getDeviceTypeName(device.type);
        const deviceCategoryName = this.getDeviceCategoryName(device.category);

        return searchCondition(deviceName) ||
          searchCondition(deviceLocation) ||
          searchCondition(deviceType) ||
          searchCondition(deviceTypeName) ||
          searchCondition(deviceCategoryName) ||
          searchCondition(deviceId);
      });
    }

    // 应用设备类型和状态过滤
    if (filterType !== 'all') {
      if (filterType === 'offline') {
        filtered = filtered.filter(device => (device.status || 'offline') === 'offline');
      } else if (filterType === 'online') {
        filtered = filtered.filter(device => (device.status || 'offline') === 'online');
      } else if (filterType === 'alert') {
        filtered = filtered.filter(device => {
          const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
          const hasAlert = device.hasAlert === true;
          return hasAlerts || hasAlert;
        });
      } else if (filterType === 'abnormal') {
        filtered = filtered.filter(device => {
          const healthStatus = device.healthStatus || 'good';
          const status = device.status || 'offline';
          const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
          const hasAlert = device.hasAlert === true;
          const isOnlineButAbnormal = status !== 'offline' && (
            healthStatus === 'error' ||
            healthStatus === 'warning' ||
            status === 'alarm' ||
            status === 'maintenance' ||
            status === 'degraded' ||
            hasAlerts ||
            hasAlert
          );
          return isOnlineButAbnormal;
        });
      } else if (filterType === 'healthy') {
        filtered = filtered.filter(device => {
          const status = device.status || 'offline';
          const healthStatus = device.healthStatus || 'good';
          const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
          const hasAlert = device.hasAlert === true;
          const isHealthyStatus = ['online', 'idle'].includes(status);
          const isHealthyCondition = healthStatus === 'good';
          const hasNoAlerts = !hasAlerts && !hasAlert;
          return isHealthyStatus && isHealthyCondition && hasNoAlerts;
        });
      } else {
        // 设备类型过滤
        filtered = this.filterDevicesByType(filtered, filterType);
      }
    }

    // 应用分组过滤
    if (selectedGroup !== 'all') {
      const selectedGroupData = this.data.deviceGroups.find(g => g.id === selectedGroup);
      if (selectedGroupData && selectedGroupData.deviceIds) {
        filtered = filtered.filter(device => selectedGroupData.deviceIds.includes(device.id));
      }
    }

    // 缓存筛选结果
    if (this.searchCache) {
      // 限制缓存大小，防止内存泄漏
      if (this.searchCache.size > 50) {
        const firstKey = this.searchCache.keys().next().value;
        this.searchCache.delete(firstKey);
      }
      this.searchCache.set(cacheKey, filtered);
    }

    // 更新筛选结果
    this.updateFilteredResults(filtered);
  },

  /**
   * 更新筛选结果 - 提取公共逻辑
   */
  updateFilteredResults(filtered) {
    const totalPages = Math.ceil(filtered.length / this.data.pageSize);
    const showPagination = filtered.length > this.data.pageSize;

    this.setData({
      devices: filtered,
      filteredDevices: filtered, // 同时更新 filteredDevices
      totalPages: totalPages,
      showPagination: showPagination,
      hasMore: filtered.length > this.data.pageSize
    });

    // 重新加载第一页数据
    this.loadCurrentPageDevices(1);
  },

  /**
   * 加载当前页的设备数据 - 从devices中分页取出数据显示
   * @param {number} page 页码
   */
  loadCurrentPageDevices(page = 1) {
    const { devices, pageSize, batchMode, selectedDevices } = this.data;

    // 计算分页数据
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageDevices = devices.slice(startIndex, endIndex);

    // 为每个设备添加选中状态标识
    const devicesWithSelection = pageDevices.map(device => ({
      ...device,
      isSelected: selectedDevices.includes(device.id)
    }));

    // 判断是否还有更多数据
    const hasMore = endIndex < devices.length;

    // 批量模式下的特殊处理：清理无效的选择项
    let updatedSelectedDevices = selectedDevices;
    if (batchMode && selectedDevices.length > 0) {
      // 获取所有有效的设备ID（当前筛选结果中的设备）
      const validDeviceIds = devices.map(device => device.id);
      // 过滤掉不在当前数据源中的选择项
      updatedSelectedDevices = selectedDevices.filter(deviceId =>
        validDeviceIds.includes(deviceId)
      );

      // 如果选择项发生了变化，提示用户
      if (updatedSelectedDevices.length !== selectedDevices.length) {
        const removedCount = selectedDevices.length - updatedSelectedDevices.length;
        wx.showToast({
          title: `已清理${removedCount}个无效选择`,
          icon: 'none',
          duration: 2000
        });
      }
    }

    this.setData({
      currentPageDevices: devicesWithSelection, // 当前页显示的设备列表（包含选中状态）
      currentPage: page,
      hasMore,
      loadingMore: false,
      selectedDevices: updatedSelectedDevices // 更新选择项
    });

    // 重置滚动位置到顶部，解决页码切换后显示异常的问题
    this.resetScrollPosition();

    // 更新全选按钮文本
    this.updateSelectAllText();

    // 更新统计数据
    this.updateDeviceStats();
  },

  /**
   * 重置滚动位置到顶部
   */
  resetScrollPosition() {
    // 使用setData更新scroll-view的scroll-top属性来重置滚动位置
    this.setData({
      scrollTop: 0
    });

    // 延迟一帧后再次设置，确保滚动重置生效
    wx.nextTick(() => {
      this.setData({
        scrollTop: 0
      });
    });
  },





  /**
   * 页码导航 - 上一页
   */
  onPrevPage() {
    const { currentPage } = this.data;
    if (currentPage > 1) {
      // 显示加载状态
      wx.showLoading({ title: '加载中...' });

      this.loadCurrentPageDevices(currentPage - 1);

      // 滚动到设备列表区域
      setTimeout(() => {
        wx.pageScrollTo({
          selector: '.device-scroll-container',
          duration: 300,
          success: () => {
            wx.hideLoading();
          },
          fail: () => {
            wx.pageScrollTo({
              scrollTop: 0,
              duration: 300
            });
            wx.hideLoading();
          }
        });
      }, 100);
    }
  },

  /**
   * 页码导航 - 下一页
   */
  onNextPage() {
    const { currentPage, totalPages } = this.data;
    if (currentPage < totalPages) {
      // 显示加载状态
      wx.showLoading({ title: '加载中...' });

      this.loadCurrentPageDevices(currentPage + 1);

      // 滚动到设备列表区域
      setTimeout(() => {
        wx.pageScrollTo({
          selector: '.device-scroll-container',
          duration: 300,
          success: () => {
            wx.hideLoading();
          },
          fail: () => {
            wx.pageScrollTo({
              scrollTop: 0,
              duration: 300
            });
            wx.hideLoading();
          }
        });
      }, 100);
    }
  },

  /**
   * 页码导航 - 跳转到指定页
   * @param {Event} e 事件对象
   */
  onGoToPage(e) {
    const page = parseInt(e.currentTarget.dataset.page);
    const { totalPages } = this.data;
    if (page >= 1 && page <= totalPages) {
      // 显示加载状态
      wx.showLoading({ title: '加载中...' });

      this.loadCurrentPageDevices(page);

      // 滚动到设备列表区域，提升用户体验
      setTimeout(() => {
        wx.pageScrollTo({
          selector: '.device-scroll-container',
          duration: 300,
          success: () => {
            wx.hideLoading();
          },
          fail: () => {
            // 如果选择器失败，滚动到页面顶部
            wx.pageScrollTo({
              scrollTop: 0,
              duration: 300
            });
            wx.hideLoading();
          }
        });
      }, 100); // 延迟确保数据已更新
    }
  },

  /**
   * 设备列表滚动到底部时的处理函数（保留用于兼容性）
   */
  onLoadMore() {
    // 当启用页码导航时，不再使用滚动加载
    if (this.data.showPagination) {
      return;
    }

    const { hasMore, loadingMore } = this.data;

    // 如果没有更多数据或正在加载，则返回
    if (!hasMore || loadingMore) {
      return;
    }

    // 设置加载状态
    this.setData({ loadingMore: true });

    // 模拟网络延迟
    setTimeout(() => {
      const nextPage = this.data.currentPage + 1;
      this.loadCurrentPageDevices(nextPage);
    }, 500);
  },

  /**
   * 页面上拉触底事件的处理函数（保留但不再使用）
   */
  onReachBottom() {
    // 现在使用scroll-view的onLoadMore方法处理分页
    // 此方法保留以防其他地方需要
  },

  /**
   * 更新设备统计数据
   */
  updateDeviceStats() {
    const { allDevices } = this.data;
    const currentStats = this.data.deviceStats;

    // 计算设备类型分布 - 基于实际设备类别和类型映射
    const typeMapping = {
      'meter': ['smart_meter', 'water_meter', 'gas_meter'], // 计量设备
      'sensor': ['environment_sensor', 'environment_monitor', 'gas_detector'], // 传感器设备
      'electrical': ['lighting', 'solar_inverter', 'motor', 'air_compressor', 'ev_charger', 'ups', 'power_distribution'], // 电气设备
      'hvac': ['air_conditioner'], // 空调设备
      'heating': ['water_heater', 'solar_water_heater', 'gas_boiler'], // 加热设备
      'water': ['cooling_water', 'water_treatment'], // 水处理设备
      'control': ['smart_control'] // 智能控制设备
    };

    // 计算各类型设备数量
    const meterDevices = allDevices.filter(d => typeMapping.meter.includes(d.type)).length;
    const sensorDevices = allDevices.filter(d => typeMapping.sensor.includes(d.type)).length;
    const electricalDevices = allDevices.filter(d => typeMapping.electrical.includes(d.type)).length;
    const hvacDevices = allDevices.filter(d => typeMapping.hvac.includes(d.type)).length;
    const heatingDevices = allDevices.filter(d => typeMapping.heating.includes(d.type)).length;
    const waterDevices = allDevices.filter(d => typeMapping.water.includes(d.type)).length;
    const controlDevices = allDevices.filter(d => typeMapping.control.includes(d.type)).length;

    // 计算未分类设备
    const allMappedTypes = Object.values(typeMapping).flat();
    const otherDevices = allDevices.filter(d => !allMappedTypes.includes(d.type)).length;

    // 计算告警严重程度分布 - 基于所有设备数据
    let criticalAlerts = 0;
    let warningAlerts = 0;
    let infoAlerts = 0;

    allDevices.forEach(device => {
      if (device.alerts && device.alerts.length > 0) {
        device.alerts.forEach(alert => {
          switch (alert.severity) {
            case 'critical':
              criticalAlerts++;
              break;
            case 'warning':
              warningAlerts++;
              break;
            case 'info':
              infoAlerts++;
              break;
          }
        });
      }
    });

    // 计算健康度 - 基于所有设备的状态和详细健康信息
    const totalDevices = allDevices.length;
    const onlineDevices = allDevices.filter(d => d.status === 'online').length;
    const alertDevices = allDevices.filter(d => d.hasAlert).length;

    // 增强的健康度计算系统
    let totalHealthScore = 0;
    let deviceCount = 0;

    allDevices.forEach(device => {
      let deviceHealthScore = 0;

      // 如果设备有详细健康信息，使用详细计算
      if (device.healthDetails) {
        const {
          operationalScore = 85,
          maintenanceScore = 85,
          performanceScore = 85,
          reliabilityScore = 85
        } = device.healthDetails;

        // 加权平均：运行状态30%，维护状态25%，性能25%，可靠性20%
        deviceHealthScore = Math.round(
          operationalScore * 0.30 +
          maintenanceScore * 0.25 +
          performanceScore * 0.25 +
          reliabilityScore * 0.20
        );
      } else {
        // 传统计算方式作为后备
        let baseScore = 85; // 基础分数

        // 设备状态评分
        if (device.status === 'online') {
          baseScore += 10;
        } else if (device.status === 'offline') {
          baseScore -= 30;
        } else if (device.status === 'alarm') {
          baseScore -= 20;
        } else if (device.status === 'maintenance') {
          baseScore -= 5;
        }

        // 告警状态评分
        if (device.hasAlert) {
          baseScore -= 15;
        }

        // 维护状态评分
        if (device.maintenanceStatus === 'normal') {
          baseScore += 5;
        } else if (device.maintenanceStatus === 'warning') {
          baseScore -= 10;
        } else if (device.maintenanceStatus === 'required') {
          baseScore -= 15;
        }

        // 能效等级评分
        if (device.energyEfficiency === 'A+') {
          baseScore += 5;
        } else if (device.energyEfficiency === 'A') {
          baseScore += 3;
        } else if (device.energyEfficiency === 'B') {
          baseScore -= 5;
        } else if (device.energyEfficiency === 'C') {
          baseScore -= 10;
        }

        // 运行时间评分（运行时间越长，可能需要更多维护）
        const uptime = device.uptime || 0;
        if (uptime > 10000) {
          baseScore -= 5;
        } else if (uptime > 5000) {
          baseScore -= 2;
        }

        deviceHealthScore = Math.max(0, Math.min(100, baseScore));
      }

      totalHealthScore += deviceHealthScore;
      deviceCount++;
    });

    // 计算平均健康度
    const healthScore = deviceCount > 0 ? Math.round(totalHealthScore / deviceCount) : 0;

    // 根据健康度确定健康等级和颜色
    let healthLevel = 'success';
    let healthColor = '#10B981';

    if (healthScore < 60) {
      healthLevel = 'error';
      healthColor = '#EF4444';
    } else if (healthScore < 75) {
      healthLevel = 'warning';
      healthColor = '#F59E0B';
    } else if (healthScore < 90) {
      healthLevel = 'success';
      healthColor = '#10B981';
    } else {
      healthLevel = 'success';
      healthColor = '#059669'; // 更深的绿色表示优秀
    }

    const stats = {
      ...currentStats, // 保留其他字段
      total: totalDevices, // 使用所有设备数据计算总数
      online: onlineDevices,
      alerts: alertDevices,

      // 更新健康度相关数据
      healthScore: healthScore,
      healthLevel: healthLevel,
      healthColor: healthColor,

      // 设备类型分布 - 修复后的完整统计
      meterDevices,
      sensorDevices,
      electricalDevices,
      hvacDevices,
      heatingDevices,
      waterDevices,
      controlDevices,
      otherDevices,
      // 告警严重程度分布
      criticalAlerts,
      warningAlerts,
      infoAlerts
    };

    this.setData({ deviceStats: stats });
  },

  /**
   * 刷新设备数据 - 使用API优化功能和缓存机制
   */
  async refreshDeviceData(forceRefresh = false) {
    let loadingShown = false;
    try {
      // 显示刷新状态
      this.setData({
        isRefreshing: true
      });

      // 如果是强制刷新，显示加载提示
      if (forceRefresh) {
        wx.showLoading({
          title: '刷新数据中...',
          mask: true
        });
        loadingShown = true;
      }

      // 使用增强版数据获取接口，支持缓存机制
      const deviceResult = await API.getDataWithCache('device', {
        includeStats: true // 包含统计信息
      }, {
        forceRefresh: forceRefresh, // 是否强制刷新
        useCache: !forceRefresh, // 是否使用缓存
        cacheExpiration: 3 * 60 * 1000 // 设备数据缓存3分钟
      });

      if (deviceResult.success) {
        let devices = deviceResult.data.list;

        // 使用格式化方法处理设备数据
        devices = this.formatDeviceDataFixed(devices);

        // 计算总页数和分页状态
        const totalPages = Math.ceil(devices.length / this.data.pageSize);
        const showPagination = devices.length > this.data.pageSize;

        // 更新设备数据
        this.setData({
          allDevices: devices,
          devices: devices, // 刷新后重置筛选结果
          filteredDevices: devices, // 刷新后重置筛选结果
          currentPage: 1,
          totalPages: totalPages,
          showPagination: showPagination,
          hasMore: devices.length > this.data.pageSize,
          // 更新设备统计数据
          deviceStats: {
            ...this.data.deviceStats,
            total: deviceResult.data.summary?.total || devices.length,
            online: deviceResult.data.summary?.online || devices.filter(d => d.status === 'online').length,
            alerts: deviceResult.data.summary?.alarm || devices.filter(d => d.hasAlert).length
          }
        });

        // 重新加载第一页数据
        this.loadCurrentPageDevices(1);

        // 显示刷新成功提示
        wx.showToast({
          title: '数据已更新',
          icon: 'success',
          duration: 1500
        });

        // 如果实时连接断开，尝试重新连接
        if (!this.isRealTimeConnected) {
          this.initRealTimeMonitor();
        }
      } else {
        throw new Error(deviceResult.message || '获取设备数据失败');
      }
    } catch (error) {
      console.error('刷新设备数据失败:', error);
      // 请求失败处理
      wx.showToast({
        title: '刷新数据失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      // 确保hideLoading与showLoading配对
      if (loadingShown) {
        wx.hideLoading();
      }

      // 无论成功失败，都结束刷新状态
      this.setData({
        isRefreshing: false
      });
    }
  },

  /**
   * 搜索按钮点击
   */
  onSearch() {
    this.setData({
      showSearch: !this.data.showSearch
    });
  },

  /**
   * 筛选按钮点击
   */
  onFilter() {
    this.setData({
      showGroups: !this.data.showGroups
    });
  },



  /**
   * 搜索输入处理 - 修复函数名匹配WXML绑定
   */
  onSearchInput(e) {
    const newKeyword = e.detail.value;

    // 避免重复设置相同的搜索关键词
    if (this.data.searchKeyword === newKeyword) {
      return;
    }

    this.setData({
      searchKeyword: newKeyword
    });

    // 实时搜索，但添加防抖以提高性能
    this.debounceSearch();
  },

  /**
   * 搜索设备 - 保留原有函数以兼容其他调用
   */
  onSearchDevice(e) {
    const newKeyword = e.detail.value;

    // 避免重复设置相同的搜索关键词
    if (this.data.searchKeyword === newKeyword) {
      return;
    }

    this.setData({
      searchKeyword: newKeyword
    });
    this.applyFilters();
  },

  /**
   * 搜索防抖处理 - 增强版本，避免重复执行，增加安全检查和WeChat小程序优化
   */
  debounceSearch() {
    try {
      // 清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        if (this.activeTimers && typeof this.activeTimers.delete === 'function') {
          this.activeTimers.delete(this.searchTimer);
        }
      }

      // 标记搜索状态，避免重复触发
      this.isSearching = true;

      // WeChat小程序优化：使用较短的防抖时间以提升响应性
      const debounceTime = 250;

      // 设置新的定时器
      this.searchTimer = setTimeout(() => {
        try {
          // 检查页面是否仍然存在（防止页面销毁后执行）
          if (!this.data || this.isDestroyed) {
            this.isSearching = false;
            return;
          }

          // 检查是否仍在搜索状态
          if (this.isSearching) {
            this.applyFilters();
            this.isSearching = false;
          }

          if (this.activeTimers && typeof this.activeTimers.delete === 'function') {
            this.activeTimers.delete(this.searchTimer);
          }
        } catch (error) {
          console.error('debounceSearch: Error in timeout callback', error);
          this.isSearching = false;

          // WeChat小程序错误上报（可选）
          if (wx.reportMonitor) {
            wx.reportMonitor('search_debounce_error', 1);
          }
        }
      }, debounceTime);

      if (this.activeTimers && typeof this.activeTimers.add === 'function') {
        this.activeTimers.add(this.searchTimer);
      }
    } catch (error) {
      console.error('debounceSearch: Error setting up debounce', error);
      this.isSearching = false;

      // WeChat小程序错误上报（可选）
      if (wx.reportMonitor) {
        wx.reportMonitor('search_setup_error', 1);
      }
    }
  },

  /**
   * 确认搜索
   */
  onSearchConfirm() {
    this.applyFilters();
  },

  /**
   * 设备类型和状态筛选 - 修复缓存导致的筛选错误问题
   */
  onFilterType(e) {
    const type = e.currentTarget.dataset.type;
    const currentFilterType = this.data.filterType;

    // 如果筛选类型发生变化，清除缓存以确保正确应用新筛选
    if (currentFilterType !== type && this.dataCache) {
      this.dataCache.lastFilterResult = null;
      this.dataCache.lastFilterParams = null;

      if (this.data.debugMode) {
        console.log(`[DEBUG] 筛选类型从 "${currentFilterType}" 切换到 "${type}"，已清除缓存`);
      }
    }

    // 先计算筛选结果数量
    const filteredCount = this.calculateFilteredCount(type);

    // 使用同步的setData更新筛选类型，确保状态立即更新
    this.setData({
      filterType: type
    }, () => {
      // 在setData回调中执行筛选，确保状态已更新
      this.applyFilters({ filterType: type });

      if (this.data.debugMode) {
        console.log(`[DEBUG] 筛选类型已更新为: ${type}，开始应用筛选`);
      }
    });

    // 显示筛选结果提示 - 使用预先计算的筛选结果数量
    if (type !== 'all') {
      const filterNames = {
        // 设备状态筛选
        'offline': '离线设备',
        'alert': '告警设备',
        'abnormal': '异常设备',
        'healthy': '正常设备',
        // 设备类型筛选 - 修复显示名称
        'meter': '计量设备',
        'sensor': '传感器设备',
        'electrical': '电气设备',
        'hvac': '空调设备',
        'heating': '加热设备',
        'water': '水处理设备',
        'control': '智能控制设备'
      };
      const filterName = filterNames[type] || `${type}类型设备`;
      wx.showToast({
        title: `已筛选${filterName}：${filteredCount}个`,
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 计算筛选结果数量 - 简化版本，直接计算筛选逻辑
   */
  calculateFilteredCount(targetFilterType) {
    const { allDevices, searchKeyword, selectedGroup } = this.data;
    const filterType = targetFilterType || this.data.filterType;
    let filtered = allDevices;

    // 应用搜索关键词过滤
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim();
      const isChineseKeyword = /[\u4e00-\u9fa5]/.test(keyword);
      const searchCondition = isChineseKeyword ?
        (text) => text.includes(keyword) :
        (text) => text.toLowerCase().includes(keyword.toLowerCase());

      filtered = filtered.filter(device => {
        const deviceName = (device.name || '').toString();
        const deviceLocation = (device.location || '').toString();
        const deviceType = (device.type || '').toString();
        const deviceId = (device.id || '').toString();
        const deviceTypeName = this.getDeviceTypeName(device.type);
        const deviceCategoryName = this.getDeviceCategoryName(device.category);

        return searchCondition(deviceName) ||
          searchCondition(deviceLocation) ||
          searchCondition(deviceType) ||
          searchCondition(deviceTypeName) ||
          searchCondition(deviceCategoryName) ||
          searchCondition(deviceId);
      });
    }

    // 应用设备类型和状态过滤
    if (filterType !== 'all') {
      if (filterType === 'offline') {
        filtered = filtered.filter(device => (device.status || 'offline') === 'offline');
      } else if (filterType === 'online') {
        filtered = filtered.filter(device => (device.status || 'offline') === 'online');
      } else if (filterType === 'alert') {
        filtered = filtered.filter(device => {
          const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
          const hasAlert = device.hasAlert === true;
          return hasAlerts || hasAlert;
        });
      } else if (filterType === 'abnormal') {
        filtered = filtered.filter(device => {
          const healthStatus = device.healthStatus || 'good';
          const status = device.status || 'offline';
          const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
          const hasAlert = device.hasAlert === true;
          const isOnlineButAbnormal = status !== 'offline' && (
            healthStatus === 'error' ||
            healthStatus === 'warning' ||
            status === 'alarm' ||
            status === 'maintenance' ||
            status === 'degraded' ||
            hasAlerts ||
            hasAlert
          );
          return isOnlineButAbnormal;
        });
      } else if (filterType === 'healthy') {
        filtered = filtered.filter(device => {
          const status = device.status || 'offline';
          const healthStatus = device.healthStatus || 'good';
          const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
          const hasAlert = device.hasAlert === true;
          const isHealthyStatus = ['online', 'idle'].includes(status);
          const isHealthyCondition = healthStatus === 'good';
          const hasNoAlerts = !hasAlerts && !hasAlert;
          return isHealthyStatus && isHealthyCondition && hasNoAlerts;
        });
      } else {
        filtered = this.filterDevicesByType(filtered, filterType);
      }
    }

    // 应用分组过滤
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(device => (device.group || '') === selectedGroup);
    }

    return filtered.length;
  },

  /**
   * 选择设备分组
   */
  onSelectGroup(e) {
    const group = e.currentTarget.dataset.group;
    this.setData({
      selectedGroup: group
    });
    this.applyFilters();
  },

  /**
   * 应用所有筛选条件并更新设备列表 - 简化版本，统一使用applyDeviceFilters
   * @param {Object} overrides - 可选的筛选条件覆盖参数
   */
  applyFilters(overrides = {}) {
    const startTime = Date.now();

    // 安全检查：确保性能监控已初始化
    if (this.performanceMonitor) {
      this.performanceMonitor.filterOperations++;
    }

    // 如果有覆盖参数，先更新到data中
    if (Object.keys(overrides).length > 0) {
      this.setData(overrides);
    }

    // 应用筛选条件并更新devices数据
    this.applyDeviceFilters();

    if (this.data.debugMode) {
      console.log(`筛选完成，结果数量: ${this.data.devices.length}，耗时: ${Date.now() - startTime}ms`);
    }
  },

  /**
   * 管理分组 - 跳转到设备分组管理页面
   */
  onManageGroups() {
    // wx.navigateTo({
    //   url: '/pages/group-management/group-management'
    // });
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
  },

  /**
   * 实时刷新数据
   */
  onRefresh() {
    this.setData({ isRefreshing: true });

    // 模拟刷新延迟
    setTimeout(() => {
      this.refreshDeviceData();
      this.updatePerformanceData();
      this.setData({ isRefreshing: false });

      wx.showToast({
        title: '刷新完成',
        icon: 'success',
        duration: 1500
      });
    }, 1500);
  },

  /**
   * 切换批量操作模式
   */
  onBatchMode() {
    const batchMode = !this.data.batchMode;
    this.setData({
      batchMode,
      selectedDevices: [] // 清空已选设备
    });

    // 更新全选按钮文本
    this.updateSelectAllText();

    wx.showToast({
      title: batchMode ? '进入批量模式' : '退出批量模式',
      icon: 'none'
    });
  },

  /**
   * 选择设备（批量模式）
   */
  onSelectDevice(e) {
    if (!this.data.batchMode) return;

    const deviceId = e.currentTarget.dataset.deviceId;
    const { selectedDevices, devices, currentPageDevices } = this.data;
    const index = selectedDevices.indexOf(deviceId);

    if (index > -1) {
      // 取消选择
      selectedDevices.splice(index, 1);
    } else {
      // 添加选择
      selectedDevices.push(deviceId);
    }

    // 更新设备列表中的选中状态
    const updatedDevices = devices.map(device => ({
      ...device,
      isSelected: selectedDevices.includes(device.id)
    }));

    // 更新当前页设备列表中的选中状态
    const updatedCurrentPageDevices = currentPageDevices.map(device => ({
      ...device,
      isSelected: selectedDevices.includes(device.id)
    }));

    this.setData({
      selectedDevices,
      devices: updatedDevices,
      currentPageDevices: updatedCurrentPageDevices
    });

    // 更新全选按钮文本
    this.updateSelectAllText();
  },

  /**
   * 全选/取消全选 - 在分页模式下只选择当前页面的设备
   */
  onSelectAll() {
    const { selectedDevices, devices, showPagination, currentPageDevices } = this.data;

    // 在分页模式下，只操作当前页面的设备
    const targetDevices = showPagination ? devices : (this.data.filteredDevices || devices || []);
    const currentPageDeviceIds = targetDevices && targetDevices.length > 0 ? targetDevices.map(d => d.id) : [];

    // 检查当前页面的设备是否全部被选中
    const allCurrentPageSelected = currentPageDeviceIds.every(id =>
      selectedDevices.includes(id)
    );

    let updatedSelectedDevices;
    if (allCurrentPageSelected) {
      // 取消选择当前页面的所有设备
      updatedSelectedDevices = selectedDevices.filter(id =>
        !currentPageDeviceIds.includes(id)
      );
    } else {
      // 选择当前页面的所有设备（保留其他页面的选择）
      updatedSelectedDevices = [...selectedDevices];
      currentPageDeviceIds.forEach(id => {
        if (!updatedSelectedDevices.includes(id)) {
          updatedSelectedDevices.push(id);
        }
      });
    }

    // 更新设备列表中的选中状态
    const updatedDevices = this.data.devices.map(device => ({
      ...device,
      isSelected: updatedSelectedDevices.includes(device.id)
    }));

    // 更新当前页设备列表中的选中状态
    const updatedCurrentPageDevices = currentPageDevices.map(device => ({
      ...device,
      isSelected: updatedSelectedDevices.includes(device.id)
    }));

    this.setData({
      selectedDevices: updatedSelectedDevices,
      devices: updatedDevices,
      currentPageDevices: updatedCurrentPageDevices
    });

    // 更新全选按钮文本
    this.updateSelectAllText();

    // 提示用户操作结果
    const action = allCurrentPageSelected ? '取消选择' : '选择';
    const pageInfo = showPagination ? `当前页${currentPageDeviceIds.length}个` : '全部';
    wx.showToast({
      title: `${action}${pageInfo}设备`,
      icon: 'none',
      duration: 1500
    });
  },

  /**
   * 取消批量操作
   */
  onCancelBatch() {
    // 更新设备列表中的选中状态
    const updatedDevices = this.data.devices.map(device => ({
      ...device,
      isSelected: false
    }));

    // 更新当前页设备列表中的选中状态
    const updatedCurrentPageDevices = this.data.currentPageDevices.map(device => ({
      ...device,
      isSelected: false
    }));

    this.setData({
      batchMode: false,
      selectedDevices: [],
      devices: updatedDevices,
      currentPageDevices: updatedCurrentPageDevices
    });

    // 更新全选按钮文本
    this.updateSelectAllText();
  },

  /**
   * 批量控制设备
   */
  onBatchControl(e) {
    const action = e.currentTarget.dataset.action;
    const { selectedDevices } = this.data;

    if (selectedDevices.length === 0) {
      wx.showToast({
        title: '请先选择设备',
        icon: 'none'
      });
      return;
    }

    const actionText = {
      start: '启动',
      stop: '停止',
      restart: '重启'
    }[action];

    wx.showModal({
      title: '确认操作',
      content: `确定要${actionText}选中的${selectedDevices.length}个设备吗？`,
      success: function (res) {
        if (res.confirm) {
          // 执行批量操作
          wx.showLoading({ title: `正在${actionText}设备...` });

          setTimeout(function () {
            wx.hideLoading();
            wx.showToast({
              title: `${actionText}完成`,
              icon: 'success'
            });

            // 退出批量模式
            this.setData({
              batchMode: false,
              selectedDevices: []
            });

            // 刷新设备数据
            this.refreshDeviceData();
          }.bind(this), 2000);
        }
      }.bind(this)
    });
  },

  /**
   * 批量删除设备
   */
  onBatchDelete() {
    const { selectedDevices } = this.data;

    if (selectedDevices.length === 0) {
      wx.showToast({
        title: '请先选择设备',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的${selectedDevices.length}个设备吗？此操作不可恢复。`,
      confirmColor: '#FF4444',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({ title: '正在删除设备...' });

          setTimeout(function () {
            wx.hideLoading();
            wx.showToast({
              title: '删除完成',
              icon: 'success'
            });

            // 退出批量模式
            this.setData({
              batchMode: false,
              selectedDevices: []
            });

            // 刷新设备数据
            this.refreshDeviceData();
          }.bind(this), 2000);
        }
      }.bind(this)
    });
  },

  /**
   * 清空搜索 - 增强版本
   */
  onClearSearch() {
    // 清除搜索定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    this.setData({
      searchKeyword: ''
    });

    // 立即应用过滤
    this.applyFilters();

    // 提供用户反馈
    wx.showToast({
      title: '已清空搜索',
      icon: 'success',
      duration: 1000
    });
  },

  /**
   * 添加设备
   */
  onAddDevice() {
    wx.navigateTo({
      url: '/pages/add-device/add-device'
    });
  },

  /**
   * 设备详情
   */
  onDeviceDetail(e) {
    const device = e.currentTarget.dataset.device;
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?deviceId=${device.id}`
    });
  },

  /**
   * 设备控制
   */
  onDeviceControl(e) {
    const device = e.currentTarget.dataset.device;

    if (device.status === 'offline') {
      wx.showToast({
        title: '设备离线，无法控制',
        icon: 'none'
      });
      return;
    }

    // 显示控制选项
    wx.showActionSheet({
      itemList: ['开启设备', '关闭设备', '重启设备', '查看详情'],
      success: function (res) {
        switch (res.tapIndex) {
          case 0:
            this.controlDevice(device.id, 'on');
            break;
          case 1:
            this.controlDevice(device.id, 'off');
            break;
          case 2:
            this.controlDevice(device.id, 'restart');
            break;
          case 3:
            // 直接跳转到设备详情，不调用onDeviceDetail函数避免参数问题
            wx.navigateTo({
              url: `/pages/device-detail/device-detail?deviceId=${device.id}`
            });
            break;
        }
      }.bind(this)
    });
  },

  /**
   * 设备菜单
   */
  onDeviceMenu: function (e) {
    const device = e.currentTarget.dataset.device;

    wx.showActionSheet({
      itemList: ['查看详情', '编辑设备', '设备设置', '删除设备'],
      success: function (res) {
        switch (res.tapIndex) {
          case 0:
            // 直接跳转到设备详情，不调用onDeviceDetail函数避免参数问题
            wx.navigateTo({
              url: `/pages/device-detail/device-detail?deviceId=${device.id}`
            });
            break;
          case 1:
            this.editDevice(device);
            break;
          case 2:
            this.deviceSettings(device);
            break;
          case 3:
            this.deleteDevice(device);
            break;
        }
      }.bind(this) // 绑定this上下文
    });
  },

  /**
   * 控制设备
   */
  controlDevice(deviceId, action) {
    wx.showLoading({
      title: '控制中...'
    });

    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '控制成功',
        icon: 'success'
      });

      // 刷新设备状态
      this.refreshDeviceData();
    }, 1000);
  },

  /**
   * 编辑设备
   */
  editDevice(device) {
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
  },

  /**
   * 设备设置
   */
  deviceSettings(device) {
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
  },

  /**
   * 按设备类型筛选设备 - 修复筛选错误的新方法
   * @param {Array} devices - 要筛选的设备列表
   * @param {string} filterType - 筛选类型
   * @returns {Array} 筛选后的设备列表
   */
  filterDevicesByType(devices, filterType) {
    // 设备类型映射 - 确保映射正确
    const DEVICE_TYPE_MAPPING = {
      'meter': ['smart_meter', 'water_meter', 'gas_meter'], // 计量设备：智能电表、智能水表、智能燃气表
      'sensor': ['environment_sensor', 'environment_monitor', 'gas_detector'], // 传感器设备：环境传感器、环境监测站、燃气检测器
      'electrical': ['lighting', 'solar_inverter', 'motor', 'air_compressor', 'ev_charger', 'ups', 'power_distribution'], // 电气设备
      'hvac': ['air_conditioner'], // 空调设备
      'heating': ['water_heater', 'solar_water_heater', 'gas_boiler'], // 加热设备
      'water': ['cooling_water', 'water_treatment'], // 水处理设备
      'control': ['smart_control'] // 智能控制设备
    };

    // 调试日志
    if (this.data.debugMode) {
      console.log(`[DEBUG] filterDevicesByType - 筛选类型: ${filterType}`);
      console.log(`[DEBUG] 输入设备数量: ${devices.length}`);
      if (DEVICE_TYPE_MAPPING[filterType]) {
        console.log(`[DEBUG] 目标设备类型: ${DEVICE_TYPE_MAPPING[filterType].join(', ')}`);
      }
    }

    // 如果没有对应的映射，返回空数组
    if (!DEVICE_TYPE_MAPPING[filterType]) {
      console.warn(`[WARNING] 未找到筛选类型 "${filterType}" 的映射`);
      return [];
    }

    // 执行筛选
    const targetTypes = DEVICE_TYPE_MAPPING[filterType];
    const filtered = devices.filter(device => {
      const deviceType = (device.type || '').toLowerCase();
      const isMatch = targetTypes.includes(deviceType);

      // 调试日志
      if (this.data.debugMode) {
        console.log(`[DEBUG] 设备: ${device.name} (${deviceType}) - 匹配: ${isMatch}`);
      }

      return isMatch;
    });

    // 调试日志
    if (this.data.debugMode) {
      console.log(`[DEBUG] 筛选结果数量: ${filtered.length}`);
      console.log(`[DEBUG] 筛选结果:`, filtered.map(d => `${d.name}(${d.type})`));
    }

    return filtered;
  },

  /**
   * 测试筛选功能 - 验证修复结果
   */
  testFiltering() {
    console.log('=== 筛选功能测试 ===');
    const { allDevices } = this.data;

    console.log('所有设备:', allDevices.map(d => `${d.name}(${d.type})`));

    // 测试传感器筛选
    const sensorDevices = this.filterDevicesByType(allDevices, 'sensor');
    console.log('传感器设备 (应该包含: 环境传感器、环境监测站、燃气检测器):');
    console.log(sensorDevices.map(d => `  - ${d.name}(${d.type})`));

    // 测试计量设备筛选
    const meterDevices = this.filterDevicesByType(allDevices, 'meter');
    console.log('计量设备 (应该包含: 智能电表、智能水表、智能燃气表):');
    console.log(meterDevices.map(d => `  - ${d.name}(${d.type})`));

    // 验证结果
    const expectedSensorTypes = ['environment_sensor', 'environment_monitor', 'gas_detector'];
    const expectedMeterTypes = ['smart_meter', 'water_meter', 'gas_meter'];

    const sensorTypesCorrect = sensorDevices.every(d => expectedSensorTypes.includes(d.type));
    const meterTypesCorrect = meterDevices.every(d => expectedMeterTypes.includes(d.type));

    console.log('=== 验证结果 ===');
    console.log(`传感器筛选正确: ${sensorTypesCorrect ? '✅' : '❌'}`);
    console.log(`计量设备筛选正确: ${meterTypesCorrect ? '✅' : '❌'}`);

    if (!sensorTypesCorrect) {
      console.error('传感器筛选错误，包含了非传感器设备');
    }
    if (!meterTypesCorrect) {
      console.error('计量设备筛选错误，包含了非计量设备');
    }

    return {
      total: allDevices.length,
      sensors: sensorDevices.length,
      meters: meterDevices.length,
      sensorDevices,
      meterDevices,
      sensorTypesCorrect,
      meterTypesCorrect,
      testPassed: sensorTypesCorrect && meterTypesCorrect
    };
  },

  /**
   * 删除设备
   */
  deleteDevice(device) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除设备"${device.name}"吗？`,
      success: function (res) {
        if (res.confirm) {
          // 模拟删除操作
          const devices = this.data.devices.filter(d => d.id !== device.id);
          this.setData({
            devices: devices,
            filteredDevices: devices
          });
          this.updateDeviceStats();

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }.bind(this)
    });
  },

  /**
   * 场景模式
   */
  onSceneMode() {
    wx.navigateTo({
      url: '/pages/scene-mode/scene-mode'
    });
  },

  /**
   * 自动化页面
   */
  onAutomation() {
    wx.navigateTo({
      url: '/pages/automation/automation'
    });
  },

  /**
   * 更新性能数据
   */
  updatePerformanceData() {
    // 模拟性能数据更新
    const avgResponseTime = Math.floor(Math.random() * 50) + 100; // 100-150ms
    const successRate = (Math.random() * 2 + 97).toFixed(1); // 97-99%
    const networkLatency = Math.floor(Math.random() * 30) + 30; // 30-60ms

    // 根据响应时间计算得分 (响应时间越低得分越高)
    const responseScore = Math.max(0, Math.min(100, 100 - (avgResponseTime - 100) * 2));

    // 随机生成趋势方向
    const trends = ['up', 'down', 'stable'];
    const getRandomTrend = () => trends[Math.floor(Math.random() * trends.length)];

    // 根据延迟确定等级
    let latencyLevel = 'good';
    if (networkLatency > 50) {
      latencyLevel = 'warning';
    }
    if (networkLatency > 80) {
      latencyLevel = 'error';
    }

    const performanceData = {
      avgResponseTime,
      responseTimeTrend: getRandomTrend(),
      responseScore,
      successRate,
      successTrend: getRandomTrend(),
      networkLatency,
      latencyTrend: getRandomTrend(),
      latencyLevel
    };

    this.setData({ performanceData });
  },

  /**
   * 查看性能详情
   */
  onViewPerformance() {
    wx.showModal({
      title: '设备性能详情',
      content: `平均响应时间: ${this.data.performanceData.avgResponseTime}ms\n传输成功率: ${this.data.performanceData.successRate}%\n网络延迟: ${this.data.performanceData.networkLatency}ms`,
      showCancel: false
    });
  },

  /**
   * 应用智能推荐
   */
  onApplyRecommendation(e) {
    const recommendation = e.currentTarget.dataset.recommendation;

    wx.showModal({
      title: '应用推荐',
      content: `确定要应用推荐"${recommendation.title}"吗？`,
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({ title: '正在应用推荐...' });

          setTimeout(function () {
            wx.hideLoading();
            wx.showToast({
              title: '推荐已应用',
              icon: 'success'
            });

            // 移除已应用的推荐
            const recommendations = this.data.recommendations.filter(r => r.id !== recommendation.id);
            this.setData({ recommendations });
          }.bind(this), 2000);
        }
      }.bind(this)
    });
  },

  /**
   * 设备维护
   */
  onDeviceMaintenance() {
    wx.showModal({
      title: '设备维护',
      content: '即将跳转到设备维护管理页面，查看维护计划和历史记录。',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '没有权限YJ03',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 能耗分析
   */
  onEnergyAnalysis() {
    wx.showModal({
      title: '能耗分析',
      content: '即将跳转到设备能耗分析页面，查看详细的能耗报告和趋势。',
      success: function (res) {
        if (res.confirm) {
          wx.showToast({
            title: '没有权限YJ03',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 更新全选按钮文本
   */
  updateSelectAllText() {
    const { selectedDevices, devices, showPagination, filteredDevices } = this.data;

    let selectAllText = '全选';

    if (showPagination) {
      // 分页模式下，检查当前页面的设备是否全部被选中
      const currentPageDeviceIds = devices && devices.length > 0 ? devices.map(d => d.id) : [];
      const allCurrentPageSelected = currentPageDeviceIds.length > 0 &&
        currentPageDeviceIds.every(id => selectedDevices && selectedDevices.includes(id));
      selectAllText = allCurrentPageSelected ? '取消全选' : '全选';
    } else {
      // 非分页模式下，检查所有过滤后的设备是否全部被选中
      // 使用 devices 作为备选，如果 filteredDevices 不存在
      const targetDevices = filteredDevices || devices || [];
      const allSelected = targetDevices.length > 0 &&
        selectedDevices && selectedDevices.length === targetDevices.length;
      selectAllText = allSelected ? '取消全选' : '全选';
    }

    this.setData({ selectAllText });
  }
})