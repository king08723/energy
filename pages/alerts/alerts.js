// pages/alerts/alerts.js
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
    this.loadAlerts();
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
    // 刷新未读数量
    this.updateCounts();
  },

  /**
   * 加载告警数据
   */
  loadAlerts: function() {
    wx.showLoading({
      title: '加载中...'
    });
    
    // 模拟API调用
    setTimeout(() => {
      const mockAlerts = this.generateMockAlerts();
      this.setData({
        alerts: mockAlerts
      });
      
      this.updateCounts();
      this.filterAlerts();
      
      wx.hideLoading();
    }, 1000);
  },

  /**
   * 生成模拟告警数据
   */
  generateMockAlerts: function() {
    const levels = ['critical', 'warning', 'info'];
    const types = ['设备故障', '能耗异常', '通信中断', '参数超限', '维护提醒'];
    const devices = [
      { name: '空调系统-01', location: '办公楼A座' },
      { name: '照明控制器-02', location: '办公楼B座' },
      { name: '电梯系统-03', location: '办公楼C座' },
      { name: '监控摄像头-04', location: '停车场' },
      { name: '门禁系统-05', location: '大厅入口' }
    ];
    
    const alerts = [];
    for (let i = 1; i <= 15; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const isRead = Math.random() > 0.4; // 60%概率已读
      
      alerts.push({
        id: i,
        title: `${type} - ${device.name}`,
        description: this.getAlertDescription(type, level),
        deviceName: device.name,
        location: device.location,
        level: level,
        levelText: this.getLevelText(level),
        levelIcon: this.getLevelIcon(level),
        type: type,
        isRead: isRead,
        timestamp: Date.now() - (i * 3600000), // 每小时一个告警
        timeAgo: this.getTimeAgo(Date.now() - (i * 3600000))
      });
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * 获取告警描述
   */
  getAlertDescription: function(type, level) {
    const descriptions = {
      '设备故障': {
        'critical': '设备完全停止工作，需要立即维修',
        'warning': '设备运行异常，建议尽快检查',
        'info': '设备状态提醒，请关注运行情况'
      },
      '能耗异常': {
        'critical': '能耗超出正常范围50%以上',
        'warning': '能耗超出正常范围20-50%',
        'info': '能耗略高于平均水平'
      },
      '通信中断': {
        'critical': '设备完全失联，无法获取数据',
        'warning': '通信不稳定，数据传输延迟',
        'info': '网络连接质量较差'
      },
      '参数超限': {
        'critical': '关键参数严重超出安全范围',
        'warning': '运行参数超出正常范围',
        'info': '参数接近预警阈值'
      },
      '维护提醒': {
        'critical': '设备已超期维护，存在安全隐患',
        'warning': '设备即将到达维护周期',
        'info': '建议安排例行维护检查'
      }
    };
    
    return descriptions[type][level] || '设备状态异常，请及时处理';
  },

  /**
   * 获取级别文本
   */
  getLevelText: function(level) {
    const levelTexts = {
      'critical': '严重',
      'warning': '警告',
      'info': '提醒'
    };
    return levelTexts[level] || '未知';
  },

  /**
   * 获取级别图标
   */
  getLevelIcon: function(level) {
    const levelIcons = {
      'critical': 'icon-warning-fill',
      'warning': 'icon-warning',
      'info': 'icon-info'
    };
    return levelIcons[level] || 'icon-info';
  },

  /**
   * 获取相对时间
   */
  getTimeAgo: function(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  },

  /**
   * 更新统计数据
   */
  updateCounts: function() {
    const alerts = this.data.alerts;
    const totalCount = alerts.length;
    const unreadCount = alerts.filter(alert => !alert.isRead).length;
    const criticalCount = alerts.filter(alert => alert.level === 'critical').length;
    
    this.setData({
      totalCount,
      unreadCount,
      criticalCount
    });
  },

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
   * 查看告警详情
   */
  viewAlertDetail: function(e) {
    const alertId = e.currentTarget.dataset.id;
    
    // 标记为已读
    this.markAsRead(e);
    
    // 跳转到详情页面
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?alertId=${alertId}`
    });
  },

  /**
   * 标记为已读
   */
  markAsRead: function(e) {
    const alertId = parseInt(e.currentTarget.dataset.id);
    const alerts = this.data.alerts.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, isRead: true };
      }
      return alert;
    });
    
    this.setData({ alerts });
    this.updateCounts();
    this.filterAlerts();
    
    wx.showToast({
      title: '已标记为已读',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 忽略告警
   */
  ignoreAlert: function(e) {
    const alertId = parseInt(e.currentTarget.dataset.id);
    
    wx.showModal({
      title: '确认忽略',
      content: '忽略后该告警将不再显示，确定要忽略吗？',
      success: (res) => {
        if (res.confirm) {
          const alerts = this.data.alerts.filter(alert => alert.id !== alertId);
          this.setData({ alerts });
          this.updateCounts();
          this.filterAlerts();
          
          wx.showToast({
            title: '已忽略告警',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 全部标记为已读
   */
  markAllRead: function() {
    const unreadCount = this.data.unreadCount;
    
    if (unreadCount === 0) {
      wx.showToast({
        title: '没有未读消息',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认操作',
      content: `将${unreadCount}条未读消息标记为已读？`,
      success: (res) => {
        if (res.confirm) {
          const alerts = this.data.alerts.map(alert => ({
            ...alert,
            isRead: true
          }));
          
          this.setData({ alerts });
          this.updateCounts();
          this.filterAlerts();
          
          wx.showToast({
            title: '全部已读',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 刷新告警数据
   */
  refreshAlerts: function() {
    if (this.data.isRefreshing) return;
    
    this.setData({ isRefreshing: true });
    
    // 模拟刷新延迟
    setTimeout(() => {
      this.loadAlerts();
      this.setData({ isRefreshing: false });
      
      wx.showToast({
        title: '刷新完成',
        icon: 'success'
      });
    }, 1500);
  },

  /**
   * 加载更多数据
   */
  loadMore: function() {
    if (this.data.isLoading || !this.data.hasMore) return;
    
    this.setData({ isLoading: true });
    
    // 模拟加载更多数据
    setTimeout(() => {
      const newAlerts = this.generateMockAlerts();
      const alerts = [...this.data.alerts, ...newAlerts];
      
      this.setData({
        alerts,
        isLoading: false,
        hasMore: alerts.length < 50 // 最多50条数据
      });
      
      this.updateCounts();
      this.filterAlerts();
    }, 1000);
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.refreshAlerts();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1500);
  },

  /**
   * 上拉加载更多
   */
  onReachBottom: function() {
    this.loadMore();
  }
})