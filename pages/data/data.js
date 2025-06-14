// pages/data/data.js
const api = require('../../utils/api.js');
const mockApi = require('../../api-mock.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 页面导航状态
    activeNavSection: 'overview',
    
    // 时间范围选择
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
    
    // 浮动按钮状态
    showBackToTop: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
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
    // 页面显示时刷新数据
    this.loadEnergyData();
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
    // 获取各个区域的位置信息
    wx.createSelectorQuery()
      .selectAll('.section-anchor')
      .boundingClientRect(rects => {
        if (!rects || rects.length === 0) return;
        
        // 找到当前在视口中的区域
        let activeSection = 'overview';
        const viewportHeight = wx.getSystemInfoSync().windowHeight;
        const threshold = viewportHeight * 0.3;
        
        for (let i = rects.length - 1; i >= 0; i--) {
          if (rects[i].top < threshold) {
            activeSection = rects[i].dataset.section;
            break;
          }
        }
        
        if (this.data.activeNavSection !== activeSection) {
          this.setData({ activeNavSection: activeSection });
        }
      })
      .exec();
  },

  /**
   * 页面内导航
   */
  navigateTo(e) {
    const section = e.currentTarget.dataset.section;
    this.setData({ activeNavSection: section });
    
    wx.createSelectorQuery()
      .select(`#section-${section}`)
      .boundingClientRect(rect => {
        if (rect) {
          wx.pageScrollTo({
            scrollTop: rect.top + wx.pageScrollTop,
            duration: 300
          });
        }
      })
      .exec();
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
   * 加载能耗数据
   */
  async loadEnergyData() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 获取能耗概览数据
      const overviewData = await this.getEnergyOverview();
      
      // 获取图表数据
      const chartData = await this.getChartData();
      
      // 获取对比数据
      const compareData = await this.getCompareData();
      
      this.setData({
        energyOverview: overviewData,
        chartData: chartData,
        compareData: compareData
      });
      
      // 更新图表
      this.updateChart();
      
    } catch (error) {
      console.error('加载能耗数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
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
    this.setData({
      activeTimeRange: range,
      showCustomPicker: range === 'custom'
    });
    
    // 根据选择的时间范围更新日期
    if (range !== 'custom') {
      this.updateDateByRange(range);
      // 重新加载数据
      this.loadEnergyData();
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
    this.setData({
      activeDataType: type,
      chartLoading: true
    });
    
    // 模拟数据加载
    setTimeout(() => {
      this.setData({ chartLoading: false });
      this.updateChart();
    }, 500);
  },

  /**
   * 图表类型变化
   */
  onChartTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      chartType: type,
      chartLoading: true
    });
    
    // 模拟数据加载
    setTimeout(() => {
      this.setData({ chartLoading: false });
      this.updateChart();
    }, 500);
  },

  /**
   * 初始化图表
   */
  initChart() {
    const ctx = wx.createCanvasContext('energyChart', this);
    this.chartContext = ctx;
    this.updateChart();
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
    ctx.setStrokeStyle('#00FFFF');
    ctx.setFillStyle('#00FFFF');
    ctx.setLineWidth(2);
    
    // 应用缩放级别
    const zoomedWidth = canvasWidth * chartZoomLevel;
    const zoomedHeight = canvasHeight * chartZoomLevel;
    
    if (chartType === 'line') {
      this.drawLineChart(ctx, chartData, zoomedWidth, zoomedHeight, padding);
    } else {
      this.drawBarChart(ctx, chartData, zoomedWidth, zoomedHeight, padding);
    }
    
    ctx.draw();
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
      
      ctx.setFillStyle('#00FFFF');
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
      title: '预览功能开发中',
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