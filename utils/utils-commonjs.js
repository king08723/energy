/**
 * 智慧能源管理小程序 - 工具函数库 (CommonJS版本)
 * 提供常用的辅助函数和工具方法
 */

/**
 * 格式化数字，添加千分位分隔符
 * @param {number} num 数字
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num, decimals = 2) {
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
 * 存储数据到本地
 * @param {string} key 存储键
 * @param {any} data 数据
 * @param {number} expireTime 过期时间(ms)
 */
function setStorage(key, data, expireTime = null) {
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
function getStorage(key) {
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
 * 显示Toast消息
 * @param {string} title 消息内容
 * @param {string} icon 图标类型
 * @param {number} duration 显示时长
 */
function showToast(title, icon = 'none', duration = 2000) {
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
function showLoading(title = '加载中...') {
  wx.showLoading({ title });
}

/**
 * 隐藏加载中
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间(ms)
 * @param {boolean} immediate 是否立即执行
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait, immediate = false) {
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
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
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

  return obj;
}

/**
 * 生成唯一ID
 * @param {string} prefix 前缀
 * @returns {string} 唯一ID
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * iOS兼容的日期解析函数
 * @param {string|Date} dateInput - 日期字符串或日期对象
 * @returns {Date} 日期对象
 */
function parseDate(dateInput) {
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

// 导入格式化运行时间函数
const { formatUptime } = require('./formatUptime.js');

// 导出所有工具函数 - 使用CommonJS格式
module.exports = {
  formatNumber,
  setStorage,
  getStorage,
  showToast,
  showLoading,
  hideLoading,
  debounce,
  deepClone,
  generateId,
  parseDate,
  formatUptime
};
