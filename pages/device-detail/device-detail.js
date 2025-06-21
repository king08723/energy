// pages/device-detail/device-detail.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '',
    timeFilter: '24h',
    deviceInfo: {
      id: '1',
      name: '客厅空调',
      type: 'power',
      icon: '❄️',
      location: '客厅',
      status: 'online',
      statusText: '运行正常',
      lastUpdate: '2分钟前',
      isOn: true,
      supportPowerControl: true,
      powerLevel: 75,
      alerts: [],
      realTimeData: [
        { key: 'power', label: '当前功率', value: '2.5', unit: 'kW' },
        { key: 'temperature', label: '室内温度', value: '24', unit: '°C' },
        { key: 'humidity', label: '湿度', value: '65', unit: '%' },
        { key: 'energy', label: '今日能耗', value: '12.8', unit: 'kWh' }
      ],
      automationRules: [
        {
          id: '1',
          name: '智能节能模式',
          description: '无人时自动调节温度',
          enabled: true
        },
        {
          id: '2',
          name: '定时开关',
          description: '每天22:00自动关闭',
          enabled: false
        }
      ],
      specifications: [
        { key: 'model', label: '设备型号', value: 'AC-2024-Pro' },
        { key: 'brand', label: '品牌', value: '格力' },
        { key: 'power', label: '额定功率', value: '3.5kW' },
        { key: 'installDate', label: '安装日期', value: '2024-01-15' },
        { key: 'warranty', label: '保修期', value: '3年' }
      ]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.deviceId) {
      this.setData({
        deviceId: options.deviceId
      });
      this.loadDeviceInfo(options.deviceId);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 刷新设备状态
    this.refreshDeviceStatus();
  },

  /**
   * 加载设备信息
   */
  loadDeviceInfo(deviceId) {
    // 显示加载状态
    wx.showLoading({ title: '加载中...' });
    
    // 通过API获取设备详情数据
    const API = require('../../utils/api.js');
    
    API.getDeviceDetail(deviceId).then(res => {
      if (res.success) {
        const deviceData = res.data;
        
        // 更新设备信息
        this.setData({
          'deviceInfo.id': deviceData.id,
          'deviceInfo.name': deviceData.name,
          'deviceInfo.type': deviceData.type,
          'deviceInfo.icon': deviceData.icon || this.getIconByType(deviceData.type),
          'deviceInfo.location': deviceData.location,
          'deviceInfo.status': deviceData.status,
          'deviceInfo.statusText': deviceData.status === 'online' ? '运行正常' : '离线',
          'deviceInfo.lastUpdate': deviceData.lastUpdate || '刚刚',
          'deviceInfo.isOn': deviceData.isOn,
          'deviceInfo.supportPowerControl': deviceData.supportPowerControl || true,
          'deviceInfo.powerLevel': deviceData.powerLevel || 75,
          'deviceInfo.alerts': deviceData.alerts || [],
          'deviceInfo.specifications': deviceData.specifications || this.data.deviceInfo.specifications,
          'deviceInfo.realTimeData': this.formatRealTimeData(deviceData),
          'deviceInfo.automationRules': deviceData.automationRules || this.data.deviceInfo.automationRules
        });
        
        wx.hideLoading();
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '获取设备信息失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取设备详情失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取设备信息出错',
        icon: 'none'
      });
    });
  },
  
  /**
   * 根据设备类型获取图标
   */
  getIconByType(type) {
    const iconMap = {
      // 基础设备类型
      'meter': '⚡',
      'sensor': '🌡️',
      'switch': '🔌',
      'hvac': '❄️',
      'power': '⚡',
      'water': '💧',
      'gas': '🔥',
      'carbon': '🌱',
      
      // 电力设备
      'power_distribution': '⚡',
      'power_meter': '📊',
      'transformer': '🔌',
      'ups': '🔋',
      
      // 水系统设备
      'water_meter': '💧',
      'water_pump': '⚙️',
      'cooling_water': '❄️',
      'water_tank': '🚰',
      
      // 燃气设备
      'gas_meter': '🔥',
      'gas_boiler': '♨️',
      'gas_detector': '🚨',
      
      // 环境监测设备
      'environment_monitor': '🌡️',
      'air_quality': '🌬️',
      'temperature_sensor': '🌡️',
      'humidity_sensor': '💧',
      
      // 其他设备
      'motor': '⚙️',
      'air_compressor': '💨',
      'ev_charger': '🔌'
    };
    
    return iconMap[type] || '📱';
  },
  
  /**
   * 格式化实时数据
   */
  formatRealTimeData(deviceData) {
    // 如果设备数据中已有格式化的实时数据，直接返回
    if (deviceData.realTimeData && Array.isArray(deviceData.realTimeData)) {
      return deviceData.realTimeData;
    }
    
    // 否则根据设备类型和当前参数构建实时数据
    const realTimeData = [];
    const currentParams = deviceData.currentParams || {};
    
    // 添加功率数据
    if (currentParams.power !== undefined) {
      realTimeData.push({
        key: 'power',
        label: '当前功率',
        value: parseFloat(currentParams.power).toFixed(1),
        unit: 'kW'
      });
    }
    
    // 根据设备类型和类别添加其他数据
    if (deviceData.category === 'electricity') {
      // 电力设备特有参数
      if (currentParams.voltage !== undefined) {
        realTimeData.push({
          key: 'voltage',
          label: '电压',
          value: currentParams.voltage.toString(),
          unit: 'V'
        });
      }
      
      if (currentParams.current !== undefined) {
        realTimeData.push({
          key: 'current',
          label: '电流',
          value: currentParams.current.toString(),
          unit: 'A'
        });
      }
      
      // 空调、环境监测设备等特有参数
      if (deviceData.type === 'hvac' || deviceData.type === 'environment_monitor') {
        if (currentParams.temperature !== undefined) {
          realTimeData.push({
            key: 'temperature',
            label: '温度',
            value: currentParams.temperature.toString(),
            unit: '°C'
          });
        }
        
        if (currentParams.humidity !== undefined) {
          realTimeData.push({
            key: 'humidity',
            label: '湿度',
            value: currentParams.humidity.toString(),
            unit: '%'
          });
        }
      }
    } else if (deviceData.category === 'water') {
      // 水系统设备特有参数
      if (currentParams.flowRate !== undefined) {
        realTimeData.push({
          key: 'flowRate',
          label: '流量',
          value: currentParams.flowRate.toString(),
          unit: 'L/min'
        });
      }
      
      if (currentParams.pressure !== undefined) {
        realTimeData.push({
          key: 'pressure',
          label: '水压',
          value: currentParams.pressure.toString(),
          unit: 'MPa'
        });
      }
      
      if (currentParams.waterFlow !== undefined) {
        realTimeData.push({
          key: 'waterFlow',
          label: '日用水量',
          value: currentParams.waterFlow.toString(),
          unit: 'm³'
        });
      }
    } else if (deviceData.category === 'gas') {
      // 燃气设备特有参数
      if (currentParams.pressure !== undefined) {
        realTimeData.push({
          key: 'pressure',
          label: '气压',
          value: currentParams.pressure.toString(),
          unit: 'MPa'
        });
      }
      
      if (currentParams.gasConsumption !== undefined) {
        realTimeData.push({
          key: 'gasConsumption',
          label: '燃气用量',
          value: currentParams.gasConsumption.toString(),
          unit: 'm³'
        });
      }
      
      if (currentParams.gasConcentration !== undefined) {
        realTimeData.push({
          key: 'gasConcentration',
          label: '气体浓度',
          value: currentParams.gasConcentration.toString(),
          unit: '%LEL'
        });
      }
    }
    
    // 环境监测设备特有参数
    if (deviceData.type === 'environment_monitor') {
      if (currentParams.airQuality !== undefined) {
        realTimeData.push({
          key: 'airQuality',
          label: '空气质量',
          value: currentParams.airQuality.toString(),
          unit: 'AQI'
        });
      }
    }
    
    // 通用参数 - 温度
    if (realTimeData.findIndex(item => item.key === 'temperature') === -1 && currentParams.temperature !== undefined) {
      realTimeData.push({
        key: 'temperature',
        label: '温度',
        value: currentParams.temperature.toString(),
        unit: '°C'
      });
    }
    
    // 添加能耗数据
    realTimeData.push({
      key: 'energy',
      label: '今日能耗',
      value: (deviceData.energyToday || 12.8).toString(),
      unit: 'kWh'
    });
    
    return realTimeData;
  },

  /**
   * 刷新设备状态
   */
  refreshDeviceStatus() {
    // 如果没有设备ID，则不进行刷新
    if (!this.data.deviceId) {
      return;
    }
    
    // 通过API获取最新的设备状态
    const API = require('../../utils/api.js');
    
    // 显示刷新状态
    wx.showNavigationBarLoading();
    
    API.getDeviceDetail(this.data.deviceId).then(res => {
      if (res.success) {
        const deviceData = res.data;
        
        // 更新设备状态信息
        this.setData({
          'deviceInfo.status': deviceData.status,
          'deviceInfo.statusText': deviceData.status === 'online' ? '运行正常' : '离线',
          'deviceInfo.lastUpdate': '刚刚',
          'deviceInfo.isOn': deviceData.isOn,
          'deviceInfo.powerLevel': deviceData.powerLevel || this.data.deviceInfo.powerLevel,
          'deviceInfo.alerts': deviceData.alerts || [],
          'deviceInfo.realTimeData': this.formatRealTimeData(deviceData)
        });
      }
    }).catch(err => {
      console.error('刷新设备状态失败:', err);
    }).finally(() => {
      wx.hideNavigationBarLoading();
    });
  },

  /**
   * 设备菜单
   */
  onDeviceMenu() {
    wx.showActionSheet({
      itemList: ['重命名设备', '移动位置', '删除设备'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.onRenameDevice();
            break;
          case 1:
            this.onMoveDevice();
            break;
          case 2:
            this.onDeleteDevice();
            break;
        }
      }
    });
  },

  /**
   * 开关控制
   */
  onSwitchChange(e) {
    const isOn = e.detail.value;
    const deviceId = this.data.deviceId;
    
    wx.showLoading({ title: isOn ? '开启中...' : '关闭中...' });
    
    // 通过API控制设备
    const API = require('../../utils/api.js');
    
    API.controlDevice(deviceId, {
      action: 'switch',
      value: isOn
    }).then(res => {
      if (res.success) {
        this.setData({
          'deviceInfo.isOn': isOn
        });
        
        wx.showToast({
          title: isOn ? '设备已开启' : '设备已关闭',
          icon: 'success'
        });
        
        // 同步更新能耗数据
        this.loadEnergyData(this.data.currentTimeRange);
      } else {
        // 操作失败，恢复开关状态
        this.setData({
          'deviceInfo.isOn': !isOn
        });
        
        wx.showToast({
          title: '操作失败: ' + (res.message || '未知错误'),
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('控制设备失败:', err);
      
      // 操作失败，恢复开关状态
      this.setData({
        'deviceInfo.isOn': !isOn
      });
      
      wx.showToast({
        title: '控制设备出错',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  /**
   * 功率调节
   */
  onPowerChange(e) {
    const powerLevel = e.detail.value;
    const deviceId = this.data.deviceId;
    
    // 先更新UI，提升用户体验
    this.setData({
      'deviceInfo.powerLevel': powerLevel
    });
    
    // 通过API控制设备功率
    const API = require('../../utils/api.js');
    
    API.controlDevice(deviceId, {
      action: 'setParams',
      params: {
        powerLevel: powerLevel
      }
    }).then(res => {
      if (res.success) {
        wx.showToast({
          title: `功率已调至${powerLevel}%`,
          icon: 'none'
        });
        
        // 同步更新能耗数据
        this.loadEnergyData(this.data.currentTimeRange);
      } else {
        // 操作失败，但不恢复UI状态，避免滑块跳动
        wx.showToast({
          title: '调节功率失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('调节功率失败:', err);
      wx.showToast({
        title: '调节功率出错',
        icon: 'none'
      });
    });
  },

  /**
   * 快捷控制
   */
  onQuickControl(e) {
    const action = e.currentTarget.dataset.action;
    const deviceId = this.data.deviceId;
    
    const actionMap = {
      restart: '重启设备',
      reset: '重置设备',
      optimize: '优化设备'
    };
    
    wx.showModal({
      title: '确认操作',
      content: `确定要${actionMap[action]}吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '执行中...' });
          
          // 通过API执行设备控制
          const API = require('../../utils/api.js');
          
          API.controlDevice(deviceId, {
            action: action
          }).then(res => {
            wx.hideLoading();
            
            if (res.success) {
              wx.showToast({
                title: `${actionMap[action]}成功`,
                icon: 'success'
              });
              
              // 同步更新能耗数据
              this.loadEnergyData(this.data.currentTimeRange);
              
              // 刷新设备状态
              this.refreshDeviceStatus();
            } else {
              wx.showToast({
                title: `${actionMap[action]}失败: ${res.message || '未知错误'}`,
                icon: 'none'
              });
            }
          }).catch(err => {
            console.error(`${actionMap[action]}失败:`, err);
            wx.hideLoading();
            
            wx.showToast({
              title: `${actionMap[action]}出错`,
              icon: 'none'
            });
          });
        }
      }
    });
  },

  /**
   * 刷新数据
   */
  onRefreshData() {
    const deviceId = this.data.deviceId;
    
    // 如果没有设备ID，则不进行刷新
    if (!deviceId) {
      return;
    }
    
    wx.showLoading({ title: '刷新中...' });
    
    // 通过API获取最新的设备数据
    const API = require('../../utils/api.js');
    
    API.getDeviceDetail(deviceId).then(res => {
      if (res.success) {
        const deviceData = res.data;
        
        // 更新设备信息
        this.setData({
          'deviceInfo.status': deviceData.status,
          'deviceInfo.statusText': deviceData.status === 'online' ? '运行正常' : '离线',
          'deviceInfo.lastUpdate': '刚刚',
          'deviceInfo.isOn': deviceData.isOn,
          'deviceInfo.powerLevel': deviceData.powerLevel || this.data.deviceInfo.powerLevel,
          'deviceInfo.alerts': deviceData.alerts || [],
          'deviceInfo.realTimeData': this.formatRealTimeData(deviceData)
        });
        
        wx.showToast({
          title: '数据已更新',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('刷新数据失败:', err);
      wx.showToast({
        title: '刷新数据出错',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  /**
   * 时间筛选切换
   */
  onTimeFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    
    this.setData({
      timeFilter: filter
    });
    
    // 加载对应时间范围的能耗数据并渲染图表
    this.loadEnergyData(filter);
  },
  
  /**
   * 加载能耗数据
   */
  loadEnergyData(timeRange) {
    const deviceId = this.data.deviceId;
    
    // 如果没有设备ID，则不进行加载
    if (!deviceId) {
      return;
    }
    
    wx.showLoading({ title: '加载数据中...' });
    
    // 通过API获取设备能耗数据
    const API = require('../../utils/api.js');
    
    API.getDeviceEnergyData(deviceId, timeRange).then(res => {
      if (res.success) {
        const energyData = res.data;
        
        // 更新能耗数据
        this.setData({
          energyData: energyData,
          chartRendered: false // 重置图表渲染状态
        }, () => {
          // 数据加载完成后渲染图表
          this.renderEnergyChart();
        });
        
        wx.hideLoading();
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '获取能耗数据失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取能耗数据失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取能耗数据出错',
        icon: 'none'
      });
    });
  },
  
  /**
   * 渲染能耗曲线图表
   */
  renderEnergyChart() {
    // 标记图表已渲染
    this.setData({
      chartRendered: true
    });
    
    // 确保有数据可以绘制
    if (!this.data.energyData || !this.data.energyData.data || this.data.energyData.data.length === 0) {
      // 无数据时显示提示
      return;
    }
    
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
        
        // 获取数据
        const chartData = this.data.energyData.data;
        
        // 获取数据的最大值和最小值，用于确定Y轴的范围
        const values = chartData.map(item => item.value);
        const maxValue = Math.max(...values) * 1.1; // 最大值增加10%的空间
        
        // 对于7天数据，调整Y轴最小值以放大差异
        let minValue;
        if (this.data.timeFilter === '7d') {
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
        switch(this.data.timeFilter) {
          case '1h':
            xTickCount = 12; // 1小时显示12个刻度（每5分钟一个）
            break;
          case '24h':
            xTickCount = 12; // 24小时显示12个刻度（每2小时一个）
            break;
          case '7d':
            xTickCount = 7; // 7天显示7个刻度（每天一个）
            break;
          default:
            xTickCount = Math.min(12, chartData.length);
        }
        
        // 计算刻度间隔
        xTickInterval = Math.max(1, Math.floor(chartData.length / xTickCount));
        
        ctx.textAlign = 'center';
        
        // 确定是否需要隔点显示（根据timeRange和数据点数量）
        const needSkipLabels = this.data.timeFilter !== '7d';
        
        // 计算实际显示的刻度索引
        const visibleIndices = [];
        if (this.data.timeFilter === '7d') {
          // 对于7天数据，显示所有7个日期
          for (let i = 0; i < chartData.length; i++) {
            visibleIndices.push(i);
          }
        } else {
          // 对于其他时间范围（1h、24h），强制隔点显示，且第一个显示点在第二个刻度上
          for (let i = 0; i < chartData.length; i += xTickInterval) {
            // 从第二个刻度开始，隔一个显示
            if (i > 0 && (i - xTickInterval) % (xTickInterval * 2) === 0) {
              visibleIndices.push(i);
            }
          }
          
          // 确保显示最后一个刻度
          if (!visibleIndices.includes(chartData.length - 1) && chartData.length > 1) {
            visibleIndices.push(chartData.length - 1);
          }
        }
        
        // 绘制所有刻度线和选定的刻度标签
        for (let i = 0; i < chartData.length; i += xTickInterval) {
          const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
          const time = chartData[i].time;
          
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
        
        for (let i = 0; i < chartData.length; i++) {
          const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
          const normalizedValue = (chartData[i].value - minValue) / (maxValue - minValue);
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
        const firstNormalizedValue = (chartData[0].value - minValue) / (maxValue - minValue);
        const firstY = paddingTop + chartHeight - firstNormalizedValue * chartHeight;
        ctx.moveTo(firstX, firstY);
        
        // 绘制中间的点
        for (let i = 1; i < chartData.length; i++) {
          const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
          const normalizedValue = (chartData[i].value - minValue) / (maxValue - minValue);
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
        if (this.data.timeFilter === '24h') {
          // 24小时时间范围，隔一个显示数值
          for (let i = 0; i < chartData.length; i += 2) {
            valueVisibleIndices.push(i);
          }
          // 确保显示最后一个点的数值
          if (!valueVisibleIndices.includes(chartData.length - 1) && chartData.length > 1) {
            valueVisibleIndices.push(chartData.length - 1);
          }
        } else {
          // 1小时和7天时间范围，显示所有数值
          for (let i = 0; i < chartData.length; i++) {
            valueVisibleIndices.push(i);
          }
        }
        
        for (let i = 0; i < chartData.length; i++) {
          const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
          const normalizedValue = (chartData[i].value - minValue) / (maxValue - minValue);
          const y = paddingTop + chartHeight - normalizedValue * chartHeight;
          
          // 绘制数据点
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
          
          // 显示数值
          if (valueVisibleIndices.includes(i)) {
            const value = chartData[i].value;
            const formattedValue = value.toFixed(1); // 保留一位小数
            ctx.fillStyle = '#333333';
            ctx.fillText(formattedValue, x, y - 10); // 在点上方10像素处显示数值
            ctx.fillStyle = '#36A1FF'; // 恢复点的颜色
          }
        }
      });
  },

  /**
   * 查看告警
   */
  onViewAlerts() {
    wx.navigateTo({
      url: `/pages/device-alerts/device-alerts?deviceId=${this.data.deviceId}`
    });
  },

  /**
   * 添加自动化规则
   */
  onAddRule() {
    wx.navigateTo({
      url: `/pages/automation-rule/automation-rule?deviceId=${this.data.deviceId}`
    });
  },

  /**
   * 规则开关切换
   */
  onRuleToggle(e) {
    const ruleId = e.currentTarget.dataset.rule;
    const enabled = e.detail.value;
    
    const rules = this.data.deviceInfo.automationRules.map(rule => {
      if (rule.id === ruleId) {
        return { ...rule, enabled };
      }
      return rule;
    });
    
    this.setData({
      'deviceInfo.automationRules': rules
    });
    
    wx.showToast({
      title: enabled ? '规则已启用' : '规则已禁用',
      icon: 'success'
    });
  },

  /**
   * 编辑设备
   */
  onEditDevice() {
    wx.navigateTo({
      url: `/pages/edit-device/edit-device?deviceId=${this.data.deviceId}`
    });
  },

  /**
   * 设备设置
   */
  onDeviceSettings() {
    wx.navigateTo({
      url: `/pages/device-settings/device-settings?deviceId=${this.data.deviceId}`
    });
  },

  /**
   * 重命名设备
   */
  onRenameDevice() {
    wx.showModal({
      title: '重命名设备',
      editable: true,
      placeholderText: this.data.deviceInfo.name,
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({
            'deviceInfo.name': res.content
          });
          
          wx.showToast({
            title: '重命名成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 移动设备
   */
  onMoveDevice() {
    wx.showActionSheet({
      itemList: ['客厅', '卧室', '厨房', '卫生间', '阳台'],
      success: (res) => {
        const locations = ['客厅', '卧室', '厨房', '卫生间', '阳台'];
        const newLocation = locations[res.tapIndex];
        
        this.setData({
          'deviceInfo.location': newLocation
        });
        
        wx.showToast({
          title: `已移动到${newLocation}`,
          icon: 'success'
        });
      }
    });
  },

  /**
   * 删除设备
   */
  onDeleteDevice() {
    wx.showModal({
      title: '删除设备',
      content: '确定要删除这个设备吗？删除后无法恢复。',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '设备已删除',
              icon: 'success'
            });
            
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }, 1000);
        }
      }
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉刷新
   */
  onPullDownRefresh() {
    this.refreshDeviceStatus();
    this.onRefreshData();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `查看我的${this.data.deviceInfo.name}`,
      path: `/pages/device-detail/device-detail?deviceId=${this.data.deviceId}`
    };
  }
})