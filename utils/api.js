/**
 * 智慧能源管理小程序 - 优化版API工具
 * 支持真实API和模拟数据切换，专为生产环境优化
 * 版本: 2.0.0 - API优化版本
 * 更新内容: 统一数据获取接口、实时数据更新机制、数据缓存优化
 */

// 引入配置和工具
const { API_CONFIG } = require('./config.js');
const { showToast, getStorage, setStorage } = require('./utils-commonjs.js');

// 引入模拟数据工具
const EnergyMockAPI = require('./api-mock.js');
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
    enableLog: false
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
 * @param {Function} apiFunction 模拟API函数
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
   * @param {string} timeRange 时间范围：1h, 6h, 12h, 24h, 7d
   */
  getMonitorDetail(deviceId, timeRange = '24h') {
    return apiRequest(`/monitor/${deviceId}`, {
      method: 'GET',
      data: { timeRange }
    }, mockAPI.getMonitorDetail, deviceId, timeRange);
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

  // ==================== 智能分析相关 ====================

  /**
   * 获取智能分析概览
   */
  getIntelligentAnalysisOverview() {
    return apiRequest('/analysis/overview', {
      method: 'GET'
    }, mockAPI.getIntelligentAnalysisOverview);
  },

  /**
   * 获取设备智能分析详情
   * @param {string} deviceId 设备ID
   */
  getDeviceIntelligentAnalysis(deviceId) {
    return apiRequest(`/analysis/device/${deviceId}`, {
      method: 'GET'
    }, mockAPI.getDeviceIntelligentAnalysis, deviceId);
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
   * 获取告警详情
   * @param {string} alertId 告警ID
   */
  getAlertDetail(alertId) {
    return apiRequest(`/alert/${alertId}`, {
      method: 'GET'
    }, mockAPI.getAlertDetail, alertId);
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

  /**
   * 执行自动化规则
   * @param {string} ruleId 规则ID
   */
  executeAutomationRule(ruleId) {
    return apiRequest(`/automation/rules/${ruleId}/execute`, {
      method: 'POST'
    }, mockAPI.executeAutomationRule, ruleId);
  },

  /**
   * 获取规则执行历史
   * @param {string} ruleId 规则ID
   * @param {string} timeRange 时间范围，默认7天
   */
  getRuleExecutionHistory(ruleId, timeRange = '7d') {
    return apiRequest(`/automation/rules/${ruleId}/history`, {
      method: 'GET',
      data: { timeRange }
    }, mockAPI.getRuleExecutionHistory, ruleId, timeRange);
  },

  /**
   * 测试规则执行
   * @param {string} ruleId 规则ID
   */
  testAutomationRule(ruleId) {
    return apiRequest(`/automation/rules/${ruleId}/test`, {
      method: 'POST'
    }, mockAPI.testAutomationRule, ruleId);
  },

  /**
   * 获取规则性能统计
   * @param {string} ruleId 规则ID
   */
  getRulePerformanceStats(ruleId) {
    return apiRequest(`/automation/rules/${ruleId}/stats`, {
      method: 'GET'
    }, mockAPI.getRulePerformanceStats, ruleId);
  },

  /**
   * 批量启用/禁用规则
   * @param {Array} ruleIds 规则ID列表
   * @param {boolean} enabled 是否启用
   */
  batchUpdateRuleStatus(ruleIds, enabled) {
    return apiRequest('/automation/rules/batch', {
      method: 'PUT',
      data: { ruleIds, enabled }
    }, mockAPI.batchUpdateRuleStatus, ruleIds, enabled);
  },

  /**
   * 获取规则冲突检测
   * @param {string} ruleId 规则ID
   */
  detectRuleConflicts(ruleId) {
    return apiRequest(`/automation/rules/${ruleId}/conflicts`, {
      method: 'GET'
    }, mockAPI.detectRuleConflicts, ruleId);
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

  /**
   * 获取场景执行历史
   * @param {string} sceneId 场景ID
   * @param {string} timeRange 时间范围，默认7天
   */
  getSceneExecutionHistory(sceneId, timeRange = '7d') {
    return apiRequest(`/scene/modes/${sceneId}/history`, {
      method: 'GET',
      data: { timeRange }
    }, mockAPI.getSceneExecutionHistory, sceneId, timeRange);
  },

  /**
   * 创建自定义场景
   * @param {Object} sceneData 场景数据
   */
  createSceneMode(sceneData) {
    return apiRequest('/scene/modes', {
      method: 'POST',
      data: sceneData
    }, mockAPI.createSceneMode, sceneData);
  },

  /**
   * 更新场景配置
   * @param {string} sceneId 场景ID
   * @param {Object} updateData 更新数据
   */
  updateSceneMode(sceneId, updateData) {
    return apiRequest(`/scene/modes/${sceneId}`, {
      method: 'PUT',
      data: updateData
    }, mockAPI.updateSceneMode, sceneId, updateData);
  },

  /**
   * 获取场景对能耗的影响分析
   * @param {string} sceneId 场景ID
   */
  getSceneEnergyImpact(sceneId) {
    return apiRequest(`/scene/modes/${sceneId}/impact`, {
      method: 'GET'
    }, mockAPI.getSceneEnergyImpact, sceneId);
  },

  /**
   * 批量获取设备状态（用于场景切换时同步更新）
   * @param {Array} deviceIds 设备ID列表
   */
  getDevicesByIds(deviceIds) {
    return apiRequest('/devices/batch', {
      method: 'POST',
      data: { deviceIds }
    }, mockAPI.getDevicesByIds, deviceIds);
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
   * 获取设备能耗数据
   * @param {string} deviceId 设备ID
   * @param {string} timeRange 时间范围：1h, 24h, 7d
   * @returns {Promise} 设备能耗数据
   */
  getDeviceEnergyData(deviceId, timeRange = '24h') {
    return apiRequest(`/device/${deviceId}/energy`, {
      method: 'GET',
      data: { timeRange }
    }, function mockGetDeviceEnergyData(deviceId, timeRange) {
      // 使用模拟数据
      const data = [];
      const now = new Date();
      let interval, count, format;

      // 根据时间范围设置不同的数据点数量和时间间隔
      switch (timeRange) {
        case '1h':
          // 1小时内，每5分钟一个数据点
          interval = 5 * 60 * 1000; // 5分钟
          count = 12; // 1小时内12个数据点
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

      // 生成数据点
      for (let i = count - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * interval);
        // 格式化时间
        const formattedTime = function (date, format) {
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');

          if (format === 'MM-DD') {
            return `${month}-${day}`;
          } else if (format === 'HH:mm') {
            return `${hours}:${minutes}`;
          } else {
            return `${year}-${month}-${day} ${hours}:${minutes}`;
          }
        }(time, format);

        // 生成能耗数据，根据设备ID和时间生成确定性数据
        // 使用设备ID的最后一位数字作为基础值
        const baseValue = parseInt(deviceId.slice(-1), 10) * 10 || 50;

        // 根据时间范围调整数据波动范围
        let value;

        if (timeRange === '7d') {
          // 周末和工作日的能耗模式不同
          const dayOfWeek = time.getDay(); // 0是周日，6是周六
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          value = isWeekend ? baseValue * 0.7 : baseValue * 1.2;
        } else {
          // 工作时间和非工作时间的能耗模式不同
          const hour = time.getHours();
          const isWorkHour = hour >= 8 && hour <= 18;

          value = isWorkHour ? baseValue * 1.3 : baseValue * 0.8;
        }

        // 使用确定性函数生成数据，减少随机性
        const hourFactor = time.getHours() % 12 / 12; // 0-1之间的小数，表示一天中的时间周期
        const dayFactor = time.getDay() / 7; // 0-1之间的小数，表示一周中的时间周期

        // 添加一些波动
        value += Math.sin(hourFactor * Math.PI * 2) * 10 + Math.sin(dayFactor * Math.PI * 2) * 5;

        data.push({
          time: formattedTime,
          value: parseFloat(value.toFixed(1)),
          unit: 'kWh'
        });
      }

      // 计算总能耗和碳排放
      const totalEnergy = data.reduce((sum, item) => sum + item.value, 0);
      const carbonEmission = totalEnergy * 0.785; // 假设每kWh电力产生0.785kg碳排放

      // 计算能效等级 (A-E)
      const efficiencyGrades = ['A+', 'A', 'B', 'C', 'D', 'E'];
      const deviceIdSum = deviceId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const efficiencyIndex = deviceIdSum % efficiencyGrades.length;
      const energyEfficiency = efficiencyGrades[efficiencyIndex];

      return {
        success: true,
        data: {
          deviceId,
          timeRange,
          data,
          totalEnergy: parseFloat(totalEnergy.toFixed(2)),
          carbonEmission: parseFloat(carbonEmission.toFixed(2)),
          efficiencyLevel: energyEfficiency,
          unit: 'kWh',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          trendValue: (Math.random() * 10).toFixed(1)
        }
      };
    }, deviceId, timeRange);
  },

  /**
   * 获取设备实时数据（普通API请求替代WebSocket）
   * @param {string|Array} deviceIds 设备ID或设备ID数组
   * @param {string} energyType 能源类型：power(电)、water(水)、gas(气)、carbon(碳)
   * @param {string} timeRange 时间范围：1h, 6h, 12h, 24h, 7d
   */
  getDeviceRealTimeData(deviceIds, energyType, timeRange = '24h') {
    const ids = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
    return apiRequest('/device/realtime', {
      method: 'GET',
      data: { deviceIds: ids, energyType: energyType, timeRange: timeRange }
    }, mockAPI.getDeviceRealTimeData, ids, energyType, timeRange);
  },

  /**
   * 创建模拟WebSocket连接（避免域名限制问题）
   * @param {Array} deviceIds 设备ID列表
   * @param {Function} callback 数据回调函数
   * @param {string} energyType 能源类型：power(电)、water(水)、gas(气)、carbon(碳)
   * @returns {Object} 模拟的socketTask对象
   */
  createLocalWebSocketMock(deviceIds, callback, energyType) {
    // 创建一个模拟的socketTask对象
    const mockSocketTask = {
      // 模拟连接状态
      isOpen: false,
      // 模拟定时器ID
      intervalId: null,
      // 模拟关闭方法
      close: function () {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
          this.isOpen = false;
          console.log('模拟WebSocket连接已关闭');
        }
      },
      // 模拟发送方法（仅记录日志）
      send: function (data) {
        console.log('模拟WebSocket发送数据:', data);
      }
    };

    // 模拟连接打开事件
    setTimeout(() => {
      mockSocketTask.isOpen = true;
      console.log('模拟WebSocket连接已打开');

      // 模拟定期发送数据
      mockSocketTask.intervalId = setInterval(() => {
        // 判断是否为分类汇总模式（deviceIds为空数组且长度为0）
        const isCategoryMode = Array.isArray(deviceIds) && deviceIds.length === 0;

        // 使用模拟API获取实时数据
        let mockData;
        if (isCategoryMode) {
          // 分类汇总模式，获取指定能源类型的数据
          mockData = mockAPI.getDeviceRealTimeData([], energyType, '24h');
          if (mockData.success && mockData.data.categoryOverview) {
            // 调用回调函数，传递分类汇总数据
            if (callback && typeof callback === 'function') {
              callback(mockData.data.categoryOverview);
            }
          }
        } else {
          // 设备详情模式，获取指定设备的数据
          mockData = mockAPI.getDeviceRealTimeData(deviceIds, null, '24h');
          if (mockData.success) {
            // 调用回调函数，传递设备数据
            if (callback && typeof callback === 'function') {
              callback(mockData.data);
            }
          }
        }
      }, 5000); // 每5秒发送一次数据
    }, 500); // 模拟连接延迟

    return mockSocketTask;
  },



  /**
   * 取消订阅实时数据
   * @param {Object} socketTask WebSocket任务对象或模拟WebSocket对象
   */
  unsubscribeRealTimeData(socketTask) {
    if (socketTask) {
      // 检查是否是模拟WebSocket对象（有close方法）
      if (typeof socketTask.close === 'function') {
        socketTask.close();
      }
      // 如果是定时器ID（兼容旧代码），则清除定时器
      else if (typeof socketTask === 'number') {
        clearInterval(socketTask);
      }
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

// Note: API method implementations are defined later in the file
// Module exports moved to the end of the file after all methods are defined

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

// ==================== API优化扩展 ====================



// First implementation removed - using the more complete implementation below

/**
 * 取消实时数据订阅
 * @param {Object} socketTask - WebSocket任务对象
 */
API.unsubscribeRealTimeData = (socketTask) => {
  if (socketTask) {
    // 发送取消订阅消息
    if (socketTask.send && typeof socketTask.send === 'function') {
      socketTask.send({
        data: JSON.stringify({
          type: 'unsubscribe'
        })
      });
    }

    // 关闭连接
    if (socketTask.close && typeof socketTask.close === 'function') {
      socketTask.close();
    }
  }
};



// ==================== API接口优化 ====================

/**
 * 统一数据获取接口
 * 支持多种数据类型的统一获取，简化页面调用逻辑
 * @param {string} dataType 数据类型：device, energy, alert, report, user
 * @param {Object} params 查询参数
 * @returns {Promise} 返回Promise对象
 */
API.getData = (dataType, params = {}) => {
  switch (dataType) {
    case 'device':
      return API.getDeviceList(params);
    case 'energy':
      return API.getHistoryEnergyData(params);
    case 'alert':
      return API.getAlertList(params);
    case 'report':
      return API.getReportList(params);
    case 'user':
      return API.getUserList(params);
    case 'home':
      return API.getHomeOverview(params);
    case 'monitor':
      // 如果未指定deviceId，则获取所有设备的实时数据聚合（用于首页概览）
      if (!params.deviceId) {
        // 获取所有设备的ID列表 - 修复异步调用问题
        return API.getDeviceList({ pageSize: 100 }).then(deviceListResult => {
          const deviceList = deviceListResult.data?.list || [];
          const deviceIds = deviceList.map(device => device.id);
          // 传递所有设备ID作为deviceIds，energyType设为null以获取所有类型的数据
          // 这样可以确保水、气、碳排放等数据也能正常显示
          return API.getDeviceRealTimeData(deviceIds, null, params.timeRange || '1h');
        });
      }
      // 如果指定了deviceId，则获取单个设备的监控详情（用于设备详情页）
      return API.getMonitorDetail(params.deviceId, params.timeRange);
    case 'groups':
      return API.getDeviceGroups(params);
    case 'automation':
      return API.getAutomationRules(params);
    case 'scene':
      return API.getSceneModes(params);
    // 场景模式扩展数据类型
    case 'scene_history':
      return API.getSceneExecutionHistory(params.sceneId, params.timeRange);
    case 'scene_impact':
      return API.getSceneEnergyImpact(params.sceneId);
    case 'devices_batch':
      return API.getDevicesByIds(params.deviceIds);
    // 自动化规则扩展数据类型
    case 'rule_history':
      return API.getRuleExecutionHistory(params.ruleId, params.timeRange);
    case 'rule_performance':
      return API.getRulePerformanceStats(params.ruleId);
    case 'rule_conflicts':
      return API.detectRuleConflicts();
    case 'rule_test':
      return API.testAutomationRule(params.ruleData);
    default:
      return Promise.reject(new Error(`未知的数据类型: ${dataType}`));
  }
};

/**
 * 实时数据更新机制
 * 基于WebSocket实现设备状态和能耗数据的实时推送
 * @param {Object} options 订阅选项
 * @param {Array} options.deviceIds 设备ID列表
 * @param {Function} options.onMessage 消息回调函数
 * @param {Function} options.onConnect 连接成功回调
 * @param {Function} options.onDisconnect 连接断开回调
 * @param {Function} options.onError 错误回调
 * @returns {Object} WebSocket任务对象
 */
API.subscribeRealTimeData = (options) => {
  const { deviceIds, onMessage, onConnect, onDisconnect, onError } = options;

  // 检查是否使用模拟数据
  const useMock = currentConfig.enableMock || API_CONFIG.mockMode;

  if (useMock) {
    // 模拟WebSocket连接
    return API.mockWebSocket(options);
  }

  // 构建WebSocket URL
  const wsUrl = currentConfig.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
  const token = getStorage('access_token');
  const fullUrl = `${wsUrl}?token=${token}`;

  // 创建WebSocket连接
  const socketTask = wx.connectSocket({
    url: fullUrl,
    success: () => {
      if (currentConfig.enableLog) {
        console.log('WebSocket连接成功');
      }
    },
    fail: (error) => {
      if (currentConfig.enableLog) {
        console.error('WebSocket连接失败:', error);
      }
      if (onError) onError(error);
    }
  });

  // 监听连接打开
  socketTask.onOpen(() => {
    if (currentConfig.enableLog) {
      console.log('WebSocket连接已打开');
    }

    // 发送订阅消息
    socketTask.send({
      data: JSON.stringify({
        type: 'subscribe',
        deviceIds: deviceIds || [],
        timestamp: Date.now()
      })
    });

    if (onConnect) onConnect();
  });

  // 监听消息
  socketTask.onMessage((message) => {
    try {
      const data = JSON.parse(message.data);
      if (currentConfig.enableLog) {
        console.log('WebSocket收到消息:', data);
      }
      if (onMessage) onMessage(data);
    } catch (error) {
      if (currentConfig.enableLog) {
        console.error('WebSocket消息解析失败:', error);
      }
      if (onError) onError(error);
    }
  });

  // 监听关闭
  socketTask.onClose((closeEvent) => {
    if (currentConfig.enableLog) {
      console.log('WebSocket连接已关闭:', closeEvent);
    }
    if (onDisconnect) onDisconnect(closeEvent);
  });

  // 监听错误
  socketTask.onError((error) => {
    if (currentConfig.enableLog) {
      console.error('WebSocket错误:', error);
    }
    if (onError) onError(error);
  });

  return socketTask;
};

/**
 * 模拟WebSocket连接（用于开发和测试）
 * @param {Object} options 订阅选项
 * @returns {Object} 模拟的WebSocket任务对象
 */
API.mockWebSocket = (options) => {
  const { deviceIds, onMessage, onConnect, onDisconnect } = options;

  // 模拟连接延时
  setTimeout(() => {
    if (onConnect) onConnect();

    // 模拟定期推送数据
    const interval = setInterval(() => {
      if (deviceIds && deviceIds.length > 0) {
        // 调用mockAPI获取完整的设备实时数据（包含水气数据）
        const realTimeResponse = mockAPI.getDeviceRealTimeData(deviceIds);

        if (realTimeResponse.success && realTimeResponse.data) {
          realTimeResponse.data.forEach(deviceData => {
            const mockData = {
              type: 'device_update',
              deviceId: deviceData.deviceId,
              timestamp: Date.now(),
              data: {
                status: deviceData.status, // 包含设备状态
                ...deviceData.realTimeParams // 使用完整的实时参数，包含水气数据
              }
            };

            if (onMessage) onMessage(mockData);
          });
        }
      }
    }, 3000); // 每3秒推送一次

    // 返回模拟的socket对象
    return {
      send: (data) => {
        if (currentConfig.enableLog) {
          console.log('Mock WebSocket发送:', data);
        }
      },
      close: () => {
        clearInterval(interval);
        if (onDisconnect) onDisconnect();
      },
      onOpen: () => { },
      onMessage: () => { },
      onClose: () => { },
      onError: () => { }
    };
  }, 500);

  // 立即返回一个基础对象
  return {
    send: () => { },
    close: () => { },
    onOpen: () => { },
    onMessage: () => { },
    onClose: () => { },
    onError: () => { }
  };
};

/**
 * 批量数据获取接口
 * 支持一次性获取多种类型的数据，减少网络请求次数
 * @param {Array} requests 请求列表，每个元素包含 {type, params}
 * @returns {Promise} 返回包含所有数据的Promise对象
 */
API.getBatchData = async (requests) => {
  try {
    const promises = requests.map(request => {
      return API.getData(request.type, request.params)
        .then(result => ({ type: request.type, success: true, data: result }))
        .catch(error => ({ type: request.type, success: false, error }));
    });

    const results = await Promise.all(promises);

    // 整理返回结果
    const batchResult = {
      success: true,
      data: {},
      errors: []
    };

    results.forEach(result => {
      if (result.success) {
        batchResult.data[result.type] = result.data;
      } else {
        batchResult.errors.push({
          type: result.type,
          error: result.error
        });
      }
    });

    // 如果有错误但也有成功的数据，仍然返回成功
    batchResult.success = Object.keys(batchResult.data).length > 0;

    return batchResult;
  } catch (error) {
    return {
      success: false,
      message: '批量数据获取失败',
      error
    };
  }
};

/**
 * 数据预加载机制
 * 根据用户行为预测，提前加载可能需要的数据
 * @param {string} currentPage 当前页面
 * @param {Object} userBehavior 用户行为数据
 */
API.preloadData = async (currentPage, userBehavior = {}) => {
  const preloadMap = {
    'index': ['device', 'energy', 'alert'],
    'devices': ['device', 'groups'],
    'data': ['energy', 'report'],
    'monitor': ['device', 'energy'],
    'automation': ['automation', 'scene'],
    'profile': ['user']
  };

  const dataTypes = preloadMap[currentPage] || [];

  if (dataTypes.length > 0) {
    // 异步预加载，不阻塞当前操作
    setTimeout(async () => {
      try {
        const requests = dataTypes.map(type => ({ type, params: {} }));
        await API.getBatchData(requests);

        if (currentConfig.enableLog) {
          console.log(`页面 ${currentPage} 数据预加载完成`);
        }
      } catch (error) {
        if (currentConfig.enableLog) {
          console.warn('数据预加载失败:', error);
        }
      }
    }, 100);
  }
};

/**
 * 订阅场景模式和自动化规则状态变化
 * @param {Object} options 订阅选项
 * @param {Function} options.onSceneChange 场景变化回调
 * @param {Function} options.onRuleExecution 规则执行回调
 * @param {Function} options.onConnect 连接成功回调
 * @param {Function} options.onDisconnect 连接断开回调
 * @returns {Object} WebSocket任务对象
 */
API.subscribeSceneAndRuleUpdates = (options) => {
  const { onSceneChange, onRuleExecution, onConnect, onDisconnect } = options;

  return API.subscribeRealTimeData({
    topics: ['scene_changes', 'rule_executions'],
    onMessage: (data) => {
      switch (data.type) {
        case 'scene_changed':
          if (onSceneChange) onSceneChange(data.payload);
          break;
        case 'rule_executed':
          if (onRuleExecution) onRuleExecution(data.payload);
          break;
      }
    },
    onConnect,
    onDisconnect
  });
};

// ==================== 数据缓存机制优化 ====================

/**
 * 统一缓存管理器
 * 提供全局数据缓存功能，支持过期时间、缓存清理等
 */
API.cache = {
  // 缓存存储
  storage: {},

  // 默认缓存过期时间（5分钟）
  defaultExpiration: 5 * 60 * 1000,

  /**
   * 设置缓存数据
   * @param {string} key 缓存键
   * @param {any} data 缓存数据
   * @param {number} expiration 过期时间（毫秒），默认5分钟
   */
  set(key, data, expiration = this.defaultExpiration) {
    const cacheItem = {
      data: data,
      timestamp: Date.now(),
      expireTime: Date.now() + expiration
    };

    this.storage[key] = cacheItem;

    // 同时缓存到本地存储（持久化）
    try {
      wx.setStorageSync(`api_cache_${key}`, cacheItem);
    } catch (error) {
      console.warn('缓存到本地存储失败:', error);
    }

    if (currentConfig.enableLog) {
      console.log(`缓存数据已设置: ${key}`);
    }
  },

  /**
   * 获取缓存数据
   * @param {string} key 缓存键
   * @returns {any|null} 缓存数据或null
   */
  get(key) {
    // 优先从内存缓存获取
    let cacheItem = this.storage[key];

    // 如果内存缓存不存在，尝试从本地存储获取
    if (!cacheItem) {
      try {
        cacheItem = wx.getStorageSync(`api_cache_${key}`);
        if (cacheItem) {
          this.storage[key] = cacheItem; // 恢复到内存缓存
        }
      } catch (error) {
        console.warn('从本地存储获取缓存失败:', error);
      }
    }

    // 检查缓存是否过期
    if (cacheItem && cacheItem.expireTime > Date.now()) {
      if (currentConfig.enableLog) {
        console.log(`使用缓存数据: ${key}`);
      }
      return cacheItem.data;
    } else if (cacheItem) {
      // 缓存过期，清除缓存
      this.remove(key);
    }

    return null;
  },

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key 缓存键
   * @returns {boolean} 是否存在有效缓存
   */
  has(key) {
    return this.get(key) !== null;
  },

  /**
   * 移除指定缓存
   * @param {string} key 缓存键
   */
  remove(key) {
    delete this.storage[key];

    try {
      wx.removeStorageSync(`api_cache_${key}`);
    } catch (error) {
      console.warn('从本地存储移除缓存失败:', error);
    }

    if (currentConfig.enableLog) {
      console.log(`缓存已移除: ${key}`);
    }
  },

  /**
   * 清除所有缓存
   */
  clearAll() {
    // 清除内存缓存
    this.storage = {};

    // 清除本地存储中的API缓存
    try {
      const storageInfo = wx.getStorageInfoSync();
      const apiCacheKeys = storageInfo.keys.filter(key => key.startsWith('api_cache_'));
      apiCacheKeys.forEach(key => {
        wx.removeStorageSync(key);
      });
    } catch (error) {
      console.warn('清除本地存储缓存失败:', error);
    }

    if (currentConfig.enableLog) {
      console.log('所有缓存已清除');
    }
  },

  /**
   * 清除指定类型的缓存
   * @param {string} type 缓存类型（如 'device', 'energy', 'alert'）
   */
  clear(type) {
    const keysToRemove = Object.keys(this.storage).filter(key => key.startsWith(type));
    keysToRemove.forEach(key => this.remove(key));

    if (currentConfig.enableLog) {
      console.log(`${type} 类型缓存已清除`);
    }
  },

  /**
   * 获取缓存状态信息
   * @returns {Object} 缓存状态
   */
  getStatus() {
    const status = {
      totalItems: Object.keys(this.storage).length,
      items: {},
      memoryUsage: 0
    };

    Object.keys(this.storage).forEach(key => {
      const item = this.storage[key];
      const age = Date.now() - item.timestamp;
      const remaining = item.expireTime - Date.now();

      status.items[key] = {
        age: Math.round(age / 1000), // 秒
        remaining: Math.round(remaining / 1000), // 秒
        expired: remaining <= 0
      };

      // 估算内存使用（简单估算）
      try {
        status.memoryUsage += JSON.stringify(item.data).length;
      } catch (error) {
        // 忽略序列化错误
      }
    });

    return status;
  },

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    Object.keys(this.storage).forEach(key => {
      if (this.storage[key].expireTime <= now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.remove(key));

    if (currentConfig.enableLog && expiredKeys.length > 0) {
      console.log(`清理了 ${expiredKeys.length} 个过期缓存`);
    }

    return expiredKeys.length;
  }
};

/**
 * 增强版getData方法，支持缓存机制
 * @param {string} dataType 数据类型
 * @param {Object} params 查询参数
 * @param {Object} options 选项
 * @returns {Promise} 数据结果
 */
API.getDataWithCache = async (dataType, params = {}, options = {}) => {
  const {
    useCache = true,
    cacheExpiration = API.cache.defaultExpiration,
    forceRefresh = false
  } = options;

  // 生成缓存键
  const cacheKey = `${dataType}_${JSON.stringify(params)}`;

  // 如果不强制刷新且启用缓存，先尝试获取缓存数据
  if (!forceRefresh && useCache) {
    const cachedData = API.cache.get(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }
  }

  try {
    // 从网络获取数据
    const result = await API.getData(dataType, params);

    // 如果启用缓存且请求成功，缓存结果
    if (useCache && result && result.success) {
      API.cache.set(cacheKey, result, cacheExpiration);
    }

    return result;
  } catch (error) {
    // 如果网络请求失败，尝试返回过期的缓存数据作为备用
    if (useCache) {
      const expiredCache = API.cache.storage[cacheKey];
      if (expiredCache) {
        console.warn('网络请求失败，使用过期缓存数据');
        return expiredCache.data;
      }
    }

    throw error;
  }
};

// 定期清理过期缓存（每10分钟执行一次）
setInterval(() => {
  API.cache.cleanup();
}, 10 * 60 * 1000);

// 导出API和配置 - 在所有方法定义完成后导出
module.exports = {
  ...API,

  // 确保这些方法在导出时可用
  getBatchData: API.getBatchData,
  preloadData: API.preloadData,
  getDataWithCache: API.getDataWithCache,
  subscribeRealTimeData: API.subscribeRealTimeData,
  unsubscribeRealTimeData: API.unsubscribeRealTimeData,
  getData: API.getData,
  subscribeSceneAndRuleUpdates: API.subscribeSceneAndRuleUpdates,
  mockWebSocket: API.mockWebSocket,
  cache: API.cache,

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