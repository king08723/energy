
// pages/index/index.js
const API = require('../../utils/api.js');
const { parseDate } = require('../../utils/utils.js');
const { formatEnergy, formatPower, formatNumber, formatTime } = require('../../utils/utils.js');

Page({
  data: {
    // 当前时间和天气
    currentDate: '',
    weather: {
      temperature: 24,
      condition: 'sunny'
    },
    
    // 调试模式开关
    debugMode: false, // 临时启用调试模式，用于排查水气数据问题
    
    // 首页概览数据
    overview: {
      totalEnergy: { value: 0, unit: 'kWh', trend: '0.0' },
      totalCost: { value: 0, unit: '元', trend: '0.0' },
      carbonEmission: { value: 0, unit: 'kg', trend: '0.0' },
      energyEfficiency: { value: 0, unit: '%', trend: '0.0' },
      // 今日能耗分类
      todayEnergy: {
        electricity: { value: 0, unit: 'kWh', trend: '0.0' },
        water: { value: 0, unit: '吨', trend: '0.0' },
        gas: { value: 0, unit: 'm³', trend: '0.0' }
      }
    },
    
    // 监控详情数据
    monitorData: {
      realTimeData: {
        power: { value: 0, unit: 'kW', trend: 'stable' },
        water: { value: 0, unit: '吨/h', trend: 'stable' },
        gas: { value: 0, unit: 'm³/h', trend: 'stable' },
        carbon: { value: 0, unit: 'kg/h', trend: 'stable' },
        temperature: { value: 25, unit: '°C', trend: 'stable' },
        humidity: { value: 60, unit: '%', trend: 'stable' }
      },
      energyCurve: []
    },
    
    // 告警数据
    alertCount: 0,
    recentAlerts: [],
    
    // 图表数据
    chartTab: 'today',
    loadCurveData: null, // 用电负荷曲线数据，用于按需注入时的延迟初始化
    
    // 页面状态
    isRefreshing: false,
    loading: true,
    
    // 实时连接状态
    realTimeStatus: 'disconnected', // connected, disconnected, error
    
    // 设备列表数据
    deviceList: []
  },
  
  // 实时连接相关属性
  socketTask: null,
  isRealTimeConnected: false,
  debugMode: false, // 调试模式开关，设为true可查看详细日志
  
  // 页面状态管理
  lastDataLoadTime: 0,
  dataRefreshInterval: 2 * 60 * 1000, // 首页数据刷新间隔（2分钟）
  isPageVisible: true,
  lastUserInteraction: 0,

  onLoad: function (options) {
    // 初始化页面状态
    this.lastUserInteraction = Date.now();
    this.isPageVisible = true;
    
    // 监听应用前后台切换
    wx.onAppShow(() => {
      if (this.isPageVisible) {
        console.log('应用从后台切换到前台，恢复首页实时监控');
        this.lastUserInteraction = Date.now();
        if (!this.isRealTimeConnected) {
          this.initRealTimeData();
        }
      }
    });
    
    wx.onAppHide(() => {
      console.log('应用切换到后台，暂停首页实时监控');
      this.disconnectRealTime();
    });
    
    // 页面加载时执行的函数
    this.updateTime();
    this.loadHomeData();
  },

  onReady: function () {
    // 页面初次渲染完成时执行的函数
    // 使用wx.nextTick确保Canvas节点已完全注入（解决按需注入时序问题）
    wx.nextTick(() => {
      // 延迟初始化图表，确保DOM节点已准备好
      setTimeout(() => {
        this.initChart();
        
        // 如果有负荷曲线数据，也在此时初始化
        if (this.data.loadCurveData) {
          this.initLoadCurveChart(this.data.loadCurveData);
        }
      }, 200);
    });
  },

  onShow: function () {
    // 更新页面可见性状态
    this.isPageVisible = true;
    this.lastUserInteraction = Date.now();
    
    // 页面显示时执行的函数
    this.updateTime();
    
    // 检查是否需要刷新数据
    if (this.shouldRefreshData()) {
      this.loadHomeData();
    }
    
    // 使用统一API进行数据预加载（包含今日用电负荷数据）
    API.preloadData('index');
    
    // 延迟启动实时数据更新，确保基础数据已加载
    setTimeout(() => {
      this.initRealTimeData();
    }, 1000);
    
    // 定时更新数据（作为WebSocket的备用方案）
    // 包括用电负荷数据的定时更新
    this.dataUpdateTimer = setInterval(() => {
      this.updateTime();
      // 如果WebSocket连接异常，则使用定时刷新
      if (!this.isRealTimeConnected) {
        // 从缓存刷新数据
        const cachedData = this.loadCachedHomeData();
        if (cachedData) {
          this.updateHomeDataDisplay(cachedData);
        }
        
        // 定时刷新用电负荷数据
        this.loadHomeData().then(() => {
          if (this.data.overview && this.data.overview.electricity && this.data.overview.electricity.loadCurve) {
            this.initLoadCurveChart(this.data.overview.electricity.loadCurve);
          }
        }).catch(error => {
          console.error('定时刷新用电负荷数据失败:', error);
        });
      }
    }, 30000); // 每30秒更新一次数据
  },
  
  onHide: function() {
    // 更新页面可见性状态
    this.isPageVisible = false;
    
    // 页面隐藏时清除定时器和断开实时连接
    if (this.dataUpdateTimer) {
      clearInterval(this.dataUpdateTimer);
    }
    this.disconnectRealTime();
  },
  
  onUnload: function() {
    // 更新页面可见性状态
    this.isPageVisible = false;
    
    // 页面卸载时清除定时器和断开实时连接
    if (this.dataUpdateTimer) {
      clearInterval(this.dataUpdateTimer);
    }
    // 清除防抖定时器
    if (this.aggregateUpdateTimer) {
      clearTimeout(this.aggregateUpdateTimer);
    }
    // 清除设备数据缓存
    this.deviceDataCache = null;
    this.disconnectRealTime();
  },

  // 初始化实时数据连接 - 使用统一API接口
  initRealTimeData: function() {
    // 获取需要监控的设备ID（从概览数据中提取）
    const deviceIds = this.getMonitorDeviceIds();
    
    // 使用统一的实时数据订阅接口
    this.socketTask = API.subscribeRealTimeData({
      deviceIds: deviceIds,
      
      // 连接成功回调
      onConnect: () => {
        if (this.data.debugMode) {
          console.log('首页实时数据连接成功');
        }    
        this.isRealTimeConnected = true;
        this.setData({ realTimeStatus: 'connected' });
        
        // 连接成功后从缓存获取最新数据
        const cachedData = this.loadCachedHomeData();
        if (cachedData) {
          this.updateHomeDataDisplay(cachedData);
        }
      },
      
      // 接收消息回调
      onMessage: (data) => {
        this.handleRealTimeMessage(data);
      },
      
      // 连接断开回调
      onDisconnect: (event) => {
        console.log('首页实时数据连接断开:', event);
        this.isRealTimeConnected = false;
        this.setData({ realTimeStatus: 'disconnected' });
        
        // 尝试重连（延迟5秒）
        setTimeout(() => {
          if (!this.isRealTimeConnected) {
            this.initRealTimeData();
          }
        }, 5000);
      },
      
      // 错误回调
      onError: (error) => {
        console.error('首页实时数据连接错误:', error);
        this.isRealTimeConnected = false;
        this.setData({ realTimeStatus: 'error' });
        
        // 错误时降级到定时刷新模式
        this.fallbackToPolling();
      }
    });
  },

  // 获取需要监控的设备ID
  getMonitorDeviceIds: function() {
    // 监控所有设备以获取总体数据
    const deviceIds = [];
    
    // 如果已经加载了设备数据，获取所有设备ID
    if (this.data.deviceList && this.data.deviceList.length > 0) {
      // 获取所有设备的ID，不限制数量
      deviceIds.push(...this.data.deviceList.map(device => device.id));
    }
    
    // 如果没有设备数据，返回空数组
    return deviceIds;
  },

  // 处理实时消息
  handleRealTimeMessage: function(message) {
    const { type, deviceId, data, timestamp } = message;
    
    switch (type) {
      case 'device_update':
        // 聚合所有设备的实时数据
        this.aggregateDeviceRealTimeData(deviceId, data);
        break;
      case 'energy_update':
        // 更新能耗数据
        this.updateEnergyRealTimeData(data);
        break;
      case 'alert':
        // 处理新告警
        this.handleNewAlert(data);
        break;
      case 'system_status':
        // 更新系统状态
        this.updateSystemStatus(data);
        break;
    }
  },

  // 聚合设备实时数据
   aggregateDeviceRealTimeData: function(deviceId, data) {
     // 初始化设备数据缓存
     if (!this.deviceDataCache) {
       this.deviceDataCache = {};
     }
     
     // 更新单个设备的数据缓存
     // 如果数据包含realTimeParams，则使用realTimeParams中的数据
     const deviceData = data.realTimeParams ? data.realTimeParams : data;
     this.deviceDataCache[deviceId] = {
       ...this.deviceDataCache[deviceId],
       ...deviceData,
       lastUpdate: Date.now()
     };
     
     // 添加调试日志，记录接收到的数据
     if (this.data.debugMode) {
       console.log(`设备 ${deviceId} 数据更新:`, {
         originalData: data,
         processedData: deviceData,
         hasWater: deviceData.water !== undefined,
         hasGas: deviceData.gas !== undefined,
         waterValue: deviceData.water,
         gasValue: deviceData.gas
       });
     }
     
     // 使用防抖机制，避免过于频繁的更新（每2秒最多更新一次）
     if (this.aggregateUpdateTimer) {
       clearTimeout(this.aggregateUpdateTimer);
     }
     
     // 设置防抖定时器并确保执行
     this.aggregateUpdateTimer = setTimeout(() => {
       // 减少日志输出，避免控制台刷屏
       if (this.data.debugMode) {
         console.log('执行聚合数据更新，最新设备:', deviceId);
       }
       this.updateAggregatedRealTimeData();
     }, 2000); // 2秒防抖延迟，减少更新频率
   },
  
  // 更新聚合的实时数据
   updateAggregatedRealTimeData: function() {
     const { monitorData } = this.data;
     if (!monitorData || !monitorData.realTimeData || !this.deviceDataCache) {
       if (this.data.debugMode) {
         console.log('聚合数据更新跳过：缺少必要数据', {
           hasMonitorData: !!monitorData,
           hasRealTimeData: !!(monitorData && monitorData.realTimeData),
           hasDeviceCache: !!this.deviceDataCache
         });
       }
       return;
     }
     
     if (this.data.debugMode) {
       console.log('开始聚合实时数据，设备数量:', Object.keys(this.deviceDataCache).length);
     }
     
     // 聚合所有设备的数据
     let totalPower = 0;      // 用电功率总和
     let totalWaterFlow = 0;  // 用水流量总和
     let totalGasFlow = 0;    // 燃气流量总和
     let totalCarbonRate = 0; // 碳排放率总和
     let deviceCount = 0;
     
     // 设备类型统计
     let powerDeviceCount = 0;  // 用电设备数量
     let waterDeviceCount = 0;  // 用水设备数量
     let gasDeviceCount = 0;    // 燃气设备数量
     
     // 遍历所有设备数据
     Object.keys(this.deviceDataCache).forEach(deviceId => {
       const deviceData = this.deviceDataCache[deviceId];
       
       // 只统计在线设备的数据
       if (deviceData) {
         // 获取设备状态信息（从设备列表中获取）
         const deviceInfo = this.data.deviceList ? this.data.deviceList.find(d => d.id === deviceId) : null;
         const isDeviceOn = deviceInfo ? deviceInfo.isOn : true; // 默认认为设备开启
         const deviceStatus = deviceInfo ? deviceInfo.status : 'online'; // 默认在线状态
         
         // 获取设备类型信息（从设备列表中获取）
         const deviceCategory = deviceInfo ? deviceInfo.category : null;
         
         if (this.data.debugMode) {
           console.log(`处理设备 ${deviceId}:`, {
             deviceData,
             deviceInfo,
             isDeviceOn,
             deviceStatus,
             deviceCategory
           });
         }
         
         // 用电功率：所有设备的实时功率总和（关机设备为0，离线设备为0）
         if (deviceData.power !== undefined) {
           let power = parseFloat(deviceData.power) || 0;
           // 关机设备或离线设备功率为0
           if (!isDeviceOn || deviceStatus !== 'online') {
             power = 0;
           }
           totalPower += power;
           powerDeviceCount++; // 统计用电设备数量
         }
         
         // 用水流量：所有用水设备实时流量的总和（关机设备流量为0）
         // 检查设备类型是否为水设备，或者数据中包含water字段
         if (deviceCategory === 'water' || deviceData.water !== undefined) {
           let waterFlow = parseFloat(deviceData.water) || 0;
           // 关机设备或离线设备流量为0
           if (!isDeviceOn || deviceStatus !== 'online') {
             waterFlow = 0;
           }
           totalWaterFlow += waterFlow;
           waterDeviceCount++; // 统计用水设备数量
           
           if (this.data.debugMode) {
             console.log(`水设备 ${deviceId}: 原始值=${deviceData.water}, 处理后=${waterFlow}, 设备状态=${deviceStatus}, 开关=${isDeviceOn}`);
           }
         } else if (deviceCategory === 'water') {
           // 水设备但没有water数据，使用模拟数据
           let waterFlow = Math.random() * 10 + 5; // 5-15的随机值
           if (!isDeviceOn || deviceStatus !== 'online') {
             waterFlow = 0;
           }
           totalWaterFlow += waterFlow;
           waterDeviceCount++;
           
           if (this.data.debugMode) {
             console.log(`水设备 ${deviceId}: 无数据，使用模拟值=${waterFlow}`);
           }
         }
         
         // 燃气流量：所有燃气设备实时流量的总和（关机设备流量为0）
         // 检查设备类型是否为燃气设备，或者数据中包含gas字段
         if (deviceCategory === 'gas' || deviceData.gas !== undefined) {
           let gasFlow = parseFloat(deviceData.gas) || 0;
           // 关机设备或离线设备流量为0
           if (!isDeviceOn || deviceStatus !== 'online') {
             gasFlow = 0;
           }
           totalGasFlow += gasFlow;
           gasDeviceCount++; // 统计燃气设备数量
           
           if (this.data.debugMode) {
             console.log(`燃气设备 ${deviceId}: 原始值=${deviceData.gas}, 处理后=${gasFlow}, 设备状态=${deviceStatus}, 开关=${isDeviceOn}`);
           }
         } else if (deviceCategory === 'gas') {
           // 燃气设备但没有gas数据，使用模拟数据
           let gasFlow = Math.random() * 8 + 2; // 2-10的随机值
           if (!isDeviceOn || deviceStatus !== 'online') {
             gasFlow = 0;
           }
           totalGasFlow += gasFlow;
           gasDeviceCount++;
           
           if (this.data.debugMode) {
             console.log(`燃气设备 ${deviceId}: 无数据，使用模拟值=${gasFlow}`);
           }
         }
         
         // 碳排放率：所有设备碳排放率的总和（关机设备排放为0）
         if (deviceData.carbon !== undefined) {
           let carbonRate = parseFloat(deviceData.carbon) || 0;
           // 关机设备或离线设备碳排放为0
           if (!isDeviceOn || deviceStatus !== 'online') {
             carbonRate = 0;
           }
           totalCarbonRate += carbonRate;
         } else {
           // 没有carbon数据，根据功率计算碳排放
           let power = parseFloat(deviceData.power) || 0;
           if (!isDeviceOn || deviceStatus !== 'online') {
             power = 0;
           }
           // 简单的碳排放计算：每kW产生0.5kg/h的碳排放
           let carbonRate = power * 0.5;
           totalCarbonRate += carbonRate;
         }
         
         deviceCount++;
       }
     });
     
     // 更新实时监控数据
     if (deviceCount > 0) {
       // 计算趋势（与当前值比较）
       const powerTrend = this.calculateTrend(totalPower, parseFloat(monitorData.realTimeData.power.value));
       const waterTrend = this.calculateTrend(totalWaterFlow, parseFloat(monitorData.realTimeData.water.value));
       const gasTrend = this.calculateTrend(totalGasFlow, parseFloat(monitorData.realTimeData.gas.value));
       const carbonTrend = this.calculateTrend(totalCarbonRate, parseFloat(monitorData.realTimeData.carbon.value));
       
       // 更新用电功率总和
       monitorData.realTimeData.power.value = totalPower.toFixed(1);
       monitorData.realTimeData.power.trend = powerTrend;
       
       // 更新用水流量总和
       monitorData.realTimeData.water.value = totalWaterFlow.toFixed(1);
       monitorData.realTimeData.water.trend = waterTrend;
       
       // 更新燃气流量总和
       monitorData.realTimeData.gas.value = totalGasFlow.toFixed(1);
       monitorData.realTimeData.gas.trend = gasTrend;
       
       // 更新碳排放率总和
       monitorData.realTimeData.carbon.value = totalCarbonRate.toFixed(2);
       monitorData.realTimeData.carbon.trend = carbonTrend;
       
       if (this.data.debugMode) {
         console.log('聚合数据更新完成:', {
           totalPower: totalPower.toFixed(1),
           totalWaterFlow: totalWaterFlow.toFixed(1),
           totalGasFlow: totalGasFlow.toFixed(1),
           totalCarbonRate: totalCarbonRate.toFixed(2),
           deviceCount,
           powerDeviceCount,
           waterDeviceCount,
           gasDeviceCount,
           // 添加更详细的调试信息
           waterDevices: Object.keys(this.deviceDataCache).filter(id => {
             const deviceInfo = this.data.deviceList ? this.data.deviceList.find(d => d.id === id) : null;
             const deviceData = this.deviceDataCache[id];
             return (deviceInfo && deviceInfo.category === 'water') || (deviceData && deviceData.water !== undefined);
           }),
           gasDevices: Object.keys(this.deviceDataCache).filter(id => {
             const deviceInfo = this.data.deviceList ? this.data.deviceList.find(d => d.id === id) : null;
             const deviceData = this.deviceDataCache[id];
             return (deviceInfo && deviceInfo.category === 'gas') || (deviceData && deviceData.gas !== undefined);
           })
         });
       }
       
       this.setData({ monitorData });
     }
   },

  // 更新能耗实时数据
  updateEnergyRealTimeData: function(data) {
    const { overview, monitorData } = this.data;
    
    if (data.totalEnergy !== undefined && overview) {
      overview.totalEnergy.value = data.totalEnergy;
      overview.totalEnergy.trend = data.trend || '0.0';
    }
    
    if (data.carbonEmission !== undefined && monitorData?.realTimeData?.carbon) {
      monitorData.realTimeData.carbon.value = data.carbonEmission;
      monitorData.realTimeData.carbon.trend = this.calculateTrend(data.carbonEmission, monitorData.realTimeData.carbon.value);
    }
    
    this.setData({ overview, monitorData });
  },

  // 处理新告警
  handleNewAlert: function(alertData) {
    const { recentAlerts, alertCount } = this.data;
    
    // 添加新告警到列表顶部
    const newAlert = {
      id: alertData.id,
      level: alertData.level,
      message: alertData.message,
      createdAt: this.formatTime(alertData.createTime || Date.now())
    };
    
    const updatedAlerts = [newAlert, ...recentAlerts.slice(0, 2)]; // 保持最多3条
    
    this.setData({
      recentAlerts: updatedAlerts,
      alertCount: alertCount + 1
    });
    
    // 显示新告警提示
    if (alertData.level === 'high' || alertData.level === 'critical') {
      wx.showToast({
        title: `新${alertData.level === 'critical' ? '紧急' : '重要'}告警`,
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 计算趋势
  calculateTrend: function(newValue, oldValue) {
    if (newValue > oldValue * 1.05) return 'up';
    if (newValue < oldValue * 0.95) return 'down';
    return 'stable';
  },

  // 断开实时连接 - 使用统一API接口
  disconnectRealTime: function() {
    if (this.socketTask) {
      API.unsubscribeRealTimeData(this.socketTask);
      this.socketTask = null;
      this.isRealTimeConnected = false;
      this.setData({ realTimeStatus: 'disconnected' });
    }
    
    // 清除降级轮询定时器
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  },
  
  // 刷新实时数据 - 使用统一API接口
  // 已删除refreshRealTimeData方法 - 改为使用缓存数据
  
  // 从API数据更新实时显示
  updateRealTimeDataFromAPI: function(apiData) {
    const { overview, monitorData } = this.data;
    
    // 更新概览数据 - 添加安全检查
    if (apiData.overview && overview && overview.totalEnergy) {
      overview.totalEnergy.value = apiData.overview.totalEnergy || overview.totalEnergy.value;
      if (overview.water) overview.water.value = apiData.overview.water || overview.water.value;
      if (overview.gas) overview.gas.value = apiData.overview.gas || overview.gas.value;
      if (overview.carbon) overview.carbon.value = apiData.overview.carbon || overview.carbon.value;
    }
    
    // 更新监控数据 - 处理多设备实时数据
    if (Array.isArray(apiData) && apiData.length > 0 && monitorData?.realTimeData) {
      // 聚合多设备的实时数据
      let totalPower = 0, totalWater = 0, totalGas = 0, totalCarbon = 0;
      let deviceCount = 0;
      
      apiData.forEach(deviceData => {
        if (deviceData.realTimeParams) {
          // 获取设备状态信息
          const deviceInfo = this.data.deviceList ? this.data.deviceList.find(d => d.id === deviceData.deviceId) : null;
          const isDeviceOn = deviceInfo ? deviceInfo.isOn : true;
          const deviceStatus = deviceData.status || (deviceInfo ? deviceInfo.status : 'online');
          
          // 根据设备状态计算实际值（关机或离线设备为0）
          const powerMultiplier = (!isDeviceOn || deviceStatus !== 'online') ? 0 : 1;
          
          totalPower += parseFloat(deviceData.realTimeParams.power || 0) * powerMultiplier;
          totalWater += parseFloat(deviceData.realTimeParams.water || 0) * powerMultiplier;
          totalGas += parseFloat(deviceData.realTimeParams.gas || 0) * powerMultiplier;
          totalCarbon += parseFloat(deviceData.realTimeParams.carbon || 0) * powerMultiplier;
          deviceCount++;
        }
      });
      
      // 更新实时监控数据
      if (deviceCount > 0) {
        // 计算趋势（简单实现：与当前值比较）
        const powerTrend = this.calculateTrend(totalPower, parseFloat(monitorData.realTimeData.power.value));
        const waterTrend = this.calculateTrend(totalWater, parseFloat(monitorData.realTimeData.water.value));
        const gasTrend = this.calculateTrend(totalGas, parseFloat(monitorData.realTimeData.gas.value));
        const carbonTrend = this.calculateTrend(totalCarbon, parseFloat(monitorData.realTimeData.carbon.value));
        
        monitorData.realTimeData.power.value = totalPower.toFixed(1);
        monitorData.realTimeData.power.trend = powerTrend;
        
        monitorData.realTimeData.water.value = totalWater.toFixed(1);
        monitorData.realTimeData.water.trend = waterTrend;
        
        monitorData.realTimeData.gas.value = totalGas.toFixed(1);
        monitorData.realTimeData.gas.trend = gasTrend;
        
        monitorData.realTimeData.carbon.value = totalCarbon.toFixed(2);
        monitorData.realTimeData.carbon.trend = carbonTrend;
      }
    } else if (apiData.realTimeParams && monitorData?.realTimeData) {
      // 处理单设备或直接的realTimeParams数据
      Object.keys(apiData.realTimeParams).forEach(key => {
        if (monitorData.realTimeData[key]) {
          monitorData.realTimeData[key].value = apiData.realTimeParams[key].value || apiData.realTimeParams[key] || monitorData.realTimeData[key].value;
          monitorData.realTimeData[key].trend = apiData.realTimeParams[key].trend || this.calculateTrend(apiData.realTimeParams[key], monitorData.realTimeData[key].value);
        }
      });
    }
    
    this.setData({ overview, monitorData });
  },
  
  // 降级到轮询模式
  fallbackToPolling: function() {
    console.log('WebSocket连接失败，降级到轮询模式');
    
    // 清除之前的轮询定时器
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
    
    // 设置轮询定时器，每30秒从缓存刷新一次数据
    this.pollingTimer = setInterval(() => {
      const cachedData = this.loadCachedHomeData();
      if (cachedData) {
        this.updateHomeDataDisplay(cachedData);
        console.log('定时从缓存刷新数据');
      }
    }, 30000);
  },
  
  // 加载天气数据 - 使用统一API接口
  loadWeatherData: async function() {
    try {
      // 如果API中有天气接口，使用API获取
      // const weatherResult = await API.getWeatherInfo();
      // if (weatherResult.success) {
      //   this.setData({ weather: weatherResult.data });
      // }
      
      // 暂时使用默认天气数据
      const weather = {
        temperature: 24,
        condition: 'sunny',
        humidity: 65,
        windSpeed: 3.2
      };
      this.setData({ weather });
    } catch (error) {
      console.error('加载天气数据失败:', error);
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

  // 加载首页数据 - 使用统一API接口和缓存机制
  /**
   * 检查是否需要刷新数据
   */
  shouldRefreshData: function() {
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
    const cacheStatus = API.cache.getStatus('home_data');
    if (!cacheStatus.exists || cacheStatus.expired) {
      return true;
    }
    
    return false;
  },

  loadHomeData: async function(forceRefresh = false) {
    try {
      // 显示加载状态
      if (forceRefresh) {
        wx.showLoading({
          title: '刷新数据...',
          mask: true
        });
      } else {
        this.setData({ loading: true });
      }
      
      // 优先尝试使用缓存数据快速显示
      if (!forceRefresh) {
        const cachedData = this.loadCachedHomeData();
        if (cachedData) {
          // 使用缓存数据快速显示（避免覆盖实时数据）
          this.updateHomeDataDisplay(cachedData);
          
          // 在后台静默更新数据
          this.updateHomeDataInBackground();
          return;
        }
      }
      
      // 没有缓存或强制刷新，使用优化的批量数据获取接口
      const requests = [
        { type: 'home', params: {} }, // 首页概览数据
        { type: 'monitor', params: {} }, // 实时监控数据
        { type: 'alert', params: { pageSize: 3 } }, // 最近告警
        { type: 'device', params: {} } // 设备列表
      ];
      
      const batchResult = await API.getBatchData(requests);
      
      if (batchResult.success) {
        const { 
          home: overviewRes, 
          monitor: monitorRes, 
          alert: alertsRes, 
          device: deviceRes 
        } = batchResult.data;
        
        // 记录数据加载时间
        this.lastDataLoadTime = Date.now();
        
        // 处理设备列表数据
        if (deviceRes && deviceRes.success && deviceRes.data && deviceRes.data.list) {
          this.setData({ deviceList: deviceRes.data.list });
          
          // 设备列表加载完成后，重新初始化实时数据连接
          // 这样getMonitorDeviceIds方法就能获取到正确的设备ID
          this.disconnectRealTime(); // 先断开之前的连接
          setTimeout(() => {
            this.initRealTimeData(); // 重新建立连接
          }, 100);
        }
        
        // 处理首页概览数据 - 使用统一API数据格式
        if (overviewRes && overviewRes.success) {
          const apiData = overviewRes.data;
          
          // 从API获取今日用电负荷数据
          const todayElectricity = apiData.realTimeEnergy?.today?.electricity || 0;
          const todayWater = apiData.realTimeEnergy?.today?.water || 0;
          const todayGas = apiData.realTimeEnergy?.today?.gas || 0;
          const todayTotal = apiData.realTimeEnergy?.today?.total || todayElectricity;
          const todayCarbonEmission = apiData.realTimeEnergy?.today?.carbonEmission || 
                                    (todayTotal * 0.785).toFixed(1);
          
          // 获取用电负荷曲线数据（24小时）
          const loadCurveData = apiData.loadCurve || [];
          
          // 构建概览数据对象
          const overview = {
            // 总能耗数据
            totalEnergy: {
              value: todayTotal,
              unit: 'kWh',
              trend: apiData.realTimeEnergy?.today?.trend || '0.0'
            },
            // 今日用电负荷数据 - 通过API获取
            electricity: {
              value: todayElectricity,
              unit: 'kWh',
              trend: apiData.realTimeEnergy?.today?.electricityTrend || apiData.realTimeEnergy?.today?.trend || '0.0',
              loadCurve: loadCurveData // 添加负荷曲线数据
            },
            // 用水数据
            water: {
              value: todayWater,
              unit: '吨',
              trend: apiData.realTimeEnergy?.today?.waterTrend || '0.0'
            },
            // 燃气数据
            gas: {
              value: todayGas,
              unit: 'm³',
              trend: apiData.realTimeEnergy?.today?.gasTrend || '0.0'
            },
            // 碳排放数据
            carbon: {
              value: todayCarbonEmission,
              unit: 'kg',
              trend: apiData.realTimeEnergy?.today?.carbonTrend || '0.0'
            },
            // 今日能耗分类数据 - 更新数据结构
            todayEnergy: {
              electricity: { 
                value: todayElectricity, 
                unit: 'kWh', 
                trend: apiData.realTimeEnergy?.today?.electricityTrend || '0.0' 
              },
              water: { 
                value: todayWater, 
                unit: '吨', 
                trend: apiData.realTimeEnergy?.today?.waterTrend || '0.0' 
              },
              gas: { 
                value: todayGas, 
                unit: 'm³', 
                trend: apiData.realTimeEnergy?.today?.gasTrend || '0.0' 
              }
            }
          };
          
          // 更新页面数据
          this.setData({ overview });
          
          // 如果有负荷曲线数据，初始化图表
          if (loadCurveData && loadCurveData.length > 0) {
            this.initLoadCurveChart(loadCurveData);
          }
        }
        
        // 处理监控数据 - 使用统一数据格式
        if (monitorRes && monitorRes.success) {
          const monitorData = {
            realTimeData: {
              power: {
                value: parseFloat(monitorRes.data.realTimeParams?.power || 0).toFixed(1),
                unit: 'kW',
                trend: monitorRes.data.realTimeParams?.powerTrend || 'stable'
              },
              water: {
                value: monitorRes.data.realTimeParams?.water || 0,
                unit: '吨/h',
                trend: monitorRes.data.realTimeParams?.waterTrend || 'stable'
              },
              gas: {
                value: monitorRes.data.realTimeParams?.gas || 0,
                unit: 'm³/h',
                trend: monitorRes.data.realTimeParams?.gasTrend || 'stable'
              },
              carbon: {
                value: monitorRes.data.realTimeParams?.carbon || 0,
                unit: 'kg/h',
                trend: monitorRes.data.realTimeParams?.carbonTrend || 'stable'
              },
              // 添加环境参数
              temperature: {
                value: monitorRes.data.environmentParams?.temperature || 25,
                unit: '°C',
                trend: monitorRes.data.environmentParams?.temperatureTrend || 'stable'
              },
              humidity: {
                value: monitorRes.data.environmentParams?.humidity || 60,
                unit: '%',
                trend: monitorRes.data.environmentParams?.humidityTrend || 'stable'
              }
            },
            // 添加图表数据
            energyCurve: monitorRes.data.energyCurve || []
          };
          this.setData({ monitorData });
        }
        
        // 处理告警数据 - 使用统一数据格式
        if (alertsRes && alertsRes.success) {
          const recentAlerts = Array.isArray(alertsRes.data.list) 
            ? alertsRes.data.list.slice(0, 3).map(alert => ({
                id: alert.id,
                level: alert.level,
                message: alert.content || alert.message, // 兼容不同字段名
                createdAt: this.formatTime(alert.createTime || alert.createdAt) // 兼容不同字段名
              }))
            : [];
          
          this.setData({
            alertCount: alertsRes.data.summary?.unread || alertsRes.data.total || 0,
            recentAlerts: recentAlerts
          });
        }
        
        // 获取天气信息 - 使用统一API
        this.loadWeatherData();
        
        this.setData({ loading: false });
        
        // 图表初始化已移至onReady生命周期，此处不再调用
        // this.initChart(); // 注释掉，避免重复初始化
        
        // 用电负荷曲线图表初始化已移至onReady生命周期
        // 将数据保存到data中，供onReady时使用
        if (overviewRes && overviewRes.success && overviewRes.data.loadCurve) {
          this.setData({
            loadCurveData: overviewRes.data.loadCurve
          });
        }
        
        // 处理部分数据获取失败的情况
        if (batchResult.errors && batchResult.errors.length > 0) {
          console.warn('部分数据获取失败:', batchResult.errors);
          // 显示部分加载失败的提示
          wx.showToast({
            title: '部分数据加载失败',
            icon: 'none',
            duration: 2000
          });
        }
      } else {
        throw new Error('批量数据获取失败');
      }
    } catch (error) {
      console.error('加载首页数据失败:', error);
      this.setData({ loading: false });
      
      // 显示具体错误信息
      wx.showToast({
        title: error.message || '数据加载失败',
        icon: 'none',
        duration: 3000
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 加载缓存的首页数据
   */
  loadCachedHomeData() {
    try {
      const cachedHome = API.cache.get('home_{}');
      const cachedDevices = API.cache.get('device_{"limit":10}');
      const cachedMonitor = API.cache.get('monitor_{}');
      const cachedAlerts = API.cache.get('alert_{"limit":5}');
      
      if (cachedHome && cachedDevices && cachedMonitor && cachedAlerts) {
        return {
          home: cachedHome,
          device: cachedDevices,
          monitor: cachedMonitor,
          alert: cachedAlerts
        };
      }
      
      return null;
    } catch (error) {
      console.error('加载缓存数据失败:', error);
      return null;
    }
  },

  /**
   * 更新首页数据显示
   */
  updateHomeDataDisplay(data) {
    try {
      const { home, device, monitor, alert } = data;
      
      // 更新首页概览数据
      if (home && home.data) {
        this.setData({
          totalDevices: home.data.totalDevices || 0,
          onlineDevices: home.data.onlineDevices || 0,
          totalEnergy: home.data.totalEnergy || 0,
          todayEnergy: home.data.todayEnergy || 0,
          energyTrend: home.data.energyTrend || [],
          powerTrend: home.data.powerTrend || []
        });
      }
      
      // 更新设备列表
      if (device && device.data && device.data.devices) {
        this.setData({
          deviceList: device.data.devices.slice(0, 6) // 首页只显示前6个设备
        });
      }
      
      // 更新监控数据 - 只更新非实时数据部分，避免覆盖WebSocket推送的实时数据
      if (monitor && monitor.data) {
        const { monitorData } = this.data;
        
        // 只更新环境数据和系统状态，保留实时监控数据
        const updatedMonitorData = {
          ...monitorData,
          // 只更新环境参数，不覆盖realTimeData
          realTimeData: {
            ...monitorData.realTimeData,
            // 只更新环境参数（温度、湿度），保留能耗实时数据
            temperature: {
              value: monitor.data.environmentParams?.temperature || monitorData.realTimeData.temperature?.value || 25,
              unit: '°C',
              trend: monitor.data.environmentParams?.temperatureTrend || 'stable'
            },
            humidity: {
              value: monitor.data.environmentParams?.humidity || monitorData.realTimeData.humidity?.value || 60,
              unit: '%',
              trend: monitor.data.environmentParams?.humidityTrend || 'stable'
            }
          },
          // 更新图表数据
          energyCurve: monitor.data.energyCurve || monitorData.energyCurve || []
        };
        
        this.setData({
          monitorData: updatedMonitorData,
          environmentData: monitor.data.environment || {},
          systemStatus: monitor.data.system || {}
        });
      }
      
      // 更新告警数据
      if (alert && alert.data && alert.data.alerts) {
        this.setData({
          recentAlerts: alert.data.alerts
        });
      }
      
      this.setData({ loading: false });
      console.log('缓存数据显示完成（保留实时监控数据）');
    } catch (error) {
      console.error('更新首页数据显示失败:', error);
    }
  },

  /**
   * 后台静默更新首页数据
   */
  async updateHomeDataInBackground() {
    try {
      const requests = [
        { type: 'device', params: { limit: 10 } },
        { type: 'home', params: {} },
        { type: 'monitor', params: {} },
        { type: 'alert', params: { limit: 5 } }
      ];
      
      const batchResult = await API.getBatchData(requests);
      
      if (batchResult.success) {
        const { home, device, monitor, alert } = batchResult.data;
        
        // 缓存新数据
        if (home && home.success) {
          API.cache.set('home_{}', home.data);
        }
        if (device && device.success) {
          API.cache.set('device_{"limit":10}', device.data);
        }
        if (monitor && monitor.success) {
          API.cache.set('monitor_{}', monitor.data);
        }
        if (alert && alert.success) {
          API.cache.set('alert_{"limit":5}', alert.data);
        }
        
        // 更新显示
        this.updateHomeDataDisplay(batchResult.data);
        
        console.log('后台首页数据更新完成');
      }
    } catch (error) {
      console.error('后台更新首页数据失败:', error);
      // 静默失败，不影响用户体验
    }
  },

  // 格式化时间
  formatTime: function(timeStr) {
    // 检查时间字符串是否有效
    if (!timeStr) {
      return '未知时间';
    }
    
    // 使用iOS兼容的日期解析函数
    const date = parseDate(timeStr);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '未知时间';
    }
    
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

  // 初始化图表 - 使用API返回的真实数据
  initChart: function() {
    // 优先使用API返回的图表数据
    let chartData;
    
    if (this.data.monitorData && this.data.monitorData.energyCurve && this.data.monitorData.energyCurve.length > 0) {
      // 使用API返回的能耗曲线数据
      const energyCurve = this.data.monitorData.energyCurve;
      chartData = {
        categories: energyCurve.map(item => item.time || item.label),
        series: [{
          name: '用电负荷',
          data: energyCurve.map(item => parseFloat(item.value || item.power || 0).toFixed(1))
        }]
      };
    } else {
      // 如果API数据不可用，使用默认数据
      chartData = {
        categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        series: [{
          name: '用电负荷',
          data: [45.2, 38.6, 65.8, 78.3, 82.1, 69.4, 52.7]
        }]
      };
    }
    
    this.setData({
      chartData: chartData
    });
    
    // 延迟绘制图表，确保DOM已渲染
    setTimeout(() => {
      this.drawChart(chartData);
    }, 100);
  },

  // 绘制折线图 - 优化按需注入兼容性
  drawChart: function(chartData) {
    const query = wx.createSelectorQuery().in(this);
    query.select('#powerChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        // 增强Canvas节点检查，确保按需注入环境下的稳定性
        if (!res || !res[0] || !res[0].node) {
          // console.warn('Canvas节点未找到，可能是按需注入导致的时序问题');
          // 延迟重试
          setTimeout(() => {
            this.drawChart(chartData);
          }, 300);
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 兼容性处理：使用推荐的新API获取设备像素比
         let dpr;
         try {
           // 优先使用wx.getWindowInfo获取pixelRatio（推荐API）
           const windowInfo = wx.getWindowInfo();
           dpr = windowInfo.pixelRatio || 2;
         } catch (e) {
           // 降级方案：使用wx.getDeviceInfo
           try {
             const deviceInfo = wx.getDeviceInfo();
             dpr = deviceInfo.pixelRatio || 2;
           } catch (e2) {
             dpr = 2; // 默认值
           }
         }
        
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
        // 确保数据都是数字类型
        const numericData = data.map(value => parseFloat(value) || 0);
        const maxValue = Math.max(...numericData);
        const minValue = Math.min(...numericData);
        const valueRange = maxValue - minValue;
        
        // 绘制网格线 - 适配浅色主题
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
        ctx.lineWidth = 0.5;
        
        // Y轴单位标签已移至标题中，此处不再显示
        
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
        
        // 垂直网格线和X轴标签 - 隔一个显示，从第2个刻度开始
        for (let i = 0; i < categories.length; i++) {
          const x = padding.left + (chartWidth / (categories.length - 1)) * i;
          
          // 网格线 - 适配浅色主题
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + chartHeight);
          ctx.stroke();
          
          // X轴标签 - 根据数据点数量调整显示策略
          let shouldShowLabel = false;
          if (categories.length <= 7) {
            // 本周数据（7个或更少数据点）：显示所有标签
            shouldShowLabel = true;
          } else {
            // 今日数据（更多数据点）：隔3个显示，从第4个刻度开始
            shouldShowLabel = (i === 3 || (i > 3 && (i - 3) % 4 === 0));
          }
          
          if (shouldShowLabel) {
            ctx.fillStyle = '#64748b';
            ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(categories[i], x, padding.top + chartHeight + 22);
          }
        }
        
        // 绘制折线图
        const points = numericData.map((value, index) => {
          const x = padding.left + (chartWidth / (numericData.length - 1)) * index;
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
        
        // 绘制数据点 - 根据数据点数量调整显示策略
          points.forEach((point, index) => {
            // 根据数据点数量决定显示策略
            let shouldShowPoint = false;
            if (points.length <= 7) {
              // 本周数据（7个或更少数据点）：显示所有数据点
              shouldShowPoint = true;
            } else {
              // 今日数据（更多数据点）：隔1个显示，从第2个数据点开始
              shouldShowPoint = (index === 1 || (index > 1 && (index - 1) % 2 === 0));
            }
            
            if (shouldShowPoint) {
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
            
            // 数值标签 - 适配浅色主题，去除KW单位
            ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
            ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(point.value.toFixed(1), point.x, point.y - 10);
          }
        });
        if (this.data.debugMode) {
          console.log('折线图绘制完成');
        }
      });
  },

  // 初始化用电负荷曲线图表 - 使用API数据
  initLoadCurveChart: function(loadCurveData) {
    if (!loadCurveData || loadCurveData.length === 0) {
      console.log('用电负荷曲线数据为空，跳过图表初始化');
      return;
    }
    
    try {
      // 处理API返回的负荷曲线数据
      const chartData = {
        categories: loadCurveData.map(item => {
          // 处理时间格式，支持多种时间格式
          if (item.time) {
            // 如果是完整时间格式，提取小时部分
            if (item.time.includes(':')) {
              return item.time;
            }
            // 如果是小时数字，格式化为HH:00
            return item.time.toString().padStart(2, '0') + ':00';
          }
          return item.label || '';
        }),
        series: [{
          name: '今日用电负荷',
          data: loadCurveData.map(item => {
            // 处理功率数据，支持多种数据字段
            const power = item.power || item.value || item.load || 0;
            return parseFloat(power).toFixed(1);
          })
        }]
      };
      
      // 更新页面数据
      this.setData({ 
        chartData: chartData,
        chartTab: 'today' // 确保显示今日标签
      });
      
      // 延迟绘制图表，确保DOM已更新
      setTimeout(() => {
        this.drawChart(chartData);
      }, 100);
      
      if (this.data.debugMode) {
        console.log('用电负荷曲线图表初始化完成:', {
          dataPoints: loadCurveData.length,
          timeRange: chartData.categories[0] + ' - ' + chartData.categories[chartData.categories.length - 1],
          maxPower: Math.max(...chartData.series[0].data.map(v => parseFloat(v))).toFixed(1) + 'kW'
        });
      }
      
    } catch (error) {
      console.error('初始化用电负荷曲线图表失败:', error);
      // 使用基于时间的确定性默认数据作为备用方案
      const now = new Date();
      const baseDate = now.getDate(); // 使用日期作为种子
      const defaultChartData = {
        categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        series: [{
          name: '今日用电负荷',
          data: [
            (40 + (baseDate % 10) * 0.5).toFixed(1),
            (35 + (baseDate % 8) * 0.4).toFixed(1), 
            (60 + (baseDate % 12) * 0.6).toFixed(1),
            (75 + (baseDate % 15) * 0.3).toFixed(1),
            (80 + (baseDate % 10) * 0.2).toFixed(1),
            (65 + (baseDate % 8) * 0.5).toFixed(1),
            (50 + (baseDate % 6) * 0.4).toFixed(1)
          ]
        }]
      };
      
      this.setData({ chartData: defaultChartData });
      setTimeout(() => {
        this.drawChart(defaultChartData);
      }, 100);
    }
  },

  // 刷新数据 - 优先使用缓存数据
  refreshData: function() {
    this.setData({
      isRefreshing: true
    });
    
    try {
      // 更新时间
      this.updateTime();
      
      // 从缓存加载首页数据
      const cachedData = this.loadCachedHomeData();
      if (cachedData) {
        this.updateHomeDataDisplay(cachedData);
        console.log('刷新数据：使用缓存数据');
      } else {
        console.log('刷新数据：缓存数据不可用，保持当前数据');
      }
      
      // 如果有负荷曲线数据，重新初始化图表
      if (this.data.overview && this.data.overview.electricity && this.data.overview.electricity.loadCurve) {
        this.initLoadCurveChart(this.data.overview.electricity.loadCurve);
      }
      
      this.setData({
        isRefreshing: false
      });
      
      wx.showToast({
        title: '数据已刷新',
        icon: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('刷新数据失败:', error);
      this.setData({
        isRefreshing: false
      });
      
      wx.showToast({
        title: '刷新失败',
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 切换图表标签 - 优先使用缓存数据
  switchChartTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      chartTab: tab
    });
    
    try {
      let chartData;
      
      // 优先从缓存获取监控数据
      const cachedMonitor = API.cache.get('monitor_{}');
      
      if (cachedMonitor && cachedMonitor.data && cachedMonitor.data.energyCurve) {
        // 使用缓存的监控数据，根据时间范围处理不同的数据字段
        const energyCurveData = cachedMonitor.data.energyCurve;
        
        chartData = {
          categories: energyCurveData.map((item, index) => {
            // 确保时间字段有效，避免NaN显示
            let timeLabel = item.time || item.label;
            if (!timeLabel || timeLabel === 'undefined' || timeLabel === 'null') {
              // 如果时间字段无效，根据标签类型生成默认时间
              if (tab === 'week') {
                const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                timeLabel = weekDays[index] || `第${index + 1}天`;
              } else {
                timeLabel = `${(index * 4).toString().padStart(2, '0')}:00`;
              }
            }
            return timeLabel;
          }),
          series: [{
            name: tab === 'today' ? '今日用电负荷' : '本周用电负荷',
            data: energyCurveData.map(item => {
              // 根据时间范围选择合适的数据字段
              let value = 0;
              if (tab === 'week') {
                // 本周数据使用electricity字段
                value = item.electricity || item.value || item.power || 0;
              } else {
                // 今日数据使用value或power字段
                value = item.value || item.power || item.electricity || 0;
              }
              // 确保数值有效
              const numValue = parseFloat(value);
              return isNaN(numValue) ? '0.0' : numValue.toFixed(1);
            })
          }]
        };
      } else if (tab === 'today' && this.data.overview && this.data.overview.electricity && this.data.overview.electricity.loadCurve) {
        // 如果是今日标签且有本地负荷曲线数据，使用本地数据
        const loadCurveData = this.data.overview.electricity.loadCurve;
        chartData = {
          categories: loadCurveData.map(item => {
            if (item.time && item.time.includes(':')) {
              return item.time;
            }
            return item.time ? item.time.toString().padStart(2, '0') + ':00' : item.label || '';
          }),
          series: [{
            name: '今日用电负荷',
            data: loadCurveData.map(item => {
              const power = item.power || item.value || item.load || 0;
              return parseFloat(power).toFixed(1);
            })
          }]
        };
      } else {
        // 如果缓存数据不可用，使用稳定的默认数据（基于时间生成确定性数据）
        if (tab === 'today') {
          // 今日数据：基于当前时间生成确定性的24小时负荷曲线
          const now = new Date();
          const baseDate = now.getDate(); // 使用日期作为种子
          chartData = {
            categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            series: [{
              name: '今日用电负荷',
              data: [
                (40 + (baseDate % 10) * 0.5).toFixed(1),
                (35 + (baseDate % 8) * 0.4).toFixed(1), 
                (60 + (baseDate % 12) * 0.6).toFixed(1),
                (75 + (baseDate % 15) * 0.3).toFixed(1),
                (80 + (baseDate % 10) * 0.2).toFixed(1),
                (65 + (baseDate % 8) * 0.5).toFixed(1),
                (50 + (baseDate % 6) * 0.4).toFixed(1)
              ]
            }]
          };
        } else if (tab === 'week') {
          // 本周数据：基于当前周数生成确定性的7天负荷数据
          const now = new Date();
          const weekSeed = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000)); // 周数作为种子
          chartData = {
            categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            series: [{
              name: '本周用电负荷',
              data: [
                (500 + (weekSeed % 20) * 2).toFixed(1),
                (480 + (weekSeed % 15) * 1.5).toFixed(1),
                (600 + (weekSeed % 25) * 1.2).toFixed(1),
                (590 + (weekSeed % 18) * 1.8).toFixed(1),
                (630 + (weekSeed % 22) * 1.4).toFixed(1),
                (370 + (weekSeed % 12) * 2.2).toFixed(1),
                (290 + (weekSeed % 10) * 1.6).toFixed(1)
              ]
            }]
          };
        }
      }
      
      this.setData({ chartData });
      
      // 重新绘制图表
      setTimeout(() => {
        this.drawChart(chartData);
      }, 100);
      
      console.log(`图表切换到${tab}，使用${cachedMonitor ? '缓存' : '默认'}数据`);
    } catch (error) {
      console.error('切换图表数据失败:', error);
      wx.showToast({
        title: '图表数据加载失败',
        icon: 'none'
      });
    }
  },

  // 页面跳转方法
  goToWeather: function() {
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
  },

  goToAlerts: function() {
    wx.navigateTo({
      url: '/pages/alerts/alerts'
    });
  },

  // 新增：处理单个告警项的点击事件，跳转到告警页面并传递告警ID
  goToAlertDetail: function(e) {
    const alertId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/alerts/alerts?alertId=${alertId}`
    });
  },

  goToMonitor: function(e) {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    // 获取点击的能源类型
    const energyType = e.currentTarget.dataset.type || 'overview';
    wx.navigateTo({
      url: `/pages/monitor/monitor?mode=category&energyType=${energyType}`
    });
  },

  goToDevices: function() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    wx.switchTab({
      url: '/pages/devices/devices'
    });
  },

  goToData: function() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    wx.switchTab({
      url: '/pages/data/data'
    });
  },

  goToSceneMode: function() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    wx.navigateTo({
      url: '/pages/scene-mode/scene-mode'
    });
  },

  goToAutomation: function() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    wx.navigateTo({
      url: '/pages/automation/automation'
    });
  },

  // 新增：跳转到详情页面（能耗概览）
  goToDetail: function() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    // 由于data页面是tabBar页面，需要使用switchTab跳转
    // 先设置全局数据来标识要显示的内容
    getApp().globalData = getApp().globalData || {};
    getApp().globalData.dataPageSection = 'overview';
    
    wx.switchTab({
      url: '/pages/data/data'
    });
  },

  // 新增：跳转到分析页面（趋势分析）
  goToAnalysis: function() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    // 由于data页面是tabBar页面，需要使用switchTab跳转
    // 先设置全局数据来标识要显示的内容
    getApp().globalData = getApp().globalData || {};
    getApp().globalData.dataPageSection = 'trend';
    
    wx.switchTab({
      url: '/pages/data/data'
    });
  },

  // 新增：导出数据功能
  exportData: function() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
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
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
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
  },

  /**
   * 下拉刷新 - 强制从网络获取最新数据
   */
  onPullDownRefresh: function() {
    // 记录用户交互时间
    this.lastUserInteraction = Date.now();
    
    this.loadHomeData(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  }
})