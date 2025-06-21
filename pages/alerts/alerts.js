// pages/alerts/alerts.js
const API = require('../../utils/api.js');

Page({
  data: {
    // 筛选状态
    activeTab: 'all', // 当前激活的筛选标签
    
    // 告警数据
    alerts: [], // 所有告警数据
    filteredAlerts: [], // 筛选后的告警数据
    
    // 统计数据
    totalCount: 0,
    unreadCount: 0,
    criticalCount: 0,
    
    // 页面状态
    isRefreshing: false,
    isLoading: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 10
  },

  /**
   * 页面加载时执行
   */
  onLoad: function (options) {
    // 使用API优化功能预加载数据
    API.preloadData('alerts');
    
    // 加载告警数据（使用批量数据获取方式）
    this.loadAlerts();
    
    // 如果有指定的告警ID，定位到该告警
    if (options.alertId) {
      console.log('接收到告警ID:', options.alertId);
      // 延迟执行，确保告警列表已加载
      setTimeout(() => {
        this.locateAlert(options.alertId); // 直接使用字符串格式的alertId，不进行parseInt转换
      }, 1500);
    }
  },

  /**
   * 页面初次渲染完成
   */
  onReady: function () {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '告警消息'
    });
  },

  /**
   * 页面显示时执行
   */
  onShow: function () {
    console.log('告警页面显示');
    
    // 页面显示时检查是否需要刷新数据
    // 如果有缓存数据且未过期，则使用缓存；否则刷新数据
    const cachedData = this.loadCachedAlertData();
    if (!cachedData) {
      this.refreshAlerts();
    }
    
    // 统计数据会通过refreshAlerts从API获取，无需单独刷新
    
    // 初始化实时监控
    this.initRealTimeMonitor();
  },

  /**
   * 页面隐藏时执行
   */
  onHide: function () {
    this.disconnectRealTime();
  },

  /**
   * 页面卸载时执行
   */
  onUnload: function () {
    this.disconnectRealTime();
  },

  /**
   * 加载告警数据 - 使用批量数据获取方式，统一数据来源
   */
  async loadAlerts(forceRefresh = false) {
    try {
      this.setData({ isLoading: true });
      
      // 检查缓存数据（与首页保持一致的缓存策略）
      if (!forceRefresh) {
        const cachedData = this.loadCachedAlertData();
        if (cachedData) {
          this.updateAlertDataDisplay(cachedData);
          this.setData({ isLoading: false });
          return;
        }
      }
      
      // 使用批量数据获取接口（与首页保持一致）
      const requests = [
        { 
          type: 'alert', 
          params: { 
            page: this.data.currentPage,
            pageSize: this.data.pageSize,
            includeResolved: true // 包含已解决的告警用于统计
          } 
        }
      ];
      
      const batchResult = await API.getBatchData(requests);
      
      if (batchResult.success && batchResult.data.alert) {
        const alertResult = batchResult.data.alert;
        
        if (alertResult.success) {
          // 使用统一的数据结构处理告警数据
          const alertsData = this.processAlertData(alertResult.data.list || []);
          
          // 使用API返回的统计数据，确保与首页数据一致
          const summary = alertResult.data.summary || {};
          
          this.setData({
            alerts: alertsData,
            totalCount: alertResult.data.total || alertsData.length,
            // 直接使用API返回的统计数据，而不是本地计算
            unreadCount: summary.unread || 0,
            criticalCount: summary.critical || 0,
            warningCount: summary.warning || 0,
            infoCount: summary.info || 0,
            isLoading: false
          });
          
          // 不再调用updateCounts()，直接使用API统计数据
          this.filterAlerts();
        } else {
          throw new Error(alertResult.message || '获取告警数据失败');
        }
      } else {
        throw new Error('批量数据获取失败');
      }
    } catch (error) {
      console.error('加载告警数据失败:', error);
      
      // API失败时只显示错误提示，不使用本地模拟数据
      this.setData({
        alerts: [],
        totalCount: 0,
        unreadCount: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        isLoading: false
      });
      
      this.filterAlerts();
      
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'error',
        duration: 2000
      });
    }
  },

  /**
   * 加载缓存的告警数据
   * @returns {Object|null} 缓存的告警数据
   */
  loadCachedAlertData() {
    try {
      // 使用与首页一致的缓存键名格式
      const cacheKey = `alert_{"page":${this.data.currentPage},"pageSize":${this.data.pageSize}}`;
      const cachedAlerts = API.cache.get ? API.cache.get(cacheKey) : null;
      
      if (cachedAlerts && cachedAlerts.data) {
        console.log('使用缓存的告警数据');
        return cachedAlerts;
      }
    } catch (error) {
      console.warn('读取告警缓存数据失败:', error);
    }
    return null;
  },

  /**
   * 更新告警数据显示
   * @param {Object} alertData 告警数据
   */
  updateAlertDataDisplay(alertData) {
    if (alertData && alertData.data && alertData.data.list) {
      const alertsData = this.processAlertData(alertData.data.list);
      
      // 使用API返回的统计数据，确保与首页数据一致
      const summary = alertData.data.summary || {};
      
      this.setData({
        alerts: alertsData,
        totalCount: alertData.data.total || alertsData.length,
        // 直接使用API返回的统计数据
        unreadCount: summary.unread || 0,
        criticalCount: summary.critical || 0,
        warningCount: summary.warning || 0,
        infoCount: summary.info || 0
      });
      
      // 不再调用updateCounts()，直接使用API统计数据
      this.filterAlerts();
    }
  },

  /**
   * 处理告警数据，统一数据结构
   * @param {Array} rawAlerts 原始告警数据
   * @returns {Array} 处理后的告警数据
   */
  processAlertData(rawAlerts) {
    return rawAlerts.map(alert => {
      // 统一告警数据结构，兼容不同的字段名
      return {
        id: alert.id,
        title: alert.title || alert.content || '未知告警',
        description: alert.description || alert.content || alert.message || '',
        deviceName: alert.deviceName || '未知设备',
        location: alert.location || '未知位置',
        level: alert.level || 'info', // critical, warning, info
        levelText: this.getLevelText(alert.level || 'info'),
        levelIcon: this.getLevelIcon(alert.level || 'info'),
        type: alert.type || 'unknown',
        status: alert.status || 'unread', // unread, read, ignored, resolved
        isRead: alert.status === 'read' || alert.status === 'resolved',
        expanded: false, // 默认折叠状态
        timestamp: new Date(alert.createTime || alert.createdAt || Date.now()).getTime(),
        timeAgo: this.getTimeAgo(new Date(alert.createTime || alert.createdAt || Date.now()).getTime()),
        createTime: alert.createTime || alert.createdAt,
        handleTime: alert.handleTime
      };
    }).sort((a, b) => b.timestamp - a.timestamp); // 按时间倒序排列
  },



  /**
   * 获取告警级别文本
   */
  getLevelText: function(level) {
    const levelTexts = {
      'critical': '严重',
      'warning': '警告',
      'info': '提示'
    };
    return levelTexts[level] || '未知';
  },

  /**
   * 获取告警级别图标
   */
  getLevelIcon: function(level) {
    const levelIcons = {
      'critical': 'icon-error-circle',
      'warning': 'icon-warning',
      'info': 'icon-info'
    };
    return levelIcons[level] || 'icon-info';
  },

  /**
   * 获取时间差描述
   */
  getTimeAgo: function(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    // 转换为分钟
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) {
      return `${minutes}分钟前`;
    }
    
    // 转换为小时
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}小时前`;
    }
    
    // 转换为天
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  },

  /**
   * 更新统计数据
   */


  /**
   * 切换筛选标签
   */
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.filterAlerts();
  },

  /**
   * 筛选告警数据
   */
  filterAlerts: function() {
    const { alerts, activeTab } = this.data;
    let filteredAlerts = [];
    
    switch (activeTab) {
      case 'all':
        filteredAlerts = alerts;
        break;
      case 'unread':
        filteredAlerts = alerts.filter(alert => !alert.isRead);
        break;
      case 'critical':
        filteredAlerts = alerts.filter(alert => alert.level === 'critical');
        break;
      default:
        filteredAlerts = alerts;
    }
    
    this.setData({
      filteredAlerts
    });
  },

  /**
   * 刷新告警数据
   */
  refreshAlerts: function() {
    this.setData({
      isRefreshing: true
    });
    
    this.loadAlerts();
    
    setTimeout(() => {
      this.setData({
        isRefreshing: false
      });
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
    }, 1000);
  },

  /**
   * 标记所有告警为已读
   */
  markAllRead: function() {
    wx.showModal({
      title: '确认操作',
      content: '确定将所有告警标记为已读吗？',
      success: (res) => {
        if (res.confirm) {
          const alerts = this.data.alerts.map(alert => {
            return { ...alert, isRead: true };
          });
          
          // 手动计算更新后的统计数据
          const unreadCount = alerts.filter(alert => !alert.isRead).length;
          const criticalCount = alerts.filter(alert => alert.level === 'critical').length;
          const warningCount = alerts.filter(alert => alert.level === 'warning').length;
          const infoCount = alerts.filter(alert => alert.level === 'info').length;
          
          this.setData({
            alerts,
            // 更新统计数据
            unreadCount,
            criticalCount,
            warningCount,
            infoCount
          });
          
          this.filterAlerts();
          
          wx.showToast({
            title: '已全部标为已读',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  /**
   * 标记指定告警为已读
   */
  markAsRead: function(e) {
    const alertId = e.currentTarget.dataset.id;
    this.markAsReadById(alertId);
    
    // 阻止事件冒泡，避免触发展开/折叠
    e.stopPropagation();
    
    wx.showToast({
      title: '已标记为已读',
      icon: 'success',
      duration: 1500
    });
  },
  markAsReadById: function(alertId) {
    const alerts = this.data.alerts.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, isRead: true };
      }
      return alert;
    });
    
    // 手动计算更新后的统计数据
    const unreadCount = alerts.filter(alert => !alert.isRead).length;
    const criticalCount = alerts.filter(alert => alert.level === 'critical').length;
    const warningCount = alerts.filter(alert => alert.level === 'warning').length;
    const infoCount = alerts.filter(alert => alert.level === 'info').length;
    
    this.setData({
      alerts,
      // 更新统计数据
      unreadCount,
      criticalCount,
      warningCount,
      infoCount
    });
    
    this.filterAlerts();
  },

  /**
   * 切换告警展开状态
   */
  toggleAlertExpand: function(e) {
    const alertId = e.currentTarget.dataset.id;
    const alerts = this.data.alerts.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, expanded: !alert.expanded };
      }
      return alert;
    });
    
    this.setData({
      alerts
    });
    
    this.filterAlerts();
    
    // 标记为已读
    this.markAsReadById(alertId);
  },

  /**
   * 查看告警详情
   */
  viewAlertDetail: function(e) {
    const alertId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/alert-detail/alert-detail?id=${alertId}`
    });
  },

  /**
   * 处理告警
   */
  handleAlert: function(e) {
    const alertId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '处理告警',
      content: '确认已处理此告警？',
      success: (res) => {
        if (res.confirm) {
          // 模拟API调用
          setTimeout(() => {
            const alerts = this.data.alerts.map(alert => {
              if (alert.id === alertId) {
                return { 
                  ...alert, 
                  isRead: true,
                  status: 'resolved',
                  statusText: '已处理'
                };
              }
              return alert;
            });
            
            // 手动计算更新后的统计数据
            const unreadCount = alerts.filter(alert => !alert.isRead).length;
            const criticalCount = alerts.filter(alert => alert.level === 'critical').length;
            const warningCount = alerts.filter(alert => alert.level === 'warning').length;
            const infoCount = alerts.filter(alert => alert.level === 'info').length;
            
            this.setData({
              alerts,
              // 更新统计数据
              unreadCount,
              criticalCount,
              warningCount,
              infoCount
            });
            
            this.filterAlerts();
            
            // 清除相关缓存，确保数据一致性
            this.clearAlertCache();
            
            wx.showToast({
              title: '处理成功',
              icon: 'success',
              duration: 1500
            });
          }, 500);
        }
      }
    });
  },

  /**
   * 清除告警相关缓存
   */
  clearAlertCache() {
    try {
      // 清除告警数据缓存
      if (API.cache && API.cache.clear) {
        API.cache.clear('alert');
      }
      console.log('告警缓存已清除');
    } catch (error) {
      console.warn('清除告警缓存失败:', error);
    }
  },

  /**
   * 忽略告警
   */
  ignoreAlert: function(e) {
    const alertId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '忽略告警',
      content: '确认忽略此告警？',
      success: (res) => {
        if (res.confirm) {
          // 模拟API调用
          setTimeout(() => {
            const alerts = this.data.alerts.map(alert => {
              if (alert.id === alertId) {
                return { 
                  ...alert, 
                  isRead: true,
                  status: 'ignored',
                  statusText: '已忽略'
                };
              }
              return alert;
            });
            
            // 手动计算更新后的统计数据
            const unreadCount = alerts.filter(alert => !alert.isRead).length;
            const criticalCount = alerts.filter(alert => alert.level === 'critical').length;
            const warningCount = alerts.filter(alert => alert.level === 'warning').length;
            const infoCount = alerts.filter(alert => alert.level === 'info').length;
            
            this.setData({
              alerts,
              // 更新统计数据
              unreadCount,
              criticalCount,
              warningCount,
              infoCount
            });
            
            this.filterAlerts();
            
            wx.showToast({
              title: '已忽略',
              icon: 'success',
              duration: 1500
            });
          }, 500);
        }
      }
    });
  },

  /**
   * 加载更多告警数据 - 使用批量数据获取方式
   */
  async loadMoreAlerts() {
    if (this.data.isLoading || this.data.alerts.length >= this.data.totalCount) {
      return;
    }
    
    try {
      this.setData({ isLoading: true });
      
      const nextPage = this.data.currentPage + 1;
      
      // 使用批量数据获取接口加载下一页数据
      const requests = [
        { 
          type: 'alert', 
          params: { 
            page: nextPage,
            pageSize: this.data.pageSize,
            includeResolved: true
          } 
        }
      ];
      
      const batchResult = await API.getBatchData(requests);
      
      if (batchResult.success && batchResult.data.alert) {
        const alertResult = batchResult.data.alert;
        
        if (alertResult.success) {
          const newAlerts = this.processAlertData(alertResult.data.list || []);
          
          // 过滤掉已存在的告警，避免重复ID
          const existingIds = new Set(this.data.alerts.map(alert => alert.id));
          const uniqueNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
          
          const allAlerts = [...this.data.alerts, ...uniqueNewAlerts];
          
          // 使用API返回的统计数据，确保与首页数据一致
          const summary = alertResult.data.summary || {};
          
          this.setData({
            alerts: allAlerts,
            currentPage: nextPage,
            totalCount: alertResult.data.total || allAlerts.length,
            // 直接使用API返回的统计数据
            unreadCount: summary.unread || 0,
            criticalCount: summary.critical || 0,
            warningCount: summary.warning || 0,
            infoCount: summary.info || 0,
            isLoading: false
          });
          
          // 不再调用updateCounts()，直接使用API统计数据
          this.filterAlerts();
        } else {
          throw new Error(alertResult.message || '加载更多数据失败');
        }
      } else {
        throw new Error('批量数据获取失败');
      }
    } catch (error) {
      console.error('加载更多告警数据失败:', error);
      
      this.setData({ isLoading: false });
      
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    this.loadMore();
  },

  /**
   * 定位到指定告警
   */
  locateAlert: function(alertId) {
    console.log('定位到告警:', alertId);
    // 查找告警，支持字符串ID和数字ID
    const index = this.data.alerts.findIndex(alert => alert.id === alertId);
    
    if (index !== -1) {
      console.log('找到告警，索引:', index);
      // 展开该告警
      const alerts = this.data.alerts.map((alert, i) => {
        return { ...alert, expanded: alert.id === alertId };
      });
      
      this.setData({ alerts });
      this.filterAlerts();
      
      // 滚动到该告警位置
      setTimeout(() => {
        // 在 filteredAlerts 中找到对应的索引
        const filteredIndex = this.data.filteredAlerts.findIndex(alert => alert.id === alertId);
        if (filteredIndex === -1) {
          console.log('在筛选后的列表中未找到告警');
          // 如果在当前筛选条件下找不到告警，切换到全部标签
          this.setData({ activeTab: 'all' });
          this.filterAlerts();
          
          // 重新尝试定位
          setTimeout(() => {
            const newFilteredIndex = this.data.filteredAlerts.findIndex(alert => alert.id === alertId);
            if (newFilteredIndex !== -1) {
              this.scrollToAlert(newFilteredIndex);
            } else {
              console.log('仍然无法找到告警元素');
              wx.showToast({
                title: '无法定位到告警',
                icon: 'none'
              });
            }
          }, 100);
          return;
        }
        
        this.scrollToAlert(filteredIndex);
      }, 300);
        
      // 标记为已读
      this.markAsReadById(alertId);
    } else {
      console.log('未找到告警:', alertId);
      wx.showToast({
        title: '未找到相关告警',
        icon: 'none'
      });
    }
  },
  
  /**
   * 滚动到指定告警位置
   */
  scrollToAlert: function(index) {
    // 使用更可靠的选择器方式，通过ID选择器
    const alertId = this.data.filteredAlerts[index].id;
    const query = wx.createSelectorQuery();
    
    // 先给目标告警添加一个临时标记
    this.setData({
      [`filteredAlerts[${index}].isTarget`]: true
    });
    
    // 使用ID选择器 - 微信小程序中更可靠
    query.select(`#alert-${alertId}`)
      .boundingClientRect(rect => {
        if (rect) {
          console.log('滚动到位置:', rect.top);
          wx.pageScrollTo({
            scrollTop: rect.top - 100, // 减去一定距离，确保元素在视图中更明显
            duration: 300
          });
          
          // 添加高亮效果
          this.setData({
            [`filteredAlerts[${index}].highlight`]: true
          });
          
          // 3秒后移除高亮效果
          setTimeout(() => {
            this.setData({
              [`filteredAlerts[${index}].highlight`]: false,
              [`filteredAlerts[${index}].isTarget`]: false
            });
          }, 3000);
        } else {
          console.log('未找到告警元素');
          wx.showToast({
            title: '无法定位到告警元素',
            icon: 'none'
          });
        }
      })
      .exec();
  },

  /**
   * 初始化实时数据监控 - 使用API优化功能
   */
  initRealTimeMonitor() {
    if (this.socketTask) {
      return; // 已经连接，避免重复连接
    }
    
    // 建立WebSocket连接监控告警数据
    this.socketTask = API.subscribeRealTimeData(
      [], // 监控所有设备的告警
      {
        onConnect: () => {
          console.log('告警页面实时连接已建立');
          this.setData({ connected: true });
        },
        onMessage: (message) => {
          this.handleRealTimeMessage(message);
        },
        onDisconnect: () => {
          console.log('告警页面实时连接已断开');
          this.setData({ connected: false });
          // 自动重连机制
          setTimeout(() => {
            if (!this.socketTask) {
              this.initRealTimeMonitor();
            }
          }, 3000);
        },
        onError: (error) => {
          console.error('告警页面实时连接错误:', error);
          this.setData({ connected: false });
        }
      },
      { type: 'alerts' } // 指定监控告警类型
    );
  },

  /**
   * 处理实时消息
   */
  handleRealTimeMessage(message) {
    if (!message || !message.type) return;
    
    switch (message.type) {
      case 'new_alert':
        this.addNewAlert(message.data);
        break;
      case 'alert_resolved':
        this.resolveAlert(message.data.alertId);
        break;
      case 'alert_updated':
        this.updateAlert(message.data);
        break;
      default:
        console.log('未知的告警实时消息类型:', message.type);
    }
  },

  /**
   * 添加新告警
   */
  addNewAlert(alertData) {
    const currentAlerts = this.data.alerts || [];
    
    // 使用统一的数据处理方法
    const processedAlert = this.processAlertData([alertData])[0];
    
    // 检查是否已存在相同ID的告警，避免重复
    const existingAlert = currentAlerts.find(alert => alert.id === processedAlert.id);
    if (existingAlert) {
      console.warn('告警已存在，跳过添加:', processedAlert.id);
      return;
    }
    
    // 将新告警添加到列表顶部
    const updatedAlerts = [processedAlert, ...currentAlerts];
    
    // 手动计算更新后的统计数据
    const unreadCount = updatedAlerts.filter(alert => !alert.isRead).length;
    const criticalCount = updatedAlerts.filter(alert => alert.level === 'critical').length;
    const warningCount = updatedAlerts.filter(alert => alert.level === 'warning').length;
    const infoCount = updatedAlerts.filter(alert => alert.level === 'info').length;
    
    this.setData({
      alerts: updatedAlerts,
      totalCount: updatedAlerts.length,
      // 更新统计数据
      unreadCount,
      criticalCount,
      warningCount,
      infoCount
    });
    
    // 重新筛选告警
    this.filterAlerts();
    
    // 清除缓存，确保数据一致性
    this.clearAlertCache();
    
    // 显示新告警提示
    wx.showToast({
      title: `新告警：${processedAlert.title}`,
      icon: 'none',
      duration: 3000
    });
    
    // 震动提醒
    wx.vibrateShort();
  },

  /**
   * 解决告警
   */
  resolveAlert(alertId) {
    const alerts = this.data.alerts.map(alert => {
      if (alert.id === alertId) {
        return {
          ...alert,
          resolved: true,
          resolvedTime: Date.now()
        };
      }
      return alert;
    });
    
    // 手动计算更新后的统计数据
    const unreadCount = alerts.filter(alert => !alert.isRead).length;
    const criticalCount = alerts.filter(alert => alert.level === 'critical').length;
    const warningCount = alerts.filter(alert => alert.level === 'warning').length;
    const infoCount = alerts.filter(alert => alert.level === 'info').length;
    
    this.setData({ 
      alerts,
      // 更新统计数据
      unreadCount,
      criticalCount,
      warningCount,
      infoCount
    });
    this.filterAlerts();
  },

  /**
   * 更新告警
   */
  updateAlert(alertData) {
    const alerts = this.data.alerts.map(alert => {
      if (alert.id === alertData.id) {
        return {
          ...alert,
          ...alertData,
          timeAgo: this.getTimeAgo(alertData.timestamp)
        };
      }
      return alert;
    });
    
    this.setData({ alerts });
    this.filterAlerts();
  },

  /**
   * 断开实时连接
   */
  disconnectRealTime() {
    if (this.socketTask) {
      API.unsubscribeRealTimeData(this.socketTask);
      this.socketTask = null;
      this.setData({ connected: false });
    }
  },

  /**
   * 刷新告警数据 - 使用批量数据获取方式
   */
  async refreshAlerts() {
    try {
      this.setData({ isRefreshing: true });
      
      // 强制刷新数据，不使用缓存
      await this.loadAlerts(true);
      
      this.setData({ isRefreshing: false });
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('刷新告警数据失败:', error);
      
      this.setData({ isRefreshing: false });
      
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.refreshAlerts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 上拉加载更多
   */
  async onReachBottom() {
    if (!this.data.hasMore || this.data.isLoading) {
      return;
    }
    
    try {
      this.setData({ isLoading: true });
      
      const nextPage = this.data.currentPage + 1;
      const result = await API.getData('alert', {
        page: nextPage,
        pageSize: this.data.pageSize,
        refresh: false
      });
      
      if (result.success && result.data.list.length > 0) {
        const newAlerts = this.processAlertData(result.data.list);
        
        // 过滤掉已存在的告警，避免重复ID
        const existingIds = new Set(this.data.alerts.map(alert => alert.id));
        const uniqueNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
        
        const allAlerts = [...this.data.alerts, ...uniqueNewAlerts];
        
        // 使用API返回的统计数据或手动计算
        const summary = result.data.summary || {};
        const unreadCount = summary.unread !== undefined ? summary.unread : allAlerts.filter(alert => !alert.isRead).length;
        const criticalCount = summary.critical !== undefined ? summary.critical : allAlerts.filter(alert => alert.level === 'critical').length;
        const warningCount = summary.warning !== undefined ? summary.warning : allAlerts.filter(alert => alert.level === 'warning').length;
        const infoCount = summary.info !== undefined ? summary.info : allAlerts.filter(alert => alert.level === 'info').length;
        
        this.setData({
          alerts: allAlerts,
          currentPage: nextPage,
          hasMore: newAlerts.length === this.data.pageSize,
          // 更新统计数据
          unreadCount,
          criticalCount,
          warningCount,
          infoCount
        });
        
        this.filterAlerts();
      } else {
        this.setData({ hasMore: false });
      }
    } catch (error) {
      console.error('加载更多告警失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  }
});