/**
 * 智慧能源管理小程序 - 工具函数库
 * 提供常用的辅助函数和工具方法
 */

/**
 * 格式化数字，添加千分位分隔符
 * @param {number} num 数字
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  const number = parseFloat(num);
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 格式化能耗数值
 * @param {number} value 能耗值
 * @param {string} unit 单位
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的字符串
 */
export function formatEnergyValue(value, unit = 'kWh', decimals = 2) {
  const formattedValue = formatNumber(value, decimals);
  return `${formattedValue} ${unit}`;
}

/**
 * 格式化功率数值
 * @param {number} power 功率值(W)
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的字符串
 */
export function formatPower(power, decimals = 1) {
  if (power >= 1000000) {
    return formatNumber(power / 1000000, decimals) + ' MW';
  } else if (power >= 1000) {
    return formatNumber(power / 1000, decimals) + ' kW';
  } else {
    return formatNumber(power, decimals) + ' W';
  }
}

/**
 * iOS兼容的日期解析函数
 * @param {string|Date} dateInput - 日期字符串或日期对象
 * @returns {Date} 日期对象
 */
export function parseDate(dateInput) {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  let dateStr = dateInput;
  // 兼容iOS：将"YYYY-MM-DD HH:mm"格式转换为iOS支持的格式
  if (typeof dateStr === 'string' && dateStr.includes('-') && dateStr.includes(' ') && !dateStr.includes('T')) {
    // 将"YYYY-MM-DD HH:mm"转换为"YYYY/MM/DD HH:mm:ss"
    dateStr = dateStr.replace(/-/g, '/') + ':00';
  }
  
  return new Date(dateStr);
}

/**
 * 格式化日期时间
 * @param {string|Date} date 日期
 * @param {string} format 格式 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm' | 'YYYY-MM-DD HH:mm:ss' | 'MM-DD HH:mm'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm') {
  if (!date) return '';
  
  const d = parseDate(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'MM-DD HH:mm':
      return `${month}-${day} ${hours}:${minutes}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

/**
 * 格式化相对时间
 * @param {string|Date} date 日期
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return formatDate(date, 'MM-DD HH:mm');
  }
}

/**
 * 计算百分比
 * @param {number} value 当前值
 * @param {number} total 总值
 * @param {number} decimals 小数位数
 * @returns {string} 百分比字符串
 */
export function formatPercentage(value, total, decimals = 1) {
  if (!total || total === 0) return '0%';
  const percentage = (value / total) * 100;
  return formatNumber(percentage, decimals) + '%';
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return formatNumber(bytes / Math.pow(k, i), decimals) + ' ' + sizes[i];
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间(ms)
 * @param {boolean} immediate 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间间隔(ms)
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 生成唯一ID
 * @param {string} prefix 前缀
 * @returns {string} 唯一ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 验证手机号
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
export function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱
 * @param {string} email 邮箱
 * @returns {boolean} 是否有效
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 获取设备状态颜色
 * @param {string} status 设备状态
 * @returns {string} 颜色值
 */
export function getDeviceStatusColor(status) {
  const colors = {
    online: '#52c41a',
    offline: '#d9d9d9',
    fault: '#ff4d4f',
    maintenance: '#faad14'
  };
  return colors[status] || '#d9d9d9';
}

/**
 * 获取告警级别颜色
 * @param {string} level 告警级别
 * @returns {string} 颜色值
 */
export function getAlertLevelColor(level) {
  const colors = {
    critical: '#ff4d4f',
    warning: '#faad14',
    info: '#1890ff'
  };
  return colors[level] || '#1890ff';
}

/**
 * 计算能耗增长率
 * @param {number} current 当前值
 * @param {number} previous 之前值
 * @param {number} decimals 小数位数
 * @returns {Object} 增长率信息
 */
export function calculateGrowthRate(current, previous, decimals = 2) {
  if (!previous || previous === 0) {
    return {
      rate: 0,
      isIncrease: false,
      formatted: '0%'
    };
  }
  
  const rate = ((current - previous) / previous) * 100;
  const isIncrease = rate > 0;
  const formatted = (isIncrease ? '+' : '') + formatNumber(rate, decimals) + '%';
  
  return {
    rate: Math.abs(rate),
    isIncrease,
    formatted
  };
}

/**
 * 计算碳排放量
 * @param {Object} energyConsumption 能源消耗对象，包含不同能源类型的消耗量
 * @param {number} energyConsumption.electricity 电力消耗(kWh)
 * @param {number} energyConsumption.gas 燃气消耗(立方米)
 * @param {number} energyConsumption.water 水资源消耗(吨)
 * @param {number} energyConsumption.coal 煤炭消耗(吨)
 * @param {number} energyConsumption.solar 太阳能发电量(kWh)，负值表示减少的碳排放
 * @param {number} energyConsumption.storage 储能使用量(kWh)
 * @returns {Object} 碳排放计算结果，包含总量和各能源类型的排放量
 */
export function calculateCarbonEmission(energyConsumption = {}) {
  // 标准化输入参数
  const {
    electricity = 0,
    gas = 0,
    water = 0,
    coal = 0,
    solar = 0,
    storage = 0
  } = typeof energyConsumption === 'object' ? energyConsumption : { electricity: arguments[0] || 0, gas: arguments[1] || 0, coal: arguments[2] || 0 };
  
  // 碳排放因子（kg CO2/单位）
  const factors = {
    electricity: 0.785, // kg CO2/kWh (国家电网平均值)
    gas: 2.093,         // kg CO2/立方米
    water: 0.344,       // kg CO2/吨
    coal: 2493,         // kg CO2/吨
    solar: 0,           // kg CO2/kWh (太阳能发电无直接碳排放)
    storage: 0.1        // kg CO2/kWh (考虑充放电损耗)
  };
  
  // 计算各能源类型的碳排放量
  const electricityEmission = electricity * factors.electricity;
  const gasEmission = gas * factors.gas;
  const waterEmission = water * factors.water;
  const coalEmission = coal * factors.coal;
  const solarEmission = solar * factors.solar; // 通常为负值或零，表示减少的碳排放
  const storageEmission = storage * factors.storage;
  
  // 计算总碳排放量（kg CO2）
  const totalEmission = electricityEmission + gasEmission + waterEmission + coalEmission + solarEmission + storageEmission;
  
  // 转换为吨CO2并保留3位小数
  const totalEmissionTons = parseFloat((totalEmission / 1000).toFixed(3));
  
  return {
    total: totalEmissionTons, // 总排放量（吨CO2）
    details: {
      electricity: parseFloat((electricityEmission / 1000).toFixed(3)),
      gas: parseFloat((gasEmission / 1000).toFixed(3)),
      water: parseFloat((waterEmission / 1000).toFixed(3)),
      coal: parseFloat((coalEmission / 1000).toFixed(3)),
      solar: parseFloat((solarEmission / 1000).toFixed(3)),
      storage: parseFloat((storageEmission / 1000).toFixed(3))
    },
    unit: 'tCO2e' // 二氧化碳当量，吨
  };
}

/**
 * 获取时间段标签
 * @param {string} timeRange 时间范围
 * @returns {Array} 时间标签数组
 */
export function getTimeLabels(timeRange) {
  const now = new Date();
  const labels = [];
  
  switch (timeRange) {
    case 'hour':
      // 过去24小时，每小时一个点
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        labels.push(formatDate(time, 'HH:mm'));
      }
      break;
      
    case 'day':
      // 过去7天，每天一个点
      for (let i = 6; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(formatDate(time, 'MM-DD'));
      }
      break;
      
    case 'week':
      // 过去4周，每周一个点
      for (let i = 3; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        labels.push(`第${4-i}周`);
      }
      break;
      
    case 'month':
      // 过去12个月，每月一个点
      for (let i = 11; i >= 0; i--) {
        const time = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(formatDate(time, 'YYYY-MM'));
      }
      break;
      
    default:
      labels.push('当前');
  }
  
  return labels;
}

/**
 * 存储数据到本地
 * @param {string} key 存储键
 * @param {any} data 数据
 * @param {number} expireTime 过期时间(ms)
 */
export function setStorage(key, data, expireTime = null) {
  const item = {
    data,
    timestamp: Date.now(),
    expireTime
  };
  
  try {
    wx.setStorageSync(key, JSON.stringify(item));
  } catch (error) {
    console.error('存储数据失败:', error);
  }
}

/**
 * 从本地获取数据
 * @param {string} key 存储键
 * @returns {any} 数据
 */
export function getStorage(key) {
  try {
    const itemStr = wx.getStorageSync(key);
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    
    // 检查是否过期
    if (item.expireTime && Date.now() > item.timestamp + item.expireTime) {
      wx.removeStorageSync(key);
      return null;
    }
    
    return item.data;
  } catch (error) {
    console.error('获取存储数据失败:', error);
    return null;
  }
}

/**
 * 清除本地存储
 * @param {string} key 存储键，不传则清除所有
 */
export function clearStorage(key = null) {
  try {
    if (key) {
      wx.removeStorageSync(key);
    } else {
      wx.clearStorageSync();
    }
  } catch (error) {
    console.error('清除存储失败:', error);
  }
}

/**
 * 显示Toast消息
 * @param {string} title 消息内容
 * @param {string} icon 图标类型
 * @param {number} duration 显示时长
 */
export function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration
  });
}

/**
 * 显示加载中
 * @param {string} title 加载文本
 */
export function showLoading(title = '加载中...') {
  wx.showLoading({ title });
}

/**
 * 隐藏加载中
 */
export function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示确认对话框
 * @param {string} content 内容
 * @param {string} title 标题
 * @returns {Promise<boolean>} 用户选择结果
 */
export function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 页面跳转
 * @param {string} url 页面路径
 * @param {Object} params 参数
 */
export function navigateTo(url, params = {}) {
  let fullUrl = url;
  
  // 添加参数
  if (Object.keys(params).length > 0) {
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    fullUrl += (url.includes('?') ? '&' : '?') + queryString;
  }
  
  wx.navigateTo({ url: fullUrl });
}

/**
 * 页面重定向
 * @param {string} url 页面路径
 * @param {Object} params 参数
 */
export function redirectTo(url, params = {}) {
  let fullUrl = url;
  
  // 添加参数
  if (Object.keys(params).length > 0) {
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    fullUrl += (url.includes('?') ? '&' : '?') + queryString;
  }
  
  wx.redirectTo({ url: fullUrl });
}

/**
 * 返回上一页
 * @param {number} delta 返回层数
 */
export function navigateBack(delta = 1) {
  wx.navigateBack({ delta });
}

/**
 * 获取当前页面路径
 * @returns {string} 页面路径
 */
export function getCurrentPagePath() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage ? currentPage.route : '';
}

/**
 * 获取页面参数
 * @returns {Object} 页面参数
 */
export function getPageParams() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage ? currentPage.options : {};
}

// 导入格式化运行时间函数
import { formatUptime } from './formatUptime.js';

// 导出格式化运行时间函数
export { formatUptime };

// 导出所有工具函数
export default {
  formatNumber,
  formatEnergyValue,
  formatPower,
  formatDate,
  formatRelativeTime,
  formatPercentage,
  formatFileSize,
  formatUptime,
  debounce,
  throttle,
  deepClone,
  generateId,
  validatePhone,
  validateEmail,
  getDeviceStatusColor,
  getAlertLevelColor,
  calculateGrowthRate,
  calculateCarbonEmission,
  getTimeLabels,
  setStorage,
  getStorage,
  clearStorage,
  showToast,
  showLoading,
  hideLoading,
  showConfirm,
  navigateTo,
  redirectTo,
  navigateBack,
  getCurrentPagePath,
  getPageParams
};