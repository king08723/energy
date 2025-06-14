/**
 * 智慧能源管理小程序 - 优化版API工具
 * 支持真实API和模拟数据切换，专为生产环境优化
 */

// 引入配置和工具
const { API_CONFIG } = require('./config.js');
const { showToast, getStorage, setStorage } = require('./utils.js');

// 引入模拟数据工具
const EnergyMockAPI = require('../api-mock.js');
const mockAPI = new EnergyMockAPI();

/**
 * API环境配置
 */
const ENV_CONFIG = {
  // 开发环境
  development: {
    baseUrl: 'https://dev-api.energy.example.com',
    timeout: 15000,
    enableMock: true,
    enableLog: true
  },
  // 测试环境
  testing: {
    baseUrl: 'https://test-api.energy.example.com',
    timeout: 12000,
    enableMock: false,
    enableLog: true
  },
  // 生产环境
  production: {
    baseUrl: 'https://api.energy.example.com',
    timeout: 10000,
    enableMock: false,
    enableLog: false
  }
};

/**
 * 获取当前环境配置
 */
function getCurrentEnvConfig() {
  // 小程序环境下默认使用开发环境配置
  // 可以通过 API_CONFIG.environment 来切换环境
  const env = API_CONFIG.environment || 'development';
  return ENV_CONFIG[env] || ENV_CONFIG.development;
}

const currentConfig = getCurrentEnvConfig();

/**
 * 请求拦截器配置
 */
const requestInterceptors = {
  // 添加认证token
  addAuth: (config) => {
    const token = getStorage('access_token');
    if (token) {
      config.header = config.header || {};
      config.header['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  
  // 添加设备信息
  addDeviceInfo: (config) => {
    config.header = config.header || {};
    config.header['X-Device-Type'] = 'miniprogram';
    config.header['X-App-Version'] = API_CONFIG.version || '1.0.0';
    return config;
  },
  
  // 添加时间戳
  addTimestamp: (config) => {
    config.data = config.data || {};
    config.data.timestamp = Date.now();
    return config;
  }
};

/**
 * 响应拦截器配置
 */
const responseInterceptors = {
  // 处理认证失效
  handleAuthError: (response) => {
    if (response.statusCode === 401) {
      // 清除本地token
      wx.removeStorageSync('access_token');
      wx.removeStorageSync('user_info');
      
      // 跳转到登录页
      wx.redirectTo({ url: '/pages/login/login' });
      
      return Promise.reject({
        success: false,
        message: '登录已过期，请重新登录',
        code: 401
      });
    }
    return response;
  },
  
  // 统一数据格式
  normalizeData: (response) => {
    if (response.statusCode === 200) {
      const data = response.data;
      
      // 统一返回格式
      if (data && typeof data === 'object') {
        return {
          success: data.success !== false,
          data: data.data || data,
          message: data.message || 'success',
          code: data.code || 200
        };
      }
    }
    
    return {
      success: false,
      data: null,
      message: '请求失败',
      code: response.statusCode
    };
  }
};

/**
 * 模拟网络请求延时
 * @param {number} delay 延时毫秒数
 */
function simulateDelay(delay = 300) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 真实API请求
 * @param {Object} config 请求配置
 * @returns {Promise} Promise对象
 */
function realApiRequest(config) {
  return new Promise((resolve, reject) => {
    // 应用请求拦截器
    let requestConfig = { ...config };
    Object.values(requestInterceptors).forEach(interceptor => {
      requestConfig = interceptor(requestConfig);
    });
    
    // 设置默认配置
    const finalConfig = {
      url: currentConfig.baseUrl + config.url,
      method: config.method || 'GET',
      data: config.data || {},
      header: {
        'Content-Type': 'application/json',
        ...requestConfig.header
      },
      timeout: currentConfig.timeout,
      success: (response) => {
        // 应用响应拦截器
        let processedResponse = response;
        Object.values(responseInterceptors).forEach(interceptor => {
          processedResponse = interceptor(processedResponse);
        });
        
        if (currentConfig.enableLog) {
          console.log('API Response:', processedResponse);
        }
        
        resolve(processedResponse);
      },
      fail: (error) => {
        if (currentConfig.enableLog) {
          console.error('API Error:', error);
        }
        
        reject({
          success: false,
          message: error.errMsg || '网络请求失败',
          error
        });
      }
    };
    
    if (currentConfig.enableLog) {
      console.log('API Request:', finalConfig);
    }
    
    // 发起请求
    wx.request(finalConfig);
  });
}

/**
 * 模拟API请求
 * @param {Function} apiFunction API函数
 * @param {...any} args 函数参数
 * @returns {Promise} Promise对象
 */
async function mockApiRequest(apiFunction, ...args) {
  try {
    // 模拟网络延时
    await simulateDelay();
    
    // 调用API函数
    const result = apiFunction.apply(mockAPI, args);
    
    if (currentConfig.enableLog) {
      console.log('Mock API Response:', result);
    }
    
    // 返回结果
    return Promise.resolve(result);
  } catch (error) {
    if (currentConfig.enableLog) {
      console.error('Mock API Error:', error);
    }
    
    return Promise.reject({
      success: false,
      message: error.message || '请求失败',
      error
    });
  }
}

/**
 * 统一的API请求包装器
 * @param {string} url API路径
 * @param {Object} options 请求选项
 * @param {Function} mockFunction 模拟函数
 * @param {...any} mockArgs 模拟函数参数
 * @returns {Promise} Promise对象
 */
async function apiRequest(url, options = {}, mockFunction = null, ...mockArgs) {
  // 检查是否使用模拟数据
  const useMock = currentConfig.enableMock || API_CONFIG.mockMode;
  
  if (useMock && mockFunction) {
    return mockApiRequest(mockFunction, ...mockArgs);
  }
  
  // 使用真实API
  const config = {
    url,
    method: options.method || 'GET',
    data: options.data || {},
    header: options.header || {}
  };
  
  // 添加重试机制
  let retryCount = 0;
  const maxRetries = API_CONFIG.retryTimes || 3;
  
  while (retryCount <= maxRetries) {
    try {
      const result = await realApiRequest(config);
      return result;
    } catch (error) {
      retryCount++;
      
      if (retryCount > maxRetries) {
        // 最后一次重试失败，返回错误
        throw error;
      }
      
      // 等待后重试
      await simulateDelay(1000 * retryCount);
    }
  }
}

/**
 * 智慧能源管理API
 */
const API = {
  
  // ==================== 用户相关 ====================
  
  /**
   * 用户登录
   * @param {string} phone 手机号
   * @param {string} code 验证码
   */
  login(phone, code) {
    return apiRequest('/auth/login', {
      method: 'POST',
      data: { phone, code }
    }, mockAPI.login, phone, code);
  },
  
  /**
   * 获取用户信息
   * @param {string} userId 用户ID
   */
  getUserInfo(userId) {
    return apiRequest(`/user/${userId}`, {
      method: 'GET'
    }, mockAPI.getUserInfo, userId);
  },
  
  /**
   * 获取用户列表
   */
  getUserList() {
    return apiRequest('/user/list', {
      method: 'GET'
    }, mockAPI.getUserList);
  },

  /**
   * 获取用户统计数据
   * @param {string} userId 用户ID（可选）
   */
  getUserStatistics(userId) {
    return apiRequest('/user/statistics', {
      method: 'GET',
      data: userId ? { userId } : {}
    }, mockAPI.getUserStatistics, userId);
  },
  
  // ==================== 首页相关 ====================
  
  /**
   * 获取首页概览数据
   */
  getHomeOverview() {
    return apiRequest('/home/overview', {
      method: 'GET'
    }, mockAPI.getHomeOverview);
  },
  
  /**
   * 获取实时监控详情
   * @param {string} deviceId 设备ID
   */
  getMonitorDetail(deviceId) {
    return apiRequest(`/monitor/${deviceId}`, {
      method: 'GET'
    }, mockAPI.getMonitorDetail, deviceId);
  },
  
  // ==================== 设备相关 ====================
  
  /**
   * 获取设备列表
   * @param {Object} params 查询参数
   */
  getDeviceList(params = {}) {
    return apiRequest('/device/list', {
      method: 'GET',
      data: params
    }, mockAPI.getDeviceList, params);
  },
  
  /**
   * 获取设备详情
   * @param {string} deviceId 设备ID
   */
  getDeviceDetail(deviceId) {
    return apiRequest(`/device/${deviceId}`, {
      method: 'GET'
    }, mockAPI.getDeviceDetail, deviceId);
  },
  
  /**
   * 控制设备
   * @param {string} deviceId 设备ID
   * @param {Object} command 控制命令
   */
  controlDevice(deviceId, command) {
    return apiRequest(`/device/${deviceId}/control`, {
      method: 'POST',
      data: command
    }, mockAPI.controlDevice, deviceId, command);
  },
  
  /**
   * 添加设备
   * @param {Object} deviceInfo 设备信息
   */
  addDevice(deviceInfo) {
    return apiRequest('/device', {
      method: 'POST',
      data: deviceInfo
    }, mockAPI.addDevice, deviceInfo);
  },

  // ==================== 设备分组相关 ====================

  /**
   * 获取设备分组列表
   * @param {Object} params 查询参数
   */
  getDeviceGroups(params = {}) {
    return apiRequest('/device/groups', {
      method: 'GET',
      data: params
    }, mockAPI.getDeviceGroups, params);
  },

  /**
   * 创建设备分组
   * @param {Object} groupData 分组数据
   */
  createDeviceGroup(groupData) {
    return apiRequest('/device/groups', {
      method: 'POST',
      data: groupData
    }, mockAPI.createDeviceGroup, groupData);
  },

  /**
   * 更新设备分组
   * @param {string} groupId 分组ID
   * @param {Object} groupData 分组数据
   */
  updateDeviceGroup(groupId, groupData) {
    return apiRequest(`/device/groups/${groupId}`, {
      method: 'PUT',
      data: groupData
    }, mockAPI.updateDeviceGroup, groupId, groupData);
  },

  /**
   * 删除设备分组
   * @param {string} groupId 分组ID
   */
  deleteDeviceGroup(groupId) {
    return apiRequest(`/device/groups/${groupId}`, {
      method: 'DELETE'
    }, mockAPI.deleteDeviceGroup, groupId);
  },

  /**
   * 添加设备到分组
   * @param {string} groupId 分组ID
   * @param {Array} deviceIds 设备ID列表
   */
  addDevicesToGroup(groupId, deviceIds) {
    return apiRequest(`/device/groups/${groupId}/devices`, {
      method: 'POST',
      data: { deviceIds }
    }, mockAPI.addDevicesToGroup, groupId, deviceIds);
  },

  /**
   * 从分组中移除设备
   * @param {string} groupId 分组ID
   * @param {Array} deviceIds 设备ID列表
   */
  removeDevicesFromGroup(groupId, deviceIds) {
    return apiRequest(`/device/groups/${groupId}/devices`, {
      method: 'DELETE',
      data: { deviceIds }
    }, mockAPI.removeDevicesFromGroup, groupId, deviceIds);
  },

  /**
   * 分组批量控制
   * @param {string} groupId 分组ID
   * @param {Object} command 控制命令
   */
  controlDeviceGroup(groupId, command) {
    return apiRequest(`/device/groups/${groupId}/control`, {
      method: 'POST',
      data: command
    }, mockAPI.controlDeviceGroup, groupId, command);
  },
  
  // ==================== 数据分析相关 ====================
  
  /**
   * 获取历史能耗数据
   * @param {Object} params 查询参数
   */
  getHistoryEnergyData(params) {
    return apiRequest('/data/history', {
      method: 'GET',
      data: params
    }, mockAPI.getHistoryEnergyData, params);
  },
  
  /**
   * 生成能耗报告
   * @param {Object} params 报告参数
   */
  generateEnergyReport(params) {
    return apiRequest('/report/generate', {
      method: 'POST',
      data: params
    }, mockAPI.generateEnergyReport, params);
  },
  
  /**
   * 获取节能方案
   */
  getSavingPlans() {
    return apiRequest('/saving/plans', {
      method: 'GET'
    }, mockAPI.getSavingPlans);
  },
  
  // ==================== 告警相关 ====================
  
  /**
   * 获取告警列表
   * @param {Object} params 查询参数
   */
  getAlertList(params = {}) {
    return apiRequest('/alert/list', {
      method: 'GET',
      data: params
    }, mockAPI.getAlertList, params);
  },
  
  /**
   * 处理告警
   * @param {string} alertId 告警ID
   * @param {string} action 处理动作
   */
  handleAlert(alertId, action) {
    return apiRequest(`/alert/${alertId}/handle`, {
      method: 'POST',
      data: { action }
    }, mockAPI.handleAlert, alertId, action);
  },
  
  // ==================== 自动化相关 ====================
  
  /**
   * 获取自动化规则列表
   */
  getAutomationRules() {
    return apiRequest('/automation/rules', {
      method: 'GET'
    }, mockAPI.getAutomationRules);
  },
  
  /**
   * 创建自动化规则
   * @param {Object} ruleData 规则数据
   */
  createAutomationRule(ruleData) {
    return apiRequest('/automation/rules', {
      method: 'POST',
      data: ruleData
    }, mockAPI.createAutomationRule, ruleData);
  },
  
  /**
   * 更新自动化规则
   * @param {string} ruleId 规则ID
   * @param {Object} updateData 更新数据
   */
  updateAutomationRule(ruleId, updateData) {
    return apiRequest(`/automation/rules/${ruleId}`, {
      method: 'PUT',
      data: updateData
    }, mockAPI.updateAutomationRule, ruleId, updateData);
  },
  
  // ==================== 场景模式相关 ====================
  
  /**
   * 获取场景模式列表
   */
  getSceneModes() {
    return apiRequest('/scene/modes', {
      method: 'GET'
    }, mockAPI.getSceneModes);
  },
  
  /**
   * 切换场景模式
   * @param {string} sceneId 场景ID
   */
  switchSceneMode(sceneId) {
    return apiRequest(`/scene/modes/${sceneId}/switch`, {
      method: 'POST'
    }, mockAPI.switchSceneMode, sceneId);
  },
  
  // ==================== 实时数据相关 ====================
  
  /**
   * 获取实时能耗数据
   * @param {Array} deviceIds 设备ID列表
   */
  getRealTimeEnergyData(deviceIds = []) {
    return apiRequest('/realtime/energy', {
      method: 'POST',
      data: { deviceIds }
    });
  },
  
  /**
   * 订阅实时数据推送
   * @param {Array} deviceIds 设备ID列表
   * @param {Function} callback 数据回调函数
   */
  subscribeRealTimeData(deviceIds, callback) {
    // WebSocket连接实现
    const wsUrl = currentConfig.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws/realtime';
    
    const socketTask = wx.connectSocket({
      url: wsUrl,
      header: {
        'Authorization': `Bearer ${getStorage('access_token')}`
      }
    });
    
    socketTask.onOpen(() => {
      console.log('WebSocket连接已打开');
      // 发送订阅消息
      socketTask.send({
        data: JSON.stringify({
          type: 'subscribe',
          deviceIds
        })
      });
    });
    
    socketTask.onMessage((res) => {
      try {
        const data = JSON.parse(res.data);
        if (callback && typeof callback === 'function') {
          callback(data);
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    });
    
    socketTask.onError((error) => {
      console.error('WebSocket连接错误:', error);
    });
    
    socketTask.onClose(() => {
      console.log('WebSocket连接已关闭');
    });
    
    return socketTask;
  },
  
  /**
   * 取消订阅实时数据
   * @param {Object} socketTask WebSocket任务对象
   */
  unsubscribeRealTimeData(socketTask) {
    if (socketTask) {
      socketTask.close();
    }
  },
  
  // ==================== 系统配置相关 ====================
  
  /**
   * 获取系统配置
   */
  getSystemConfig() {
    return apiRequest('/system/config', {
      method: 'GET'
    });
  },
  
  /**
   * 更新系统配置
   * @param {Object} config 配置数据
   */
  updateSystemConfig(config) {
    return apiRequest('/system/config', {
      method: 'PUT',
      data: config
    });
  },
  
  /**
   * 获取API版本信息
   */
  getApiVersion() {
    return apiRequest('/system/version', {
      method: 'GET'
    });
  },
  
  /**
   * 健康检查
   */
  healthCheck() {
    return apiRequest('/system/health', {
      method: 'GET'
    });
  }
};

// 导出API和配置
module.exports = {
  ...API,
  
  // 配置管理
  config: {
    /**
     * 设置环境
     * @param {string} env 环境名称 development|testing|production
     */
    setEnvironment(env) {
      if (ENV_CONFIG[env]) {
        Object.assign(currentConfig, ENV_CONFIG[env]);
        console.log(`API环境已切换到: ${env}`);
      }
    },
    
    /**
     * 获取当前配置
     */
    getCurrentConfig() {
      return { ...currentConfig };
    },
    
    /**
     * 设置自定义配置
     * @param {Object} config 配置对象
     */
    setCustomConfig(config) {
      Object.assign(currentConfig, config);
    },
    
    /**
     * 启用/禁用模拟模式
     * @param {boolean} enable 是否启用
     */
    setMockMode(enable) {
      currentConfig.enableMock = enable;
      console.log(`模拟模式已${enable ? '启用' : '禁用'}`);
    },
    
    /**
     * 启用/禁用日志
     * @param {boolean} enable 是否启用
     */
    setLogMode(enable) {
      currentConfig.enableLog = enable;
    }
  },
  
  // 工具方法
  utils: {
    /**
     * 检查网络连接
     */
    checkNetworkStatus() {
      return new Promise((resolve) => {
        wx.getNetworkType({
          success: (res) => {
            resolve({
              isConnected: res.networkType !== 'none',
              networkType: res.networkType
            });
          },
          fail: () => {
            resolve({
              isConnected: false,
              networkType: 'unknown'
            });
          }
        });
      });
    },
    
    /**
     * 批量请求
     * @param {Array} requests 请求数组
     * @returns {Promise} Promise对象
     */
    async batchRequest(requests) {
      try {
        const results = await Promise.allSettled(requests);
        return results.map((result, index) => ({
          index,
          success: result.status === 'fulfilled',
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason : null
        }));
      } catch (error) {
        throw error;
      }
    },
    
    /**
     * 清除所有缓存
     */
    clearCache() {
      wx.removeStorageSync('access_token');
      wx.removeStorageSync('user_info');
      console.log('API缓存已清除');
    }
  }
};

/**
 * 使用示例：
 * 
 * // 基础使用
 * const API = require('../../utils/api.js');
 * 
 * Page({
 *   data: {
 *     socketTask: null
 *   },
 *   
 *   async onLoad() {
 *     try {
 *       // 检查网络状态
 *       const networkStatus = await API.utils.checkNetworkStatus();
 *       if (!networkStatus.isConnected) {
 *         wx.showToast({ title: '网络连接异常', icon: 'none' });
 *         return;
 *       }
 *       
 *       // 获取首页数据
 *       const result = await API.getHomeOverview();
 *       if (result.success) {
 *         this.setData({ overview: result.data });
 *       }
 *       
 *       // 订阅实时数据
 *       this.subscribeRealTimeData();
 *     } catch (error) {
 *       wx.showToast({ title: error.message, icon: 'none' });
 *     }
 *   },
 *   
 *   // 订阅实时数据
 *   subscribeRealTimeData() {
 *     const deviceIds = ['device1', 'device2'];
 *     const socketTask = API.subscribeRealTimeData(deviceIds, (data) => {
 *       console.log('收到实时数据:', data);
 *       // 更新页面数据
 *       this.updateRealTimeData(data);
 *     });
 *     
 *     this.setData({ socketTask });
 *   },
 *   
 *   // 更新实时数据
 *   updateRealTimeData(data) {
 *     // 处理实时数据更新逻辑
 *     if (data.type === 'energy_data') {
 *       this.setData({
 *         realTimeEnergy: data.data
 *       });
 *     }
 *   },
 *   
 *   // 设备控制
 *   async onDeviceControl(e) {
 *     const { deviceId, action, value } = e.currentTarget.dataset;
 *     try {
 *       const result = await API.controlDevice(deviceId, { action, value });
 *       if (result.success) {
 *         wx.showToast({ title: '控制成功' });
 *         this.refreshDeviceList();
 *       }
 *     } catch (error) {
 *       wx.showToast({ title: error.message, icon: 'none' });
 *     }
 *   },
 *   
 *   // 批量获取数据
 *   async loadAllData() {
 *     const requests = [
 *       API.getHomeOverview(),
 *       API.getDeviceList(),
 *       API.getAlertList()
 *     ];
 *     
 *     const results = await API.utils.batchRequest(requests);
 *     
 *     results.forEach((result, index) => {
 *       if (result.success) {
 *         switch (index) {
 *           case 0:
 *             this.setData({ overview: result.data.data });
 *             break;
 *           case 1:
 *             this.setData({ devices: result.data.data });
 *             break;
 *           case 2:
 *             this.setData({ alerts: result.data.data });
 *             break;
 *         }
 *       }
 *     });
 *   },
 *   
 *   onUnload() {
 *     // 页面卸载时取消订阅
 *     if (this.data.socketTask) {
 *       API.unsubscribeRealTimeData(this.data.socketTask);
 *     }
 *   }
 * });
 * 
 * // 环境配置示例
 * // 在app.js中设置环境
 * const API = require('./utils/api.js');
 * 
 * App({
 *   onLaunch() {
 *     // 根据编译环境设置API环境
 *     if (process.env.NODE_ENV === 'production') {
 *       API.config.setEnvironment('production');
 *     } else {
 *       API.config.setEnvironment('development');
 *       API.config.setLogMode(true);
 *     }
 *   }
 * });
 */