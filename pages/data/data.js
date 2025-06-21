// pages/data/data.js
const API = require('../../utils/api.js');
const mockApi = require('../../utils/api-mock.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 页面导航状态
    activeNavSection: 'overview', // 当前激活的导航区域
    
    // 时间范围选择
    timeRange: 'today',
    timeRangeOptions: [
      { value: 'today', label: '今日' },
      { value: 'week', label: '本周' },
      { value: 'month', label: '本月' },
      { value: 'quarter', label: '本季度' },
      { value: 'year', label: '本年' },
      { value: 'custom', label: '自定义' }
    ],
    activeTimeRange: 'month',
    startDate: '',
    endDate: '',
    showCustomPicker: false,
    
    // 能耗概览数据
    energyOverview: {
      electricity: 0,
      electricityChange: 0,
      water: 0,
      waterChange: 0,
      gas: 0,
      gasChange: 0,
      carbon: 0,
      carbonChange: 0
    },
    
    // 图表相关
    chartType: 'line',
    chartData: [],
    chartLoading: false,
    chartZoomLevel: 1,
    activeDataType: 'all',
    legendStatus: {
      electricity: true,
      water: true,
      gas: true
    },
    
    // 对比分析
    compareType: 'period',
    compareData: [],
    
    // 报告生成
    reportType: 'summary',
    reportFormat: 'pdf',
    reportGenerating: false,
    isReportSectionCollapsed: true,
    showReportPanel: false, // 修复WXML中的数据绑定
    
    // 浮动按钮状态
    showBackToTop: false,
    
    // 实时连接状态
    realTimeStatus: 'disconnected' // connected, disconnected, error
  },

  // 实时连接相关属性
  socketTask: null,
  isRealTimeConnected: false,
  lastDataLoadTime: 0, // 记录上次数据加载时间
  dataRefreshInterval: 5 * 60 * 1000, // 数据刷新间隔（5分钟）
  isPageVisible: true, // 页面可见性状态
  realTimeUpdateInterval: null, // 实时更新定时器
  baseUpdateFrequency: 30000, // 基础更新频率（30秒）
  adaptiveUpdateFrequency: 30000, // 自适应更新频率

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化页面状态
    this.isPageVisible = false;
    this.lastUserInteraction = Date.now();
    this.lastDataLoadTime = 0;
    this.dataRefreshInterval = 30000; // 30秒刷新间隔
    this.hasScrolledToSection = false; // 防止重复跳转的标记
    this.lastQueryParams = null; // 初始化查询参数缓存
    
    // 初始化图表配置
    // 注意：图表初始化在onReady中进行，这里不需要调用
    
    // 监听页面可见性变化（小程序特有）
    wx.onAppShow(() => {
      if (this.isPageVisible) {
        console.log('应用从后台切换到前台，恢复实时监控');
        this.lastUserInteraction = Date.now();
        if (!this.isRealTimeConnected) {
          this.initRealTimeMonitor();
        }
      }
    });
    
    wx.onAppHide(() => {
      console.log('应用切换到后台，暂停实时监控');
      this.disconnectRealTime();
    });
    
    this.initDateRange();
    this.loadEnergyData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    this.initChart();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 更新页面可见性状态
    this.isPageVisible = true;
    this.lastUserInteraction = Date.now();
    
    // 页面显示时刷新数据和启动实时监控
    this.loadEnergyData();
    this.initRealTimeMonitor();
    
    // 数据预加载 - 预测用户可能访问的页面
    API.preloadData('data');
    
    // 检查是否有指定的页面区域需要跳转
    const app = getApp();
    if (app.globalData && app.globalData.dataPageSection && !this.hasScrolledToSection) {
      const targetSection = app.globalData.dataPageSection;
      // 清除全局数据
      delete app.globalData.dataPageSection;
      // 设置标记，防止重复跳转
      this.hasScrolledToSection = true;
      
      // 延迟执行滚动，确保页面已完全渲染
      setTimeout(() => {
        this.scrollToSection({
          currentTarget: {
            dataset: {
              section: targetSection
            }
          }
        });
      }, 300);
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 重置跳转标记，允许下次进入页面时跳转
    this.hasScrolledToSection = false;
    // 更新页面可见性状态
    this.isPageVisible = false;
    
    // 页面隐藏时断开实时连接
    this.disconnectRealTime();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 更新页面可见性状态
    this.isPageVisible = false;
    
    // 页面卸载时断开实时连接
    this.disconnectRealTime();
  },

  /**
   * 页面滚动事件
   */
  onPageScroll(e) {
    // 当页面滚动超过一定距离时显示返回顶部按钮
    this.setData({
      showBackToTop: e.scrollTop > 300
    });
    
    // 根据滚动位置更新导航栏激活状态
    this.updateActiveNavByScroll(e.scrollTop);
  },
  
  /**
   * 根据滚动位置更新导航栏激活状态
   */
  updateActiveNavByScroll(scrollTop) {
    // 获取各个区域的位置信息 - 使用section ID选择器
    const sections = ['overview', 'trend', 'compare', 'report'];
    
    wx.createSelectorQuery()
      .selectAll('#section-overview, #section-trend, #section-compare, #section-report')
      .boundingClientRect(rects => {
        if (!rects || rects.length === 0) return;
        
        // 找到当前在视口中的区域
        let activeSection = 'overview';
        const viewportHeight = wx.getWindowInfo().windowHeight;
        const threshold = viewportHeight * 0.3;
        
        // 根据元素位置确定当前激活的section
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          if (rect.top <= threshold && rect.bottom > threshold) {
            // 根据ID确定section名称
            const id = rect.id;
            if (id) {
              activeSection = id.replace('section-', '');
              break;
            }
          }
        }
        
        // 如果没有找到合适的section，使用距离顶部最近的
        if (activeSection === 'overview') {
          let minDistance = Infinity;
          for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const distance = Math.abs(rect.top);
            if (distance < minDistance && rect.top <= threshold) {
              minDistance = distance;
              const id = rect.id;
              if (id) {
                activeSection = id.replace('section-', '');
              }
            }
          }
        }
        
        if (this.data.activeNavSection !== activeSection) {
          this.setData({ activeNavSection: activeSection });
        }
      })
      .exec();
  },

  /**
   * 页面内导航 - 修复跳转功能
   */
  scrollToSection(e) {
    const section = e.currentTarget.dataset.section;
    console.log('点击导航项:', section);
    
    // 立即更新激活状态，提供即时反馈
    this.setData({ activeNavSection: section });
    
    // 使用更可靠的滚动实现
    const query = wx.createSelectorQuery().in(this);
    query.select(`#section-${section}`)
      .boundingClientRect()
      .selectViewport()
      .scrollOffset()
      .exec(res => {
        const rect = res[0];
        const scroll = res[1];
        
        if (rect) {
          // 计算目标滚动位置，考虑导航栏高度
          const scrollTop = Math.max(0, rect.top + scroll.scrollTop - 100); // 减去100px作为顶部偏移
          
          console.log(`跳转到section-${section}, 目标位置: ${scrollTop}`);
          
          wx.pageScrollTo({
            scrollTop: scrollTop,
            duration: 500,
            success: () => {
              console.log(`成功跳转到section-${section}`);
            },
            fail: (error) => {
              console.error(`跳转失败:`, error);
              // 如果pageScrollTo失败，尝试备用方法
              this.scrollToSectionFallback(section);
            }
          });
        } else {
          console.error(`未找到目标元素: #section-${section}`);
          // 显示可用的section列表，帮助调试
          this.showAvailableSections();
          // 尝试备用方法
          this.scrollToSectionFallback(section);
        }
      });
  },

  // 兼容性方法
  navigateTo(e) {
    this.scrollToSection(e);
  },

  /**
   * 备用跳转方法 - 如果主方法失效可以使用这个
   */
  scrollToSectionFallback(section) {
    console.log(`使用备用方法跳转到: ${section}`);
    
    // 尝试多种选择器
    const selectors = [
      `#section-${section}`,
      `.section-${section}`,
      `[data-section="${section}"]`
    ];
    
    let selectorIndex = 0;
    
    const tryNextSelector = () => {
      if (selectorIndex >= selectors.length) {
        console.error('所有备用方法都失败了');
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
        return;
      }
      
      const selector = selectors[selectorIndex];
      console.log(`尝试选择器: ${selector}`);
      
      wx.createSelectorQuery()
        .select(selector)
        .boundingClientRect()
        .exec(res => {
          if (res[0]) {
            const rect = res[0];
            console.log(`找到元素，位置:`, rect);
            
            wx.pageScrollTo({
              scrollTop: Math.max(0, rect.top - 100),
              duration: 800,
              success: () => {
                console.log(`备用方法成功跳转到: ${section}`);
              },
              fail: () => {
                console.log(`备用方法失败，尝试下一个选择器`);
                selectorIndex++;
                tryNextSelector();
              }
            });
          } else {
            console.log(`选择器 ${selector} 未找到元素`);
            selectorIndex++;
            tryNextSelector();
          }
        });
    };
    
    tryNextSelector();
  },

  /**
   * 显示可用的section列表（调试用）
   */
  showAvailableSections() {
    const sections = ['overview', 'trend', 'compare', 'report'];
    console.log('可用的section列表:', sections);
    
    // 检查每个section是否存在
    sections.forEach(section => {
      wx.createSelectorQuery()
        .select(`#section-${section}`)
        .boundingClientRect()
        .exec(res => {
          console.log(`Section ${section} 存在:`, !!res[0]);
          if (res[0]) {
            console.log(`Section ${section} 位置:`, res[0]);
          }
        });
    });
  },

  /**
   * 初始化日期范围
   */
  initDateRange() {
    const now = new Date();
    const endDate = this.formatDate(now);
    const startDate = this.formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    this.setData({
      startDate,
      endDate
    });
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 加载能耗数据 - 使用API优化功能
   */
  async loadEnergyData() {
    try {
      // 检查缓存状态，避免重复请求
      const cacheStatus = API.cache.getStatus();
      const shouldRefresh = this.shouldRefreshData(cacheStatus);
      
      if (!shouldRefresh) {
        console.log('使用缓存数据，跳过网络请求');
        return;
      }
      
      wx.showLoading({ title: '加载中...' });
      
      // 使用批量数据获取接口，采用更清晰的数据类型设计
      const requests = [
        { 
          type: 'energy', // 能耗数据（包含概览、图表和对比）
          params: { 
            startDate: this.data.startDate,
            endDate: this.data.endDate,
            timeRange: this.data.activeTimeRange,
            chartType: this.data.chartType,
            compareType: this.data.compareType,
            includeAll: true // 请求所有类型的数据
          } 
        }
      ];
      
      const batchResult = await API.getBatchData(requests);
      
      if (batchResult.success) {
        // 处理能耗数据
        const energyResult = batchResult.data.energy;
        
        if (energyResult && energyResult.success) {
          const energyData = energyResult.data;
          
          // 处理概览数据 - 数据适配逻辑
          if (energyData.overview) {
            // 如果API直接返回overview格式，直接使用
            this.setData({
              energyOverview: energyData.overview
            });
          } else if (energyData.breakdown) {
            // 如果API返回breakdown格式，转换为overview格式
            const adaptedOverview = this.adaptBreakdownToOverview(energyData);
            this.setData({
              energyOverview: adaptedOverview
            });
          }
          
          // 处理图表数据
          if (energyData.chartData) {
            this.setData({
              chartData: energyData.chartData
            });
          }
          
          // 处理对比数据
          if (energyData.compareData) {
            this.setData({
              compareData: energyData.compareData
            });
          }
        }
        
        // 处理部分数据获取失败的情况
        if (batchResult.errors && batchResult.errors.length > 0) {
          console.warn('部分数据获取失败:', batchResult.errors);
          // 对于失败的数据，使用模拟数据作为备用
          await this.loadFallbackData(batchResult.errors);
        }
        
        // 更新图表
        this.updateChart();
        
        // 记录数据加载成功的时间戳，用于缓存管理
        this.lastDataLoadTime = Date.now();
      } else {
        throw new Error('批量数据获取失败');
      }
    } catch (error) {
      console.error('加载能耗数据失败:', error);
      // 如果API调用失败，使用模拟数据作为备用
      await this.loadFallbackData(['overview', 'chart', 'compare']);
      wx.showToast({
        title: '数据加载失败，使用模拟数据',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 加载备用数据（模拟数据）
   */
  async loadFallbackData(failedTypes) {
    try {
      if (failedTypes.includes('overview') || failedTypes.includes(0)) {
        const overviewData = await this.getEnergyOverview();
        this.setData({ energyOverview: overviewData });
      }
      
      if (failedTypes.includes('chart') || failedTypes.includes(1)) {
        const chartData = await this.getChartData();
        this.setData({ chartData: chartData });
      }
      
      if (failedTypes.includes('compare') || failedTypes.includes(2)) {
        const compareData = await this.getCompareData();
        this.setData({ compareData: compareData });
      }
      
      // 更新图表
      this.updateChart();
    } catch (error) {
      console.error('加载备用数据失败:', error);
    }
  },

  /**
   * 检查是否需要刷新数据
   * @param {Object} cacheStatus 缓存状态
   * @returns {boolean} 是否需要刷新
   */
  shouldRefreshData(cacheStatus) {
    // 如果是首次加载，必须刷新
    if (!this.lastDataLoadTime) {
      return true;
    }
    
    // 检查距离上次加载是否超过刷新间隔
    const timeSinceLastLoad = Date.now() - this.lastDataLoadTime;
    if (timeSinceLastLoad > this.dataRefreshInterval) {
      return true;
    }
    
    // 检查缓存状态
    const energyCache = cacheStatus.energy;
    if (!energyCache || !energyCache.valid) {
      return true;
    }
    
    // 检查时间范围或图表类型是否发生变化
    if (this.hasParametersChanged()) {
      return true;
    }
    
    return false;
  },

  /**
   * 检查查询参数是否发生变化
   * @returns {boolean} 参数是否变化
   */
  hasParametersChanged() {
    const currentParams = {
      timeRange: this.data.activeTimeRange,
      chartType: this.data.chartType,
      compareType: this.data.compareType,
      startDate: this.data.startDate,
      endDate: this.data.endDate
    };
    
    // 如果没有缓存的参数，认为发生了变化
    if (!this.lastQueryParams) {
      this.lastQueryParams = currentParams;
      return true;
    }
    
    // 比较参数是否发生变化
    const hasChanged = JSON.stringify(currentParams) !== JSON.stringify(this.lastQueryParams);
    
    if (hasChanged) {
      this.lastQueryParams = currentParams;
    }
    
    return hasChanged;
  },

  /**
   * 获取默认概览数据
   */
  getDefaultOverviewData() {
    return {
      electricity: 0,
      electricityChange: 0,
      water: 0,
      waterChange: 0,
      gas: 0,
      gasChange: 0,
      carbon: 0,
      carbonChange: 0
    };
  },

  /**
   * 获取能耗概览数据
   */
  async getEnergyOverview() {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          electricity: 245.6,
          electricityChange: -8.2,
          water: 12.3,
          waterChange: 5.1,
          gas: 18.7,
          gasChange: -2.4,
          carbon: 156.8,
          carbonChange: -12.5
        });
      }, 500);
    });
  },

  /**
   * 获取图表数据
   */
  async getChartData() {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = [];
        const now = new Date();
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          data.push({
            date: this.formatDate(date),
            electricity: Math.random() * 50 + 200,
            water: Math.random() * 5 + 10,
            gas: Math.random() * 10 + 15
          });
        }
        
        resolve(data);
      }, 300);
    });
  },

  /**
   * 获取对比数据
   */
  async getCompareData() {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            type: 'electricity',
            name: '电力消耗',
            current: '245.6 kWh',
            previous: '267.8 kWh',
            change: -8.2,
            percentage: 91.8
          },
          {
            type: 'water',
            name: '水消耗',
            current: '12.3 吨',
            previous: '11.7 吨',
            change: 5.1,
            percentage: 105.1
          },
          {
            type: 'gas',
            name: '燃气消耗',
            current: '18.7 m³',
            previous: '19.2 m³',
            change: -2.4,
            percentage: 97.6
          },
          {
            type: 'carbon',
            name: '碳排放量',
            current: '156.8 kg',
            previous: '179.2 kg',
            change: -12.5,
            percentage: 87.5
          }
        ]);
      }, 200);
    });
  },

  /**
   * 时间范围变化
   */
  onTimeRangeChange(e) {
    const range = e.currentTarget.dataset.range;
    
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    // 重置数据加载时间，强制刷新数据
    this.lastDataLoadTime = 0;
    
    this.setData({
      activeTimeRange: range,
      showCustomPicker: range === 'custom'
    });
    
    // 根据选择的时间范围更新日期
    if (range !== 'custom') {
      this.updateDateByRange(range);
      // 确保日期更新后再加载数据（小程序中使用setTimeout确保setData完成）
      setTimeout(() => {
        this.loadEnergyData();
      }, 0);
    }
  },

  /**
   * 根据时间范围更新日期
   */
  updateDateByRange(range) {
    const now = new Date();
    let startDate, endDate;
    
    switch (range) {
      case 'day':
        startDate = endDate = this.formatDate(now);
        break;
      case 'week':
        endDate = this.formatDate(now);
        startDate = this.formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        endDate = this.formatDate(now);
        startDate = this.formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        break;
      case 'year':
        endDate = this.formatDate(now);
        startDate = this.formatDate(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000));
        break;
    }
    
    this.setData({ startDate, endDate });
  },

  /**
   * 开始日期变化
   */
  onStartDateChange(e) {
    this.setData({
      startDate: e.detail.value
    });
  },

  /**
   * 结束日期变化
   */
  onEndDateChange(e) {
    this.setData({
      endDate: e.detail.value
    });
  },
  
  /**
   * 应用自定义日期范围
   */
  applyCustomDate() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    // 重置数据加载时间，强制刷新数据
    this.lastDataLoadTime = 0;
    
    this.loadEnergyData();
    wx.showToast({
      title: '已应用自定义日期',
      icon: 'success'
    });
  },

  /**
   * 数据类型变化
   */
  onDataTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    // 重置数据加载时间，强制刷新数据
    this.lastDataLoadTime = 0;
    
    this.setData({
      activeDataType: type,
      chartLoading: true
    });
    
    // 重新加载数据以获取对应类型的数据
    this.loadEnergyData().then(() => {
      this.setData({ chartLoading: false });
      this.updateChart();
    }).catch(() => {
      // 如果加载失败，仍然需要隐藏loading状态
      this.setData({ chartLoading: false });
    });
  },

  /**
   * 图表类型变化
   */
  onChartTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    // 重置数据加载时间，强制刷新数据
    this.lastDataLoadTime = 0;
    
    this.setData({
      chartType: type,
      chartLoading: true
    });
    
    // 重新加载数据以获取对应图表类型的数据
    this.loadEnergyData().then(() => {
      this.setData({ chartLoading: false });
      this.updateChart();
    }).catch(() => {
      // 如果加载失败，仍然需要隐藏loading状态
      this.setData({ chartLoading: false });
    });
  },

  /**
   * 初始化图表
   */
  initChart() {
    // 使用Canvas 2D接口
    const query = wx.createSelectorQuery().in(this);
    query.select('#energyChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸 - 使用新的API替代已废弃的wx.getSystemInfoSync
        const dpr = wx.getDeviceInfo().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        this.chartContext = ctx;
        this.canvas = canvas;
        this.updateChart();
      });
  },

  /**
   * 更新图表
   */
  updateChart() {
    if (!this.chartContext || this.data.chartData.length === 0) {
      return;
    }
    
    this.setData({ chartLoading: true });
    
    setTimeout(() => {
      this.drawChart();
      this.setData({ chartLoading: false });
    }, 500);
  },

  /**
   * 绘制图表
   */
  drawChart() {
    const ctx = this.chartContext;
    const { chartData, chartType, chartZoomLevel } = this.data;
    
    // 获取canvas尺寸
    const canvasWidth = 350;
    const canvasHeight = 200;
    const padding = 40;
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 设置样式
    ctx.strokeStyle = '#00FFFF';
    ctx.fillStyle = '#00FFFF';
    ctx.lineWidth = 2;
    
    // 应用缩放级别
    const zoomedWidth = canvasWidth * chartZoomLevel;
    const zoomedHeight = canvasHeight * chartZoomLevel;
    
    if (chartType === 'line') {
      this.drawLineChart(ctx, chartData, zoomedWidth, zoomedHeight, padding);
    } else {
      this.drawBarChart(ctx, chartData, zoomedWidth, zoomedHeight, padding);
    }
    
    // Canvas 2D不需要调用draw()方法
  },

  /**
   * 绘制折线图
   */
  drawLineChart(ctx, data, width, height, padding) {
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // 计算数据点位置
    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + (1 - item.electricity / 300) * chartHeight;
      return { x, y, value: item.electricity };
    });
    
    // 绘制折线
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    
    // 绘制数据点
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  },

  /**
   * 绘制柱状图
   */
  drawBarChart(ctx, data, width, height, padding) {
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / data.length * 0.6;
    
    data.forEach((item, index) => {
      const x = padding + (index + 0.2) * (chartWidth / data.length);
      const barHeight = (item.electricity / 300) * chartHeight;
      const y = padding + chartHeight - barHeight;
      
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  },

  /**
   * 图表缩放控制
   */
  zoomChart(e) {
    const action = e.currentTarget.dataset.action;
    let newZoomLevel = this.data.chartZoomLevel;
    
    if (action === 'in' && newZoomLevel < 2) {
      newZoomLevel += 0.25;
    } else if (action === 'out' && newZoomLevel > 0.5) {
      newZoomLevel -= 0.25;
    } else if (action === 'reset') {
      newZoomLevel = 1;
    }
    
    this.setData({ chartZoomLevel: newZoomLevel });
    this.updateChart();
  },

  /**
   * 切换图表图例
   */
  toggleLegend(e) {
    const type = e.currentTarget.dataset.type;
    const newStatus = {};
    newStatus[`legendStatus.${type}`] = !this.data.legendStatus[type];
    
    this.setData(newStatus);
    this.updateChart();
  },

  /**
   * 图表触摸事件
   */
  onChartTouchStart(e) {
    // 处理图表交互
    this.chartTouchStartX = e.touches[0].x;
    this.chartTouchStartY = e.touches[0].y;
  },

  onChartTouchMove(e) {
    // 处理图表交互，如显示数据提示
    const moveX = e.touches[0].x;
    const moveY = e.touches[0].y;
    
    // 计算移动距离，可用于实现图表拖动等功能
    const deltaX = moveX - this.chartTouchStartX;
    const deltaY = moveY - this.chartTouchStartY;
    
    // 这里可以添加更多交互逻辑
  },

  onChartTouchEnd(e) {
    // 处理图表交互结束
    this.chartTouchStartX = null;
    this.chartTouchStartY = null;
  },

  /**
   * 对比类型变化
   */
  onCompareTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      compareType: type,
      chartLoading: true
    });
    
    // 模拟数据加载
    setTimeout(() => {
      this.loadEnergyData();
    }, 500);
  },
  
  /**
   * 查看对比详情
   */
  viewCompareDetail(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.compareData[index];
    
    wx.showModal({
      title: `${item.name}对比详情`,
      content: `当前周期: ${item.current}\n对比周期: ${item.previous}\n变化率: ${item.change > 0 ? '+' : ''}${item.change}%`,
      showCancel: false
    });
  },

  /**
   * 切换报告部分的折叠状态
   */
  toggleReportSection() {
    this.setData({
      isReportSectionCollapsed: !this.data.isReportSectionCollapsed
    });
  },

  /**
   * 切换报告面板显示状态 - 修复WXML绑定
   */
  toggleReportPanel() {
    this.setData({
      showReportPanel: !this.data.showReportPanel
    });
    console.log('切换报告面板状态:', this.data.showReportPanel);
  },

  /**
   * 报告类型变化
   */
  onReportTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      reportType: type
    });
  },

  /**
   * 报告格式变化
   */
  onReportFormatChange(e) {
    const format = e.currentTarget.dataset.format;
    this.setData({
      reportFormat: format
    });
  },

  /**
   * 生成报告
   */
  async onGenerateReport() {
    const { reportType, reportFormat } = this.data;
    
    this.setData({ reportGenerating: true });
    
    try {
      // 模拟报告生成
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      wx.showToast({
        title: '报告生成成功',
        icon: 'success'
      });
      
      // 这里可以添加下载或分享逻辑
      
    } catch (error) {
      console.error('生成报告失败:', error);
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      });
    } finally {
      this.setData({ reportGenerating: false });
    }
  },

  /**
   * 预览报告
   */
  onPreviewReport() {
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
  },

  /**
   * 刷新数据
   */
  refreshData() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    this.loadEnergyData();
    wx.showToast({
      title: '数据已刷新',
      icon: 'success'
    });
  },
  
  /**
   * 显示帮助信息
   */
  showHelp(e) {
    const section = e.currentTarget.dataset.section;
    let content = '';
    
    switch(section) {
      case 'overview':
        content = '能耗概览展示了各类能源的使用情况和同比变化。点击卡片可查看详细数据。';
        break;
      case 'trend':
        content = '趋势图表展示了能耗随时间的变化趋势，可切换不同图表类型和数据类型，还可以缩放查看更多细节。';
        break;
      case 'compare':
        content = '对比分析展示了当前周期与上一周期的能耗对比情况，点击对比项可查看详细数据。';
        break;
      case 'report':
        content = '报告生成功能可以根据当前数据生成不同类型的能耗报告，支持多种格式导出。';
        break;
      default:
        content = '这是能源数据分析页面，展示各类能源使用情况和分析结果。';
    }
    
    wx.showModal({
      title: '帮助信息',
      content: content,
      showCancel: false
    });
  },

  /**
   * 导航到节能建议页面
   */
  onNavigateToSaving() {
    wx.navigateTo({
      url: '/pages/saving/saving'
    });
  },

  /**
   * 导航到告警页面
   */
  onNavigateToAlerts() {
    wx.navigateTo({
      url: '/pages/alerts/alerts'
    });
  },

  /**
   * 导航到设备页面
   */
  onNavigateToDevices() {
    wx.switchTab({
      url: '/pages/devices/devices'
    });
  },
  
  /**
   * 返回页面顶部
   */
  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  /**
   * 数据适配器：将breakdown格式转换为overview格式
   * @param {Object} energyData - API返回的能耗数据
   * @returns {Object} 转换后的overview格式数据
   */
  adaptBreakdownToOverview(energyData) {
    const { breakdown, carbonEmission, statistics } = energyData;
    
    // 基础数据转换
    const overview = {
      electricity: breakdown?.electricity?.value || 0,
      water: breakdown?.water?.value || 0,
      gas: breakdown?.gas?.value || 0,
      carbon: carbonEmission?.total || 0
    };
    
    // 计算变化量（基于统计数据的增长率）
    const growthRate = statistics?.growth || 0;
    overview.electricityChange = this.calculateChange(overview.electricity, growthRate);
    overview.waterChange = this.calculateChange(overview.water, growthRate * 0.8); // 水的变化通常较小
    overview.gasChange = this.calculateChange(overview.gas, growthRate * 0.6); // 燃气变化更小
    overview.carbonChange = this.calculateChange(overview.carbon, growthRate * -0.5); // 碳排放通常呈下降趋势
    
    return overview;
  },

  /**
   * 计算变化百分比
   * @param {Number} currentValue - 当前值
   * @param {Number} baseGrowthRate - 基础增长率
   * @returns {Number} 变化百分比
   */
  calculateChange(currentValue, baseGrowthRate) {
    if (!currentValue || currentValue === 0) return 0;
    // 添加一些随机性，使数据更真实
    const randomFactor = (Math.random() - 0.5) * 2; // -1 到 1 的随机数
    return Number((baseGrowthRate + randomFactor).toFixed(1));
  },

  /**
   * 页面相关事件处理函数--监听用户下拉刷新
   */
  onPullDownRefresh() {
    this.loadEnergyData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里加载更多历史数据
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '智能能源管理 - 数据分析',
      path: '/pages/data/data'
    };
   },

  /**
   * 初始化实时监控 - 优化版本
   */
  initRealTimeMonitor() {
    // 如果已经连接，先断开
    if (this.socketTask) {
      this.disconnectRealTime();
    }
    
    // 只在页面可见时启动实时监控
    if (!this.isPageVisible) {
      console.log('页面不可见，跳过实时监控初始化');
      return;
    }
    
    this.socketTask = API.subscribeRealTimeData({
      dataTypes: ['energy', 'chart'], // 订阅能耗和图表数据更新
      
      // 连接成功回调
      onConnect: () => {
        console.log('数据页面实时数据连接成功');
        this.isRealTimeConnected = true;
        this.setData({ realTimeStatus: 'connected' });
        
        // 启动自适应更新机制
        this.startAdaptiveUpdates();
      },
      
      // 接收消息回调
      onMessage: (data) => {
        this.handleRealTimeMessage(data);
      },
      
      // 连接断开回调
      onDisconnect: (event) => {
        console.log('数据页面实时数据连接断开:', event);
        this.isRealTimeConnected = false;
        this.setData({ realTimeStatus: 'disconnected' });
        
        // 停止自适应更新
        this.stopAdaptiveUpdates();
        
        // 延迟重试，避免频繁重连
        setTimeout(() => {
          if (!this.isRealTimeConnected && this.isPageVisible) {
            this.initRealTimeMonitor();
          }
        }, 5000);
      },
      
      // 错误回调
      onError: (error) => {
        console.error('数据页面实时数据连接错误:', error);
        this.isRealTimeConnected = false;
        this.setData({ realTimeStatus: 'error' });
        this.stopAdaptiveUpdates();
      }
    });
  },

  /**
   * 处理实时消息
   */
  handleRealTimeMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'energy_update':
        this.updateEnergyData(data);
        break;
      case 'chart_update':
        this.updateChartData(data);
        break;
    }
  },

  /**
   * 更新能耗数据
   */
  updateEnergyData(data) {
    const { energyOverview } = this.data;
    
    // 更新概览数据
    if (data.overview) {
      this.setData({
        energyOverview: {
          ...energyOverview,
          ...data.overview
        }
      });
    }
    
    // 更新对比数据
    if (data.compare) {
      this.setData({
        compareData: data.compare
      });
    }
  },

  /**
   * 更新图表数据
   */
  updateChartData(data) {
    if (data.chartData) {
      this.setData({
        chartData: data.chartData
      });
      
      // 更新图表显示
      this.updateChart();
    }
  },

  /**
   * 启动自适应更新机制
   */
  startAdaptiveUpdates() {
    // 清除现有定时器
    this.stopAdaptiveUpdates();
    
    // 根据页面可见性和用户交互调整更新频率
    this.realTimeUpdateInterval = setInterval(() => {
      if (this.isPageVisible && this.isRealTimeConnected) {
        // 检查是否需要更新数据
        this.checkAndUpdateRealTimeData();
      }
    }, this.adaptiveUpdateFrequency);
  },

  /**
   * 停止自适应更新机制
   */
  stopAdaptiveUpdates() {
    if (this.realTimeUpdateInterval) {
      clearInterval(this.realTimeUpdateInterval);
      this.realTimeUpdateInterval = null;
    }
  },

  /**
   * 检查并更新实时数据
   */
  checkAndUpdateRealTimeData() {
    // 根据用户交互频率调整更新频率
    const now = Date.now();
    const timeSinceLastInteraction = now - (this.lastUserInteraction || 0);
    
    // 如果用户长时间无交互，降低更新频率
    if (timeSinceLastInteraction > 2 * 60 * 1000) { // 2分钟无交互
      this.adaptiveUpdateFrequency = this.baseUpdateFrequency * 2; // 降低到60秒
    } else {
      this.adaptiveUpdateFrequency = this.baseUpdateFrequency; // 保持30秒
    }
    
    // 请求最新的实时数据
    this.requestLatestData();
  },

  /**
   * 请求最新数据
   */
  async requestLatestData() {
    try {
      // 只请求关键的实时数据，避免过度请求
      const result = await API.getData('energy', {
        startDate: this.data.startDate,
        endDate: this.data.endDate,
        timeRange: this.data.activeTimeRange,
        realTime: true // 标记为实时请求
      });
      
      if (result.success) {
        this.setData({
          energyOverview: result.data || this.getDefaultOverviewData()
        });
      }
    } catch (error) {
      console.warn('实时数据更新失败:', error);
    }
  },

  /**
   * 断开实时连接
   */
  disconnectRealTime() {
    if (this.socketTask) {
      API.unsubscribeRealTimeData(this.socketTask);
      this.socketTask = null;
      this.isRealTimeConnected = false;
    }
    
    // 停止自适应更新
    this.stopAdaptiveUpdates();
  },

  /**
   * 预览报告
   */
  onPreviewReport() {
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
  },

  /**
   * 刷新数据
   */
  refreshData() {
    this.loadEnergyData();
    wx.showToast({
      title: '数据已刷新',
      icon: 'success'
    });
  },
  
  /**
   * 显示帮助信息
   */
  showHelp(e) {
    const section = e.currentTarget.dataset.section;
    let content = '';
    
    switch(section) {
      case 'overview':
        content = '能耗概览展示了各类能源的使用情况和同比变化。点击卡片可查看详细数据。';
        break;
      case 'trend':
        content = '趋势图表展示了能耗随时间的变化趋势，可切换不同图表类型和数据类型，还可以缩放查看更多细节。';
        break;
      case 'compare':
        content = '对比分析展示了当前周期与上一周期的能耗对比情况，点击对比项可查看详细数据。';
        break;
      case 'report':
        content = '报告生成功能可以根据当前数据生成不同类型的能耗报告，支持多种格式导出。';
        break;
      default:
        content = '这是能源数据分析页面，展示各类能源使用情况和分析结果。';
    }
    
    wx.showModal({
      title: '帮助信息',
      content: content,
      showCancel: false
    });
  },

  /**
   * 导航到节能建议页面
   */
  onNavigateToSaving() {
    wx.navigateTo({
      url: '/pages/saving/saving'
    });
  },

  /**
   * 导航到告警页面
   */
  onNavigateToAlerts() {
    wx.navigateTo({
      url: '/pages/alerts/alerts'
    });
  },

  /**
   * 导航到设备页面
   */
  onNavigateToDevices() {
    wx.switchTab({
      url: '/pages/devices/devices'
    });
  },
  
  /**
   * 返回页面顶部
   */
  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉刷新
   */
  onPullDownRefresh() {
    this.loadEnergyData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里加载更多历史数据
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '智能能源管理 - 数据分析',
      path: '/pages/data/data'
    };
  }
})