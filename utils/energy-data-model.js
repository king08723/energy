/**
 * 智慧能源管理小程序 - 能源数据模型
 * 提供统一的能源数据结构和计算方法
 * 版本: 1.1.0
 * 更新日期: 2023-06-15
 */

// 引入配置
const { ENERGY_TYPES, ENERGY_UNITS } = require('./config.js');
const { parseDate } = require('./utils.js');

/**
 * 能源数据模型类
 * 提供能源数据的统一结构和计算方法
 * 支持多种能源类型的能耗计算和碳排放计算
 */
class EnergyDataModel {
  constructor() {
    // 设备能耗数据缓存 - 用于存储各设备的能耗数据
    this.deviceEnergyCache = new Map();
    
    // 能源类型的基准消耗率 (单位: kW, m³/h, 吨/h)
    // 这些值作为各类型能源消耗的基准值，后续会与设备类型系数、时间模式系数等相乘得到实际能耗
    this.baseConsumptionRates = {
      [ENERGY_TYPES.ELECTRICITY]: 0.5,  // 0.5 kW
      [ENERGY_TYPES.WATER]: 0.05,      // 0.05 吨/h
      [ENERGY_TYPES.GAS]: 0.1,         // 0.1 m³/h
      [ENERGY_TYPES.SOLAR]: -0.8,      // -0.8 kW (负值表示产能)
      [ENERGY_TYPES.STORAGE]: 0.3      // 0.3 kW
    };
    
    // 设备类型的能耗系数 (相对于基准消耗率的倍数)
    // 不同设备类型有不同的能耗特性，此系数表示相对于基准消耗率的倍数
    this.deviceTypeFactors = {
      // 电力设备
      'air_conditioner': 2.5,  // 空调耗电量是基准值的2.5倍
      'lighting': 0.8,         // 照明耗电量是基准值的0.8倍
      'power_meter': 0.01,     // 电表自身消耗很少
      'transformer': 0.5,      // 变压器
      'ups': 0.3,              // 不间断电源
      
      // 水系统设备
      'water_meter': 0.01,     // 水表
      'water_pump': 1.5,       // 水泵
      'cooling_water': 2.0,    // 冷却水系统
      'water_tank': 0.1,       // 水箱
      
      // 燃气设备
      'gas_meter': 0.01,       // 燃气表
      'gas_boiler': 3.0,       // 燃气锅炉
      'gas_detector': 0.01,    // 燃气探测器
      
      // 环境监测设备
      'environment_monitor': 0.05,  // 环境监测器
      'air_quality': 0.05,         // 空气质量监测
      'temperature_sensor': 0.01,  // 温度传感器
      'humidity_sensor': 0.01,
      
      // 其他设备
      'motor': 1.8,               // 电机
      'air_compressor': 2.2,       // 空气压缩机
      'ev_charger': 3.5,           // 电动车充电桩
      'solar_inverter': -1.0,      // 太阳能逆变器 (负值表示产能)
      'energy_storage': 0.2        // 储能设备
    };
    
    // 碳排放系数 (kg CO2 / 单位能源)
    // 这些系数用于计算不同能源类型的碳排放量
    // 参考来源: 国家发改委气候司发布的《中国区域电网基准线排放因子》和《温室气体排放核算与报告要求》
    this.carbonEmissionFactors = {
      [ENERGY_TYPES.ELECTRICITY]: 0.785, // 0.785 kg CO2/kWh (电网平均值)
      [ENERGY_TYPES.WATER]: 0.344,      // 0.344 kg CO2/吨 (包含水处理和输送能耗)
      [ENERGY_TYPES.GAS]: 2.093,        // 2.093 kg CO2/m³ (天然气燃烧排放)
      [ENERGY_TYPES.SOLAR]: 0,          // 0 kg CO2/kWh (太阳能发电无直接碳排放)
      [ENERGY_TYPES.STORAGE]: 0.1       // 0.1 kg CO2/kWh (考虑充放电损耗和电网电力的间接排放)
    };
    
    // 时间模式系数 (不同时间段的能耗系数)
    // 这些系数反映了不同时间段的能源使用模式差异
    this.timePatternFactors = {
      // 工作日模式
      weekday: {
        night: 0.3,      // 凌晨 (0-6点) - 低谷时段
        morning: 1.2,    // 早晨 (6-9点) - 早高峰
        working: 1.5,    // 工作时间 (9-18点) - 高峰时段
        evening: 1.0,    // 晚上 (18-22点) - 平峰时段
        lateNight: 0.5   // 深夜 (22-24点) - 次低谷时段
      },
      // 周末模式
      weekend: {
        night: 0.3,      // 凌晨 (0-6点)
        morning: 0.8,    // 早晨 (6-9点)
        working: 0.9,    // 工作时间 (9-18点)
        evening: 1.2,    // 晚上 (18-22点) - 周末晚间用电高峰
        lateNight: 0.7   // 深夜 (22-24点)
      }
    };
  }
  
  /**
   * 获取设备功率（用于能耗计算）
   * @param {string} deviceId 设备ID
   * @returns {number} 设备功率（kW）
   */
  getDevicePower(deviceId) {
    // 这里应该从设备数据中获取实际功率
    // 暂时返回默认值，实际应用中需要从设备配置或实时数据中获取
    return 1.0; // 默认1kW
  }
  
  /**
   * 获取当前时间模式
   * @param {Date} date - 日期对象
   * @returns {Object} 时间模式信息，包含日期类型、时间段和对应系数
   */
  getTimePattern(date = new Date()) {
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0是周日，6是周六
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let timeSlot;
    if (hour >= 0 && hour < 6) {
      timeSlot = 'night';
    } else if (hour >= 6 && hour < 9) {
      timeSlot = 'morning';
    } else if (hour >= 9 && hour < 18) {
      timeSlot = 'working';
    } else if (hour >= 18 && hour < 22) {
      timeSlot = 'evening';
    } else {
      timeSlot = 'lateNight';
    }
    
    const dayType = isWeekend ? 'weekend' : 'weekday';
    const factor = this.timePatternFactors[dayType][timeSlot];
    
    return {
      dayType,
      timeSlot,
      factor
    };
  }
  
  /**
   * 计算设备能耗和碳排放
   * @param {Object} device - 设备对象
   * @param {number} duration - 持续时间(小时)
   * @param {Date} date - 日期对象
   * @returns {Object} 能耗数据，包含能耗值、单位和碳排放量
   */
  calculateDeviceEnergy(device, duration = 1, date = new Date()) {
    // 如果设备离线或关闭，能耗为0
    if (device.status === 'offline' || device.isOn === false) {
      return {
        value: 0,
        unit: this.getEnergyUnit(device.category),
        carbonEmission: 0
      };
    }
    
    // 获取设备类型的能耗系数
    const deviceType = device.type || 'generic';
    const typeFactor = this.deviceTypeFactors[deviceType] || 1.0;
    
    // 获取时间模式系数
    const { factor: timeFactor } = this.getTimePattern(date);
    
    // 获取设备功率等级系数 (0-100%)
    const powerFactor = (device.powerLevel || 100) / 100;
    
    // 获取设备的能源类型
    const energyType = device.category || ENERGY_TYPES.ELECTRICITY;
    
    // 获取基准消耗率
    const baseRate = this.baseConsumptionRates[energyType] || this.baseConsumptionRates[ENERGY_TYPES.ELECTRICITY];
    
    // 计算能耗值 (考虑负值情况，如太阳能发电)
    const energyValue = baseRate * typeFactor * timeFactor * powerFactor * duration;
    
    // 计算碳排放量 (对于负值能耗，表示减少的碳排放)
    const carbonFactor = this.carbonEmissionFactors[energyType] || 0;
    const carbonEmission = energyValue * carbonFactor;
    
    return {
      value: parseFloat(energyValue.toFixed(3)),
      unit: this.getEnergyUnit(energyType),
      carbonEmission: parseFloat(carbonEmission.toFixed(3)),
      energyType: energyType,  // 添加能源类型信息
      timestamp: date.toISOString() // 添加时间戳
    };
  }
  
  /**
   * 获取能源单位
   * @param {string} energyType - 能源类型
   * @returns {string} 能源单位
   */
  getEnergyUnit(energyType) {
    return ENERGY_UNITS[energyType] || 'kWh';
  }
  
  /**
   * 累计设备能耗和碳排放
   * @param {string} deviceId - 设备ID
   * @param {Object} energyData - 能耗数据
   * @param {Date} timestamp - 时间戳
   */
  accumulateDeviceEnergy(deviceId, energyData, timestamp = new Date()) {
    if (!this.deviceEnergyCache.has(deviceId)) {
      // 初始化设备能耗缓存结构
      this.deviceEnergyCache.set(deviceId, {
        daily: {},     // 按日累计数据
        hourly: {},    // 按小时累计数据
        monthly: {},   // 按月累计数据 (新增)
        total: 0,      // 总能耗
        carbonTotal: 0, // 总碳排放
        energyType: energyData.energyType || ENERGY_TYPES.ELECTRICITY // 记录能源类型
      });
    }
    
    const deviceCache = this.deviceEnergyCache.get(deviceId);
    
    // 更新总能耗和碳排放
    deviceCache.total += energyData.value;
    deviceCache.carbonTotal += energyData.carbonEmission;
    
    // 获取日期相关的键
    const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    const monthKey = dateKey.substring(0, 7); // YYYY-MM
    const hourKey = `${dateKey}T${dateObj.getHours().toString().padStart(2, '0')}`;
    
    // 更新日能耗
    if (!deviceCache.daily[dateKey]) {
      deviceCache.daily[dateKey] = {
        value: 0,
        carbonEmission: 0,
        timestamp: dateKey
      };
    }
    deviceCache.daily[dateKey].value += energyData.value;
    deviceCache.daily[dateKey].carbonEmission += energyData.carbonEmission;
    
    // 更新月能耗 (新增)
    if (!deviceCache.monthly[monthKey]) {
      deviceCache.monthly[monthKey] = {
        value: 0,
        carbonEmission: 0,
        timestamp: monthKey
      };
    }
    deviceCache.monthly[monthKey].value += energyData.value;
    deviceCache.monthly[monthKey].carbonEmission += energyData.carbonEmission;
    
    // 更新小时能耗
    if (!deviceCache.hourly[hourKey]) {
      deviceCache.hourly[hourKey] = {
        value: 0,
        carbonEmission: 0,
        timestamp: hourKey
      };
    }
    deviceCache.hourly[hourKey].value += energyData.value;
    deviceCache.hourly[hourKey].carbonEmission += energyData.carbonEmission;
  }
  
  /**
   * 获取设备能耗数据
   * @param {string} deviceId - 设备ID
   * @param {string} timeRange - 时间范围 (day, week, month, total)
   * @param {Date} endDate - 结束日期，默认为当前时间
   * @returns {Object} 能耗数据，包含能耗值和碳排放量
   */
  getDeviceEnergyData(deviceId, timeRange = 'day', endDate = new Date()) {
    if (!this.deviceEnergyCache.has(deviceId)) {
      return {
        value: 0,
        carbonEmission: 0,
        unit: 'kWh',
        timeRange: timeRange
      };
    }
    
    const deviceCache = this.deviceEnergyCache.get(deviceId);
    const now = new Date();
    const data = [];
    let interval, count, format;
    
    // 根据时间范围设置不同的数据点数量和时间间隔
    switch(timeRange) {
      case '1h':
        // 1小时内，每5分钟一个数据点
        interval = 5 * 60 * 1000; // 5分钟
        count = 12; // 1小时内12个数据点
        format = 'HH:mm';
        break;
      case '6h':
        // 6小时内，每30分钟一个数据点
        interval = 30 * 60 * 1000; // 30分钟
        count = 12; // 6小时内12个数据点
        format = 'HH:mm';
        break;
      case '12h':
        // 12小时内，每1小时一个数据点
        interval = 60 * 60 * 1000; // 1小时
        count = 12; // 12小时内12个数据点
        format = 'HH:mm';
        break;
      case '24h':
        // 24小时内，每2小时一个数据点
        interval = 2 * 60 * 60 * 1000; // 2小时
        count = 12; // 24小时内12个数据点
        format = 'HH:mm';
        break;
      case '7d':
        // 7天内，每天一个数据点
        interval = 24 * 60 * 60 * 1000; // 1天
        count = 7; // 7天内7个数据点
        format = 'MM-DD';
        break;
      default:
        // 默认24小时，每2小时一个数据点
        interval = 2 * 60 * 60 * 1000; // 2小时
        count = 12; // 24小时内12个数据点
        format = 'HH:mm';
    }
    
    // 确定要获取的数据类型（能耗或碳排放）
    const valueKey = dataType === 'carbon' ? 'carbonEmission' : 'value';
    const unit = dataType === 'carbon' ? 'kg' : (ENERGY_UNITS[deviceCache.energyType] || 'kWh');
    
    // 生成数据点
    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval);
      // 格式化时间
      const formattedTime = this.formatTime(time, format);
      
      // 查找对应时间段的能耗数据
      let value = 0;
      
      if (timeRange === '7d') {
        // 对于7天数据，查找对应日期的累计值
        const dateKey = time.toISOString().split('T')[0];
        if (deviceCache.daily[dateKey]) {
          value = deviceCache.daily[dateKey][valueKey];
        }
      } else {
        // 对于小时级数据，查找对应小时的累计值
        const dateKey = time.toISOString().split('T')[0];
        const hourKey = `${dateKey}T${time.getHours().toString().padStart(2, '0')}`;
        
        if (deviceCache.hourly[hourKey]) {
          value = deviceCache.hourly[hourKey][valueKey];
        }
      }
      
      data.push({
        time: formattedTime,
        value: parseFloat(value.toFixed(2)),
        timestamp: time.toISOString(),
        unit: unit
      });
    }
    
    return {
      data,
      timeRange,
      dataType,
      unit,
      deviceId
    };
  }
  
  /**
   * 格式化时间
   * @param {Date|string|number} dateInput - 日期对象、时间字符串或时间戳
   * @param {string} format - 格式化字符串
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(dateInput, format) {
    // 处理不同类型的时间输入
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = parseDate(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      console.error('formatTime: 无效的时间参数', dateInput);
      return '时间格式错误';
    }
    
    // 检查Date对象是否有效
    if (isNaN(date.getTime())) {
      console.error('formatTime: 无效的日期', dateInput);
      return '无效日期';
    }
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (format === 'MM-DD') {
      return `${month}-${day}`;
    } else if (format === 'HH:mm') {
      return `${hours}:${minutes}`;
    } else if (format === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    } else {
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
  }
  
  /**
   * 计算多设备能耗汇总
   * @param {Array} deviceIds - 设备ID数组
   * @param {string} timeRange - 时间范围
   * @returns {Object} 能耗汇总数据
   */
  calculateDevicesEnergySummary(deviceIds, timeRange = 'day') {
    let totalEnergy = 0;
    let totalCarbonEmission = 0;
    const deviceData = [];
    let unit = 'kWh'; // 默认单位
    
    // 计算各设备的能耗并汇总
    deviceIds.forEach(deviceId => {
      const energyData = this.getDeviceEnergyData(deviceId, timeRange);
      if (energyData) {
        totalEnergy += energyData.value;
        totalCarbonEmission += energyData.carbonEmission;
        unit = energyData.unit || unit;
        
        // 获取设备信息
        const device = this.getDeviceById(deviceId);
        if (device) {
          deviceData.push({
            deviceId,
            deviceName: device.name || `设备${deviceId}`,
            deviceType: device.type || 'generic',
            energyValue: energyData.value,
            carbonEmission: energyData.carbonEmission,
            unit: energyData.unit,
            percentage: 0 // 将在下面计算
          });
        }
      }
    });
    
    // 计算各设备占比
    if (totalEnergy > 0) {
      deviceData.forEach(device => {
        device.percentage = parseFloat(((device.energyValue / totalEnergy) * 100).toFixed(1));
      });
    }
    
    // 按能耗降序排序
    deviceData.sort((a, b) => b.energyValue - a.energyValue);
    
    return {
      totalEnergy: parseFloat(totalEnergy.toFixed(3)),
      totalCarbonEmission: parseFloat(totalCarbonEmission.toFixed(3)),
      unit,
      timeRange,
      deviceCount: deviceData.length,
      deviceData
    };
  }
  
  /**
   * 生成多设备能耗时间序列数据
   * @param {Array} deviceIds - 设备ID数组
   * @param {string} timeRange - 时间范围：1h, 6h, 12h, 24h, 7d
   * @param {string} dataType - 数据类型：energy 或 carbon
   * @returns {Object} 时间序列数据
   */
  generateDevicesEnergyTimeSeries(deviceIds, timeRange = '24h', dataType = 'energy') {
    const now = new Date();
    let interval, count, format;
    
    // 根据时间范围设置不同的数据点数量和时间间隔
    switch(timeRange) {
      case '1h':
        interval = 5 * 60 * 1000; // 5分钟
        count = 12; // 1小时内12个数据点
        format = 'HH:mm';
        break;
      case '6h':
        interval = 30 * 60 * 1000; // 30分钟
        count = 12; // 6小时内12个数据点
        format = 'HH:mm';
        break;
      case '12h':
        interval = 60 * 60 * 1000; // 1小时
        count = 12; // 12小时内12个数据点
        format = 'HH:mm';
        break;
      case '24h':
        interval = 2 * 60 * 60 * 1000; // 2小时
        count = 12; // 24小时内12个数据点
        format = 'HH:mm';
        break;
      case '7d':
        interval = 24 * 60 * 60 * 1000; // 1天
        count = 7; // 7天内7个数据点
        format = 'MM-DD';
        break;
      default:
        interval = 2 * 60 * 60 * 1000; // 2小时
        count = 12; // 24小时内12个数据点
        format = 'HH:mm';
    }
    
    // 确定要获取的数据类型（能耗或碳排放）
    const valueKey = dataType === 'carbon' ? 'carbonEmission' : 'value';
    const unit = dataType === 'carbon' ? 'kg' : 'kWh';
    
    // 初始化结果数组
    const result = [];
    
    // 生成时间点
    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval);
      const formattedTime = this.formatTime(time, format);
      
      // 计算该时间点的总能耗或碳排放
      let totalValue = 0;
      const deviceValues = {};
      
      deviceIds.forEach(deviceId => {
        if (this.deviceEnergyCache.has(deviceId)) {
          const deviceCache = this.deviceEnergyCache.get(deviceId);
          let deviceValue = 0;
          
          if (timeRange === '7d') {
            // 对于7天数据，查找对应日期的累计值
            const dateKey = time.toISOString().split('T')[0];
            if (deviceCache.daily[dateKey]) {
              deviceValue = deviceCache.daily[dateKey][valueKey];
            }
          } else {
            // 对于小时级数据，查找对应小时的累计值
            const dateKey = time.toISOString().split('T')[0];
            const hourKey = `${dateKey}T${time.getHours().toString().padStart(2, '0')}`;
            
            if (deviceCache.hourly[hourKey]) {
              deviceValue = deviceCache.hourly[hourKey][valueKey];
            }
          }
          
          totalValue += deviceValue;
          
          // 存储每个设备的值，用于后续分析
          const device = this.getDeviceById(deviceId);
          if (device) {
            deviceValues[deviceId] = {
              value: parseFloat(deviceValue.toFixed(2)),
              deviceName: device.name || `设备${deviceId}`,
              deviceType: device.type || 'generic'
            };
          }
        }
      });
      
      result.push({
        time: formattedTime,
        timestamp: time.toISOString(),
        value: parseFloat(totalValue.toFixed(2)),
        deviceValues // 包含每个设备的贡献值
      });
    }
    
    return {
      data: result,
      timeRange,
      dataType,
      unit,
      deviceCount: deviceIds.length
    };
  }
  
  /**
   * 获取能源类型分布
   * @param {Array} deviceIds - 设备ID数组
   * @param {string} timeRange - 时间范围
   * @returns {Object} 能源类型分布数据，包含各能源类型的能耗值、碳排放量和百分比
   */
  getEnergyTypeDistribution(deviceIds, timeRange = 'day') {
    const distribution = {};
    let total = 0;
    let totalCarbon = 0;
    
    // 初始化各能源类型的值
    Object.keys(ENERGY_TYPES).forEach(key => {
      const energyType = ENERGY_TYPES[key];
      distribution[energyType] = {
        value: 0,
        carbonEmission: 0,
        percentage: 0,
        unit: ENERGY_UNITS[energyType] || 'kWh',
        displayName: ENERGY_TYPE_NAMES[energyType] || energyType
      };
    });
    
    // 计算各设备的能耗并按能源类型汇总
    deviceIds.forEach(deviceId => {
      if (this.deviceEnergyCache.has(deviceId)) {
        const energyData = this.getDeviceEnergyData(deviceId, timeRange);
        const device = this.getDeviceById(deviceId);
        
        if (energyData && device) {
          const energyType = device.category || ENERGY_TYPES.ELECTRICITY;
          distribution[energyType].value += energyData.value;
          distribution[energyType].carbonEmission += energyData.carbonEmission;
          total += energyData.value;
          totalCarbon += energyData.carbonEmission;
        }
      }
    });
    
    // 计算百分比
    if (total > 0) {
      Object.keys(distribution).forEach(type => {
        distribution[type].percentage = parseFloat(((distribution[type].value / total) * 100).toFixed(1));
        distribution[type].value = parseFloat(distribution[type].value.toFixed(3));
        distribution[type].carbonEmission = parseFloat(distribution[type].carbonEmission.toFixed(3));
      });
    }
    
    // 过滤掉值为0的能源类型
    const result = {};
    Object.keys(distribution).forEach(type => {
      if (distribution[type].value > 0) {
        result[type] = distribution[type];
      }
    });
    
    return {
      distribution: result,
      total: parseFloat(total.toFixed(3)),
      totalCarbonEmission: parseFloat(totalCarbon.toFixed(3)),
      timeRange
    };
  }
  
  /**
   * 获取设备对象
   * @param {string} deviceId - 设备ID
   * @returns {Object} 设备对象
   */
  getDeviceById(deviceId) {
    // 此方法需要在使用此类的地方实现
    // 返回设备对象
    return null;
  }
  
  /**
   * 数据同步与观察者模式实现
   */
  
  // 观察者列表
  #observers = [];
  
  /**
   * 注册观察者
   * @param {Function} callback - 回调函数，当设备数据更新时调用
   * @returns {number} 观察者ID，用于后续移除
   */
  registerObserver(callback) {
    if (typeof callback !== 'function') {
      console.error('注册观察者失败：回调必须是函数');
      return -1;
    }
    
    const observerId = this.#observers.length;
    this.#observers.push({
      id: observerId,
      callback
    });
    
    return observerId;
  }
  
  /**
   * 移除观察者
   * @param {number} observerId - 观察者ID
   * @returns {boolean} 是否成功移除
   */
  removeObserver(observerId) {
    const index = this.#observers.findIndex(observer => observer.id === observerId);
    if (index !== -1) {
      this.#observers.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * 通知所有观察者
   * @param {Object} data - 更新的数据
   */
  notifyObservers(data) {
    this.#observers.forEach(observer => {
      try {
        observer.callback(data);
      } catch (error) {
        console.error('通知观察者失败:', error);
      }
    });
  }
  
  /**
   * 更新设备状态并计算能耗
   * @param {string} deviceId - 设备ID
   * @param {Object} deviceData - 设备数据
   * @returns {Object} 更新后的能耗数据
   */
  updateDeviceStatus(deviceId, deviceData) {
    // 计算设备能耗
    const energyData = this.calculateDeviceEnergy(deviceData);
    
    // 累计设备能耗
    this.accumulateDeviceEnergy(deviceId, energyData);
    
    // 通知观察者
    this.notifyObservers({
      type: 'device_update',
      deviceId,
      deviceData,
      energyData
    });
    
    return energyData;
  }
  
  /**
   * 批量更新设备状态
   * @param {Array} devices - 设备数组
   * @returns {Object} 更新结果
   */
  updateDevicesStatus(devices) {
    const results = {};
    
    devices.forEach(device => {
      if (device.id) {
        results[device.id] = this.updateDeviceStatus(device.id, device);
      }
    });
    
    // 通知观察者批量更新完成
    this.notifyObservers({
      type: 'devices_batch_update',
      devices,
      results
    });
    
    return results;
  }
  
  /**
   * 清除设备能耗缓存
   * @param {string} deviceId - 设备ID，如果不提供则清除所有设备的缓存
   */
  clearDeviceEnergyCache(deviceId) {
    if (deviceId) {
      this.deviceEnergyCache.delete(deviceId);
    } else {
      this.deviceEnergyCache.clear();
    }
    
    // 通知观察者缓存已清除
    this.notifyObservers({
      type: 'cache_cleared',
      deviceId
    });
  }
}

/**
 * 场景模式数据模型类
 * 提供场景模式的数据结构和计算方法
 */
class SceneModeModel {
  constructor() {
    this.scenes = [];
    this.activeSceneId = null;
  }
  
  /**
   * 获取场景对设备的影响
   * @param {string} sceneId 场景ID
   * @returns {Object|null} 场景影响信息
   */
  getSceneDeviceImpact(sceneId) {
    const scene = this.scenes.find(s => s.id === sceneId);
    if (!scene) return null;
    
    return {
      affectedDevices: scene.deviceSettings.length,
      estimatedEnergyChange: this.calculateEnergyImpact(scene),
      executionTime: scene.executionTime || 30 // 秒
    };
  }
  
  /**
   * 计算场景切换对能耗的影响
   * @param {Object} scene 场景对象
   * @returns {number} 能耗变化（kW）
   */
  calculateEnergyImpact(scene) {
    return scene.deviceSettings.reduce((total, setting) => {
      const devicePower = this.getDevicePower(setting.deviceId);
      const powerChange = setting.isOn ? devicePower : -devicePower;
      return total + powerChange;
    }, 0);
  }
  
  /**
   * 获取设备功率（用于能耗计算）
   * @param {string} deviceId 设备ID
   * @returns {number} 设备功率（kW）
   */
  getDevicePower(deviceId) {
    // 这里应该从设备数据中获取实际功率
    // 暂时返回默认值，实际应用中需要从设备配置或实时数据中获取
    return 1.0; // 默认1kW
  }
}

/**
 * 自动化规则数据模型类
 * 提供自动化规则的数据结构和计算方法
 */
class AutomationRuleModel {
  constructor() {
    this.rules = [];
    this.executionHistory = [];
  }
  
  /**
   * 评估规则触发条件
   * @param {string} ruleId 规则ID
   * @param {Object} currentData 当前数据
   * @returns {boolean} 是否触发
   */
  evaluateRuleTrigger(ruleId, currentData) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule || !rule.enabled) return false;
    
    switch (rule.trigger.type) {
      case 'time':
        return this.evaluateTimeTrigger(rule.trigger, currentData.currentTime);
      case 'energy':
        return this.evaluateEnergyTrigger(rule.trigger, currentData.energyData);
      case 'device':
        return this.evaluateDeviceTrigger(rule.trigger, currentData.deviceStates);
      default:
        return false;
    }
  }
  
  /**
   * 评估时间触发条件
   * @param {Object} trigger 触发器配置
   * @param {Date} currentTime 当前时间
   * @returns {boolean} 是否触发
   */
  evaluateTimeTrigger(trigger, currentTime) {
    const now = currentTime || new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (trigger.time) {
      const [triggerHour, triggerMinute] = trigger.time.split(':').map(Number);
      return hour === triggerHour && minute === triggerMinute;
    }
    
    return false;
  }
  
  /**
   * 评估能耗触发条件
   * @param {Object} trigger 触发器配置
   * @param {Object} energyData 能耗数据
   * @returns {boolean} 是否触发
   */
  evaluateEnergyTrigger(trigger, energyData) {
    if (!energyData || !trigger.threshold) return false;
    
    const currentValue = energyData[trigger.metric] || 0;
    
    switch (trigger.operator) {
      case 'gt': return currentValue > trigger.threshold;
      case 'lt': return currentValue < trigger.threshold;
      case 'eq': return currentValue === trigger.threshold;
      case 'gte': return currentValue >= trigger.threshold;
      case 'lte': return currentValue <= trigger.threshold;
      default: return false;
    }
  }
  
  /**
   * 评估设备触发条件
   * @param {Object} trigger 触发器配置
   * @param {Object} deviceStates 设备状态
   * @returns {boolean} 是否触发
   */
  evaluateDeviceTrigger(trigger, deviceStates) {
    if (!deviceStates || !trigger.deviceId) return false;
    
    const deviceState = deviceStates[trigger.deviceId];
    if (!deviceState) return false;
    
    return deviceState[trigger.property] === trigger.value;
  }
  
  /**
   * 计算规则执行的能耗影响
   * @param {string} ruleId 规则ID
   * @returns {number} 能耗影响（kW）
   */
  calculateRuleEnergyImpact(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return 0;
    
    return rule.actions.reduce((total, action) => {
      if (action.type === 'device_control') {
        const devicePower = this.getDevicePower(action.deviceId);
        const powerChange = action.value ? devicePower : -devicePower;
        return total + powerChange;
      }
      return total;
    }, 0);
  }
  
  /**
   * 获取设备功率（用于能耗计算）
   * @param {string} deviceId 设备ID
   * @returns {number} 设备功率（kW）
   */
  getDevicePower(deviceId) {
    // 这里应该从设备数据中获取实际功率
    // 暂时返回默认值，实际应用中需要从设备配置或实时数据中获取
    return 1.0; // 默认1kW
  }
}

// 导出能源数据模型类
module.exports = {
  EnergyDataModel,
  SceneModeModel,
  AutomationRuleModel
};