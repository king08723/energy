// pages/intelligent-analysis/intelligent-analysis.js
const API = require('../../utils/api.js');

Page({
  data: {
    loading: true,
    devices: [],
    filteredDevices: [], // 筛选后的设备列表
    alerts: [],
    analysisResults: [],
    selectedTab: 'devices', // devices, alerts, optimization
    filterType: 'all', // all, high_risk, medium_risk, low_risk
    optimizationRecommendations: [],
    // 告警统计数据
    alertStats: {
      total: 0,
      critical: 0,
      major: 0,
      minor: 0,
      unread: 0
    }
  },

  // 页面状态管理
  lastDataLoadTime: 0,
  dataRefreshInterval: 3 * 60 * 1000, // 智能分析数据刷新间隔（3分钟）
  isPageVisible: true,
  lastUserInteraction: 0,

  /**
   * 计算告警统计数据
   * 修正告警级别映射：critical, warning, info
   */
  calculateAlertStats(alerts) {
    const stats = {
      total: alerts.length,
      critical: 0,
      major: 0,  // warning级别映射为major
      minor: 0,  // info级别映射为minor
      unread: 0
    };

    alerts.forEach(alert => {
      // 统计不同级别的告警 - 修正级别映射
      if (alert.level === 'critical') {
        stats.critical++;
      } else if (alert.level === 'warning') {
        stats.major++;  // warning映射为major
      } else if (alert.level === 'info') {
        stats.minor++;  // info映射为minor
      }

      // 统计未读告警
      if (alert.status === 'unread') {
        stats.unread++;
      }
    });

    return stats;
  },

  onLoad() {
    // 初始化用户交互时间和页面状态
    this.lastUserInteraction = Date.now();
    this.isPageVisible = true;
    
    // 预加载智能分析页面数据
    API.preloadData('intelligent-analysis');
    this.loadIntelligentAnalysis();
    // 初始化实时数据订阅
    this.initRealTimeSubscription();
    
    // 监听应用前后台切换
    wx.onAppShow(() => {
      if (this.isPageVisible) {
        console.log('应用从后台切换到前台，恢复智能分析实时监控');
        this.lastUserInteraction = Date.now();
        if (!this.socketTask || !this.socketTask.isConnected) {
          this.initRealTimeSubscription();
        }
      }
    });
    
    wx.onAppHide(() => {
      console.log('应用切换到后台，暂停智能分析实时监控');
      this.disconnectRealTime();
    });
  },

  onShow() {
    // 更新页面可见性状态
    this.isPageVisible = true;
    this.lastUserInteraction = Date.now();
    
    // 检查是否需要刷新数据
    if (this.shouldRefreshData()) {
      this.loadIntelligentAnalysis();
    }
    
    // 重新连接实时数据（如果断开）
    if (!this.socketTask || !this.socketTask.isConnected) {
      this.initRealTimeSubscription();
    }
  },

  onHide() {
    // 更新页面可见性状态
    this.isPageVisible = false;
    
    // 页面隐藏时暂停实时订阅以节省资源
    if (this.socketTask) {
      this.socketTask.pause && this.socketTask.pause();
    }
  },

  onUnload() {
    // 更新页面可见性状态
    this.isPageVisible = false;
    
    // 页面卸载时断开实时连接
    this.disconnectRealTime();
  },

  /**
   * 加载智能分析数据
   * 优化版本：优先使用缓存数据，提升用户体验
   */
  async loadIntelligentAnalysis(forceRefresh = false) {
    try {
      // 如果不是强制刷新，先尝试使用缓存数据
      if (!forceRefresh) {
        const cachedData = API.cache.get('intelligent_analysis');
        if (cachedData) {
          // 使用缓存数据快速显示
          this.setData({
            devices: cachedData.devices,
            filteredDevices: cachedData.devices, // 初始显示全部设备
            alerts: cachedData.alerts,
            optimizationRecommendations: cachedData.optimizationRecommendations,
            alertStats: cachedData.alertStats,
            loading: false
          });
          
          // 检查缓存是否需要刷新（API缓存机制会自动处理过期）
          const cacheAge = Date.now() - (cachedData.timestamp || 0);
          if (cacheAge < 2 * 60 * 1000) { // 2分钟内的缓存直接使用
            console.log('使用缓存数据，跳过网络请求');
            return;
          }
          
          // 缓存数据较旧，在后台静默更新
          console.log('使用缓存数据显示，后台更新数据');
          this.loadDataFromNetwork(true); // 静默更新
          return;
        }
      }
      
      // 没有缓存或强制刷新，显示加载状态并从网络获取数据
      wx.showLoading({ title: '加载中...' });
      await this.loadDataFromNetwork(false);
      
    } catch (error) {
      console.error('加载智能分析数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 从网络加载数据
   * @param {boolean} silent 是否静默更新（不显示加载状态）
   */
  async loadDataFromNetwork(silent = false) {
    try {
      if (!silent) {
        this.setData({ loading: true });
      }
      
      // 使用优化的批量数据获取接口，明确数据类型
      const batchResult = await API.getBatchData([
        { type: 'device', params: { includeIntelligentAnalysis: true } }, // 包含智能分析的设备列表
        { type: 'alert', params: {} }, // 告警列表
        { type: 'energy', params: { includeOptimization: true } } // 能耗数据（包含优化建议）
      ]);

      if (!batchResult.success) {
        throw new Error(batchResult.message || '批量数据获取失败');
      }

      // 从批量结果中提取数据
      const devicesRes = batchResult.data.device || {};
      const alertsRes = batchResult.data.alert || {};
      const energyRes = batchResult.data.energy || {};
      
      // 调试日志：检查批量数据获取结果
      console.log('批量数据获取结果:', {
        success: batchResult.success,
        deviceData: devicesRes,
        alertData: alertsRes,
        errors: batchResult.errors
      });

      // 过滤有智能分析结果的设备
      const devicesList = devicesRes.data?.list || devicesRes.data || [];
      const devicesWithAnalysis = devicesList.filter(device => 
        device.intelligentAnalysis
      );

      // 生成优化建议
      const optimizationRecommendations = this.generateOptimizationRecommendations(
        devicesWithAnalysis
      );

      // 计算告警统计数据
      const alertsList = alertsRes.data?.list || alertsRes.data || [];
      console.log('告警数据处理:', {
        原始告警数据: alertsRes,
        提取的告警列表: alertsList,
        告警数量: alertsList.length
      });
      
      const alertStats = this.calculateAlertStats(alertsList);
      console.log('告警统计结果:', alertStats);

      const analysisData = {
        devices: devicesWithAnalysis,
        alerts: alertsList,
        optimizationRecommendations,
        alertStats
      };

      this.setData({
        ...analysisData,
        filteredDevices: this.getFilteredDevices(),
        loading: false
      });

      // 记录数据加载时间
      this.lastDataLoadTime = Date.now();

      // 使用API统一缓存机制，而不是自定义缓存
      API.cache.set('intelligent_analysis', {
        ...analysisData,
        timestamp: this.lastDataLoadTime
      }, 5 * 60 * 1000); // 5分钟缓存
      
      if (silent) {
        console.log('后台数据更新完成');
      }
      
    } catch (error) {
       console.error('从网络加载数据失败:', error);
       if (!silent) {
         throw error; // 重新抛出错误，让上层处理
       }
     }
   },

  /**
   * 生成优化建议
   */
  generateOptimizationRecommendations(devices) {
    const recommendations = [];
    
    // 按风险等级分组
    const highRiskDevices = devices.filter(d => d.intelligentAnalysis.riskLevel === 'high');
    const mediumRiskDevices = devices.filter(d => d.intelligentAnalysis.riskLevel === 'medium');
    const lowEfficiencyDevices = devices.filter(d => d.intelligentAnalysis.efficiencyScore < 70);
    
    // 高风险设备建议
    if (highRiskDevices.length > 0) {
      recommendations.push({
        id: 'high_risk',
        type: 'urgent',
        title: '紧急处理高风险设备',
        description: `发现 ${highRiskDevices.length} 台高风险设备，建议立即检查`,
        devices: highRiskDevices.map(d => d.name),
        priority: 1,
        estimatedSavings: {
          energy: highRiskDevices.length * 50,
          cost: highRiskDevices.length * 35,
          carbon: highRiskDevices.length * 25
        }
      });
    }
    
    // 中风险设备建议
    if (mediumRiskDevices.length > 0) {
      recommendations.push({
        id: 'medium_risk',
        type: 'maintenance',
        title: '预防性维护',
        description: `${mediumRiskDevices.length} 台设备需要预防性维护`,
        devices: mediumRiskDevices.map(d => d.name),
        priority: 2,
        estimatedSavings: {
          energy: mediumRiskDevices.length * 30,
          cost: mediumRiskDevices.length * 20,
          carbon: mediumRiskDevices.length * 15
        }
      });
    }
    
    // 低效率设备建议
    if (lowEfficiencyDevices.length > 0) {
      recommendations.push({
        id: 'low_efficiency',
        type: 'optimization',
        title: '效率优化',
        description: `${lowEfficiencyDevices.length} 台设备效率偏低，建议优化`,
        devices: lowEfficiencyDevices.map(d => d.name),
        priority: 3,
        estimatedSavings: {
          energy: lowEfficiencyDevices.length * 20,
          cost: lowEfficiencyDevices.length * 15,
          carbon: lowEfficiencyDevices.length * 10
        }
      });
    }
    
    return recommendations.sort((a, b) => a.priority - b.priority);
  },

  /**
   * 检查是否需要刷新数据
   */
  shouldRefreshData() {
    const now = Date.now();
    
    // 首次加载
    if (this.lastDataLoadTime === 0) {
      return true;
    }
    
    // 检查刷新间隔
    if (now - this.lastDataLoadTime > this.dataRefreshInterval) {
      return true;
    }
    
    // 检查缓存状态
    const cacheStatus = API.cache.getStatus('intelligent_analysis');
    if (!cacheStatus.exists || cacheStatus.expired) {
      return true;
    }
    
    return false;
  },

  /**
   * 切换标签页
   */
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    this.setData({ selectedTab: tab });
  },

  /**
   * 切换过滤类型
   */
  onFilterChange(e) {
    const { filter } = e.currentTarget.dataset;
    
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    this.setData({ 
      filterType: filter,
      filteredDevices: this.getFilteredDevices(filter)
    });
  },

  /**
   * 获取过滤后的设备列表
   */
  getFilteredDevices(filterType = null) {
    const { devices } = this.data;
    const currentFilterType = filterType || this.data.filterType;
    
    if (currentFilterType === 'all') {
      return devices;
    }
    
    return devices.filter(device => {
      if (!device.intelligentAnalysis) return false;
      const riskLevel = device.intelligentAnalysis.riskLevel;
      return riskLevel === currentFilterType.replace('_risk', '');
    });
  },

  /**
   * 查看设备详情
   */
  onDeviceDetail(e) {
    const { deviceId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?id=${deviceId}`
    });
  },

  /**
   * 查看告警详情
   */
  onAlertDetail(e) {
    const { alertId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/alert-detail/alert-detail?id=${alertId}`
    });
  },

  /**
   * 执行优化建议
   */
  onExecuteRecommendation(e) {
    const { recommendationId } = e.currentTarget.dataset;
    const recommendation = this.data.optimizationRecommendations.find(
      r => r.id === recommendationId
    );
    
    if (!recommendation) return;
    
    wx.showModal({
      title: '执行优化建议',
      content: `确定要执行"${recommendation.title}"吗？这将影响 ${recommendation.devices.length} 台设备。`,
      success: (res) => {
        if (res.confirm) {
          this.executeOptimization(recommendation);
        }
      }
    });
  },

  /**
   * 执行优化操作
   */
  async executeOptimization(recommendation) {
    try {
      wx.showLoading({ title: '执行中...' });
      
      // 模拟执行优化操作
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      wx.showToast({
        title: '执行成功',
        icon: 'success'
      });
      
      // 重新加载数据
      this.loadIntelligentAnalysis();
      
    } catch (error) {
      console.error('执行优化失败:', error);
      wx.showToast({
        title: '执行失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 获取风险等级颜色
   */
  getRiskLevelColor(riskLevel) {
    const colors = {
      high: '#ff4757',
      medium: '#ffa502',
      low: '#2ed573'
    };
    return colors[riskLevel] || '#666';
  },

  /**
   * 获取风险等级文本
   */
  getRiskLevelText(riskLevel) {
    const texts = {
      high: '高风险',
      medium: '中风险',
      low: '低风险'
    };
    return texts[riskLevel] || '未知';
  },

  /**
   * 下拉刷新
   * 强制从网络获取最新数据
   */
  onPullDownRefresh() {
    this.loadIntelligentAnalysis(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '智能分析报告',
      path: '/pages/intelligent-analysis/intelligent-analysis'
    };
  },

  // ==================== 数据缓存机制优化 ====================

  /**
   * 缓存智能分析数据到全局
   * @param {Object} data 要缓存的数据
   */
  cacheIntelligentAnalysisData(data) {
    try {
      const cacheData = {
        ...data,
        timestamp: Date.now(),
        expireTime: Date.now() + 5 * 60 * 1000 // 5分钟过期
      };
      
      // 缓存到本地存储
      wx.setStorageSync('intelligent_analysis_cache', cacheData);
      
      // 缓存到全局应用数据
      const app = getApp();
      if (app.globalData) {
        app.globalData.intelligentAnalysisCache = cacheData;
      }
      
      console.log('智能分析数据已缓存');
    } catch (error) {
      console.error('缓存智能分析数据失败:', error);
    }
  },

  /**
   * 获取缓存的智能分析数据
   * @returns {Object|null} 缓存的数据或null
   */
  getCachedIntelligentAnalysisData() {
    try {
      // 优先从全局应用数据获取
      const app = getApp();
      let cacheData = app.globalData?.intelligentAnalysisCache;
      
      // 如果全局数据不存在，从本地存储获取
      if (!cacheData) {
        cacheData = wx.getStorageSync('intelligent_analysis_cache');
      }
      
      // 检查缓存是否过期
      if (cacheData && cacheData.expireTime > Date.now()) {
        console.log('使用缓存的智能分析数据');
        return cacheData;
      } else {
        // 缓存过期，清除缓存
        this.clearIntelligentAnalysisCache();
        return null;
      }
    } catch (error) {
      console.error('获取缓存智能分析数据失败:', error);
      return null;
    }
  },

  /**
   * 清除智能分析数据缓存
   */
  clearIntelligentAnalysisCache() {
    try {
      // 清除本地存储
      wx.removeStorageSync('intelligent_analysis_cache');
      
      // 清除全局应用数据
      const app = getApp();
      if (app.globalData) {
        delete app.globalData.intelligentAnalysisCache;
      }
      
      console.log('智能分析数据缓存已清除');
    } catch (error) {
      console.error('清除智能分析数据缓存失败:', error);
    }
  },

  /**
   * 初始化实时数据订阅
   * 订阅设备状态和告警数据的实时更新
   */
  initRealTimeSubscription() {
    try {
      // 获取当前设备ID列表用于订阅
      const deviceIds = this.data.devices.map(device => device.id);
      
      this.socketTask = API.subscribeRealTimeData({
        deviceIds: deviceIds,
        types: ['alert', 'device'], // 订阅告警和设备数据
        onConnect: () => {
          console.log('智能分析页面实时数据连接成功');
        },
        onMessage: (data) => {
          this.handleRealTimeMessage(data);
        },
        onDisconnect: (event) => {
          console.log('实时数据连接断开，尝试重连');
          // 3秒后尝试重连
          setTimeout(() => {
            this.initRealTimeSubscription();
          }, 3000);
        },
        onError: (error) => {
          console.error('实时数据连接错误:', error);
        }
      });
    } catch (error) {
      console.error('初始化实时数据订阅失败:', error);
    }
  },

  /**
   * 处理实时消息
   * @param {Object} data 实时数据
   */
  handleRealTimeMessage(data) {
    try {
      switch (data.type) {
        case 'new_alert':
          this.handleNewAlert(data.data);
          break;
        case 'alert_resolved':
          this.handleAlertResolved(data.data);
          break;
        case 'device_status_update':
          this.handleDeviceStatusUpdate(data.data);
          break;
        case 'device_analysis_update':
          this.handleDeviceAnalysisUpdate(data.data);
          break;
        case 'device_update':
          // 处理设备更新消息
          this.handleDeviceUpdate(data.deviceId, data.data);
          break;
        default:
          console.log('未处理的实时消息类型:', data.type);
      }
    } catch (error) {
      console.error('处理实时消息失败:', error);
    }
  },

  /**
   * 处理新告警
   * @param {Object} alertData 新告警数据
   */
  handleNewAlert(alertData) {
    const currentAlerts = [...this.data.alerts];
    
    // 检查告警是否已存在
    const existingIndex = currentAlerts.findIndex(alert => alert.id === alertData.id);
    if (existingIndex === -1) {
      // 新告警，添加到列表开头
      currentAlerts.unshift(alertData);
      
      // 重新计算告警统计
      const alertStats = this.calculateAlertStats(currentAlerts);
      
      this.setData({
        alerts: currentAlerts,
        alertStats
      });
      
      // 更新缓存
      this.updateCache({ alerts: currentAlerts, alertStats });
      
      // 显示新告警提示 - 根据告警级别显示不同图标
      const levelText = alertData.level === 'critical' ? '严重' : 
                       alertData.level === 'warning' ? '警告' : '信息';
      wx.showToast({
        title: `${levelText}告警：${alertData.title}`,
        icon: alertData.level === 'critical' ? 'error' : 'none',
        duration: 3000
      });
    }
  },

  /**
   * 处理告警解决
   * @param {Object} data 包含alertId的数据
   */
  handleAlertResolved(data) {
    const currentAlerts = this.data.alerts.map(alert => {
      if (alert.id === data.alertId) {
        return { ...alert, status: 'resolved' };
      }
      return alert;
    });
    
    const alertStats = this.calculateAlertStats(currentAlerts);
    
    this.setData({
      alerts: currentAlerts,
      alertStats
    });
    
    // 更新缓存
    this.updateCache({ alerts: currentAlerts, alertStats });
  },

  /**
   * 处理设备状态更新
   * @param {Object} deviceData 设备数据
   */
  handleDeviceStatusUpdate(deviceData) {
    const currentDevices = this.data.devices.map(device => {
      if (device.id === deviceData.id) {
        return { ...device, ...deviceData };
      }
      return device;
    });
    
    this.setData({
      devices: currentDevices,
      filteredDevices: this.getFilteredDevices()
    });
    
    // 更新缓存
    this.updateCache({ devices: currentDevices });
  },

  /**
   * 处理设备智能分析更新
   * @param {Object} analysisData 分析数据
   */
  handleDeviceAnalysisUpdate(analysisData) {
    const currentDevices = this.data.devices.map(device => {
      if (device.id === analysisData.deviceId) {
        return { 
          ...device, 
          intelligentAnalysis: {
            ...device.intelligentAnalysis,
            ...analysisData.analysis
          }
        };
      }
      return device;
    });
    
    // 重新生成优化建议
    const optimizationRecommendations = this.generateOptimizationRecommendations(currentDevices);
    
    this.setData({
      devices: currentDevices,
      optimizationRecommendations,
      filteredDevices: this.getFilteredDevices()
    });
    
    // 更新缓存
    this.updateCache({ 
      devices: currentDevices, 
      optimizationRecommendations 
    });
  },

  /**
   * 处理设备更新消息
   * @param {string} deviceId 设备ID
   * @param {Object} updateData 设备更新数据
   */
  handleDeviceUpdate(deviceId, updateData) {
    if (!deviceId || !updateData) {
      console.warn('设备更新数据不完整:', { deviceId, updateData });
      return;
    }

    const currentDevices = [...this.data.devices];
    const deviceIndex = currentDevices.findIndex(device => device.id === deviceId);
    
    if (deviceIndex !== -1) {
      // 更新设备数据
      currentDevices[deviceIndex] = {
        ...currentDevices[deviceIndex],
        ...updateData,
        lastUpdateTime: Date.now()
      };
      
      // 重新生成优化建议
      const optimizationRecommendations = this.generateOptimizationRecommendations(currentDevices);
      
      this.setData({
        devices: currentDevices,
        optimizationRecommendations,
        filteredDevices: this.getFilteredDevices()
      });
      
      // 更新缓存
      this.updateCache({ 
        devices: currentDevices, 
        optimizationRecommendations 
      });
    } else {
      console.warn('未找到要更新的设备:', deviceId);
    }
  },

  /**
   * 更新缓存数据
   * @param {Object} updateData 要更新的数据
   */
  updateCache(updateData) {
    const cachedData = API.cache.get('intelligent_analysis') || {};
    const updatedCache = {
      ...cachedData,
      ...updateData,
      timestamp: Date.now()
    };
    API.cache.set('intelligent_analysis', updatedCache, 5 * 60 * 1000);
  },

  /**
   * 断开实时连接
   */
  disconnectRealTime() {
    if (this.socketTask) {
      API.unsubscribeRealTimeData && API.unsubscribeRealTimeData(this.socketTask);
      this.socketTask = null;
    }
  }
});