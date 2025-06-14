/**
 * 智慧能源管理小程序 - 模拟数据接口工具
 * 提供所有页面所需的模拟数据
 */

class EnergyMockAPI {
  constructor() {
    this.users = this.initUsers();
    this.devices = this.initDevices();
    this.deviceGroups = this.initDeviceGroups(); // 设备分组数据
    this.energyData = this.initEnergyData();
    this.alerts = this.initAlerts();
    this.automationRules = this.initAutomationRules();
    this.sceneMode = this.initSceneMode();
    this.reports = this.initReports();
    this.savingPlans = this.initSavingPlans();
  }

  // ==================== 用户管理相关 ====================
  
  /**
   * 用户登录
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @returns {Object} 登录结果
   */
  login(phone, code) {
    return {
      success: true,
      data: {
        token: 'mock_token_' + Date.now(),
        userInfo: {
          id: '001',
          phone: phone,
          nickname: '能源管理员',
          avatar: '/images/default-avatar.svg',
          role: 'admin', // admin, user, guest
          company: '智慧科技有限公司',
          department: '能源管理部'
        }
      },
      message: '登录成功'
    };
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Object} 用户信息
   */
  getUserInfo(userId) {
    const user = this.users.find(u => u.id === userId) || this.users[0];
    return {
      success: true,
      data: user
    };
  }

  /**
   * 获取用户列表（管理员功能）
   * @returns {Object} 用户列表
   */
  getUserList() {
    return {
      success: true,
      data: this.users
    };
  }

  /**
   * 获取用户统计数据
   * @param {string} userId - 用户ID（可选）
   * @returns {Object} 用户统计数据
   */
  getUserStatistics(userId) {
    return {
      success: true,
      data: {
        deviceCount: this.devices.length, // 设备总数
        alertCount: this.alerts.filter(a => a.status === 'unread').length, // 待处理告警数
        energySaving: 15.8, // 节能效果百分比
        carbonReduction: 2.35 // 减碳量（吨）
      },
      message: '获取用户统计数据成功'
    };
  }

  // ==================== 首页数据 ====================
  
  /**
   * 获取首页概览数据
   * @returns {Object} 首页数据
   */
  getHomeOverview() {
    return {
      success: true,
      data: {
        // 实时总能耗数据
        realTimeEnergy: {
          today: {
            electricity: 1250.5, // kWh
            water: 85.2, // 吨
            gas: 125.8, // 立方米
            total: 1461.5 // 综合能耗
          },
          thisMonth: {
            electricity: 28500.2,
            water: 1850.5,
            gas: 2850.6,
            total: 33201.3
          }
        },
        // 用电负荷曲线（24小时）
        loadCurve: this.generateLoadCurve(),
        // 设备告警概览
        alertSummary: {
          total: 5,
          critical: 1,
          warning: 3,
          info: 1,
          types: ['设备离线', '能耗异常', '温度过高']
        },
        // 天气信息
        weather: {
          temperature: 25,
          humidity: 65,
          condition: '晴',
          icon: 'sunny'
        },
        // 快捷控制状态
        quickControls: {
          energySavingMode: false,
          currentScene: '工作日模式'
        }
      }
    };
  }

  /**
   * 获取实时监控详情
   * @param {string} deviceId - 设备ID或区域ID
   * @returns {Object} 监控详情
   */
  getMonitorDetail(deviceId) {
    return {
      success: true,
      data: {
        deviceInfo: {
          id: deviceId,
          name: '生产车间A区',
          type: 'area',
          status: 'online'
        },
        // 分时能耗曲线
        energyCurve: this.generateEnergyTimeSeries(),
        // 实时参数
        realTimeParams: {
          power: 125.5, // kW
          voltage: 380.2, // V
          current: 195.8, // A
          frequency: 50.0, // Hz
          powerFactor: 0.95
        },
        // 环境参数
        environmentParams: {
          temperature: 28.5, // °C
          humidity: 62.3, // %
          airQuality: 'good'
        },
        // 告警列表
        alerts: this.alerts.slice(0, 3)
      }
    };
  }

  // ==================== 设备管理相关 ====================
  
  /**
   * 获取设备列表
   * @param {Object} params - 查询参数
   * @returns {Object} 设备列表
   */
  getDeviceList(params = {}) {
    let devices = [...this.devices];
    
    // 筛选逻辑
    if (params.type) {
      devices = devices.filter(d => d.type === params.type);
    }
    if (params.status) {
      devices = devices.filter(d => d.status === params.status);
    }
    if (params.keyword) {
      devices = devices.filter(d => 
        d.name.includes(params.keyword) || 
        d.location.includes(params.keyword)
      );
    }

    return {
      success: true,
      data: {
        list: devices,
        total: devices.length,
        summary: {
          total: this.devices.length,
          online: this.devices.filter(d => d.status === 'online').length,
          offline: this.devices.filter(d => d.status === 'offline').length,
          alarm: this.devices.filter(d => d.hasAlert).length
        }
      }
    };
  }

  /**
   * 获取设备详情
   * @param {string} deviceId - 设备ID
   * @returns {Object} 设备详情
   */
  getDeviceDetail(deviceId) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      return { success: false, message: '设备不存在' };
    }

    return {
      success: true,
      data: {
        ...device,
        // 扩展详情信息
        specifications: {
          model: 'ES-2000',
          manufacturer: '智能设备厂商',
          installDate: '2023-01-15',
          warrantyExpire: '2025-01-15'
        },
        // 历史运行数据
        historyData: {
          totalRunTime: 2580, // 小时
          totalEnergyConsumption: 15680.5, // kWh
          averagePower: 6.08, // kW
          efficiency: 0.92
        },
        // 当前参数
        currentParams: {
          power: device.power || 0,
          voltage: 220,
          current: device.power ? (device.power * 1000 / 220).toFixed(1) : 0,
          temperature: 45.2
        }
      }
    };
  }

  /**
   * 控制设备
   * @param {string} deviceId - 设备ID
   * @param {Object} command - 控制命令
   * @returns {Object} 控制结果
   */
  controlDevice(deviceId, command) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      return { success: false, message: '设备不存在' };
    }

    // 模拟控制逻辑
    if (command.action === 'switch') {
      device.isOn = command.value;
      device.status = command.value ? 'online' : 'offline';
    } else if (command.action === 'setMode') {
      device.mode = command.value;
    } else if (command.action === 'setParams') {
      Object.assign(device, command.params);
    }

    return {
      success: true,
      data: device,
      message: '控制成功'
    };
  }

  /**
   * 添加设备
   * @param {Object} deviceInfo - 设备信息
   * @returns {Object} 添加结果
   */
  addDevice(deviceInfo) {
    const newDevice = {
      id: 'device_' + Date.now(),
      ...deviceInfo,
      status: 'online',
      isOn: false,
      hasAlert: false,
      addTime: new Date().toISOString()
    };
    
    this.devices.push(newDevice);
    
    return {
      success: true,
      data: newDevice,
      message: '设备添加成功'
    };
  }

  // ==================== 历史数据与报告 ====================
  
  /**
   * 获取历史能耗数据
   * @param {Object} params - 查询参数
   * @returns {Object} 历史数据
   */
  getHistoryEnergyData(params) {
    const { timeRange, energyType, deviceId } = params;
    
    return {
      success: true,
      data: {
        // 能耗曲线数据
        chartData: this.generateHistoryChartData(timeRange, energyType),
        // 统计数据
        statistics: {
          total: 28500.5,
          average: 950.02,
          peak: 1580.3,
          valley: 320.8,
          growth: 5.2 // 同比增长%
        },
        // 分项能耗
        breakdown: {
          electricity: { value: 18500.2, percentage: 65 },
          water: { value: 5200.1, percentage: 18 },
          gas: { value: 4800.2, percentage: 17 }
        },
        // 碳排放量
        carbonEmission: {
          total: 14.25, // 吨CO2
          electricity: 11.84,
          gas: 2.41
        }
      }
    };
  }

  /**
   * 生成能耗报告
   * @param {Object} params - 报告参数
   * @returns {Object} 报告数据
   */
  generateEnergyReport(params) {
    const { reportType, timeRange } = params;
    
    return {
      success: true,
      data: {
        reportId: 'report_' + Date.now(),
        reportType,
        timeRange,
        generateTime: new Date().toISOString(),
        summary: {
          totalConsumption: 28500.5,
          totalCost: 18525.33,
          carbonEmission: 14.25,
          efficiency: 0.89
        },
        trends: {
          consumption: 5.2, // 同比增长%
          cost: 3.8,
          efficiency: -2.1 // 负数表示效率提升
        },
        recommendations: [
          '建议在非生产时间关闭部分照明设备',
          '空调温度设置可适当调高1-2度',
          '考虑安装光伏发电系统'
        ],
        downloadUrl: 'https://example.com/reports/report_' + Date.now() + '.pdf'
      }
    };
  }

  // ==================== 告警管理 ====================
  
  /**
   * 获取告警列表
   * @param {Object} params - 查询参数
   * @returns {Object} 告警列表
   */
  getAlertList(params = {}) {
    let alerts = [...this.alerts];
    
    // 筛选逻辑
    if (params.status) {
      alerts = alerts.filter(a => a.status === params.status);
    }
    if (params.level) {
      alerts = alerts.filter(a => a.level === params.level);
    }
    if (params.type) {
      alerts = alerts.filter(a => a.type === params.type);
    }

    return {
      success: true,
      data: {
        list: alerts,
        total: alerts.length,
        summary: {
          unread: alerts.filter(a => a.status === 'unread').length,
          critical: alerts.filter(a => a.level === 'critical').length,
          warning: alerts.filter(a => a.level === 'warning').length
        }
      }
    };
  }

  /**
   * 处理告警
   * @param {string} alertId - 告警ID
   * @param {string} action - 处理动作
   * @returns {Object} 处理结果
   */
  handleAlert(alertId, action) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return { success: false, message: '告警不存在' };
    }

    if (action === 'read') {
      alert.status = 'read';
    } else if (action === 'ignore') {
      alert.status = 'ignored';
    } else if (action === 'resolve') {
      alert.status = 'resolved';
    }

    alert.handleTime = new Date().toISOString();

    return {
      success: true,
      data: alert,
      message: '处理成功'
    };
  }

  // ==================== 自动化规则 ====================
  
  /**
   * 获取自动化规则列表
   * @returns {Object} 规则列表
   */
  getAutomationRules() {
    return {
      success: true,
      data: this.automationRules
    };
  }

  /**
   * 创建自动化规则
   * @param {Object} ruleData - 规则数据
   * @returns {Object} 创建结果
   */
  createAutomationRule(ruleData) {
    const newRule = {
      id: 'rule_' + Date.now(),
      ...ruleData,
      createTime: new Date().toISOString(),
      enabled: true,
      executeCount: 0
    };
    
    this.automationRules.push(newRule);
    
    return {
      success: true,
      data: newRule,
      message: '规则创建成功'
    };
  }

  /**
   * 更新自动化规则
   * @param {string} ruleId - 规则ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果
   */
  updateAutomationRule(ruleId, updateData) {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (!rule) {
      return { success: false, message: '规则不存在' };
    }

    Object.assign(rule, updateData);
    rule.updateTime = new Date().toISOString();

    return {
      success: true,
      data: rule,
      message: '规则更新成功'
    };
  }

  // ==================== 场景模式 ====================
  
  /**
   * 获取场景模式列表
   * @returns {Object} 场景列表
   */
  getSceneModes() {
    return {
      success: true,
      data: this.sceneMode
    };
  }

  /**
   * 切换场景模式
   * @param {string} sceneId - 场景ID
   * @returns {Object} 切换结果
   */
  switchSceneMode(sceneId) {
    const scene = this.sceneMode.find(s => s.id === sceneId);
    if (!scene) {
      return { success: false, message: '场景不存在' };
    }

    // 更新当前场景状态
    this.sceneMode.forEach(s => s.isActive = false);
    scene.isActive = true;
    scene.lastActiveTime = new Date().toISOString();

    return {
      success: true,
      data: scene,
      message: '场景切换成功'
    };
  }

  // ==================== 节能方案 ====================
  
  /**
   * 获取节能方案
   * @returns {Object} 节能方案
   */
  getSavingPlans() {
    return {
      success: true,
      data: {
        plans: this.savingPlans,
        achievements: {
          totalSaved: 2580.5, // kWh
          costSaved: 1677.33, // 元
          carbonReduced: 1.29 // 吨CO2
        },
        tips: [
          '合理设置空调温度，夏季26°C，冬季20°C',
          '及时关闭不必要的照明设备',
          '定期维护设备，保持最佳运行状态',
          '利用自然光，减少人工照明时间'
        ]
      }
    };
  }

  // ==================== 数据初始化方法 ====================
  
  initUsers() {
    return [
      {
        id: '001',
        phone: '13800138001',
        nickname: '能源管理员',
        avatar: '/images/default-avatar.svg',
        role: 'admin',
        company: '智慧科技有限公司',
        department: '能源管理部',
        permissions: ['device_control', 'data_view', 'user_manage', 'system_config']
      },
      {
        id: '002',
        phone: '13800138002',
        nickname: '设备操作员',
        avatar: '/images/default-avatar.svg',
        role: 'user',
        company: '智慧科技有限公司',
        department: '生产部',
        permissions: ['device_control', 'data_view']
      },
      {
        id: '003',
        phone: '13800138003',
        nickname: '数据分析师',
        avatar: '/images/default-avatar.png',
        role: 'user',
        company: '智慧科技有限公司',
        department: '技术部',
        permissions: ['data_view']
      }
    ];
  }

  initDevices() {
    return [
      {
        id: 'device_001',
        name: '生产车间空调系统',
        type: 'air_conditioner',
        location: '生产车间A区',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 15.5, // kW
        mode: 'cooling',
        temperature: 26,
        brand: '格力',
        model: 'GMV-120WL/A'
      },
      {
        id: 'device_002',
        name: '办公区照明系统',
        type: 'lighting',
        location: '办公楼2层',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 8.2,
        brightness: 80,
        brand: '飞利浦',
        model: 'LED-Panel-600x600'
      },
      {
        id: 'device_003',
        name: '热水器系统',
        type: 'water_heater',
        location: '员工宿舍',
        status: 'online',
        isOn: true,
        hasAlert: true,
        power: 12.0,
        temperature: 55,
        brand: '美的',
        model: 'F60-21WB1'
      },
      {
        id: 'device_004',
        name: '智能电表',
        type: 'smart_meter',
        location: '配电房',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 0,
        brand: '华立',
        model: 'DDS102-1'
      },
      {
        id: 'device_005',
        name: '光伏逆变器',
        type: 'solar_inverter',
        location: '屋顶',
        status: 'offline',
        isOn: false,
        hasAlert: true,
        power: 0,
        brand: '华为',
        model: 'SUN2000-20KTL'
      }
    ];
  }

  initEnergyData() {
    return {
      realTime: {
        electricity: 125.5,
        water: 8.2,
        gas: 15.8
      },
      history: {
        daily: this.generateDailyData(30),
        monthly: this.generateMonthlyData(12)
      }
    };
  }

  initAlerts() {
    return [
      {
        id: 'alert_001',
        title: '设备离线告警',
        content: '光伏逆变器设备离线，请检查网络连接',
        level: 'critical', // critical, warning, info
        type: 'device_offline',
        deviceId: 'device_005',
        deviceName: '光伏逆变器',
        location: '屋顶',
        status: 'unread', // unread, read, ignored, resolved
        createTime: '2024-01-15T10:30:00Z',
        handleTime: null
      },
      {
        id: 'alert_002',
        title: '能耗异常告警',
        content: '热水器系统能耗超出正常范围20%',
        level: 'warning',
        type: 'energy_abnormal',
        deviceId: 'device_003',
        deviceName: '热水器系统',
        location: '员工宿舍',
        status: 'unread',
        createTime: '2024-01-15T09:15:00Z',
        handleTime: null
      },
      {
        id: 'alert_003',
        title: '温度过高告警',
        content: '生产车间温度达到32°C，建议调整空调设置',
        level: 'warning',
        type: 'temperature_high',
        deviceId: 'device_001',
        deviceName: '生产车间空调系统',
        location: '生产车间A区',
        status: 'read',
        createTime: '2024-01-15T08:45:00Z',
        handleTime: '2024-01-15T09:00:00Z'
      },
      {
        id: 'alert_004',
        title: '定期维护提醒',
        content: '智能电表需要进行季度维护检查',
        level: 'info',
        type: 'maintenance_reminder',
        deviceId: 'device_004',
        deviceName: '智能电表',
        location: '配电房',
        status: 'unread',
        createTime: '2024-01-15T08:00:00Z',
        handleTime: null
      },
      {
        id: 'alert_005',
        title: '节能建议',
        content: '检测到非工作时间照明系统仍在运行，建议关闭',
        level: 'info',
        type: 'energy_saving_tip',
        deviceId: 'device_002',
        deviceName: '办公区照明系统',
        location: '办公楼2层',
        status: 'ignored',
        createTime: '2024-01-14T22:30:00Z',
        handleTime: '2024-01-15T08:30:00Z'
      }
    ];
  }

  initAutomationRules() {
    return [
      {
        id: 'rule_001',
        name: '工作日自动照明',
        description: '工作日早8点自动开启办公区照明，晚6点自动关闭',
        enabled: true,
        trigger: {
          type: 'time',
          conditions: [
            { time: '08:00', days: [1, 2, 3, 4, 5] },
            { time: '18:00', days: [1, 2, 3, 4, 5] }
          ]
        },
        actions: [
          {
            deviceId: 'device_002',
            action: 'switch',
            params: { on: true, brightness: 80 }
          }
        ],
        createTime: '2024-01-10T10:00:00Z',
        executeCount: 15
      },
      {
        id: 'rule_002',
        name: '温度自动调节',
        description: '当车间温度超过30°C时自动调低空调温度',
        enabled: true,
        trigger: {
          type: 'condition',
          conditions: [
            { deviceId: 'device_001', parameter: 'temperature', operator: '>', value: 30 }
          ]
        },
        actions: [
          {
            deviceId: 'device_001',
            action: 'setParams',
            params: { temperature: 26 }
          }
        ],
        createTime: '2024-01-08T14:30:00Z',
        executeCount: 8
      },
      {
        id: 'rule_003',
        name: '节假日节能模式',
        description: '节假日自动关闭非必要设备',
        enabled: false,
        trigger: {
          type: 'holiday',
          conditions: []
        },
        actions: [
          {
            deviceId: 'device_002',
            action: 'switch',
            params: { on: false }
          }
        ],
        createTime: '2024-01-05T16:20:00Z',
        executeCount: 0
      }
    ];
  }

  initSceneMode() {
    return [
      {
        id: 'scene_001',
        name: '工作日模式',
        description: '正常工作时间的设备运行模式',
        type: 'office', // factory, school, office
        isActive: true,
        devices: [
          { deviceId: 'device_001', settings: { on: true, temperature: 26 } },
          { deviceId: 'device_002', settings: { on: true, brightness: 80 } }
        ],
        schedule: {
          startTime: '08:00',
          endTime: '18:00',
          days: [1, 2, 3, 4, 5]
        },
        lastActiveTime: '2024-01-15T08:00:00Z'
      },
      {
        id: 'scene_002',
        name: '非工作日模式',
        description: '周末和节假日的节能运行模式',
        type: 'office',
        isActive: false,
        devices: [
          { deviceId: 'device_001', settings: { on: false } },
          { deviceId: 'device_002', settings: { on: false } }
        ],
        schedule: {
          startTime: '00:00',
          endTime: '23:59',
          days: [0, 6]
        },
        lastActiveTime: '2024-01-13T00:00:00Z'
      },
      {
        id: 'scene_003',
        name: '夜间模式',
        description: '夜间安防和应急照明模式',
        type: 'office',
        isActive: false,
        devices: [
          { deviceId: 'device_001', settings: { on: false } },
          { deviceId: 'device_002', settings: { on: true, brightness: 20 } }
        ],
        schedule: {
          startTime: '22:00',
          endTime: '06:00',
          days: [0, 1, 2, 3, 4, 5, 6]
        },
        lastActiveTime: '2024-01-14T22:00:00Z'
      }
    ];
  }

  initReports() {
    return [
      {
        id: 'report_001',
        title: '2024年1月能耗报告',
        type: 'monthly',
        period: '2024-01',
        generateTime: '2024-02-01T09:00:00Z',
        status: 'completed',
        downloadUrl: 'https://example.com/reports/202401.pdf'
      }
    ];
  }

  initSavingPlans() {
    return [
      {
        id: 'plan_001',
        title: '照明系统节能优化',
        description: '通过智能调光和定时控制，预计节能15%',
        category: 'lighting',
        estimatedSaving: {
          energy: 450.5, // kWh/月
          cost: 292.83, // 元/月
          carbon: 0.225 // 吨CO2/月
        },
        implementation: {
          difficulty: 'easy',
          cost: 5000,
          paybackPeriod: 8 // 月
        },
        status: 'recommended' // recommended, implementing, completed
      },
      {
        id: 'plan_002',
        title: '空调系统智能控制',
        description: '根据人员在岗情况和环境温度智能调节',
        category: 'hvac',
        estimatedSaving: {
          energy: 680.2,
          cost: 442.13,
          carbon: 0.340
        },
        implementation: {
          difficulty: 'medium',
          cost: 12000,
          paybackPeriod: 15
        },
        status: 'implementing'
      },
      {
        id: 'plan_003',
        title: '屋顶光伏发电系统',
        description: '安装20kW光伏发电系统，自发自用',
        category: 'renewable',
        estimatedSaving: {
          energy: 2500.0,
          cost: 1625.0,
          carbon: 1.25
        },
        implementation: {
          difficulty: 'hard',
          cost: 80000,
          paybackPeriod: 60
        },
        status: 'recommended'
      }
    ];
  }

  /**
   * 初始化设备分组数据
   * @returns {Array} 设备分组列表
   */
  initDeviceGroups() {
    return [
      {
        id: 'group_001',
        name: '办公区照明',
        description: '办公区域所有照明设备的统一管理',
        icon: 'light',
        deviceCount: 12,
        onlineCount: 11,
        totalPower: 2.4, // kW
        energyToday: 18.5, // kWh
        deviceIds: ['device_002', 'device_005'], // 关联的设备ID
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: 'group_002',
        name: '空调系统',
        description: '全楼空调设备集中控制',
        icon: 'air-conditioner',
        deviceCount: 8,
        onlineCount: 7,
        totalPower: 45.6,
        energyToday: 285.2,
        deviceIds: ['device_001', 'device_003'],
        createdAt: '2024-01-08T10:15:00Z',
        updatedAt: '2024-01-15T16:20:00Z'
      },
      {
        id: 'group_003',
        name: '生产设备',
        description: '车间主要生产设备监控',
        icon: 'factory',
        deviceCount: 15,
        onlineCount: 14,
        totalPower: 125.8,
        energyToday: 1580.6,
        deviceIds: ['device_004', 'device_006'],
        createdAt: '2024-01-05T08:00:00Z',
        updatedAt: '2024-01-15T12:45:00Z'
      },
      {
        id: 'group_004',
        name: '安防系统',
        description: '监控摄像头和门禁系统',
        icon: 'security',
        deviceCount: 6,
        onlineCount: 6,
        totalPower: 1.8,
        energyToday: 43.2,
        deviceIds: [],
        createdAt: '2024-01-12T15:30:00Z',
        updatedAt: '2024-01-15T09:10:00Z'
      }
    ];
  }

  // ==================== 设备分组管理相关 ====================

  /**
   * 获取设备分组列表
   * @param {Object} params - 查询参数
   * @returns {Object} 分组列表
   */
  getDeviceGroups(params = {}) {
    let groups = [...this.deviceGroups];
    
    // 筛选逻辑
    if (params.keyword) {
      groups = groups.filter(g => 
        g.name.includes(params.keyword) || 
        g.description.includes(params.keyword)
      );
    }
    
    return {
      success: true,
      data: {
        list: groups,
        total: groups.length,
        summary: {
          totalGroups: this.deviceGroups.length,
          totalDevices: this.deviceGroups.reduce((sum, g) => sum + g.deviceCount, 0),
          onlineDevices: this.deviceGroups.reduce((sum, g) => sum + g.onlineCount, 0)
        }
      },
      message: '获取分组列表成功'
    };
  }

  /**
   * 创建设备分组
   * @param {Object} groupData - 分组数据
   * @returns {Object} 创建结果
   */
  createDeviceGroup(groupData) {
    const newGroup = {
      id: 'group_' + Date.now(),
      name: groupData.name,
      description: groupData.description || '',
      icon: groupData.icon || 'default',
      deviceCount: 0,
      onlineCount: 0,
      totalPower: 0,
      energyToday: 0,
      deviceIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.deviceGroups.push(newGroup);
    
    return {
      success: true,
      data: newGroup,
      message: '分组创建成功'
    };
  }

  /**
   * 更新设备分组
   * @param {string} groupId - 分组ID
   * @param {Object} groupData - 更新数据
   * @returns {Object} 更新结果
   */
  updateDeviceGroup(groupId, groupData) {
    const groupIndex = this.deviceGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return {
        success: false,
        message: '分组不存在'
      };
    }
    
    // 更新分组信息
    Object.assign(this.deviceGroups[groupIndex], {
      ...groupData,
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      data: this.deviceGroups[groupIndex],
      message: '分组更新成功'
    };
  }

  /**
   * 删除设备分组
   * @param {string} groupId - 分组ID
   * @returns {Object} 删除结果
   */
  deleteDeviceGroup(groupId) {
    const groupIndex = this.deviceGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return {
        success: false,
        message: '分组不存在'
      };
    }
    
    this.deviceGroups.splice(groupIndex, 1);
    
    return {
      success: true,
      message: '分组删除成功'
    };
  }

  /**
   * 添加设备到分组
   * @param {string} groupId - 分组ID
   * @param {Array} deviceIds - 设备ID列表
   * @returns {Object} 操作结果
   */
  addDevicesToGroup(groupId, deviceIds) {
    const group = this.deviceGroups.find(g => g.id === groupId);
    if (!group) {
      return {
        success: false,
        message: '分组不存在'
      };
    }
    
    // 添加设备到分组
    deviceIds.forEach(deviceId => {
      if (!group.deviceIds.includes(deviceId)) {
        group.deviceIds.push(deviceId);
        group.deviceCount++;
        
        // 检查设备是否在线
        const device = this.devices.find(d => d.id === deviceId);
        if (device && device.status === 'online') {
          group.onlineCount++;
        }
      }
    });
    
    group.updatedAt = new Date().toISOString();
    
    return {
      success: true,
      data: group,
      message: '设备添加成功'
    };
  }

  /**
   * 从分组中移除设备
   * @param {string} groupId - 分组ID
   * @param {Array} deviceIds - 设备ID列表
   * @returns {Object} 操作结果
   */
  removeDevicesFromGroup(groupId, deviceIds) {
    const group = this.deviceGroups.find(g => g.id === groupId);
    if (!group) {
      return {
        success: false,
        message: '分组不存在'
      };
    }
    
    // 从分组中移除设备
    deviceIds.forEach(deviceId => {
      const index = group.deviceIds.indexOf(deviceId);
      if (index > -1) {
        group.deviceIds.splice(index, 1);
        group.deviceCount--;
        
        // 检查设备是否在线
        const device = this.devices.find(d => d.id === deviceId);
        if (device && device.status === 'online') {
          group.onlineCount--;
        }
      }
    });
    
    group.updatedAt = new Date().toISOString();
    
    return {
      success: true,
      data: group,
      message: '设备移除成功'
    };
  }

  /**
   * 分组批量控制
   * @param {string} groupId - 分组ID
   * @param {Object} command - 控制命令
   * @returns {Object} 控制结果
   */
  controlDeviceGroup(groupId, command) {
    const group = this.deviceGroups.find(g => g.id === groupId);
    if (!group) {
      return {
        success: false,
        message: '分组不存在'
      };
    }
    
    const results = [];
    
    // 对分组中的每个设备执行控制命令
    group.deviceIds.forEach(deviceId => {
      const result = this.controlDevice(deviceId, command);
      results.push({
        deviceId,
        success: result.success,
        message: result.message
      });
    });
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: true,
      data: {
        groupId,
        totalDevices: group.deviceIds.length,
        successCount,
        failCount: group.deviceIds.length - successCount,
        results
      },
      message: `批量控制完成，成功${successCount}个，失败${group.deviceIds.length - successCount}个`
    };
  }

  // ==================== 辅助方法 ====================
  
  generateLoadCurve() {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        time: i.toString().padStart(2, '0') + ':00',
        power: Math.random() * 100 + 50 + (i >= 8 && i <= 18 ? 50 : 0)
      });
    }
    return hours;
  }

  generateEnergyTimeSeries() {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: time.toISOString(),
        electricity: Math.random() * 50 + 30,
        water: Math.random() * 10 + 5,
        gas: Math.random() * 20 + 10
      });
    }
    return data;
  }

  generateHistoryChartData(timeRange, energyType) {
    const data = [];
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.random() * 1000 + 500
      });
    }
    
    return data;
  }

  generateDailyData(days) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        electricity: Math.random() * 1000 + 500,
        water: Math.random() * 100 + 50,
        gas: Math.random() * 200 + 100
      });
    }
    return data;
  }

  generateMonthlyData(months) {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.push({
        month: date.toISOString().substr(0, 7),
        electricity: Math.random() * 30000 + 15000,
        water: Math.random() * 3000 + 1500,
        gas: Math.random() * 6000 + 3000
      });
    }
    return data;
  }
}

// 导出类和实例
const energyAPI = new EnergyMockAPI();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnergyMockAPI;
  module.exports.instance = energyAPI;
} else if (typeof window !== 'undefined') {
  window.EnergyMockAPI = EnergyMockAPI;
  window.energyAPI = energyAPI;
}

// 使用示例：
// const homeData = energyAPI.getHomeOverview();
// const deviceList = energyAPI.getDeviceList({ type: 'air_conditioner' });
// const controlResult = energyAPI.controlDevice('device_001', { action: 'switch', value: false });