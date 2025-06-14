
// pages/index/index.js
const api = require('../../utils/api.js');
const { formatEnergy, formatPower, formatNumber, formatTime } = require('../../utils/utils.js');

Page({
  data: {
    // 时间和天气
    currentTime: '',
    currentDate: '',
    weather: {
      temperature: 24,
      condition: 'sunny'
    },
    
    // 首页概览数据
    overview: {},
    
    // 监控详情数据
    monitorData: {},
    
    // 告警数据
    alertCount: 0,
    recentAlerts: [],
    
    // 图表数据
    chartTab: 'today',
    
    // 页面状态
    isRefreshing: false,
    loading: true
  },

  onLoad: function (options) {
    // 页面加载时执行的函数
    this.updateTime();
    this.loadHomeData();
  },

  onReady: function () {
    // 页面初次渲染完成时执行的函数
  },

  onShow: function () {
    // 页面显示时执行的函数
    this.updateTime();
    // 定时更新数据
    this.dataUpdateTimer = setInterval(() => {
      this.updateTime();
      this.loadHomeData();
    }, 30000); // 每30秒更新一次数据
  },
  
  onHide: function() {
    // 页面隐藏时清除定时器
    if (this.dataUpdateTimer) {
      clearInterval(this.dataUpdateTimer);
    }
  },
  
  onUnload: function() {
    // 页面卸载时清除定时器
    if (this.dataUpdateTimer) {
      clearInterval(this.dataUpdateTimer);
    }
  },

  // 更新时间
  updateTime: function() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    this.setData({
      currentTime: `${hours}:${minutes}`,
      currentDate: `${month}月${day}日`
    });
  },

  // 加载首页数据
  loadHomeData: async function() {
    try {
      this.setData({ loading: true });
      
      // 并行获取首页概览数据和监控详情数据
      const [overviewRes, monitorRes, alertsRes] = await Promise.all([
        api.getHomeOverview(),
        api.getMonitorDetail(),
        api.getAlertList({ page: 1, pageSize: 5 })
      ]);
      
      if (overviewRes.success && monitorRes.success && alertsRes.success) {
        // 转换数据格式以匹配页面期望的结构
        const overview = {
          totalEnergy: {
            value: overviewRes.data.realTimeEnergy.today.total,
            unit: 'kWh',
            trend: Math.random() > 0.5 ? (Math.random() * 10).toFixed(1) : -(Math.random() * 10).toFixed(1)
          }
        };
        
        const monitorData = {
          realTimeData: {
            power: {
              value: monitorRes.data.realTimeParams.power,
              unit: 'kW',
              trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable')
            },
            water: {
              value: overviewRes.data.realTimeEnergy.today.water,
              unit: '吨',
              trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable')
            },
            gas: {
              value: overviewRes.data.realTimeEnergy.today.gas,
              unit: 'm³',
              trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable')
            },
            carbon: {
              value: (overviewRes.data.realTimeEnergy.today.total * 0.5968).toFixed(1),
              unit: 'kg',
              trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable')
            }
          }
        };
        
        // 转换告警数据字段名以匹配WXML
        const recentAlerts = alertsRes.data.list.slice(0, 3).map(alert => ({
          id: alert.id,
          level: alert.level,
          message: alert.content, // content -> message
          createdAt: this.formatTime(alert.createTime) // createTime -> createdAt
        }));
        
        this.setData({
          overview: overview,
          monitorData: monitorData,
          alertCount: alertsRes.data.summary.unread, // 显示未读告警数量
          recentAlerts: recentAlerts,
          loading: false
        });
        
        // 初始化图表
        this.initChart();
      } else {
        throw new Error('数据获取失败');
      }
    } catch (error) {
      console.error('加载首页数据失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间
  formatTime: function(timeStr) {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  },

  // 初始化图表
  initChart: function() {
    // 模拟今日用电负荷数据
    const chartData = {
      categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      series: [{
        name: '用电负荷',
        data: [45.2, 38.6, 65.8, 78.3, 82.1, 69.4, 52.7]
      }]
    };
    
    this.setData({
      chartData: chartData
    });
    
    // 延迟绘制图表，确保DOM已渲染
    setTimeout(() => {
      this.drawChart(chartData);
    }, 100);
  },

  // 绘制折线图
  drawChart: function(chartData) {
    const query = wx.createSelectorQuery().in(this);
    query.select('#powerChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        // 设置canvas尺寸
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        // 图表配置 - 增加底部padding确保X轴标签完整显示
        const padding = { top: 40, right: 40, bottom: 70, left: 60 };
        const chartWidth = res[0].width - padding.left - padding.right;
        const chartHeight = res[0].height - padding.top - padding.bottom;
        
        // 清空画布
        ctx.clearRect(0, 0, res[0].width, res[0].height);
        
        // 设置背景渐变 - 适配浅色主题
        const bgGradient = ctx.createLinearGradient(0, 0, 0, res[0].height);
        bgGradient.addColorStop(0, 'rgba(248, 250, 252, 0.8)');
        bgGradient.addColorStop(0.5, 'rgba(241, 245, 249, 0.6)');
        bgGradient.addColorStop(1, 'rgba(248, 250, 252, 0.9)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, res[0].width, res[0].height);
        
        const data = chartData.series[0].data;
        const categories = chartData.categories;
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const valueRange = maxValue - minValue;
        
        // 绘制网格线 - 适配浅色主题
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
        ctx.lineWidth = 0.5;
        
        // Y轴单位标签 - 适配浅色主题
        ctx.fillStyle = '#64748b';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('kW', padding.left - 12, padding.top - 8);
        
        // 水平网格线
        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (chartHeight / 4) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(padding.left + chartWidth, y);
          ctx.stroke();
          
          // Y轴标签
          const value = maxValue - (valueRange / 4) * i;
          ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
          ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(value.toFixed(1), padding.left - 15, y + 4);
        }
        
        // 垂直网格线和X轴标签
        for (let i = 0; i < categories.length; i++) {
          const x = padding.left + (chartWidth / (categories.length - 1)) * i;
          
          // 网格线 - 适配浅色主题
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + chartHeight);
          ctx.stroke();
          
          // X轴标签 - 适配浅色主题
          ctx.fillStyle = '#64748b';
          ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(categories[i], x, padding.top + chartHeight + 22);
        }
        
        // 绘制折线图
        const points = data.map((value, index) => {
          const x = padding.left + (chartWidth / (data.length - 1)) * index;
          const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
          return { x, y, value };
        });
        
        // 绘制渐变填充区域 - 适配浅色主题
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        ctx.fill();
        
        // 绘制折线阴影 - 适配浅色主题
        ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        // 绘制折线 - 适配浅色主题
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 绘制数据点 - 适配浅色主题
        points.forEach(point => {
          // 数据点阴影
          ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          
          // 外圈 - 适配浅色主题
          ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fill();
          
          // 重置阴影
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // 内圈 - 适配浅色主题
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
          ctx.fill();
          
          // 数值标签背景 - 适配浅色主题
          const textWidth = ctx.measureText(point.value.toFixed(1)).width;
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          ctx.fillRect(point.x - textWidth/2 - 4, point.y - 20, textWidth + 8, 14);
          
          // 数值标签 - 适配浅色主题
          ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
          ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(point.value.toFixed(1), point.x, point.y - 10);
        });
        
        console.log('折线图绘制完成');
      });
  },

  // 刷新数据
  refreshData: async function() {
    this.setData({
      isRefreshing: true
    });
    
    try {
      this.updateTime();
      await this.loadHomeData();
      this.setData({
        isRefreshing: false
      });
      wx.showToast({
        title: '数据已更新',
        icon: 'success'
      });
    } catch (error) {
      this.setData({
        isRefreshing: false
      });
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    }
  },

  // 切换图表标签
  switchChartTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      chartTab: tab
    });
    
    // 根据选择的标签加载不同的数据
    let chartData;
    if (tab === 'today') {
      chartData = {
        categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        series: [{
          name: '今日用电负荷',
          data: [45.2, 38.6, 65.8, 78.3, 82.1, 69.4, 52.7]
        }]
      };
    } else if (tab === 'week') {
      chartData = {
        categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        series: [{
          name: '本周用电负荷',
          data: [520.5, 485.2, 612.8, 598.3, 645.1, 380.4, 295.7]
        }]
      };
    }
    
    this.setData({ chartData });
    
    // 重新绘制图表
     setTimeout(() => {
       this.drawChart(chartData);
     }, 100);
  },

  // 页面跳转方法
  goToWeather: function() {
    wx.showToast({
      title: '天气功能开发中',
      icon: 'none'
    });
  },

  goToAlerts: function() {
    wx.navigateTo({
      url: '/pages/alerts/alerts'
    });
  },

  goToMonitor: function() {
    wx.navigateTo({
      url: '/pages/monitor/monitor'
    });
  },

  goToDevices: function() {
    wx.switchTab({
      url: '/pages/devices/devices'
    });
  },

  goToData: function() {
    wx.switchTab({
      url: '/pages/data/data'
    });
  },

  goToSceneMode: function() {
    wx.navigateTo({
      url: '/pages/scene-mode/scene-mode'
    });
  },

  // 新增：跳转到详情页面
  goToDetail: function() {
    wx.navigateTo({
      url: '/pages/data/data?tab=detail'
    });
  },

  // 新增：跳转到分析页面
  goToAnalysis: function() {
    wx.navigateTo({
      url: '/pages/data/data?tab=analysis'
    });
  },

  // 新增：导出数据功能
  exportData: function() {
    wx.showLoading({
      title: '正在导出...'
    });
    
    // 模拟导出过程
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '导出成功',
        icon: 'success'
      });
    }, 2000);
  },

  // 快捷功能
  quickSaveEnergy: function() {
    wx.showModal({
      title: '节能模式',
      content: '是否开启节能模式？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '节能模式已开启',
            icon: 'success'
          });
        }
      }
    });
  }
})