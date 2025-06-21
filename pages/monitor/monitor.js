// pages/monitor/monitor.js
const API = require('../../utils/api.js');

Page({
  data: {
    // 页面的初始数据
    deviceId: '', // 当前监控的设备ID
    mode: 'overview', // 页面模式：overview(总览)、device(设备详情)、category(分类汇总)
    energyType: '', // 能源类型：power(电)、water(水)、gas(气)、carbon(碳)
    deviceInfo: {}, // 设备基本信息
    energyCurve: [], // 分时能耗曲线数据
    realTimeParams: {}, // 实时参数
    environmentParams: {}, // 环境参数
    alerts: [], // 告警列表
    connected: false, // WebSocket连接状态
    socketTask: null, // WebSocket任务对象
    isLoading: true, // 加载状态
    timeRange: '24h', // 时间范围：1h, 6h, 12h, 24h, 7d
    chartRendered: false, // 图表是否已渲染
    signalStrength: 0, // 信号强度：0-4
    categoryData: {}, // 分类汇总数据
  },

  onLoad: function (options) {
    // 页面加载时执行的函数
    if (options.mode === 'category') {
      // 分类汇总模式
      this.setData({
        mode: 'category',
        energyType: options.energyType || 'power' // 默认为电力
      });
    } else if (options.deviceId) {
      // 设备详情模式
      this.setData({
        mode: 'device',
        deviceId: options.deviceId
      });
    } else {
      // 总览模式
      this.setData({
        mode: 'overview',
        deviceId: 'overview'
      });
    }
    
    // 使用API优化功能预加载数据
    API.preloadData('monitor');
    
    this.loadMonitorData();
    this.subscribeRealTimeData();
  },

  onReady: function () {
    // 页面初次渲染完成后，渲染能耗曲线图表
    if (this.data.energyCurve && this.data.energyCurve.length > 0) {
      this.renderEnergyChart();
    }
  },

  onShow: function () {
    // 页面显示时执行的函数
    if (this.data.deviceId && !this.data.connected) {
      this.subscribeRealTimeData();
    }
    
    // 初始化实时监控
    this.initRealTimeMonitor();
  },

  onHide: function() {
    // 页面隐藏时执行的函数
    this.disconnectRealTime();
  },

  onUnload: function() {
    // 页面卸载时执行的函数
    this.unsubscribeRealTimeData();
    this.disconnectRealTime();
  },

  // 加载监控数据 - 使用API优化功能
  loadMonitorData: async function() {
    try {
      // 取消之前的实时数据订阅
      this.unsubscribeRealTimeData();
      
      this.setData({ isLoading: true });
      
      // 根据不同模式加载不同数据
      if (this.data.mode === 'category') {
        // 分类汇总模式 - 加载特定能源类型的汇总数据
        await this.loadCategoryData();
      } else {
        // 总览模式或设备详情模式 - 使用统一数据获取接口
        const result = await API.getData('monitor', {
          deviceId: this.data.deviceId,
          timeRange: this.data.timeRange,
          refresh: false // 允许使用缓存
        });
        
        if (result.success) {
          const data = result.data;
          // 格式化实时参数中的功率数据
          const formattedRealTimeParams = { ...data.realTimeParams };
          if (formattedRealTimeParams.power !== undefined && formattedRealTimeParams.power !== null) {
            formattedRealTimeParams.power = parseFloat(formattedRealTimeParams.power).toFixed(1);
          }
          
          // 更新页面数据
          this.setData({
            deviceInfo: data.deviceInfo,
            energyCurve: data.energyCurve,
            realTimeParams: formattedRealTimeParams,
            environmentParams: data.environmentParams,
            alerts: data.alerts,
            isLoading: false,
            // 根据设备状态设置信号强度
            signalStrength: data.deviceInfo?.status === 'online' ? 4 : 1
          });
          
          // 渲染能耗曲线图表
          if (data.energyCurve && data.energyCurve.length > 0) {
            this.renderEnergyChart();
          }
          
          // 获取实时数据（替代WebSocket连接）
          this.fetchRealTimeData();
        } else {
          throw new Error(result.message || '获取监控数据失败');
        }
      }
    } catch (error) {
      console.error('加载监控数据失败:', error);
      wx.showToast({
        title: error.message || '网络错误',
        icon: 'error'
      });
      this.setData({ isLoading: false });
    }
  },
  
  // 加载分类汇总数据
  loadCategoryData: function() {
    // 根据能源类型获取相应的汇总数据，传递时间范围参数
    API.getDeviceRealTimeData([], this.data.energyType, this.data.timeRange).then(res => {
      if (res.success && res.data.categoryOverview) {
        const categoryData = res.data.categoryOverview;
        
        // 更新页面数据
        this.setData({
          categoryData: categoryData,
          energyCurve: categoryData.timeSeriesData || [],
          isLoading: false
        });
        
        // 渲染能耗曲线图表
        if (categoryData.timeSeriesData && categoryData.timeSeriesData.length > 0) {
          this.renderEnergyChart();
        }
      } else {
        wx.showToast({
          title: '获取分类数据失败',
          icon: 'error'
        });
        this.setData({ isLoading: false });
      }
    }).catch(err => {
      console.error('加载分类数据失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      });
      this.setData({ isLoading: false });
    });
  },
  
  // 获取实时数据（替代WebSocket连接）
  fetchRealTimeData: function() {
    // 如果是分类汇总模式，使用不同的API调用
    if (this.data.mode === 'category') {
      API.getDeviceRealTimeData([], this.data.energyType, this.data.timeRange).then(res => {
        if (res.success && res.data.categoryOverview) {
          this.handleCategoryRealTimeUpdate(res.data.categoryOverview);
        }
      }).catch(err => {
        console.error('获取分类实时数据失败:', err);
      });
    } else {
      // 总览模式或设备详情模式
      API.getDeviceRealTimeData(this.data.deviceId === 'overview' ? [] : [this.data.deviceId], null, this.data.timeRange).then(res => {
        if (res.success) {
          this.handleRealTimeUpdate(res.data);
        }
      }).catch(err => {
        console.error('获取实时数据失败:', err);
      });
    }
  },
  
  // 处理分类汇总模式的实时数据更新
  handleCategoryRealTimeUpdate: function(data) {
    // 更新分类汇总数据
    this.setData({
      categoryData: data
    });
    
    // 如果有时间序列数据，更新能耗曲线
    if (data.timeSeriesData && data.timeSeriesData.length > 0) {
      this.setData({
        energyCurve: data.timeSeriesData
      });
      
      // 重新渲染图表
      this.renderEnergyChart();
    }
  },

  // 订阅实时数据
  subscribeRealTimeData: function() {
    // 如果已有连接，先关闭
    this.unsubscribeRealTimeData();
    
    // 获取当前设备ID或设备列表
    let deviceIds = [];
    if (this.data.mode === 'device') {
      deviceIds = [this.data.deviceInfo.id];
    }
    // 分类汇总模式和总览模式都使用空数组
    
    // 使用API中的WebSocket模拟连接获取实时数据
    const socketTask = API.subscribeRealTimeData(
      deviceIds, 
      (data) => {
        // 根据当前模式处理接收到的实时数据
        if (this.data.mode === 'category') {
          this.handleCategoryRealTimeUpdate(data);
        } else {
          this.handleRealTimeUpdate(data);
        }
      },
      this.data.energyType // 传递能源类型参数
    );
    
    // 保存socketTask，以便在页面卸载时关闭连接
    this.setData({
      socketTask: socketTask,
      connected: true
    });
  },

  // 取消订阅实时数据
  unsubscribeRealTimeData: function() {
    if (this.data.socketTask) {
      // 关闭WebSocket连接
      API.unsubscribeRealTimeData(this.data.socketTask);
      this.setData({
        socketTask: null,
        connected: false
      });
    }
  },

  // 处理实时数据更新
  handleRealTimeUpdate(data) {
    // 如果是总览模式
    if (this.data.mode === 'overview') {
      if (data.overview) {
        this.setData({
          totalPower: data.overview.totalPower,
          totalEnergy: data.overview.totalEnergy,
          deviceCount: data.overview.deviceCount,
          onlineCount: data.overview.onlineCount,
          alertCount: data.overview.alertCount
        });
      }
    } else {
      // 设备详情模式
      if (data.length > 0) {
        const deviceData = data[0]; // 获取第一个设备的数据
        
        // 更新实时参数
        if (deviceData.realTimeParams) {
          this.setData({
            realTimeParams: deviceData.realTimeParams
          });
        }
      }
    }
    
    // 更新环境参数
    if (data.environmentParams) {
      this.setData({
        environmentParams: data.environmentParams
      });
    }
    
    // 更新设备状态
    if (data.deviceStatus) {
      this.setData({
        'deviceInfo.status': data.deviceStatus.status,
        signalStrength: data.deviceStatus.signalStrength || this.data.signalStrength
      });
    }
    
    // 更新告警信息
    if (data.alerts) {
      this.setData({
        alerts: data.alerts
      });
    }
  },

  // 渲染能耗曲线图表
  renderEnergyChart: function() {
    // 标记图表已渲染
    this.setData({
      chartRendered: true
    });
    
    // 使用Canvas 2D API获取canvas上下文
    const query = wx.createSelectorQuery();
    query.select('#energyChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        // 添加检查，确保res[0]存在
        if (!res || !res[0]) {
          console.error('Canvas元素未找到');
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置canvas的宽高（解决高清屏模糊问题）
        // 使用新API替代已废弃的wx.getSystemInfoSync
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        const canvasWidth = res[0].width; // 画布宽度
        const canvasHeight = res[0].height; // 画布高度
        const paddingLeft = 40; // 左侧填充（用于显示Y轴标签）
        const paddingRight = 10; // 右侧填充
        const paddingTop = 10; // 顶部填充
        const paddingBottom = 30; // 底部填充（用于显示X轴标签）
        
        // 计算图表区域的尺寸
        const chartWidth = canvasWidth - paddingLeft - paddingRight;
        const chartHeight = canvasHeight - paddingTop - paddingBottom;
        
        // 确保有数据可以绘制
        if (!this.data.energyCurve || this.data.energyCurve.length === 0) {
          // 绘制无数据提示
          ctx.font = '14px sans-serif';
          ctx.fillStyle = '#999999';
          ctx.textAlign = 'center';
          ctx.fillText('暂无数据', canvasWidth / 2, canvasHeight / 2);
          return;
        }
    
        // 获取数据的最大值和最小值，用于确定Y轴的范围
        const values = this.data.energyCurve.map(item => item.value);
        const maxValue = Math.max(...values) * 1.1; // 最大值增加10%的空间
        
        // 对于7天数据，调整Y轴最小值以放大差异
        let minValue;
        if (this.data.timeRange === '7d') {
          // 计算数据的平均值
          const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          // 设置最小值为平均值的一定比例，以放大差异
          const minDataValue = Math.min(...values);
          // 取平均值的70%和最小值的90%中的较小值，确保所有数据点都在视图内
          minValue = Math.min(avgValue * 0.7, minDataValue * 0.9);
        } else {
          minValue = Math.min(...values) * 0.9; // 最小值减少10%的空间
        }
        
        // 绘制坐标轴
        ctx.beginPath();
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        
        // 绘制Y轴
        ctx.moveTo(paddingLeft, paddingTop);
        ctx.lineTo(paddingLeft, canvasHeight - paddingBottom);
        
        // 绘制X轴
        ctx.moveTo(paddingLeft, canvasHeight - paddingBottom);
        ctx.lineTo(canvasWidth - paddingRight, canvasHeight - paddingBottom);
        ctx.stroke();
        
        // 绘制Y轴刻度和网格线
        const yTickCount = 5; // Y轴刻度数量
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#999999';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= yTickCount; i++) {
          const y = paddingTop + chartHeight - (i / yTickCount) * chartHeight;
          const value = minValue + (i / yTickCount) * (maxValue - minValue);
          
          // 绘制刻度线
          ctx.beginPath();
          ctx.moveTo(paddingLeft - 5, y);
          ctx.lineTo(paddingLeft, y);
          ctx.stroke();
          
          // 绘制刻度值
          ctx.fillText(value.toFixed(1), paddingLeft - 8, y + 3);
          
          // 绘制网格线
          ctx.beginPath();
          ctx.setLineDash([2, 2]); // 设置虚线样式
          ctx.moveTo(paddingLeft, y);
          ctx.lineTo(canvasWidth - paddingRight, y);
          ctx.stroke();
          ctx.setLineDash([]); // 恢复实线样式
        }
    
        // 根据时间范围和数据点数量确定X轴刻度策略
        let xTickCount;
        let xTickInterval;
        
        // 根据不同的时间范围设置不同的刻度策略
        switch(this.data.timeRange) {
          case '1h':
            xTickCount = 12; // 1小时显示12个刻度（每5分钟一个）
            break;
          case '6h':
            xTickCount = 12; // 6小时显示12个刻度（每30分钟一个）
            break;
          case '12h':
            xTickCount = 12; // 12小时显示12个刻度（每1小时一个）
            break;
          case '24h':
            xTickCount = 12; // 24小时显示12个刻度（每2小时一个）
            break;
          case '7d':
            xTickCount = 7; // 7天显示7个刻度（每天一个）
            break;
          default:
            xTickCount = Math.min(12, this.data.energyCurve.length);
        }
        
        // 计算刻度间隔
        xTickInterval = Math.max(1, Math.floor(this.data.energyCurve.length / xTickCount));
        
        ctx.textAlign = 'center';
        
        // 确定是否需要隔点显示（根据timeRange和数据点数量）
        const needSkipLabels = this.data.timeRange !== '7d';
        
        // 计算实际显示的刻度索引
        const visibleIndices = [];
        if (this.data.timeRange === '7d') {
          // 对于7天数据，显示所有7个日期
          for (let i = 0; i < this.data.energyCurve.length; i++) {
            visibleIndices.push(i);
          }
        } else {
          // 对于其他时间范围（1h、6h、12h、24h），强制隔点显示，且第一个显示点在第二个刻度上
          for (let i = 0; i < this.data.energyCurve.length; i += xTickInterval) {
            // 从第二个刻度开始，隔一个显示
            if (i > 0 && (i - xTickInterval) % (xTickInterval * 2) === 0) {
              visibleIndices.push(i);
            }
          }
          
          // 确保显示最后一个刻度
          if (!visibleIndices.includes(this.data.energyCurve.length - 1) && this.data.energyCurve.length > 1) {
            visibleIndices.push(this.data.energyCurve.length - 1);
          }
        }
        
        // 绘制所有刻度线和选定的刻度标签
        for (let i = 0; i < this.data.energyCurve.length; i += xTickInterval) {
          const x = paddingLeft + (i / (this.data.energyCurve.length - 1)) * chartWidth;
          const time = this.data.energyCurve[i].time;
          
          // 绘制刻度线
          ctx.beginPath();
          ctx.moveTo(x, canvasHeight - paddingBottom);
          ctx.lineTo(x, canvasHeight - paddingBottom + 5);
          ctx.stroke();
          
          // 只在选定的索引处绘制刻度标签
          if (visibleIndices.includes(i)) {
            ctx.fillText(time, x, canvasHeight - paddingBottom + 15);
          }
        }
    
        // 绘制曲线
        ctx.beginPath();
        ctx.strokeStyle = '#36A1FF'; // 曲线颜色
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.data.energyCurve.length; i++) {
          const x = paddingLeft + (i / (this.data.energyCurve.length - 1)) * chartWidth;
          const normalizedValue = (this.data.energyCurve[i].value - minValue) / (maxValue - minValue);
          const y = paddingTop + chartHeight - normalizedValue * chartHeight;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
    
        // 绘制曲线下方的渐变填充
        const gradient = ctx.createLinearGradient(0, paddingTop, 0, canvasHeight - paddingBottom);
        gradient.addColorStop(0, 'rgba(54, 161, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(54, 161, 255, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        
        // 绘制第一个点
        const firstX = paddingLeft;
        const firstNormalizedValue = (this.data.energyCurve[0].value - minValue) / (maxValue - minValue);
        const firstY = paddingTop + chartHeight - firstNormalizedValue * chartHeight;
        ctx.moveTo(firstX, firstY);
        
        // 绘制中间的点
        for (let i = 1; i < this.data.energyCurve.length; i++) {
          const x = paddingLeft + (i / (this.data.energyCurve.length - 1)) * chartWidth;
          const normalizedValue = (this.data.energyCurve[i].value - minValue) / (maxValue - minValue);
          const y = paddingTop + chartHeight - normalizedValue * chartHeight;
          ctx.lineTo(x, y);
        }
        
        // 绘制底部的点，形成闭合区域
        const lastX = paddingLeft + chartWidth;
        ctx.lineTo(lastX, canvasHeight - paddingBottom);
        ctx.lineTo(firstX, canvasHeight - paddingBottom);
        ctx.closePath();
        ctx.fill();
        
        // 绘制数据点和数值
        ctx.fillStyle = '#36A1FF';
        ctx.textAlign = 'center';
        ctx.font = '10px sans-serif';
        
        // 确定哪些点需要显示数值
        const valueVisibleIndices = [];
        if (this.data.timeRange === '24h') {
          // 24小时时间范围，隔一个显示数值
          for (let i = 0; i < this.data.energyCurve.length; i += 2) {
            valueVisibleIndices.push(i);
          }
          // 确保显示最后一个点的数值
          if (!valueVisibleIndices.includes(this.data.energyCurve.length - 1) && this.data.energyCurve.length > 1) {
            valueVisibleIndices.push(this.data.energyCurve.length - 1);
          }
        } else {
          // 1小时、6小时、12小时和7天时间范围，显示所有数值
          for (let i = 0; i < this.data.energyCurve.length; i++) {
            valueVisibleIndices.push(i);
          }
        }
        
        for (let i = 0; i < this.data.energyCurve.length; i++) {
          const x = paddingLeft + (i / (this.data.energyCurve.length - 1)) * chartWidth;
          const normalizedValue = (this.data.energyCurve[i].value - minValue) / (maxValue - minValue);
          const y = paddingTop + chartHeight - normalizedValue * chartHeight;
          
          // 绘制数据点
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
          
          // 显示数值
          if (valueVisibleIndices.includes(i)) {
            const value = this.data.energyCurve[i].value;
            const formattedValue = value.toFixed(1); // 保留一位小数
            ctx.fillStyle = '#333333';
            ctx.fillText(formattedValue, x, y - 10); // 在点上方10像素处显示数值
            ctx.fillStyle = '#36A1FF'; // 恢复点的颜色
          }
        }
      });
  },

  // 切换时间范围
  onTimeRangeChange: function(e) {
    const timeRange = e.currentTarget.dataset.range;
    
    // 如果点击的是当前已选中的时间范围，不做任何操作
    if (this.data.timeRange === timeRange) {
      return;
    }
    
    // 先设置加载状态，防止界面闪烁
    this.setData({ 
      isLoading: true,
      timeRange: timeRange 
    });
    
    // 取消之前的实时数据订阅
    this.unsubscribeRealTimeData();
    
    // 重新加载数据
    this.loadMonitorData();
  },

  // 刷新数据
  onRefresh: function() {
    this.loadMonitorData();
  },

  // 查看告警详情
  onViewAlert: function(e) {
    const alertId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/alerts/alerts?deviceId=${this.data.deviceId}&alertId=${alertId}`
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadMonitorData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 返回上一页
  onBack: function() {
    wx.navigateBack();
  },

  /**
   * 初始化实时数据监控 - 使用API优化功能
   */
  initRealTimeMonitor() {
    if (this.socketTask) {
      return; // 已经连接，避免重复连接
    }
    
    // 根据页面模式确定监控参数
    let monitorParams = {
      deviceId: this.data.deviceId,
      mode: this.data.mode,
      energyType: this.data.energyType
    };
    
    // 建立WebSocket连接
    this.socketTask = API.subscribeRealTimeData(
      this.data.mode === 'device' ? [this.data.deviceId] : [],
      {
        onConnect: () => {
          console.log('监控页面实时连接已建立');
          this.setData({ connected: true });
        },
        onMessage: (message) => {
          this.handleRealTimeMessage(message);
        },
        onDisconnect: () => {
          console.log('监控页面实时连接已断开');
          this.setData({ connected: false });
          // 自动重连机制
          setTimeout(() => {
            if (!this.socketTask) {
              this.initRealTimeMonitor();
            }
          }, 3000);
        },
        onError: (error) => {
          console.error('监控页面实时连接错误:', error);
          this.setData({ connected: false });
        }
      },
      monitorParams
    );
  },

  /**
   * 处理实时消息
   */
  handleRealTimeMessage(message) {
    if (!message || !message.type) return;
    
    switch (message.type) {
      case 'monitor_update':
        this.updateMonitorData(message.data);
        break;
      case 'device_alert':
        this.updateAlerts(message.data);
        break;
      case 'environment_update':
        this.updateEnvironmentParams(message.data);
        break;
      default:
        console.log('未知的实时消息类型:', message.type);
    }
  },

  /**
   * 更新监控数据
   */
  updateMonitorData(data) {
    if (this.data.mode === 'category') {
      // 分类汇总模式
      this.setData({
        categoryData: {
          ...this.data.categoryData,
          ...data
        }
      });
    } else {
      // 设备详情或总览模式
      const updateData = {};
      
      if (data.realTimeParams) {
        // 确保功率数据保留一位小数
        const formattedParams = { ...data.realTimeParams };
        if (formattedParams.power !== undefined && formattedParams.power !== null) {
          formattedParams.power = parseFloat(formattedParams.power).toFixed(1);
        }
        updateData.realTimeParams = formattedParams;
      }
      
      if (data.deviceInfo) {
        updateData.deviceInfo = {
          ...this.data.deviceInfo,
          ...data.deviceInfo
        };
        updateData.signalStrength = data.deviceInfo.status === 'online' ? 4 : 1;
      }
      
      if (data.energyCurve) {
        updateData.energyCurve = data.energyCurve;
        // 重新渲染图表
        setTimeout(() => {
          this.renderEnergyChart();
        }, 100);
      }
      
      this.setData(updateData);
    }
  },

  /**
   * 更新告警信息
   */
  updateAlerts(alertData) {
    const currentAlerts = this.data.alerts || [];
    const newAlerts = [...currentAlerts];
    
    if (alertData.action === 'add') {
      newAlerts.unshift(alertData.alert);
    } else if (alertData.action === 'remove') {
      const index = newAlerts.findIndex(alert => alert.id === alertData.alertId);
      if (index > -1) {
        newAlerts.splice(index, 1);
      }
    }
    
    this.setData({ alerts: newAlerts });
  },

  /**
   * 更新环境参数
   */
  updateEnvironmentParams(envData) {
    this.setData({
      environmentParams: {
        ...this.data.environmentParams,
        ...envData
      }
    });
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
   * 刷新监控数据
   */
  async refreshMonitorData() {
    try {
      this.setData({ isLoading: true });
      
      // 使用强制刷新获取最新数据
      const result = await API.getData('monitor', {
        deviceId: this.data.deviceId,
        timeRange: this.data.timeRange,
        refresh: true // 强制刷新
      });
      
      if (result.success) {
        const data = result.data;
        this.setData({
          deviceInfo: data.deviceInfo,
          energyCurve: data.energyCurve,
          realTimeParams: data.realTimeParams,
          environmentParams: data.environmentParams,
          alerts: data.alerts,
          signalStrength: data.deviceInfo?.status === 'online' ? 4 : 1
        });
        
        // 重新渲染图表
        if (data.energyCurve && data.energyCurve.length > 0) {
          this.renderEnergyChart();
        }
        
        wx.showToast({
          title: '数据已更新',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('刷新监控数据失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },
});