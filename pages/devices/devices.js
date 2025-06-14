// pages/devices/devices.js
// 在文件顶部添加API和工具函数引入
const API = require('../../utils/api.js');
const { formatUptime } = require('../../utils/utils.js');

Page({
  data: {
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
    allDevices: [], // 所有设备数据（用于分页）
    devices: [], // 当前显示的设备数据
    filteredDevices: [], // 过滤后的设备数据
    loading: false,
    
    // 滚动位置控制
    scrollTop: 0
  },

  // 卡片点击事件 - 增加快速筛选功能
  onCardTap(e) {
    const type = e.currentTarget.dataset.type;
    const stats = this.data.deviceStats;
    
    // 快速筛选功能
    switch(type) {
      case 'total':
        // 显示全部设备
        this.setData({ 
          filterType: 'all',
          showSearch: true // 展开搜索筛选面板
        });
        this.onFilterType({ currentTarget: { dataset: { type: 'all' } } });
        break;
      case 'online':
        // 快速筛选正常设备
        this.setData({ 
          filterType: 'healthy',
          showSearch: true
        });
        this.onFilterType({ currentTarget: { dataset: { type: 'healthy' } } });
        break;
      case 'alerts':
        // 快速筛选告警设备
        this.setData({ 
          filterType: 'alert',
          showSearch: true
        });
        this.onFilterType({ currentTarget: { dataset: { type: 'alert' } } });
        break;
      case 'health':
        // 根据健康度筛选
        const filterType = stats.healthScore < 70 ? 'abnormal' : 'healthy';
        this.setData({ 
          filterType: filterType,
          showSearch: true
        });
        this.onFilterType({ currentTarget: { dataset: { type: filterType } } });
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
      selectedGroup: 'all',
      filteredDevices: this.data.allDevices
    });
    
    // 重新加载第一页数据
    this.loadDevicesWithPagination(1);
    
    wx.showToast({
      title: '已清除所有筛选条件',
      icon: 'success',
      duration: 1500
    });
  },

  onLoad: function (options) {
    // 页面加载时初始化数据
    this.initDeviceData();
    this.updateDeviceStats();
  },

  onReady: function () {
    // 页面初次渲染完成
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.refreshDeviceData();
  },

  /**
   * 初始化设备数据 - 8条设备数据，严格按5条/页分页
   */
  initDeviceData() {
    // 模拟设备数据
    let mockDevices = [
      {        id: 'device_001',        name: '生产线电表A1',        type: 'meter',  // 修正：电表类型改为meter        icon: '⚡',
        status: 'online',
        statusText: '在线',
        location: '生产车间A',
        power: 1250,
        powerTrend: 'up',
        group: 'production',
        lastUpdate: '2分钟前',
        healthStatus: 'good',
        uptime: '72小时15分钟',
        temperature: 45,
        isUpdating: true,
        alerts: []
      },
      {
        id: 'device_002',
        name: '温湿度传感器B2',
        type: 'sensor',
        icon: '🌡️',
        status: 'online',
        statusText: '在线',
        location: '办公区域B',
        power: null,
        powerTrend: 'stable',
        group: 'office',
        lastUpdate: '1分钟前',
        healthStatus: 'good',
        uptime: '168小时30分钟',
        temperature: 23,
        isUpdating: false,
        alerts: []
      },
      {        id: 'device_003',        name: '智能开关C3',        type: 'switch',  // 修正：开关类型改为switch        icon: '🔌',
        status: 'offline',
        statusText: '离线',
        location: '公共走廊C',
        power: 0,
        powerTrend: 'down',
        group: 'public',
        lastUpdate: '30分钟前',
        healthStatus: 'error',
        uptime: '0小时0分钟',
        temperature: null,
        isUpdating: false,
        alerts: [
          {
            message: '设备离线超过30分钟',
            time: '30分钟前',
            level: 'warning',
            severity: 'critical'
          }
        ]
      },
      {        id: 'device_004',        name: '中央空调控制器',        type: 'hvac',  // 修正：空调类型改为hvac        icon: '❄️',
        status: 'online',
        statusText: '在线',
        location: '办公区域A',
        power: 3200,
        powerTrend: 'up',
        group: 'office',
        lastUpdate: '刚刚',
        healthStatus: 'warning',
        uptime: '24小时8分钟',
        temperature: 38,
        isUpdating: true,
        alerts: [
          {
            message: '能耗异常偏高',
            time: '5分钟前',
            level: 'warning',
            severity: 'warning'
          }
        ]
      },
      {
        id: 'device_005',
        name: '水表监测器',
        type: 'sensor',
        icon: '💧',
        status: 'online',
        statusText: '在线',
        location: '公共区域',
        power: null,
        powerTrend: 'stable',
        group: 'public',
        lastUpdate: '5分钟前',
        healthStatus: 'good',
        uptime: '120小时45分钟',
        temperature: null,
        isUpdating: false,
        alerts: []
      },
      {        id: 'device_006',        name: '电量计量表D1',        type: 'meter',  // 修正：电量计量表应该是meter类型        icon: '⚡',
        status: 'online',
        statusText: '在线',
        location: '生产区域B',
        power: 850,
        powerTrend: 'stable',
        group: 'production',
        lastUpdate: '3分钟前',
        healthStatus: 'good',
        uptime: '96小时20分钟',
        temperature: 35,
        isUpdating: false,
        alerts: []
      },
      {        id: 'device_007',        name: '智能门锁E2',        type: 'switch',  // 修正：智能门锁改为switch类型        icon: '🔒',
        status: 'online',
        statusText: '在线',
        location: '办公区域C',
        power: 45,
        powerTrend: 'down',
        group: 'office',
        lastUpdate: '1分钟前',
        healthStatus: 'good',
        uptime: '240小时10分钟',
        temperature: 28,
        isUpdating: false,
        alerts: []
      },
      {        id: 'device_008',        name: '环境监测站F3',        type: 'sensor',  // 修正：环境监测站改为sensor类型        icon: '🌿',
        status: 'online',
        statusText: '在线',
        location: '公共区域D',
        power: 120,
        powerTrend: 'stable',
        group: 'public',
        lastUpdate: '刚刚',
        healthStatus: 'good',
        uptime: '48小时5分钟',
        temperature: 22,
        isUpdating: false,
        alerts: [
          {
            message: '空气质量数据更新',
            time: '刚刚',
            level: 'info',
            severity: 'info'
          }
        ]
      }
    ];
    
    // 格式化设备运行时间为简洁格式（小时h分钟m）
    mockDevices = mockDevices.map(device => {
      if (device.uptime) {
        // 使用formatUptime函数将"XX小时XX分钟"格式转换为"XXhXXm"格式
        device.uptime = formatUptime(device.uptime);
      }
      return device;
    });
    
    // 计算总页数和分页状态
    const totalPages = Math.ceil(mockDevices.length / this.data.pageSize);
    const showPagination = mockDevices.length > this.data.pageSize; // 超过5个设备时显示分页
    
    // 存储所有设备数据并初始化分页状态
    this.setData({
      allDevices: mockDevices,
      filteredDevices: mockDevices, // 初始化过滤数据为所有数据
      currentPage: 1,
      totalPages: totalPages,
      showPagination: showPagination,
      hasMore: mockDevices.length > this.data.pageSize // 判断是否有更多数据
    });
    
    // 严格按照分页逻辑加载第一页数据（5条）
    this.loadDevicesWithPagination(1);
  },

  /**
   * 基于页码的分页加载设备数据 - 严格按5条/页分页
   * @param {number} page 页码
   */
  loadDevicesWithPagination(page = 1) {
    const { allDevices, pageSize, filteredDevices, searchKeyword, filterType, selectedGroup, batchMode, selectedDevices } = this.data;
    
    // 判断是否有过滤条件
    const isFiltered = searchKeyword || filterType !== 'all' || selectedGroup !== 'all';
    const sourceDevices = isFiltered ? filteredDevices : allDevices;
    
    // 计算分页数据
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageDevices = sourceDevices.slice(startIndex, endIndex);
    
    // 为每个设备添加选中状态标识
    const devicesWithSelection = pageDevices.map(device => ({
      ...device,
      isSelected: selectedDevices.includes(device.id)
    }));
    
    // 计算总页数
    const totalPages = Math.ceil(sourceDevices.length / pageSize);
    const showPagination = sourceDevices.length > pageSize;
    
    // 判断是否还有更多数据
    const hasMore = endIndex < sourceDevices.length;
    
    // 批量模式下的特殊处理：清理无效的选择项
    let updatedSelectedDevices = selectedDevices;
    if (batchMode && selectedDevices.length > 0) {
      // 获取所有有效的设备ID（当前数据源中的设备）
      const validDeviceIds = sourceDevices.map(device => device.id);
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
      devices: devicesWithSelection, // 当前页显示的设备列表（包含选中状态）
      currentPage: page,
      totalPages: totalPages,
      showPagination: showPagination,
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
   * 分页加载设备数据 - 严格按5条/页分页（保留原方法用于兼容）
   * @param {number} page 页码
   * @param {boolean} append 是否追加到现有数据
   */
  loadDevices(page = 1, append = false) {
    const { allDevices, pageSize } = this.data;
    
    // 计算分页数据
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageDevices = allDevices.slice(startIndex, endIndex);
    
    // 判断是否还有更多数据
    const hasMore = endIndex < allDevices.length;
    
    // 更新设备列表（严格分页，不影响filteredDevices）
    const devices = append ? 
      [...this.data.devices, ...pageDevices] : pageDevices;
    
    this.setData({
      devices, // 当前显示的设备列表（分页后的数据）
      currentPage: page,
      hasMore,
      loadingMore: false
    });
    
    // 更新统计数据
    this.updateDeviceStats();
  },

  /**
   * 加载过滤后的设备数据（分页）
   * @param {number} page 页码
   * @param {boolean} append 是否追加到现有数据
   */
  loadFilteredDevices(page = 1, append = false) {
    const { filteredDevices, pageSize } = this.data;
    
    // 计算分页数据
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageDevices = filteredDevices.slice(startIndex, endIndex);
    
    // 判断是否还有更多数据
    const hasMore = endIndex < filteredDevices.length;
    
    // 更新设备列表
    const devices = append ? 
      [...this.data.devices, ...pageDevices] : pageDevices;
    
    this.setData({
      devices,
      currentPage: page,
      hasMore,
      loadingMore: false
    });
    
    // 更新统计数据
    this.updateDeviceStats();
  },
  
  /**
   * 页码导航 - 上一页
   */
  onPrevPage() {
    const { currentPage } = this.data;
    if (currentPage > 1) {
      // 显示加载状态
      wx.showLoading({ title: '加载中...' });
      
      this.loadDevicesWithPagination(currentPage - 1);
      
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
      
      this.loadDevicesWithPagination(currentPage + 1);
      
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
      
      this.loadDevicesWithPagination(page);
      
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
    
    const { hasMore, loadingMore, filteredDevices, allDevices } = this.data;
    
    // 如果没有更多数据或正在加载，则返回
    if (!hasMore || loadingMore) {
      return;
    }
    
    // 设置加载状态
    this.setData({ loadingMore: true });
    
    // 模拟网络延迟
    setTimeout(() => {
      const nextPage = this.data.currentPage + 1;
      
      // 判断是否有过滤条件
      const isFiltered = filteredDevices.length !== allDevices.length || 
                        this.data.searchKeyword || 
                        this.data.filterType !== 'all' || 
                        this.data.selectedGroup !== 'all';
      
      if (isFiltered) {
        this.loadFilteredDevices(nextPage, true);
      } else {
        this.loadDevices(nextPage, true);
      }
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
    const { devices } = this.data;
    const currentStats = this.data.deviceStats;
    
    // 计算设备类型分布
    const sensorDevices = devices.filter(d => d.type === 'sensor').length;
    const controlDevices = devices.filter(d => d.type === 'control').length;
    const monitorDevices = devices.filter(d => d.type === 'monitor').length;
    const otherDevices = devices.filter(d => !['sensor', 'control', 'monitor'].includes(d.type)).length;
    
    // 计算告警严重程度分布
    let criticalAlerts = 0;
    let warningAlerts = 0;
    let infoAlerts = 0;
    
    devices.forEach(device => {
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
    
    const stats = {
      ...currentStats, // 保留其他字段如signalStrength、healthScore等
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      alerts: devices.filter(d => d.alerts && d.alerts.length > 0).length,
      // 设备类型分布
      sensorDevices,
      controlDevices,
      monitorDevices,
      otherDevices,
      // 告警严重程度分布
      criticalAlerts,
      warningAlerts,
      infoAlerts
    };
    
    this.setData({ deviceStats: stats });
  },

  /**
   * 刷新设备数据
   */
  refreshDeviceData() {
    // 这里可以调用API获取最新设备数据
    console.log('刷新设备数据');
    
    // 格式化所有设备的运行时间
    const { allDevices } = this.data;
    const updatedDevices = allDevices.map(device => {
      if (device.uptime) {
        // 确保运行时间格式为"XXhXXm"
        if (!device.uptime.includes('h') && !device.uptime.includes('m')) {
          device.uptime = formatUptime(device.uptime);
        }
      }
      return device;
    });
    
    // 更新设备数据
    this.setData({
      allDevices: updatedDevices,
      filteredDevices: updatedDevices
    });
    
    this.updateDeviceStats();
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
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 搜索设备
   */
  onSearchDevice(e) {
    const keyword = e.detail.value.toLowerCase();
    const { allDevices } = this.data;
    
    let filteredDevices = allDevices;
    
    if (keyword) {
      filteredDevices = allDevices.filter(device => 
        device.name.toLowerCase().includes(keyword) ||
        device.location.toLowerCase().includes(keyword) ||
        device.type.toLowerCase().includes(keyword)
      );
    }
    
    this.setData({
      searchKeyword: keyword,
      filteredDevices
    });
    
    // 重新加载第一页数据
    this.loadDevicesWithPagination(1);
  },

  /**
   * 确认搜索
   */
  onSearchConfirm() {
    this.filterDevices();
  },

  /**
   * 设备类型和状态筛选 - 增强版本
   */
  onFilterType(e) {
    const type = e.currentTarget.dataset.type;
    const { allDevices, searchKeyword, selectedGroup } = this.data;
    
    let filteredDevices = allDevices;
    
    // 应用搜索关键词过滤
    if (searchKeyword) {
      filteredDevices = filteredDevices.filter(device => 
        device.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        device.location.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        device.type.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    
    // 应用设备类型和状态过滤
    if (type !== 'all') {
      // 设备状态筛选
      if (type === 'offline') {
        filteredDevices = filteredDevices.filter(device => device.status === 'offline');
      } else if (type === 'alert') {
        filteredDevices = filteredDevices.filter(device => 
          device.alerts && device.alerts.length > 0
        );
      } else if (type === 'abnormal') {
        filteredDevices = filteredDevices.filter(device => 
          device.healthStatus === 'error' || device.healthStatus === 'warning'
        );
      } else if (type === 'healthy') {
        filteredDevices = filteredDevices.filter(device => 
          device.status === 'online' && device.healthStatus === 'good' && 
          (!device.alerts || device.alerts.length === 0)
        );
      } else {
        // 原有的设备类型筛选逻辑
        filteredDevices = filteredDevices.filter(device => device.type === type);
      }
    }
    
    // 应用分组过滤
    if (selectedGroup !== 'all') {
      filteredDevices = filteredDevices.filter(device => device.group === selectedGroup);
    }
    
    this.setData({
      filterType: type,
      filteredDevices
    });
    
    // 重新加载第一页数据
    this.loadDevicesWithPagination(1);
    
    // 显示筛选结果提示
    if (type !== 'all') {
      const statusNames = {
        'offline': '离线设备',
        'alert': '告警设备', 
        'abnormal': '异常设备',
        'healthy': '正常设备'
      };
      const filterName = statusNames[type] || `${type}类型设备`;
      wx.showToast({
        title: `已筛选${filterName}：${filteredDevices.length}个`,
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 选择设备分组
   */
  onSelectGroup(e) {
    const group = e.currentTarget.dataset.group;
    this.setData({
      selectedGroup: group
    });
    this.filterDevices();
  },

  /**
   * 筛选设备列表
   */
  filterDevices() {
    const { allDevices, searchKeyword, filterType, selectedGroup } = this.data;
    let filtered = allDevices;
    
    // 按关键词搜索
    if (searchKeyword) {
      filtered = filtered.filter(device => 
        device.name.includes(searchKeyword) || 
        device.type.includes(searchKeyword) ||
        device.location.includes(searchKeyword)
      );
    }
    
    // 按设备类型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(device => device.type === filterType);
    }
    
    // 按分组筛选
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(device => device.group === selectedGroup);
    }
    
    // 更新过滤后的设备数据并重置分页
    this.setData({
      filteredDevices: filtered,
      devices: [],
      currentPage: 1,
      hasMore: true
    });
    
    // 重新加载第一页数据
    this.loadFilteredDevices(1, false);
  },

  /**
   * 管理分组 - 跳转到设备分组管理页面
   */
  onManageGroups() {
    wx.navigateTo({
      url: '/pages/group-management/group-management'
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
    const { selectedDevices, devices } = this.data;
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
    
    this.setData({ 
      selectedDevices,
      devices: updatedDevices
    });
    
    // 更新全选按钮文本
    this.updateSelectAllText();
  },

  /**
   * 全选/取消全选 - 在分页模式下只选择当前页面的设备
   */
  onSelectAll() {
    const { selectedDevices, devices, showPagination } = this.data;
    
    // 在分页模式下，只操作当前页面的设备
    const targetDevices = showPagination ? devices : this.data.filteredDevices;
    const currentPageDeviceIds = targetDevices.map(d => d.id);
    
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
    
    this.setData({
      selectedDevices: updatedSelectedDevices,
      devices: updatedDevices
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
    
    this.setData({
      batchMode: false,
      selectedDevices: [],
      devices: updatedDevices
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
      success: function(res) {
        if (res.confirm) {
          // 执行批量操作
          wx.showLoading({ title: `正在${actionText}设备...` });
          
          setTimeout(function() {
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
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '正在删除设备...' });
          
          setTimeout(function() {
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
   * 清空搜索
   */
  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.filterDevices();
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
      success: function(res) {
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
  onDeviceMenu: function(e) {
    const device = e.currentTarget.dataset.device;
    
    wx.showActionSheet({
      itemList: ['查看详情', '编辑设备', '设备设置', '删除设备'],
      success: function(res) {
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
      title: '编辑功能开发中',
      icon: 'none'
    });
  },

  /**
   * 设备设置
   */
  deviceSettings(device) {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  /**
   * 删除设备
   */
  deleteDevice(device) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除设备"${device.name}"吗？`,
      success: function(res) {
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
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '正在应用推荐...' });
          
          setTimeout(function() {
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
            title: '维护功能开发中',
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
      success: function(res) {
        if (res.confirm) {
          wx.showToast({
            title: '分析功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 刷新设备统计数据
   */
  refreshDeviceStats: function() {
    const devices = this.data.devices;
    const stats = {
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      error: devices.filter(d => d.status === 'error').length,
      total: devices.length
    };
    
    this.setData({
      deviceStats: stats
    });
  },

  /**
   * 过滤设备列表
   */
  filterDevices: function() {
    const { devices, filterType, searchKeyword } = this.data;
    let filtered = devices;
    
    // 按状态筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(device => device.status === filterType);
    }
    
    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(device => 
        device.name.toLowerCase().includes(keyword) ||
        device.location.toLowerCase().includes(keyword) ||
        device.typeText.toLowerCase().includes(keyword)
      );
    }
    
    this.setData({
      filteredDevices: filtered
    });
  },

  /**
   * 筛选类型改变
   */
  onFilterChange: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      filterType: type
    }, () => {
      this.filterDevices();
    });
  },

  /**
   * 搜索输入
   */
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    }, () => {
      this.filterDevices();
    });
  },

  /**
   * 添加设备
   */
  onAddDevice: function() {
    wx.navigateTo({
      url: '/pages/add-device/add-device'
    });
  },

  /**
   * 设备详情
   */
  onDeviceDetail: function(e) {
    const device = e.currentTarget.dataset.device;
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?deviceId=${device.id}`
    });
  },

  /**
   * 设备控制
   */
  onDeviceControl: function(e) {
    const device = e.currentTarget.dataset.device;
    
    if (device.status === 'offline' || device.status === 'error') {
      wx.showToast({
        title: '设备离线，无法控制',
        icon: 'none'
      });
      return;
    }
    
    // 显示控制选项
    wx.showActionSheet({
      itemList: ['设备详情', '远程控制', '查看历史', '设置自动化'],
      success: function(res) {
        switch(res.tapIndex) {
          case 0:
            this.onDeviceDetail(e);
            break;
          case 1:
            this.showDeviceControl(device);
            break;
          case 2:
            this.showDeviceHistory(device);
            break;
          case 3:
            this.onAutomation();
            break;
        }
      }.bind(this) // 绑定this上下文
    });
  },

  /**
   * 显示设备控制面板
   */
  showDeviceControl: function(device) {
    wx.showModal({
      title: `控制 ${device.name}`,
      content: `当前状态：${device.status === 'online' ? '运行正常' : '设备异常'}\n功率：${device.power || '--'}`,
      showCancel: true,
      cancelText: '取消',
      confirmText: '详细控制',
      success: function(res) {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/device-detail/device-detail?id=${device.id}`
          });
        }
      }
    });
  },

  /**
   * 显示设备历史
   */
  showDeviceHistory: function(device) {
    wx.navigateTo({
      url: `/pages/data/data?deviceId=${device.id}`
    });
  },

  /**
   * 自动化规则
   */
  onAutomation: function() {
    wx.navigateTo({
      url: '/pages/automation/automation'
    });
  },

  /**
   * 场景模式
   */
  onSceneMode: function() {
    wx.navigateTo({
      url: '/pages/scene-mode/scene-mode'
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    // 模拟刷新数据
    setTimeout(function() {
      this.refreshDeviceStats();
      this.filterDevices();
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }.bind(this), 1000);
  },

  /**
   * 更新全选按钮文本
   */
  updateSelectAllText() {
    const { selectedDevices, devices, showPagination, filteredDevices } = this.data;
    
    let selectAllText = '全选';
    
    if (showPagination) {
      // 分页模式下，检查当前页面的设备是否全部被选中
      const currentPageDeviceIds = devices.map(d => d.id);
      const allCurrentPageSelected = currentPageDeviceIds.length > 0 && 
        currentPageDeviceIds.every(id => selectedDevices.includes(id));
      selectAllText = allCurrentPageSelected ? '取消全选' : '全选';
    } else {
      // 非分页模式下，检查所有过滤后的设备是否全部被选中
      const allSelected = filteredDevices.length > 0 && 
        selectedDevices.length === filteredDevices.length;
      selectAllText = allSelected ? '取消全选' : '全选';
    }
    
    this.setData({ selectAllText });
  }
})